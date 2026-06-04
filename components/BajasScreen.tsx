import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { InspectionAsset } from '../types';
import { hasPermission } from '../utils/permissions';

interface BajasScreenProps {
    companyId: string;
    profile: any;
}

const BajasScreen: React.FC<BajasScreenProps> = ({ companyId, profile }) => {
    const [retiredAssets, setRetiredAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
    const [isReactivating, setIsReactivating] = useState(false);

    const hasWritePermission = hasPermission(profile, 'equipos', 'write');

    useEffect(() => {
        loadData();
    }, [companyId]);

    const loadData = async () => {
        setLoading(true);
        const data = await db.getRetiredAssets(companyId);
        setRetiredAssets(data);
        setLoading(false);
    };

    const handleReactivate = async (asset: any) => {
        if (!hasWritePermission) {
            alert('No tienes permisos de modificación para reactivar equipos.');
            return;
        }

        if (!window.confirm(`¿Estás seguro de que deseas reactivar el equipo con matrícula "${asset.id}"? Volverá al estado activo de servicio.`)) {
            return;
        }

        setIsReactivating(true);
        try {
            const success = await db.updateAsset(asset.id, {
                lifecycleStatus: 'active',
                retiredAt: null as any,
                retiredById: null as any,
                retiredByName: null as any,
                retirementReason: null as any
            });

            if (success) {
                alert('Equipo reactivado exitosamente');
                setSelectedAsset(null);
                loadData();
            } else {
                alert('Error al reactivar el equipo');
            }
        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setIsReactivating(false);
        }
    };

    const filteredAssets = retiredAssets.filter(asset => 
        asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.retirementReason || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col p-4 lg:p-0">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500 !text-4xl">delete_forever</span>
                    Equipos de Baja (Descartes)
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Bitácora histórica de cilindros y extintores que fueron retirados del servicio activo.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total de Bajas</span>
                    <span className="text-2xl font-black text-white">{retiredAssets.length}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Extintores de Baja</span>
                    <span className="text-2xl font-black text-orange-400">
                        {retiredAssets.filter(a => a.equipmentCategory === 'Extintor' || !a.equipmentCategory).length}
                    </span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Otros Equipos</span>
                    <span className="text-2xl font-black text-slate-400">
                        {retiredAssets.filter(a => a.equipmentCategory !== 'Extintor' && a.equipmentCategory).length}
                    </span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white/5 border border-white/10 p-2 rounded-2xl flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 ml-4">search</span>
                <input
                    type="text"
                    placeholder="Buscar por matrícula, cliente, tipo o motivo de baja..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none text-white text-sm focus:ring-0 placeholder-slate-600 flex-1 py-3"
                />
            </div>

            {/* Table Container */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-auto h-full custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-5">Matrícula</th>
                                    <th className="p-5">Lugar / Cliente</th>
                                    <th className="p-5">Especificaciones</th>
                                    <th className="p-5">Fecha de Baja</th>
                                    <th className="p-5">Motivo de Baja</th>
                                    <th className="p-5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssets.map(asset => (
                                    <tr key={asset.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-5">
                                            <span className="font-mono text-primary font-bold text-xs">{asset.id}</span>
                                        </td>
                                        <td className="p-5">
                                            <div>
                                                <p className="font-bold text-white leading-tight">{asset.name || 'Sin nombre'}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{asset.clientName}</p>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="text-xs text-slate-300">
                                                <p><span className="text-slate-500">Categoría:</span> {asset.equipmentCategory || 'Extintor'}</p>
                                                <p className="mt-0.5"><span className="text-slate-500">Tipo/Cap:</span> {asset.type || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-xs text-slate-400 font-mono">
                                                {asset.retiredAt ? new Date(asset.retiredAt).toLocaleDateString('es-UY', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-5 max-w-[200px] truncate">
                                            <span className="text-xs text-red-400 font-medium">
                                                {asset.retirementReason || 'No especificado'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedAsset(asset)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                                                >
                                                    <span className="material-symbols-outlined !text-sm">visibility</span>
                                                    Ficha
                                                </button>
                                                {hasWritePermission && (
                                                    <button
                                                        onClick={() => handleReactivate(asset)}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined !text-sm">restart_alt</span>
                                                        Reactivar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAssets.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-20 text-center">
                                            <span className="material-symbols-outlined text-slate-700 !text-5xl mb-4 font-light">inventory_2</span>
                                            <p className="text-slate-500 font-medium">No se registran equipos de baja.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Asset Detail Modal */}
            {selectedAsset && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#1a1c1e] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl animate-scaleIn flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between mb-6 shrink-0 border-b border-white/5 pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 rounded">DE BAJA</span>
                                    <span className="font-mono text-slate-400 text-xs">Matrícula: {selectedAsset.id}</span>
                                </div>
                                <h2 className="text-2xl font-black text-white mt-1">{selectedAsset.name || 'Detalle de Baja'}</h2>
                            </div>
                            <button onClick={() => setSelectedAsset(null)} className="size-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto custom-scrollbar pr-1 space-y-6 text-sm">
                            {/* Decommission Info Box */}
                            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 space-y-3">
                                <h3 className="font-bold text-red-400 flex items-center gap-2">
                                    <span className="material-symbols-outlined !text-base">info</span>
                                    Información de la Baja
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <p className="text-slate-500 font-bold uppercase tracking-wider">Fecha de Baja</p>
                                        <p className="text-white mt-0.5 font-medium">
                                            {selectedAsset.retiredAt ? new Date(selectedAsset.retiredAt).toLocaleString('es-UY') : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold uppercase tracking-wider">Responsable</p>
                                        <p className="text-white mt-0.5 font-medium">{selectedAsset.retiredByName || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-slate-500 font-bold uppercase tracking-wider">Motivo de Baja</p>
                                        <p className="text-red-400 mt-1 font-medium bg-red-500/10 border border-red-500/10 rounded-xl p-3">
                                            {selectedAsset.retirementReason || 'No especificado'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Equipment specs */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-white flex items-center gap-2 border-b border-white/5 pb-1">
                                    <span className="material-symbols-outlined !text-base text-slate-400">fire_extinguisher</span>
                                    Ficha del Equipo
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                    <div>
                                        <p className="text-slate-500 font-bold">Cliente</p>
                                        <p className="text-white mt-0.5 font-medium">{selectedAsset.clientName}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold">Categoría</p>
                                        <p className="text-white mt-0.5 font-medium">{selectedAsset.equipmentCategory || 'Extintor'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold">Tipo / Capacidad</p>
                                        <p className="text-white mt-0.5 font-medium">{selectedAsset.type || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold">Sello de Fábrica</p>
                                        <p className="text-white mt-0.5 font-medium">{selectedAsset.selloFabrica || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold">Sello de Recarga</p>
                                        <p className="text-white mt-0.5 font-medium">{selectedAsset.matricula || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold">UNIT de Fábrica</p>
                                        <p className="text-white mt-0.5 font-medium">{selectedAsset.unit || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold">Última Carga</p>
                                        <p className="text-white mt-0.5 font-mono">{selectedAsset.lastRecharge ? new Date(selectedAsset.lastRecharge).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold">Último Ensayo (PH)</p>
                                        <p className="text-white mt-0.5 font-mono">{selectedAsset.lastHydrotest ? new Date(selectedAsset.lastHydrotest).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-bold">Ubicación</p>
                                        <p className="text-white mt-0.5 font-medium truncate" title={selectedAsset.description}>{selectedAsset.description || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 mt-6 border-t border-white/5 pt-4 shrink-0">
                            {hasWritePermission && (
                                <button
                                    onClick={() => handleReactivate(selectedAsset)}
                                    disabled={isReactivating}
                                    className="flex-1 bg-primary text-background-dark font-black py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-green-400 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-wider text-xs"
                                >
                                    {isReactivating ? 'REACTIVANDO...' : 'REACTIVAR EQUIPO'}
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedAsset(null)}
                                className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/10 active:scale-[0.98] transition-all uppercase tracking-wider text-xs"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BajasScreen;
