
import { Network } from '@capacitor/network';
import { db } from './db';
import { InspectionRecord } from '../types';

const OFFLINE_QUEUE_KEY = 'inspection_offline_queue';

export const offlineService = {
    async isOnline(): Promise<boolean> {
        const status = await Network.getStatus();
        return status.connected;
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

        const errors: string[] = [];
        let syncedCount = 0;
        const remainingQueue: InspectionRecord[] = [];

        for (const record of queue) {
            try {
                const res = await db.addInspection(record);
                if (res.success) {
                    syncedCount++;
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
