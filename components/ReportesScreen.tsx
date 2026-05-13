import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { db } from '../services/db';
import { Client, InspectionAsset, UserProfile } from '../types';

const today = new Date().toISOString().split('T')[0];

interface ReportesScreenProps {
    companyId?: string;
}

const ReportesScreen: React.FC<ReportesScreenProps> = ({ companyId }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [assets, setAssets] = useState<InspectionAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [factoryProfile, setFactoryProfile] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<'inventory' | 'audit'>('inventory');
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const clientsData = await db.getClients(companyId);
            setClients(clientsData);
            
            if (companyId && companyId !== 'ALL') {
                const profile = await db.getProfile(companyId);
                setFactoryProfile(profile);
            }
            setLoading(false);
        };
        loadData();
    }, [companyId]);

    const handleSelectClient = async (client: Client) => {
        setLoading(true);
        setSelectedClient(client);
        const [assetsData, logsData] = await Promise.all([
            db.getAssetsByClient(client.id),
            db.getAuditLogsByClient(client.id)
        ]);
        setAssets(assetsData);
        setAuditLogs(logsData);
        
        // If companyId was ALL (admin view), we should fetch the factory profile of the client
        if (companyId === 'ALL' || !companyId) {
            const profile = await db.getProfile(client.company_id || '');
            setFactoryProfile(profile);
        }
        setLoading(false);
    };

    const handleExport = async () => {
        if (!selectedClient) return;
        setExporting(true);

        try {
            const workbook = new ExcelJS.Workbook();
            
            if (activeTab === 'inventory') {
                const worksheet = workbook.addWorksheet('Inventario');
                // ... (Existing inventory export logic remains same, just inside this if)
                // Actually, I'll keep the existing logic and just add another worksheet for audit if activeTab is audit
                setupInventoryWorksheet(worksheet, assets, selectedClient, factoryProfile);
            } else {
                const worksheet = workbook.addWorksheet('Bitácora de Cambios');
                setupAuditWorksheet(worksheet, auditLogs, selectedClient, factoryProfile);
            }

            // Export
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const filename = activeTab === 'inventory' ? 'inventario' : 'bitacora';
            link.download = `${filename}_${selectedClient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting Excel:', error);
        }

        setExporting(false);
    };

    const setupInventoryWorksheet = async (worksheet: any, assetsData: any[], client: Client, profile: any) => {
        worksheet.getRow(1).height = 40;
        worksheet.getRow(2).height = 40;
        worksheet.getRow(3).height = 40;

        worksheet.columns = [
            { key: 'lugar', width: 25 },
            { key: 'tipoCap', width: 20 },
            { key: 'unit', width: 15 },
            { key: 'sello', width: 15 },
            { key: 'fechaCarga', width: 15 },
            { key: 'fechaEnsayo', width: 15 },
            { key: 'inspeccion', width: 15 },
            { key: 'retirado', width: 15 },
            { key: 'observaciones', width: 30 },
            { key: 'id', width: 15 },
            { key: 'establecimiento', width: 30 },
            { key: 'vtoCarga', width: 15 },
            { key: 'vtoEnsayo', width: 15 },
            { key: 'estado', width: 15 },
            { key: 'fotoUrl', width: 30 },
        ];

        const b1 = worksheet.getCell('B1');
        b1.value = client.name.toUpperCase();
        b1.font = { name: 'Arial Black', size: 16, color: { argb: 'FFFF0000' }, bold: true };
        b1.alignment = { vertical: 'middle', horizontal: 'left' };

        const c1 = worksheet.getCell('C1');
        c1.value = new Date().toLocaleDateString('es-UY');
        c1.font = { name: 'Arial', size: 12, bold: true };
        c1.alignment = { vertical: 'middle', horizontal: 'center' };

        const headerRow = worksheet.getRow(4);
        headerRow.values = [
            'Lugar', 'Tipo / Cap', 'UNIT de fábrica', 'Sello de recarga',
            'Fecha de carga', 'Fecha de ensayo', 'Inspección SI/NO', 'Retirado SI/NO',
            'Observaciones', 'ID', 'Establecimiento', 'Vto. Carga',
            'Vto. Ensayo', 'Estado'
        ];
        headerRow.height = 25;
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '13EC5B' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        assetsData.forEach((asset) => {
            const isExpired = asset.expirationDate && asset.expirationDate < today;
            const hasObservations = asset.description && asset.description.includes('ACEPTABLE CON OBSERVACIONES');
            const statusInsp = isExpired ? 'Vencido' : hasObservations ? 'ACEPTABLE C/ OBS' : asset.status === 'ok' ? 'OK' : 'ALERTA';

            worksheet.addRow({
                lugar: asset.name || 'N/A',
                tipoCap: `${asset.type || ''}`.trim() || 'N/A',
                unit: asset.unit || 'N/A',
                sello: asset.matricula || 'N/A',
                fechaCarga: asset.lastRecharge || 'N/A',
                fechaEnsayo: asset.lastHydrotest || 'N/A',
                inspeccion: asset.lastInspection ? 'SI' : 'NO',
                retirado: asset.lifecycleStatus === 'active' || !asset.lifecycleStatus ? 'NO' : 'SI',
                observaciones: asset.description || '',
                id: asset.id,
                establecimiento: client.name,
                vtoCarga: asset.expirationDate || 'N/A',
                vtoEnsayo: asset.nextHydrotest || 'N/A',
                estado: statusInsp,
                fotoUrl: asset.imageUrl || ''
            }).font = { size: 10 };
        });

        if (profile?.logo_url) {
            await addLogoToWorksheet(worksheet, profile.logo_url);
        }
    };

    const setupAuditWorksheet = async (worksheet: any, logs: any[], client: Client, profile: any) => {
        worksheet.getRow(1).height = 40;
        worksheet.getRow(2).height = 40;
        worksheet.getRow(3).height = 40;

        worksheet.columns = [
            { key: 'fecha', width: 20 },
            { key: 'usuario', width: 25 },
            { key: 'equipoId', width: 15 },
            { key: 'campo', width: 20 },
            { key: 'anterior', width: 25 },
            { key: 'actual', width: 25 },
            { key: 'contexto', width: 30 }
        ];

        const b1 = worksheet.getCell('B1');
        b1.value = `BITÁCORA DE AUDITORÍA: ${client.name.toUpperCase()}`;
        b1.font = { name: 'Arial Black', size: 14, color: { argb: 'FF0000FF' }, bold: true };
        b1.alignment = { vertical: 'middle', horizontal: 'left' };

        const headerRow = worksheet.getRow(4);
        headerRow.values = [
            'Fecha / Hora', 'Usuario', 'ID Equipo', 'Campo Modificado', 'Valor Anterior', 'Valor Actual', 'Contexto'
        ];
        headerRow.height = 25;
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        logs.forEach(log => {
            log.changes.forEach((change: any) => {
                worksheet.addRow({
                    fecha: new Date(log.created_at).toLocaleString('es-UY'),
                    usuario: log.user_name,
                    equipoId: log.asset_id,
                    campo: change.field,
                    anterior: change.old,
                    actual: change.new,
                    contexto: log.context
                }).font = { size: 10 };
            });
        });

        if (profile?.logo_url) {
            await addLogoToWorksheet(worksheet, profile.logo_url);
        }
    };

    const addLogoToWorksheet = async (worksheet: any, logoUrl: string) => {
        try {
            const response = await fetch(logoUrl);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            
            const extension = blob.type.split('/')[1] === 'png' ? 'png' : 'jpeg';
            
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            await new Promise((resolve) => { img.onload = resolve; });

            const imageId = worksheet.workbook.addImage({
                buffer: arrayBuffer,
                extension: extension,
            });

            const targetHeight = 120;
            const ratio = targetHeight / img.height;

            worksheet.addImage(imageId, {
                tl: { col: 4, row: 0 }, 
                ext: { width: img.width * ratio, height: targetHeight }
            });
            
            URL.revokeObjectURL(img.src);
        } catch (e) {
            console.error('Error adding logo:', e);
        }
    };

    const getStats = () => {
        const total = assets.length;
        const active = assets.filter(a => a.lifecycleStatus === 'active' || !a.lifecycleStatus).length;
        const expired = assets.filter(a => {
            if (!a.expirationDate) return false;
            return new Date(a.expirationDate) < new Date();
        }).length;
        const pendingInsp = assets.filter(a => {
            if (!a.nextInspection) return false;
            return new Date(a.nextInspection) < new Date();
        }).length;

        return { total, active, expired, pendingInsp };
    };

    const stats = getStats();
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary !text-4xl">analytics</span>
                        Reportes de Clientes
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gere y exporte informes detallados de inventario por empresa.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Client List */}
                <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-3xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Seleccionar Cliente</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {loading && clients.length === 0 && (
                            <div className="flex justify-center p-8">
                                <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                            </div>
                        )}
                        {clients.map(client => (
                            <button
                                key={client.id}
                                onClick={() => handleSelectClient(client)}
                                className={`w-full p-4 rounded-2xl text-left border transition-all flex items-center gap-4 ${selectedClient?.id === client.id
                                    ? 'bg-primary border-primary text-background-dark'
                                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                                    }`}
                            >
                                <div className={`size-10 rounded-xl flex items-center justify-center font-bold relative shrink-0 ${selectedClient?.id === client.id ? 'bg-background-dark/20 text-background-dark' : 'bg-slate-800 text-slate-500'
                                    }`}>
                                    {client.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold truncate">{client.name}</p>
                                    <p className={`text-[10px] truncate opacity-60 ${selectedClient?.id === client.id ? '' : 'text-slate-500'}`}>
                                        {client.address || 'Sin dirección'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Report Content */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl flex flex-col overflow-hidden relative">
                    {!selectedClient ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                            <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                <span className="material-symbols-outlined !text-4xl opacity-20">dock_to_left</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-400">Ningún cliente seleccionado</h3>
                            <p className="max-w-xs mt-2">Elija una empresa de la lista para generar y visualizar sus reportes detallados.</p>
                        </div>
                    ) : (
                        loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden animate-fadeIn">
                                {/* Report Header */}
                                <div className="p-6 border-b border-white/10 bg-white/[0.03] space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined !text-3xl text-primary">domain</span>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-white">{selectedClient.name}</h2>
                                                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">{assets.length} Equipos registrados</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleExport}
                                            disabled={exporting || (activeTab === 'inventory' ? assets.length === 0 : auditLogs.length === 0)}
                                            className="flex items-center gap-2 bg-primary text-background-dark font-black px-6 py-3 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale uppercase text-xs tracking-wider"
                                        >
                                            <span className="material-symbols-outlined !text-lg">download</span>
                                            {exporting ? 'Generando...' : activeTab === 'inventory' ? 'Emitir Inventario' : 'Descargar Bitácora'}
                                        </button>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
                                        <button
                                            onClick={() => setActiveTab('inventory')}
                                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-primary text-background-dark shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Inventario
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('audit')}
                                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Bitácora / Auditoría
                                        </button>
                                    </div>

                                    {/* Stats Grid */}
                                    {activeTab === 'inventory' && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Equipos</p>
                                                <p className="text-2xl font-black text-white">{stats.total}</p>
                                            </div>
                                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Activos</p>
                                                <p className="text-2xl font-black text-blue-400">{stats.active}</p>
                                            </div>
                                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Vencidos (Carga)</p>
                                                <p className="text-2xl font-black text-status-red">{stats.expired}</p>
                                            </div>
                                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Insp. Pendientes</p>
                                                <p className="text-2xl font-black text-amber-500">{stats.pendingInsp}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Table Preview */}
                                <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary !text-lg">
                                                {activeTab === 'inventory' ? 'list_alt' : 'history_edu'}
                                            </span>
                                            {activeTab === 'inventory' ? 'Vista Previa de Inventario' : 'Historial de Modificaciones'}
                                        </h3>
                                    </div>

                                    {activeTab === 'inventory' ? (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                                                    <th className="pb-3 pl-2">ID</th>
                                                    <th className="pb-3">Tipo / Cap</th>
                                                    <th className="pb-3">Norma</th>
                                                    <th className="pb-3 text-center">Estado</th>
                                                    <th className="pb-3 text-right pr-2">Próx. Insp.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assets.map(asset => (
                                                    <tr key={asset.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                                        <td className="py-4 pl-2 font-mono text-[10px] text-primary">{asset.id}</td>
                                                        <td className="py-4">
                                                            <p className="text-xs font-bold text-white mb-0.5">{asset.type}</p>
                                                        </td>
                                                        <td className="py-4 text-[10px] text-slate-500 font-mono">{asset.unit || 'UNIT 507'}</td>
                                                        <td className="py-4 text-center">
                                                            <span className={`inline-flex px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider ${(asset.expirationDate && asset.expirationDate < today) || asset.status === 'failed'
                                                                ? 'bg-status-red/20 text-status-red'
                                                                : 'bg-primary/20 text-primary'
                                                                }`}>
                                                                {(asset.expirationDate && asset.expirationDate < today) ? 'Vencido' : asset.status === 'ok' ? 'OK' : 'ALERTA'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right pr-2 font-mono text-[10px] text-slate-300">
                                                            {asset.nextInspection || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="space-y-3">
                                            {auditLogs.length === 0 ? (
                                                <p className="text-center text-slate-500 py-12 italic">No hay registros de modificaciones para este cliente.</p>
                                            ) : (
                                                auditLogs.map(log => (
                                                    <div key={log.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                                                                    <span className="material-symbols-outlined !text-lg">person</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-white">{log.user_name}</p>
                                                                    <p className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase">{log.context}</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {log.changes.map((change: any, i: number) => (
                                                                <div key={i} className="grid grid-cols-3 gap-4 items-center text-[11px]">
                                                                    <div className="font-bold text-slate-400 uppercase tracking-tighter">{change.field}</div>
                                                                    <div className="text-status-red line-through opacity-50 truncate">{change.old}</div>
                                                                    <div className="text-primary font-bold truncate flex items-center gap-1">
                                                                        <span className="material-symbols-outlined !text-xs">arrow_forward</span>
                                                                        {change.new}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="pt-1 text-[9px] text-slate-600 font-mono">ID EQUIPO: {log.asset_id}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportesScreen;
