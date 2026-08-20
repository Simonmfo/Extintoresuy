import { Network } from '@capacitor/network';
import { db } from './db';
import { supabase } from './supabase';
import { InspectionRecord } from '../types';

const OFFLINE_QUEUE_KEY = 'inspection_offline_queue';

function base64ToBlob(base64Data: string): Blob {
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

export const offlineService = {
    async isOnline(): Promise<boolean> {
        try {
            const status = await Network.getStatus();
            return status.connected;
        } catch (e) {
            return false;
        }
    },

    async saveToQueue(record: InspectionRecord): Promise<void> {
        const queue = this.getQueue();
        queue.push({
            ...record,
            id: record.id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    },

    getQueue(): InspectionRecord[] {
        const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
        return saved ? JSON.parse(saved) : [];
    },

    async syncQueue(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
        if (!(await this.isOnline())) {
            return { success: false, syncedCount: 0, errors: ['Aún sin conexión'] };
        }

        const queue = this.getQueue();
        if (queue.length === 0) return { success: true, syncedCount: 0, errors: [] };

        console.log(`[OfflineSync] Iniciando sincronización de ${queue.length} registros...`);
        const errors: string[] = [];
        let syncedCount = 0;
        const remainingQueue: InspectionRecord[] = [];

        for (const record of queue) {
            try {
                // 1. If image is base64, upload it first
                if (record.imageUrl && record.imageUrl.startsWith('data:')) {
                    console.log(`[OfflineSync] Subiendo foto para equipo ${record.assetId}...`);
                    try {
                        const blob = base64ToBlob(record.imageUrl);
                        const url = await db.uploadFile(blob, 'inspection-photos', 'inspections');
                        if (url) {
                            record.imageUrl = url;
                        }
                    } catch (uploadErr: any) {
                        console.error('Error uploading cached image:', uploadErr);
                    }
                }

                // 2. If signature is base64, upload it first
                if (record.signatureUrl && record.signatureUrl.startsWith('data:')) {
                    console.log(`[OfflineSync] Subiendo firma para equipo ${record.assetId}...`);
                    try {
                        const blob = base64ToBlob(record.signatureUrl);
                        const url = await db.uploadFile(blob, 'inspection-photos', 'signatures');
                        if (url) {
                            record.signatureUrl = url;
                        }
                    } catch (uploadErr: any) {
                        console.error('Error uploading cached signature:', uploadErr);
                    }
                }

                // 3. Save audit logs online if present
                if (record.auditLog) {
                    console.log(`[OfflineSync] Guardando log de auditoría para equipo ${record.assetId}...`);
                    await db.saveAuditLog(record.auditLog);
                }

                // 4. Update the asset online if present
                if (record.assetUpdate) {
                    console.log(`[OfflineSync] Actualizando equipo ${record.assetId} online...`);
                    await db.updateAsset(record.assetId, record.assetUpdate);
                }

                // 5. Save the inspection record
                const res = await db.addInspection(record);
                if (res.success) {
                    syncedCount++;
                    console.log(`[OfflineSync] Registro ${record.assetId} sincronizado exitosamente.`);
                } else {
                    errors.push(`Error sincronizando ${record.assetId}: ${res.message}`);
                    remainingQueue.push(record);
                }
            } catch (error: any) {
                errors.push(`Error fatal sincronizando ${record.assetId}: ${error.message}`);
                remainingQueue.push(record);
            }
        }

        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));

        return {
            success: errors.length === 0,
            syncedCount,
            errors
        };
    },

    async downloadClientData(technicianId: string, companyId: string): Promise<{ success: boolean; message: string }> {
        if (!(await this.isOnline())) {
            return { success: false, message: 'Sin conexión a internet' };
        }

        try {
            console.log(`[OfflineSync] Descargando datos para técnico: ${technicianId}, empresa: ${companyId}`);
            
            // 1. Fetch clients assigned to this technician
            const { data: clients, error: clientErr } = await supabase
                .from('clients')
                .select('*')
                .eq('assigned_technician_id', technicianId);

            if (clientErr) throw clientErr;

            // 2. Fetch all assets belonging to these clients
            const clientIds = clients?.map(c => c.id) || [];
            let assets: any[] = [];
            if (clientIds.length > 0) {
                const { data: assetsData, error: assetsErr } = await supabase
                    .from('assets')
                    .select('*')
                    .in('client_id', clientIds);

                if (assetsErr) throw assetsErr;
                assets = assetsData || [];
            }

            // Map assets to match local camelCase structure
            const mappedAssets = assets.map((asset: any) => ({
                id: asset.id,
                name: asset.name,
                equipmentCategory: asset.equipment_category,
                type: asset.type,
                description: asset.description,
                lastInspection: asset.last_inspection,
                lat: asset.location_lat,
                lng: asset.location_lng,
                status: asset.status,
                imageUrl: asset.image_url,
                clientId: asset.client_id,
                expirationDate: asset.expiration_date,
                lifecycleStatus: asset.location_status,
                nextInspection: asset.next_inspection_date,
                lastRecharge: asset.last_recharge_date,
                lastHydrotest: asset.last_hydrotest_date,
                nextHydrotest: asset.next_hydrotest_date,
                unit: asset.unit,
                matricula: asset.matricula,
                selloFabrica: asset.sello_fabrica,
                assignedTechnicianId: asset.assigned_technician_id,
                retiredAt: asset.retired_at,
                retiredById: asset.retired_by_id,
                retiredByName: asset.retired_by_name,
                retirementReason: asset.retirement_reason,
                companyId: companyId,
                createdAt: asset.created_at,
                createdByName: asset.created_by_name
            }));

            // 3. Save to localStorage
            localStorage.setItem('offline_clients', JSON.stringify(clients || []));
            localStorage.setItem('offline_assets', JSON.stringify(mappedAssets));
            localStorage.setItem('offline_last_download', new Date().toISOString());

            return { success: true, message: 'Equipos descargados exitosamente para trabajo offline.' };
        } catch (error: any) {
            console.error('Error downloading offline data:', error);
            return { success: false, message: `Error al descargar datos: ${error.message}` };
        }
    },

    getOfflineClients(): any[] {
        const saved = localStorage.getItem('offline_clients');
        return saved ? JSON.parse(saved) : [];
    },

    getOfflineAssets(): any[] {
        const saved = localStorage.getItem('offline_assets');
        return saved ? JSON.parse(saved) : [];
    },

    getLastDownloadTime(): string | null {
        return localStorage.getItem('offline_last_download');
    },

    initAutoSync(onSyncComplete?: (results: any) => void) {
        Network.addListener('networkStatusChange', async (status) => {
            if (status.connected) {
                console.log('Volvimos a estar online, sincronizando...');
                const results = await this.syncQueue();
                if (onSyncComplete) onSyncComplete(results);
            }
        });
    }
};
