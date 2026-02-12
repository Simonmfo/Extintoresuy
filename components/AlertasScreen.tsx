
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { InspectionAsset, UserProfile } from '../types';

interface AlertasScreenProps {
    type: 'expired' | 'pending';
    companyId: string;
    onAction: (assetId: string) => void;
    onBack: () => void;
    profile?: UserProfile | null;
}

const AlertasScreen: React.FC<AlertasScreenProps> = ({ type, companyId, onAction, onBack, profile }) => {
    const [groupedAssets, setGroupedAssets] = useState<{ [clientId: string]: { clientName: string; assets: InspectionAsset[] } }>({});
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigningClient, setAssigningClient] = useState<{ id: string; name: string } | null>(null);
    const [assigningAsset, setAssigningAsset] = useState<InspectionAsset | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const [rawAssets, allClients, allTechs] = await Promise.all([
            db.getAssets(companyId),
            db.getClients(companyId),
            db.getTechniciansWithStats(companyId)
        ]);

        setTechnicians(allTechs);

        let allAssets = rawAssets;
        if (profile?.role === 'tecnico') {
            allAssets = rawAssets.filter(a => a.assignedTechnicianId === profile.id);
        }

        let filtered: InspectionAsset[] = [];
        if (type === 'expired') {
            filtered = allAssets.filter(a => a.status === 'expired' || a.status === 'failed');
        } else {
            filtered = allAssets.filter(a => a.status === 'pending');
        }

        // Group by client
        const grouped = filtered.reduce((acc, asset) => {
            const clientId = asset.clientId || 'unknown';
            if (!acc[clientId]) {
                const client = allClients.find(c => c.id === clientId);
                acc[clientId] = {
                    clientName: client ? client.name : 'Cliente Desconocido',
                    assets: []
                };
            }
            acc[clientId].assets.push(asset);
            return acc;
        }, {} as { [clientId: string]: { clientName: string; assets: InspectionAsset[] } });

        setGroupedAssets(grouped);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [type, companyId]);

    const handleAssign = async (technicianId: string) => {
        setIsSubmitting(true);
        let success = false;

        if (assigningAsset) {
            success = await db.assignAssetToTechnician(assigningAsset.id, technicianId);
        } else if (assigningClient) {
            const statuses = type === 'expired' ? ['expired', 'failed'] : ['pending'];
            success = await db.assignAllClientAssetsToTechnician(assigningClient.id, technicianId, statuses);
        }

        if (success) {
            setAssigningClient(null);
            setAssigningAsset(null);
            await loadData();
        } else {
            alert('Error al asignar el técnico.');
        }
        setIsSubmitting(false);
    };

    const handleUnassignAsset = async (assetId: string) => {
        if (!window.confirm('¿Deseas quitar la asignación de este equipo?')) return;
        setIsSubmitting(true);
        const success = await db.assignAssetToTechnician(assetId, null as any);
        if (success) {
            await loadData();
        } else {
            alert('Error al desasignar.');
        }
        setIsSubmitting(false);
    };

    const handleUnassignClient = async (clientId: string) => {
        if (!window.confirm('¿Deseas quitar la asignación de todos los equipos de este cliente?')) return;
        setIsSubmitting(true);
        const statuses = type === 'expired' ? ['expired', 'failed'] : ['pending'];
        const success = await db.assignAllClientAssetsToTechnician(clientId, null as any, statuses);
        if (success) {
            await loadData();
        } else {
            alert('Error al desasignar.');
        }
        setIsSubmitting(false);
    };

    const totalAssets = Object.values(groupedAssets).reduce((sum: number, group: any) => sum + (group.assets?.length || 0), 0);

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 lg:p-8 relative">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <span className={`material-symbols-outlined ${type === 'expired' ? 'text-status-red' : 'text-status-yellow'} !text-3xl`}>
                                {type === 'expired' ? 'report_problem' : 'inventory_2'}
                            </span>
                            {type === 'expired' ? 'Críticos y Vencidos' : 'Pendientes de Revisión'}
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Equipos organizados por cliente que requieren atención.
                        </p>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-slate-300">
                    {totalAssets} Equipos
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                </div>
            ) : totalAssets > 0 ? (
                <div className="space-y-12">
                    {Object.entries(groupedAssets).map(([clientId, group]) => {
                        const hasAssignments = group.assets?.some(a => a.assignedTechnicianId);

                        return (
                            <div key={clientId} className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary text-xl">business_center</span>
                                        <h2 className="text-lg font-black text-white uppercase tracking-wider text-wrap">{group.clientName}</h2>
                                        <span className="text-[10px] font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                            {group.assets.length} items
                                        </span>
                                    </div>

                                    {profile?.role !== 'tecnico' && (
                                        hasAssignments ? (
                                            <button
                                                onClick={() => handleUnassignClient(clientId)}
                                                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 w-fit"
                                            >
                                                <span className="material-symbols-outlined text-sm">person_remove</span>
                                                DESASIGNAR TODOS
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setAssigningClient({ id: clientId, name: group.clientName })}
                                                className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all flex items-center gap-2 w-fit"
                                            >
                                                <span className="material-symbols-outlined text-sm">assignment_ind</span>
                                                ASIGNAR TODOS A TÉCNICO
                                            </button>
                                        )
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {group.assets.map(asset => {
                                        const assignedTech = technicians.find(t => t.id === asset.assignedTechnicianId);

                                        return (
                                            <div
                                                key={asset.id}
                                                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] transition-all group flex flex-col gap-4 relative overflow-hidden"
                                            >
                                                {assignedTech && (
                                                    <div className="absolute top-0 right-0 px-3 py-1 bg-primary/20 border-b border-l border-white/10 rounded-bl-xl">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-primary !text-[12px]">engineering</span>
                                                            <span className="text-[9px] font-black text-primary uppercase tracking-tighter">
                                                                Técnico: {assignedTech.full_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4">
                                                    <div className={`size-14 rounded-2xl flex items-center justify-center border transition-colors ${type === 'expired' ? 'bg-status-red/10 border-status-red/20 group-hover:border-status-red/50' : 'bg-status-yellow/10 border-status-yellow/20 group-hover:border-status-yellow/50'
                                                        }`}>
                                                        <span className={`material-symbols-outlined !text-3xl ${type === 'expired' ? 'text-status-red' : 'text-status-yellow'}`}>
                                                            fire_extinguisher
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h3 className="font-bold text-white truncate">{asset.name || 'Extintor'}</h3>
                                                            <span className="text-[10px] font-mono text-primary font-bold">{asset.id}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-400 mb-2">{asset.type}</p>

                                                        {profile?.role !== 'tecnico' && (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setAssigningAsset(asset);
                                                                    }}
                                                                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 text-slate-400 hover:text-primary transition-all flex items-center justify-center"
                                                                    title="Asignar a técnico"
                                                                >
                                                                    <span className="material-symbols-outlined !text-xl">assignment_ind</span>
                                                                </button>
                                                                {asset.assignedTechnicianId && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleUnassignAsset(asset.id);
                                                                        }}
                                                                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"
                                                                        title="Quitar asignación"
                                                                    >
                                                                        <span className="material-symbols-outlined !text-xl">person_remove</span>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => onAction(asset.id)}
                                                                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-all flex items-center justify-center"
                                                                >
                                                                    <span className="material-symbols-outlined !text-xl">chevron_right</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <span className="material-symbols-outlined text-6xl text-slate-700 mb-4 font-light">verified</span>
                    <p className="text-slate-500 font-medium">No hay equipos en este estado.</p>
                </div>
            )}

            {/* Assignment Modal */}
            {(assigningClient || assigningAsset) && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-background-dark border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white">{assigningAsset ? 'Asignar equipo' : 'Asignar flota completa'}</h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    {assigningAsset ? `Extintor: ${assigningAsset.name || assigningAsset.id}` : `Cliente: ${assigningClient?.name}`}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setAssigningClient(null);
                                    setAssigningAsset(null);
                                }}
                                className="size-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                            {technicians.length > 0 ? (
                                technicians.map(tech => (
                                    <button
                                        key={tech.id}
                                        onClick={() => handleAssign(tech.id)}
                                        disabled={isSubmitting}
                                        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xs">
                                                {tech.full_name?.substring(0, 2) || 'TE'}
                                            </div>
                                            <div>
                                                <span className="block font-bold text-white">{tech.full_name}</span>
                                                <span className="block text-[10px] text-slate-500 uppercase font-black">{tech.pendingCount} Pendientes</span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <p className="text-slate-500 text-sm">No hay técnicos creados.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => {
                                    setAssigningClient(null);
                                    setAssigningAsset(null);
                                }}
                                className="flex-1 py-4 rounded-xl border border-white/10 text-xs font-bold text-slate-400 uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertasScreen;
