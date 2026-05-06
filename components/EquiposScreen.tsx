
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Client, InspectionAsset } from '../types';
import QRCode from 'react-qr-code';
import ReactDOM from 'react-dom';

interface EquiposScreenProps {
    initialAssetId?: string | null;
    onClearInitialId?: () => void;
    companyId?: string;
}

const EquiposScreen: React.FC<EquiposScreenProps> = ({ initialAssetId, onClearInitialId, companyId }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [assets, setAssets] = useState<InspectionAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newAsset, setNewAsset] = useState({ name: '', equipmentCategory: 'Extintor', type: '', description: '', agent: '', fireClass: '', expirationDate: '', nextInspection: '', lastRecharge: '', lastHydrotest: '', nextHydrotest: '', lastInspection: '', lifecycleStatus: 'active' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewingAsset, setViewingAsset] = useState<InspectionAsset | null>(null);
    const [editingAsset, setEditingAsset] = useState<InspectionAsset | null>(null);

    useEffect(() => {
        if (initialAssetId && clients.length > 0) {
            const loadInitialAsset = async () => {
                const asset = await db.getAsset(initialAssetId);
                if (asset) {
                    const client = clients.find(c => c.id === asset.clientId);
                    if (client) {
                        setSelectedClient(client);
                        const clientAssets = await db.getAssetsByClient(client.id);
                        setAssets(clientAssets);
                        setViewingAsset(asset);
                    }
                }
                onClearInitialId?.();
            };
            loadInitialAsset();
        }
    }, [initialAssetId, clients]);

    const addYears = (dateStr: string, years: number) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setFullYear(d.getFullYear() + years);
        return d.toISOString().split('T')[0];
    };

    const addMonths = (dateStr: string, months: number) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setMonth(d.getMonth() + months);
        return d.toISOString().split('T')[0];
    };


    useEffect(() => {
        const loadClients = async () => {
            setLoading(true);
            const data = await db.getClients(companyId);
            setClients(data);
            setLoading(false);
        };
        loadClients();
    }, [companyId]);

    const handleSelectClient = async (client: Client) => {
        if (selectedClient?.id === client.id) {
            setSelectedClient(null);
            setAssets([]);
            return;
        }

        setLoading(true);
        setSelectedClient(client);
        const data = await db.getAssetsByClient(client.id);
        setAssets(data);
        setLoading(false);
    };

    const handleExport = () => {
        if (!selectedClient || assets.length === 0) return;

        // Create CSV content
        const headers = ['ID', 'Nombre', 'Categoría', 'Tipo', 'Estado', 'Última Inspección', 'Ubicación'];
        const today = new Date().toISOString().split('T')[0];
        const rows = assets.map(asset => {
            const isExpired = asset.expirationDate && asset.expirationDate < today;
            const statusText = isExpired ? 'Vencido' : asset.status === 'ok' ? 'Al día' : asset.status === 'failed' ? 'Rechazado' : 'Pendiente';

            return [
                asset.id,
                asset.name || 'Sin nombre',
                asset.equipmentCategory || 'N/A',
                asset.type || 'N/A',
                statusText,
                asset.lastInspection || 'Nunca',
                asset.description || 'N/A'
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_equipos_${selectedClient.name.replace(/\s+/g, '_')}.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [isPrintingBatch, setIsPrintingBatch] = useState(false);
    const [isPrintingGrid, setIsPrintingGrid] = useState(false);

    const handlePrintGrid = () => {
        if (!selectedClient || assets.length === 0) return;
        setIsPrintingGrid(true);

        // Wait for React to render the batch container
        setTimeout(() => {
            const container = document.getElementById('batch-qr-container');
            if (container) {
                const printWindow = window.open('', '', 'width=1000,height=800');
                if (printWindow) {
                    let labelsHtml = '';
                    assets.forEach(asset => {
                        const qrElem = document.getElementById(`batch-qr-${asset.id}`)?.querySelector('svg');
                        if (qrElem) {
                            labelsHtml += `
                                <div class="qr-item">
                                    <div class="qr-svg">${qrElem.outerHTML}</div>
                                    <div class="qr-info">
                                        <div class="qr-id">${asset.id}</div>
                                        <div class="qr-client">${selectedClient.name.substring(0, 15)}</div>
                                        <div class="qr-type">${asset.type}</div>
                                        <div class="qr-footer">EXTINTORESUY</div>
                                    </div>
                                </div>
                            `;
                        }
                    });

                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                            <head>
                                <title>Lote QR - ${selectedClient.name}</title>
                                <style>
                                    @page { size: A4; margin: 10mm; }
                                    body { 
                                        margin: 0; 
                                        font-family: 'Segoe UI', system-ui, sans-serif;
                                        background: white;
                                        padding: 0;
                                    }
                                    .grid-container {
                                        display: grid;
                                        grid-template-columns: repeat(3, 1fr);
                                        gap: 8px;
                                    }
                                    .qr-item {
                                        border: 1px solid black;
                                        padding: 10px;
                                        display: flex;
                                        align-items: center;
                                        gap: 12px;
                                        height: 90px;
                                        box-sizing: border-box;
                                        page-break-inside: avoid;
                                        background: #fff;
                                        border-radius: 4px;
                                    }
                                    .qr-svg svg {
                                        width: 60px !important;
                                        height: 60px !important;
                                        flex-shrink: 0;
                                    }
                                    .qr-info {
                                        flex: 1;
                                        display: flex;
                                        flex-direction: column;
                                        justify-content: center;
                                        min-width: 0;
                                    }
                                    .qr-id { 
                                        font-weight: 900; 
                                        font-size: 11px; 
                                        color: black; 
                                        margin-bottom: 2px;
                                        font-family: monospace;
                                    }
                                    .qr-client { 
                                        font-size: 9px; 
                                        color: #111; 
                                        font-weight: 700;
                                        white-space: nowrap;
                                        overflow: hidden;
                                        text-overflow: ellipsis;
                                    }
                                    .qr-type { 
                                        font-size: 8px; 
                                        color: #555;
                                        margin-top: 2px;
                                    }
                                    .qr-footer {
                                        font-size: 7px;
                                        color: #999;
                                        margin-top: 4px;
                                        font-weight: bold;
                                        letter-spacing: 0.5px;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="grid-container">
                                    ${labelsHtml}
                                </div>
                                <script>
                                    window.onload = function() {
                                        setTimeout(() => {
                                            window.print();
                                            window.close();
                                        }, 1000);
                                    }
                                </script>
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                }
            }
            setIsPrintingGrid(false);
        }, 1200);
    };

    // Modified approach for HandlePrintQR:
    // We will render the active QR in a hidden div in the main App, then copy its innerHTML to the print window.
    const [qrAssetToPrint, setQrAssetToPrint] = useState<InspectionAsset | null>(null);

    useEffect(() => {
        if (qrAssetToPrint && selectedClient) {
            const timer = setTimeout(() => {
                const svg = document.getElementById('printable-qr-code');
                if (svg) {
                    const printWindow = window.open('', '', 'width=400,height=400');
                    if (printWindow) {
                        const qrHtml = svg.outerHTML;

                        printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Etiqueta QR</title>
                                    <style>
                                        @page { size: auto; margin: 0mm; }
                                        body { 
                                            margin: 5px; 
                                            font-family: 'Segoe UI', system-ui, sans-serif;
                                            background: white;
                                        }
                                        .qr-item {
                                            border: 1px solid black;
                                            padding: 10px;
                                            display: flex;
                                            align-items: center;
                                            gap: 12px;
                                            height: 90px;
                                            width: 240px;
                                            box-sizing: border-box;
                                            background: #fff;
                                            border-radius: 4px;
                                        }
                                        .qr-svg svg {
                                            width: 60px !important;
                                            height: 60px !important;
                                            flex-shrink: 0;
                                        }
                                        .qr-info {
                                            flex: 1;
                                            display: flex;
                                            flex-direction: column;
                                            justify-content: center;
                                            min-width: 0;
                                        }
                                        .qr-id { 
                                            font-weight: 900; 
                                            font-size: 11px; 
                                            color: black; 
                                            margin-bottom: 2px;
                                            font-family: monospace;
                                        }
                                        .qr-client { 
                                            font-size: 9px; 
                                            color: #111; 
                                            font-weight: 700;
                                            white-space: nowrap;
                                            overflow: hidden;
                                            text-overflow: ellipsis;
                                        }
                                        .qr-type { 
                                            font-size: 8px; 
                                            color: #555;
                                            margin-top: 2px;
                                        }
                                        .qr-footer {
                                            font-size: 7px;
                                            color: #999;
                                            margin-top: 4px;
                                            font-weight: bold;
                                            letter-spacing: 0.5px;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="qr-item">
                                        <div class="qr-svg">${qrHtml}</div>
                                        <div class="qr-info">
                                            <div class="qr-id">${qrAssetToPrint.id}</div>
                                            <div class="qr-client">${selectedClient.name.substring(0, 15)}</div>
                                            <div class="qr-type">${qrAssetToPrint.type}</div>
                                            <div class="qr-footer">EXTINTORESUY</div>
                                        </div>
                                    </div>
                                    <script>
                                        window.onload = function() {
                                            window.print();
                                            window.close();
                                        }
                                    </script>
                                </body>
                            </html>
                        `);
                        printWindow.document.close();
                    }
                }
                setQrAssetToPrint(null); // Reset
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [qrAssetToPrint, selectedClient]);

    const handleAddAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;

        setIsSubmitting(true);
        const result = await db.addAsset({
            name: newAsset.name,
            type: newAsset.type,
            description: newAsset.description,
            clientId: selectedClient.id,
            agent: newAsset.agent,
            fireClass: newAsset.fireClass,
            expirationDate: newAsset.expirationDate,
            lastInspection: newAsset.lastInspection,
            nextInspection: newAsset.nextInspection,
            lastRecharge: newAsset.lastRecharge,
            lastHydrotest: newAsset.lastHydrotest,
            nextHydrotest: newAsset.nextHydrotest,
            lifecycleStatus: newAsset.lifecycleStatus as any
        });

        if (result) {
            // Refresh assets
            const updatedAssets = await db.getAssetsByClient(selectedClient.id);
            setAssets(updatedAssets);
            setIsAddModalOpen(false);
            setNewAsset({ name: '', equipmentCategory: 'Extintor', type: '', description: '', agent: '', fireClass: '', expirationDate: '', nextInspection: '', lastRecharge: '', lastHydrotest: '', nextHydrotest: '', lastInspection: '', lifecycleStatus: 'active' });
        }
        setIsSubmitting(false);
    };

    const openAddModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAddModalOpen(true);
    };


    const handleEditAsset = (asset: InspectionAsset) => {
        setViewingAsset(null);
        setEditingAsset(asset);
    };

    const handleUpdateAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAsset) return;

        setIsSubmitting(true);
        const success = await db.updateAsset(editingAsset.id, {
            name: editingAsset.name,
            type: editingAsset.type,
            description: editingAsset.description,
            agent: editingAsset.agent,
            fireClass: editingAsset.fireClass,
            expirationDate: editingAsset.expirationDate,
            lastInspection: editingAsset.lastInspection,
            nextInspection: editingAsset.nextInspection,
            lastRecharge: editingAsset.lastRecharge,
            lastHydrotest: editingAsset.lastHydrotest,
            nextHydrotest: editingAsset.nextHydrotest,
            lifecycleStatus: editingAsset.lifecycleStatus
        });

        if (success) {
            if (selectedClient) {
                const updatedAssets = await db.getAssetsByClient(selectedClient.id);
                setAssets(updatedAssets);
            }
            setEditingAsset(null);
        }
        setIsSubmitting(false);
    };

    const handleDeleteAsset = async (assetId: string) => {
        if (!window.confirm("¿Está seguro de que desea eliminar este equipo permanentemente?")) return;

        // Optimistic update or loading state
        // setIsSubmitting(true); // Maybe not needed for delete if fast, but good for safety

        const success = await db.deleteAsset(assetId);

        if (success) {
            if (selectedClient) {
                const updatedAssets = await db.getAssetsByClient(selectedClient.id);
                setAssets(updatedAssets);
            }
        } else {
            alert("Error al eliminar el equipo.");
        }
        // setIsSubmitting(false);
    };

    return (
        <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto h-full overflow-hidden flex flex-col relative">
            {/* Hidden QR for generating print preview */}
            {qrAssetToPrint && (
                <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
                    <QRCode
                        id="printable-qr-code"
                        value={JSON.stringify({ id: qrAssetToPrint.id })}
                        size={64}
                    />
                </div>
            )}

            {/* Hidden Batch QR Container */}
            {(isPrintingBatch || isPrintingGrid) && (
                <div id="batch-qr-container" style={{ position: 'absolute', top: -9999, left: -9999 }}>
                    {assets.map(asset => (
                        <div key={`batch-${asset.id}`} id={`batch-qr-${asset.id}`}>
                            <QRCode
                                value={JSON.stringify({ id: asset.id })}
                                size={64}
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary !text-3xl">domain</span>
                        Gestión de Clientes
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Seleccione una empresa para ver su inventario de seguridad.</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-slate-300">
                    Total: {clients.length} Empresas
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {loading && !selectedClient && (
                    <div className="flex justify-center p-8">
                        <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    </div>
                )}

                {clients.length === 0 && !loading && (
                    <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10">
                        <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">folder_off</span>
                        <p className="text-slate-500 font-medium">No hay empresas registradas.</p>
                    </div>
                )}

                {clients.map(client => (
                    <div key={client.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:bg-white/[0.07]">
                        <button
                            onClick={() => handleSelectClient(client)}
                            className="w-full p-4 flex items-center justify-between text-left group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`size-12 rounded-xl flex items-center justify-center font-bold text-lg uppercase transition-colors ${selectedClient?.id === client.id ? 'bg-primary text-background-dark' : 'bg-slate-800 text-slate-400'}`}>
                                    {client.name.substring(0, 2)}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-base group-hover:text-white transition-colors ${selectedClient?.id === client.id ? 'text-primary' : 'text-slate-200'}`}>
                                        {client.name}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-[12px]">location_on</span>
                                            {client.address || 'Sin dirección'}
                                        </span>
                                        {client.contact_email && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined !text-[12px]">mail</span>
                                                {client.contact_email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {selectedClient?.id === client.id && (
                                    <>
                                        {/* Estadísticas rápidas del cliente */}
                                        <div className="hidden lg:flex items-center gap-6 mr-4 py-1.5 px-4 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Equipos</span>
                                                <span className="text-xs text-white font-black">{assets.length}</span>
                                            </div>
                                            <div className="w-px h-6 bg-white/10" />
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">En Actividad</span>
                                                <span className="text-xs text-blue-400 font-black">
                                                    {assets.filter(a => a.lifecycleStatus === 'active' || !a.lifecycleStatus).length}
                                                </span>
                                            </div>
                                            <div className="w-px h-6 bg-white/10" />
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Vencen &lt; 30d</span>
                                                <span className="text-xs text-status-red font-black">
                                                    {assets.filter(a => {
                                                        if (!a.expirationDate) return false;
                                                        const diff = new Date(a.expirationDate).getTime() - Date.now();
                                                        const days = diff / (1000 * 60 * 60 * 24);
                                                        return days >= 0 && days <= 30;
                                                    }).length}
                                                </span>
                                            </div>
                                        </div>

                                        <div
                                            onClick={openAddModal}
                                            className="hidden sm:flex items-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-background-dark px-3 py-1.5 rounded-lg border border-primary/20 hover:border-primary transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined !text-base">add_circle</span>
                                            Agregar Equipo
                                        </div>
                                    </>
                                )}
                                <span className={`material-symbols-outlined text-slate-500 transition-transform duration-300 ${selectedClient?.id === client.id ? 'rotate-180 text-primary' : ''}`}>
                                    expand_more
                                </span>
                            </div>
                        </button>

                        {/* Expanded Assets List */}
                        {selectedClient?.id === client.id && (
                            <div className="border-t border-white/10 bg-black/20 p-4 animate-fadeIn">
                                {/* Mobile Statistics and Add Button */}
                                <div className="sm:hidden space-y-4 mb-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                                            <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-tight">Equipos</span>
                                            <span className="text-xs text-white font-black">{assets.length}</span>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                                            <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-tight">Activos</span>
                                            <span className="text-xs text-blue-400 font-black">
                                                {assets.filter(a => a.lifecycleStatus === 'active' || !a.lifecycleStatus).length}
                                            </span>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                                            <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-tight">Vencen &lt; 30d</span>
                                            <span className="text-xs text-status-red font-black">
                                                {assets.filter(a => {
                                                    if (!a.expirationDate) return false;
                                                    const diff = new Date(a.expirationDate).getTime() - Date.now();
                                                    const days = diff / (1000 * 60 * 60 * 24);
                                                    return days >= 0 && days <= 30;
                                                }).length}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={openAddModal}
                                        className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-background-dark px-3 py-3 rounded-lg border border-primary/20 hover:border-primary transition-all text-xs font-bold uppercase tracking-wider"
                                    >
                                        <span className="material-symbols-outlined !text-base">add_circle</span>
                                        Agregar Equipo
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                                    </div>
                                ) : assets.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                                                    <th className="pb-3 pl-2 hidden sm:table-cell">ID</th>
                                                    <th className="pb-3">Equipo</th>
                                                    <th className="pb-3">Estado Op.</th>
                                                    <th className="pb-3 hidden md:table-cell">Ult. Insp.</th>
                                                    <th className="pb-3">Prox. Insp.</th>
                                                    <th className="pb-3 hidden lg:table-cell">Ult. Recarga</th>
                                                    <th className="pb-3 hidden xl:table-cell">Prox. PH</th>
                                                    <th className="pb-3 text-right pr-2">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {assets.map(asset => (
                                                    <tr
                                                        key={asset.id}
                                                        className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 cursor-pointer"
                                                        onClick={() => setViewingAsset(asset)}
                                                    >
                                                        <td className="py-3 pl-2 font-mono text-slate-400 text-[10px] text-primary hidden sm:table-cell">{asset.id}</td>
                                                        <td className="py-3">
                                                            <div className="font-bold text-white text-xs sm:text-sm">{asset.name || 'Equipo'}</div>
                                                            <div className="text-[10px] text-slate-500">{asset.equipmentCategory || 'Extintor'} - {asset.type}</div>
                                                            <div className="hidden sm:block text-[9px] text-slate-600 truncate max-w-[120px]">{asset.description}</div>
                                                        </td>
                                                        <td className="py-3">
                                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${asset.lifecycleStatus === 'active' || !asset.lifecycleStatus ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                                asset.lifecycleStatus === 'maintenance' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                                }`}>
                                                                {asset.lifecycleStatus === 'active' || !asset.lifecycleStatus ? 'Activo' :
                                                                    asset.lifecycleStatus === 'maintenance' ? 'Planta' : 'Descarte'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-slate-400 font-mono text-[10px] hidden md:table-cell">{asset.lastInspection ? new Date(asset.lastInspection).toLocaleDateString() : '-'}</td>
                                                        <td className="py-3 text-white font-mono text-xs font-bold">{asset.nextInspection ? new Date(asset.nextInspection).toLocaleDateString() : '-'}</td>
                                                        <td className="py-3 text-slate-400 font-mono text-[10px] hidden lg:table-cell">{asset.lastRecharge ? new Date(asset.lastRecharge).toLocaleDateString() : '-'}</td>
                                                        <td className="py-3 text-slate-400 font-mono text-[10px] hidden xl:table-cell">{asset.nextHydrotest ? new Date(asset.nextHydrotest).toLocaleDateString() : '-'}</td>
                                                        <td className="py-3 text-right pr-2 flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setQrAssetToPrint(asset); }}
                                                                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                                                                title="Imprimir QR"
                                                            >
                                                                <span className="material-symbols-outlined !text-lg">print</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }}
                                                                className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-full"
                                                                title="Eliminar"
                                                            >
                                                                <span className="material-symbols-outlined !text-lg">delete</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        <div className="mt-6 flex flex-wrap justify-end pt-4 border-t border-white/10 gap-3">
                                            <button
                                                onClick={handlePrintGrid}
                                                disabled={isPrintingGrid}
                                                className={`flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold px-4 py-2 rounded-xl transition-all text-sm border border-white/10 ${isPrintingGrid ? 'opacity-50 cursor-wait' : ''}`}
                                            >
                                                <span className="material-symbols-outlined !text-lg text-primary">
                                                    {isPrintingGrid ? 'sync' : 'grid_view'}
                                                </span>
                                                {isPrintingGrid ? 'Generando lote...' : 'Imprimir por Lote (A4)'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (!selectedClient || assets.length === 0) return;
                                                    setIsPrintingBatch(true);
                                                    // Re-implementing handlePrintAll inside because I replaced it
                                                    setTimeout(() => {
                                                        const container = document.getElementById('batch-qr-container');
                                                        if (container) {
                                                            const printWindow = window.open('', '', 'width=800,height=600');
                                                            if (printWindow) {
                                                                let labelsHtml = '';
                                                                assets.forEach(asset => {
                                                                    const qrElem = document.getElementById(`batch-qr-${asset.id}`)?.querySelector('svg');
                                                                    if (qrElem) {
                                                                        labelsHtml += `
                                                                            <div class="qr-item">
                                                                                <div class="qr-svg">${qrElem.outerHTML}</div>
                                                                                <div class="qr-info">
                                                                                    <div class="qr-id">${asset.id}</div>
                                                                                    <div class="qr-client">${selectedClient.name.substring(0, 15)}</div>
                                                                                    <div class="qr-type">${asset.type}</div>
                                                                                    <div class="qr-footer">EXTINTORESUY</div>
                                                                                </div>
                                                                            </div>
                                                                        `;
                                                                    }
                                                                });

                                                                printWindow.document.write(`
                                                                    <!DOCTYPE html>
                                                                    <html>
                                                                        <head>
                                                                            <title>Códigos QR - ${selectedClient.name}</title>
                                                                            <style>
                                                                        @page { size: auto; margin: 0; }
                                                                        body { 
                                                                            margin: 0; padding: 20px;
                                                                            font-family: 'Segoe UI', system-ui, sans-serif; 
                                                                            display: flex; flex-direction: column; align-items: center;
                                                                            background: white; gap: 10px;
                                                                        }
                                                                        .qr-item {
                                                                            border: 1px solid black;
                                                                            padding: 10px;
                                                                            display: flex;
                                                                            align-items: center;
                                                                            gap: 12px;
                                                                            height: 90px;
                                                                            width: 240px;
                                                                            box-sizing: border-box;
                                                                            page-break-after: always;
                                                                            background: #fff;
                                                                            border-radius: 4px;
                                                                        }
                                                                        .qr-svg svg {
                                                                            width: 60px !important;
                                                                            height: 60px !important;
                                                                            flex-shrink: 0;
                                                                        }
                                                                        .qr-info {
                                                                            flex: 1;
                                                                            display: flex;
                                                                            flex-direction: column;
                                                                            justify-content: center;
                                                                            min-width: 0;
                                                                        }
                                                                        .qr-id { 
                                                                            font-weight: 900; 
                                                                            font-size: 11px; 
                                                                            color: black; 
                                                                            margin-bottom: 2px;
                                                                            font-family: monospace;
                                                                        }
                                                                        .qr-client { 
                                                                            font-size: 9px; 
                                                                            color: #111; 
                                                                            font-weight: 700;
                                                                            white-space: nowrap;
                                                                            overflow: hidden;
                                                                            text-overflow: ellipsis;
                                                                        }
                                                                        .qr-type { 
                                                                            font-size: 8px; 
                                                                            color: #555;
                                                                            margin-top: 2px;
                                                                        }
                                                                        .qr-footer {
                                                                            font-size: 7px;
                                                                            color: #999;
                                                                            margin-top: 4px;
                                                                            font-weight: bold;
                                                                            letter-spacing: 0.5px;
                                                                        }
                                                                    </style>
                                                                </head>
                                                                <body>
                                                                    ${labelsHtml}
                                                                            <script>
                                                                                window.onload = function() {
                                                                                    setTimeout(() => { window.print(); window.close(); }, 800);
                                                                                }
                                                                            </script>
                                                                        </body>
                                                                    </html>
                                                                `);
                                                                printWindow.document.close();
                                                            }
                                                        }
                                                        setIsPrintingBatch(false);
                                                    }, 1000);
                                                }}
                                                disabled={isPrintingBatch}
                                                className={`flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold px-4 py-2 rounded-xl transition-all text-sm border border-white/10 ${isPrintingBatch ? 'opacity-50 cursor-wait' : ''}`}
                                            >
                                                <span className="material-symbols-outlined !text-lg">
                                                    {isPrintingBatch ? 'sync' : 'print'}
                                                </span>
                                                {isPrintingBatch ? 'Generando...' : 'Imprimir Códigos (QR)'}
                                            </button>
                                            <button
                                                onClick={handleExport}
                                                className="flex items-center gap-2 bg-primary hover:bg-green-400 text-background-dark font-bold px-4 py-2 rounded-xl transition-colors text-sm shadow-lg shadow-primary/10"
                                            >
                                                <span className="material-symbols-outlined !text-lg">download</span>
                                                Exportar Reporte (CSV)
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-slate-500 text-sm">
                                        Este cliente no tiene equipos registrados.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* View Asset Detail Modal */}
            {viewingAsset && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-background-dark border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl animate-scaleIn overflow-hidden">
                        {/* Modal Header/Banner */}
                        <div className="bg-gradient-to-br from-primary/20 to-emerald-500/20 p-8 border-b border-white/10 relative">
                            <button
                                onClick={() => setViewingAsset(null)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                            <div className="flex items-center gap-6">
                                <div className="size-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-4xl text-primary">fire_extinguisher</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">{viewingAsset.name || 'Equipo'}</h2>
                                    <p className="text-primary font-mono text-sm uppercase tracking-widest">{viewingAsset.id}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${viewingAsset.lifecycleStatus === 'active' || !viewingAsset.lifecycleStatus ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                            {viewingAsset.lifecycleStatus === 'active' || !viewingAsset.lifecycleStatus ? 'Activo' : 'Inactivo'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${(viewingAsset.expirationDate && viewingAsset.expirationDate < new Date().toISOString().split('T')[0]) || viewingAsset.status === 'failed'
                                            ? 'bg-status-red/20 text-status-red'
                                            : 'bg-primary/20 text-primary'
                                            }`}>
                                            {(viewingAsset.expirationDate && viewingAsset.expirationDate < new Date().toISOString().split('T')[0]) ? 'Vencido' : viewingAsset.status === 'ok' ? 'Conforme' : 'Alerta'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Key Technical Data */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tipo de Equipo</p>
                                    <p className="text-white font-bold">{viewingAsset.type}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Agente Extintor</p>
                                    <p className="text-white font-bold">{viewingAsset.agent || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Clase de Fuego</p>
                                    <p className="text-white font-bold">{viewingAsset.fireClass || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Ubicación</p>
                                    <p className="text-white font-bold text-sm leading-tight">{viewingAsset.description || 'Sin descripción'}</p>
                                </div>
                            </div>

                            {/* Maintenance Timetable */}
                            <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
                                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary !text-lg">event_repeat</span>
                                    Cronograma de Mantenimiento
                                </h3>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase mb-1">Última Inspección</span>
                                        <span className="text-white font-mono text-sm">{viewingAsset.lastInspection ? new Date(viewingAsset.lastInspection).toLocaleDateString() : '-'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase mb-1">Próxima Inspección</span>
                                        <span className="text-primary font-mono text-sm">{viewingAsset.nextInspection ? new Date(viewingAsset.nextInspection).toLocaleDateString() : '-'}</span>
                                    </div>
                                    <div className="flex flex-col border-t border-white/5 pt-3">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase mb-1">Vencimiento Carga</span>
                                        <span className={`font-mono text-sm ${viewingAsset.expirationDate && new Date(viewingAsset.expirationDate) < new Date() ? 'text-status-red' : 'text-slate-300'}`}>
                                            {viewingAsset.expirationDate ? new Date(viewingAsset.expirationDate).toLocaleDateString() : '-'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col border-t border-white/5 pt-3">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase mb-1">Próxima Hidrostática</span>
                                        <span className="text-slate-300 font-mono text-sm">{viewingAsset.nextHydrotest ? new Date(viewingAsset.nextHydrotest).toLocaleDateString() : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="p-8 bg-black/20 border-t border-white/10 flex items-center justify-between gap-4">
                            <button
                                onClick={() => { setQrAssetToPrint(viewingAsset); }}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all font-bold text-sm"
                            >
                                <span className="material-symbols-outlined !text-lg">print</span>
                                Imprimir Etiqueta
                            </button>
                            <button
                                onClick={() => handleEditAsset(viewingAsset)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary text-background-dark rounded-xl shadow-lg shadow-primary/20 hover:bg-green-400 transition-all font-black text-sm uppercase tracking-tight"
                            >
                                <span className="material-symbols-outlined !text-lg fill-1">edit</span>
                                Editar Datos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Asset Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-background-dark border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-white">Nuevo Equipo</h2>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleAddAsset} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Ref.</label>
                                <input
                                    type="text"
                                    required
                                    value={newAsset.name}
                                    onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                                    placeholder="Ej. Extintor Hall / Manguera 1"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoría de Equipo</label>
                                <select
                                    value={newAsset.equipmentCategory}
                                    onChange={e => setNewAsset({ ...newAsset, equipmentCategory: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                                >
                                    <option value="Extintor">Extintor</option>
                                    <option value="Manguera / Nicho">Manguera / Nicho de Incendio</option>
                                    <option value="Botiquín">Botiquín de Primeros Auxilios</option>
                                    <option value="Alarma / Detector">Alarma / Detector de Humo</option>
                                    <option value="Luminaria de Emergencia">Luminaria de Emergencia</option>
                                    <option value="Otro">Otro Equipo de Seguridad</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipo / Detalles</label>
                                {newAsset.equipmentCategory === 'Extintor' ? (
                                    <select
                                        value={newAsset.type}
                                        onChange={e => {
                                            const type = e.target.value;
                                            let agent = '';
                                            let fireClass = '';

                                            if (type.includes('PQS')) { agent = 'Polvo Químico ABC'; fireClass = 'A, B, C'; }
                                            else if (type.includes('CO2')) { agent = 'CO2'; fireClass = 'B, C'; }
                                            else if (type.includes('Agua')) { agent = 'Agua'; fireClass = 'A'; }
                                            else if (type.includes('Espuma')) { agent = 'Espuma AFFF'; fireClass = 'A, B'; }

                                            setNewAsset({ ...newAsset, type, agent, fireClass });
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                                    >
                                        <option value="" disabled>Seleccionar Tipo</option>
                                        <option value="PQS 4kg">PQS 4kg</option>
                                        <option value="PQS 8kg">PQS 8kg</option>
                                        <option value="CO2 2kg">CO2 2kg</option>
                                        <option value="CO2 5kg">CO2 5kg</option>
                                        <option value="Agua 10L">Agua 10L</option>
                                        <option value="Espuma AFFF">Espuma AFFF</option>
                                        <option value="Acetato de Potasio">Acetato de Potasio (Clase K)</option>
                                        <option value="Clase D">Clase D (Metales)</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={newAsset.type}
                                        onChange={e => setNewAsset({ ...newAsset, type: e.target.value })}
                                        placeholder="Ej. Manguera 25mts / Tipo B"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                )}
                            </div>

                            {newAsset.equipmentCategory === 'Extintor' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Agente Extintor</label>
                                        <select
                                            value={newAsset.agent}
                                            onChange={e => setNewAsset({ ...newAsset, agent: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none text-xs"
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="Agua">Agua</option>
                                            <option value="Agua Pulverizada">Agua Pulverizada</option>
                                            <option value="Polvo Químico ABC">Polvo Químico ABC</option>
                                            <option value="CO2">CO2 (Dióxido de Carbono)</option>
                                            <option value="Espuma AFFF">Espuma AFFF</option>
                                            <option value="Clase D">Agentes Especiales (Clase D)</option>
                                            <option value="Acetato de Potasio">Acetato de Potasio (Clase F)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Clase de Fuego</label>
                                        <input
                                            type="text"
                                            value={newAsset.fireClass}
                                            onChange={e => setNewAsset({ ...newAsset, fireClass: e.target.value })}
                                            placeholder="Ej. A, B, C"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Última Inspección</label>
                                    <input
                                        type="date"
                                        value={newAsset.lastInspection || ''}
                                        onChange={e => {
                                            const date = e.target.value;
                                            setNewAsset({ ...newAsset, lastInspection: date, nextInspection: addMonths(date, 1) });
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Próxima Inspección</label>
                                    <input
                                        type="date"
                                        value={newAsset.nextInspection}
                                        onChange={e => setNewAsset({ ...newAsset, nextInspection: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {newAsset.equipmentCategory === 'Extintor' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Última Recarga</label>
                                        <input
                                            type="date"
                                            value={newAsset.lastRecharge}
                                            onChange={e => {
                                                const date = e.target.value;
                                                setNewAsset({ ...newAsset, lastRecharge: date, expirationDate: addYears(date, 2) });
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                )}
                                {['Extintor', 'Botiquín'].includes(newAsset.equipmentCategory) && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vencimiento {newAsset.equipmentCategory === 'Botiquín' ? 'Insumos' : 'Carga'}</label>
                                        <input
                                            type="date"
                                            value={newAsset.expirationDate}
                                            onChange={e => setNewAsset({ ...newAsset, expirationDate: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                )}
                            </div>

                            {['Extintor', 'Manguera / Nicho'].includes(newAsset.equipmentCategory) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Última PH</label>
                                        <input
                                            type="date"
                                            value={newAsset.lastHydrotest || ''}
                                            onChange={e => {
                                                const date = e.target.value;
                                                setNewAsset({ ...newAsset, lastHydrotest: date, nextHydrotest: addYears(date, 4) });
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Próxima PH</label>
                                        <input
                                            type="date"
                                            value={newAsset.nextHydrotest}
                                            onChange={e => setNewAsset({ ...newAsset, nextHydrotest: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estado Operativo</label>
                                <select
                                    value={newAsset.lifecycleStatus || 'active'}
                                    onChange={e => setNewAsset({ ...newAsset, lifecycleStatus: e.target.value as any })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                                >
                                    <option value="active">Activo (En Servicio)</option>
                                    <option value="maintenance">En Planta / Taller</option>
                                    <option value="discarded">Descartado / Fuera de Uso</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ubicación / Descripción</label>
                                <textarea
                                    value={newAsset.description}
                                    onChange={e => setNewAsset({ ...newAsset, description: e.target.value })}
                                    placeholder="Ej. Pasillo principal, junto a escalera"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors h-24 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary text-background-dark font-black py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-green-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {isSubmitting ? 'Guardando...' : 'Registrar Equipo'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Asset Modal */}
            {editingAsset && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-background-dark border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-white">Editar Equipo</h2>
                            <button
                                onClick={() => setEditingAsset(null)}
                                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase">ID del Activo</span>
                            <span className="font-mono text-sm font-bold text-primary">{editingAsset.id}</span>
                        </div>

                        <form onSubmit={handleUpdateAsset} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre Ref.</label>
                                <input
                                    type="text"
                                    required
                                    value={editingAsset.name}
                                    onChange={e => setEditingAsset({ ...editingAsset, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categoría de Equipo</label>
                                <select
                                    value={editingAsset.equipmentCategory || 'Extintor'}
                                    onChange={e => setEditingAsset({ ...editingAsset, equipmentCategory: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                                >
                                    <option value="Extintor">Extintor</option>
                                    <option value="Manguera / Nicho">Manguera / Nicho de Incendio</option>
                                    <option value="Botiquín">Botiquín de Primeros Auxilios</option>
                                    <option value="Alarma / Detector">Alarma / Detector de Humo</option>
                                    <option value="Luminaria de Emergencia">Luminaria de Emergencia</option>
                                    <option value="Otro">Otro Equipo de Seguridad</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipo / Detalles</label>
                                {editingAsset.equipmentCategory === 'Extintor' ? (
                                    <select
                                        value={editingAsset.type}
                                        onChange={e => {
                                            const type = e.target.value;
                                            let agent = '';
                                            let fireClass = '';

                                            if (type.includes('PQS')) { agent = 'Polvo Químico ABC'; fireClass = 'A, B, C'; }
                                            else if (type.includes('CO2')) { agent = 'CO2'; fireClass = 'B, C'; }
                                            else if (type.includes('Agua')) { agent = 'Agua'; fireClass = 'A'; }
                                            else if (type.includes('Espuma')) { agent = 'Espuma AFFF'; fireClass = 'A, B'; }

                                            setEditingAsset({ ...editingAsset, type, agent, fireClass });
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                                    >
                                        <option value="" disabled>Seleccionar Tipo</option>
                                        <option value="PQS 4kg">PQS 4kg</option>
                                        <option value="PQS 8kg">PQS 8kg</option>
                                        <option value="CO2 2kg">CO2 2kg</option>
                                        <option value="CO2 5kg">CO2 5kg</option>
                                        <option value="Agua 10L">Agua 10L</option>
                                        <option value="Espuma AFFF">Espuma AFFF</option>
                                        <option value="Acetato de Potasio">Acetato de Potasio (Clase K)</option>
                                        <option value="Clase D">Clase D (Metales)</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={editingAsset.type}
                                        onChange={e => setEditingAsset({ ...editingAsset, type: e.target.value })}
                                        placeholder="Ej. Manguera 25mts / Tipo B"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                )}
                            </div>

                            {editingAsset.equipmentCategory === 'Extintor' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Agente Extintor</label>
                                        <select
                                            value={editingAsset.agent || ''}
                                            onChange={e => setEditingAsset({ ...editingAsset, agent: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none text-xs"
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="Agua">Agua</option>
                                            <option value="Agua Pulverizada">Agua Pulverizada</option>
                                            <option value="Polvo Químico ABC">Polvo Químico ABC</option>
                                            <option value="CO2">CO2 (Dióxido de Carbono)</option>
                                            <option value="Espuma AFFF">Espuma AFFF</option>
                                            <option value="Clase D">Agentes Especiales (Clase D)</option>
                                            <option value="Acetato de Potasio">Acetato de Potasio (Clase F)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Clase de Fuego</label>
                                        <input
                                            type="text"
                                            value={editingAsset.fireClass || ''}
                                            onChange={e => setEditingAsset({ ...editingAsset, fireClass: e.target.value })}
                                            placeholder="Ej. A, B, C"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Última Inspección</label>
                                    <input
                                        type="date"
                                        value={editingAsset.lastInspection || ''}
                                        onChange={e => {
                                            const date = e.target.value;
                                            setEditingAsset({ ...editingAsset, lastInspection: date, nextInspection: addMonths(date, 1) });
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Próxima Inspección</label>
                                    <input
                                        type="date"
                                        value={editingAsset.nextInspection || ''}
                                        onChange={e => setEditingAsset({ ...editingAsset, nextInspection: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {editingAsset.equipmentCategory === 'Extintor' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Última Recarga</label>
                                        <input
                                            type="date"
                                            value={editingAsset.lastRecharge || ''}
                                            onChange={e => {
                                                const date = e.target.value;
                                                setEditingAsset({ ...editingAsset, lastRecharge: date, expirationDate: addYears(date, 2) });
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                )}
                                {['Extintor', 'Botiquín'].includes(editingAsset.equipmentCategory || 'Extintor') && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vencimiento {editingAsset.equipmentCategory === 'Botiquín' ? 'Insumos' : 'Carga'}</label>
                                        <input
                                            type="date"
                                            value={editingAsset.expirationDate || ''}
                                            onChange={e => setEditingAsset({ ...editingAsset, expirationDate: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                )}
                            </div>

                            {['Extintor', 'Manguera / Nicho'].includes(editingAsset.equipmentCategory || 'Extintor') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Última PH</label>
                                        <input
                                            type="date"
                                            value={editingAsset.lastHydrotest || ''}
                                            onChange={e => {
                                                const date = e.target.value;
                                                setEditingAsset({ ...editingAsset, lastHydrotest: date, nextHydrotest: addYears(date, 4) });
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Próxima PH</label>
                                        <input
                                            type="date"
                                            value={editingAsset.nextHydrotest || ''}
                                            onChange={e => setEditingAsset({ ...editingAsset, nextHydrotest: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estado Operativo</label>
                                <select
                                    value={editingAsset.lifecycleStatus || 'active'}
                                    onChange={e => setEditingAsset({ ...editingAsset, lifecycleStatus: e.target.value as any })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                                >
                                    <option value="active">Activo (En Servicio)</option>
                                    <option value="maintenance">En Planta / Taller</option>
                                    <option value="discarded">Descartado / Fuera de Uso</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ubicación / Descripción</label>
                                <textarea
                                    value={editingAsset.description}
                                    onChange={e => setEditingAsset({ ...editingAsset, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 transition-colors h-24 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary text-background-dark font-black py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-green-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {isSubmitting ? 'Guardando Cambios...' : 'Actualizar Equipo'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquiposScreen;
