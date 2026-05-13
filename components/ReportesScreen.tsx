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
        const data = await db.getAssetsByClient(client.id);
        setAssets(data);
        
        // If companyId was ALL (admin view), we should fetch the factory profile of the client
        if (companyId === 'ALL' || !companyId) {
            const profile = await db.getProfile(client.company_id || '');
            setFactoryProfile(profile);
        }
        setLoading(false);
    };

    const handleExport = async () => {
        if (!selectedClient || assets.length === 0) return;
        setExporting(true);

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Inventario');

            // 1. Set Row 1, 2 and 3 Heights for space
            worksheet.getRow(1).height = 40;
            worksheet.getRow(2).height = 40;
            worksheet.getRow(3).height = 40;

            // 2. Define Columns (Widths and Keys only, no auto-headers)
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
            ];

            // 3. Set B1 to Client Name (Real name, Uppercase, Red)
            const b1 = worksheet.getCell('B1');
            b1.value = selectedClient.name.toUpperCase();
            b1.font = { name: 'Arial Black', size: 16, color: { argb: 'FFFF0000' }, bold: true };
            b1.alignment = { vertical: 'middle', horizontal: 'left' };

            // 4. Set C1 to Current Date
            const c1 = worksheet.getCell('C1');
            c1.value = new Date().toLocaleDateString('es-UY');
            c1.font = { name: 'Arial', size: 12, bold: true };
            c1.alignment = { vertical: 'middle', horizontal: 'center' };

            // 5. Add Table Headers at Row 4
            const headerRow = worksheet.getRow(4);
            headerRow.values = [
                'Lugar', 'Tipo / Cap', 'UNIT de fábrica', 'Sello de recarga',
                'Fecha de carga', 'Fecha de ensayo', 'Inspección SI/NO', 'Retirado SI/NO',
                'Observaciones', 'ID', 'Establecimiento', 'Vto. Carga',
                'Vto. Ensayo', 'Estado'
            ];
            headerRow.height = 25;
            headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '13EC5B' }
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

            // 6. Add Data Rows starting from Row 5
            assets.forEach((asset) => {
                const isExpired = asset.expirationDate && asset.expirationDate < today;
                const statusInsp = isExpired ? 'Vencido' : asset.status === 'ok' ? 'OK' : 'ALERTA';

                const row = worksheet.addRow({
                    lugar: asset.name || 'N/A',
                    tipoCap: `${asset.type || ''} ${asset.capacity || ''}`.trim() || 'N/A',
                    unit: asset.unit || 'N/A',
                    sello: asset.matricula || 'N/A',
                    fechaCarga: asset.lastRecharge || 'N/A',
                    fechaEnsayo: asset.lastHydrotest || 'N/A',
                    inspeccion: asset.lastInspection ? 'SI' : 'NO',
                    retirado: asset.lifecycleStatus === 'active' || !asset.lifecycleStatus ? 'NO' : 'SI',
                    observaciones: asset.description || '',
                    id: asset.id,
                    establecimiento: selectedClient.name,
                    vtoCarga: asset.expirationDate || 'N/A',
                    vtoEnsayo: asset.nextHydrotest || 'N/A',
                    estado: statusInsp
                });

                
                row.font = { size: 10 };
                row.alignment = { vertical: 'middle', horizontal: 'left' };
            });


            // 7. Add Logo if available (Space from D1 onwards)
            if (factoryProfile?.logo_url) {
                try {
                    const response = await fetch(factoryProfile.logo_url);
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    
                    // Create an image object to get dimensions
                    const img = new Image();
                    img.src = URL.createObjectURL(blob);
                    await new Promise((resolve) => {
                        img.onload = resolve;
                    });

                    const imageId = workbook.addImage({
                        buffer: arrayBuffer,
                        extension: factoryProfile.logo_url.toLowerCase().endsWith('.png') ? 'png' : 'jpeg',
                    });

                    // Calculate dimensions to fill Row 1, 2 and 3 height (40 + 40 + 40 = 120)
                    const targetHeight = 120;
                    const ratio = targetHeight / img.height;
                    const displayW = img.width * ratio;
                    const displayH = targetHeight;

                    // Add logo starting exactly at Column D (index 3), Row 1 (index 0)
                    worksheet.addImage(imageId, {
                        tl: { col: 3, row: 0 }, 
                        ext: { width: displayW, height: displayH }
                    });
                    
                    URL.revokeObjectURL(img.src);
                } catch (imgError) {
                    console.error('Error adding logo to Excel:', imgError);
                }
            }


            // Export
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `reporte_${selectedClient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting Excel:', error);
        }

        setExporting(false);
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
                                            disabled={exporting || assets.length === 0}
                                            className="flex items-center gap-2 bg-primary text-background-dark font-black px-6 py-3 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale uppercase text-xs tracking-wider"
                                        >
                                            <span className="material-symbols-outlined !text-lg">download</span>
                                            {exporting ? 'Generando...' : 'Emitir Reporte Excel (CSV)'}
                                        </button>
                                    </div>

                                    {/* Stats Grid */}
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
                                </div>

                                {/* Assets Table Preview */}
                                <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary !text-lg">list_alt</span>
                                            Vista Previa de Inventario
                                        </h3>
                                    </div>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                                                <th className="pb-3 pl-2">ID</th>
                                                <th className="pb-3">Tipo / Agente</th>
                                                <th className="pb-3">Capacidad</th>
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
                                                        <p className="text-[9px] text-slate-500">{asset.agent || 'Sin agente'}</p>
                                                    </td>
                                                    <td className="py-4 text-xs text-slate-300">{asset.capacity || '-'}</td>
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
