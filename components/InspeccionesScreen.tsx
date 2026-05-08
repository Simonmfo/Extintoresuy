
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { supabase } from '../services/supabase';
import { InspectionAsset, UserProfile } from '../types';
import QRScannerModal from './QRScannerModal';

interface InspeccionesScreenProps {
    onBack: () => void;
    profile: UserProfile | null;
    onStartInspection: (assetId: string) => void;
    pendingCount?: number;
    onFinalize?: () => void;
}

const InspeccionesScreen: React.FC<InspeccionesScreenProps> = ({ onBack, profile, onStartInspection, pendingCount = 0, onFinalize }) => {
    const [inspections, setInspections] = useState<any[]>([]);
    const [assignedAssets, setAssignedAssets] = useState<InspectionAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'assigned' | 'history'>(profile?.role === 'tecnico' ? 'assigned' : 'history');

    const loadData = async () => {
        setLoading(true);
        try {
            // Load history
            let query = supabase
                .from('inspections')
                .select('*, assets(name, type)')
                .order('date', { ascending: false });

            if (profile?.role === 'tecnico') {
                query = query.eq('inspector_id', profile.id);
            }

            const { data: inspectionData, error: inspectionError } = await query;

            if (inspectionError) throw inspectionError;
            setInspections(inspectionData || []);

            // Load assigned assets if technician
            if (profile?.role === 'tecnico') {
                const assets = await db.getAssets();
                const assigned = assets.filter(a => a.assignedTechnicianId === profile.id);
                setAssignedAssets(assigned);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [profile]);


    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 lg:p-8">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-400">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary !text-3xl">
                                {activeTab === 'assigned' ? 'assignment' : 'history'}
                            </span>
                            {activeTab === 'assigned' ? 'Mis Equipos Asignados' : 'Historial de Inspecciones'}
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            {activeTab === 'assigned'
                                ? 'Equipos bajo tu responsabilidad para inspección.'
                                : 'Registro completo de todas las tareas realizadas en campo.'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {pendingCount > 0 && (
                        <button
                            onClick={onFinalize}
                            className="bg-status-yellow text-background-dark px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-status-yellow/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined !text-lg">draw</span>
                            Finalizar ({pendingCount})
                        </button>
                    )}


                    <button
                        onClick={() => onStartInspection()}
                        className="bg-primary text-background-dark px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined !text-lg">qr_code_scanner</span>
                        Iniciar Inspección
                    </button>

                    {profile?.role === 'tecnico' && (
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
                            <button
                                onClick={() => setActiveTab('assigned')}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'assigned' ? 'bg-primary text-background-dark shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Mis Equipos
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-primary text-background-dark shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Historial
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                </div>
            ) : activeTab === 'assigned' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignedAssets.length > 0 ? assignedAssets.map((asset) => (
                        <div
                            key={asset.id}
                            className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.08] transition-all group border-l-4 border-l-primary"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <span className="material-symbols-outlined !text-2xl">fire_extinguisher</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${(asset.expirationDate && asset.expirationDate < new Date().toISOString().split('T')[0]) || asset.status === 'failed'
                                        ? 'bg-status-red/20 text-status-red'
                                        : asset.status === 'pending' ? 'bg-status-yellow/20 text-status-yellow' : 'bg-primary/20 text-primary'
                                    }`}>
                                    {(asset.expirationDate && asset.expirationDate < new Date().toISOString().split('T')[0]) ? 'vencido' : asset.status === 'failed' ? 'rechazado' : asset.status}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{asset.name}</h3>
                            <p className="text-xs text-slate-500 font-mono mb-4">{asset.id}</p>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="material-symbols-outlined !text-sm">category</span>
                                    <span>{asset.type}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="material-symbols-outlined !text-sm">event</span>
                                    <span>Vence: {asset.expirationDate ? new Date(asset.expirationDate).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onStartInspection(asset.id)}
                                className="w-full py-3 bg-primary text-background-dark rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                                Iniciar Inspección
                            </button>
                        </div>
                    )) : (
                        <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <span className="material-symbols-outlined text-6xl text-slate-700 mb-4 font-light">assignment_late</span>
                            <p className="text-slate-500 font-medium">No tienes equipos asignados actualmente.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/5 bg-black/20">
                                    <th className="p-4 font-bold">Fecha / Hora</th>
                                    <th className="p-4 font-bold">Equipo</th>
                                    <th className="p-4 font-bold">Resultado</th>
                                    <th className="p-4 font-bold">Notas</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {inspections.length > 0 ? inspections.map((inspection) => (
                                    <tr key={inspection.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4">
                                            <div className="text-white font-bold">{new Date(inspection.date).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-slate-500">{new Date(inspection.date).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-200 font-bold">{inspection.assets?.name || 'N/A'}</div>
                                            <div className="text-[10px] text-slate-500 font-mono text-primary">{inspection.asset_id}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${inspection.result === 'pass' ? 'bg-primary/20 text-primary' :
                                                inspection.result === 'fail' ? 'bg-status-red/20 text-status-red' :
                                                    'bg-status-yellow/20 text-status-yellow'
                                                }`}>
                                                {inspection.result === 'pass' ? 'Aprobado' :
                                                    inspection.result === 'fail' ? 'Rechazado' : 'Observado'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 text-xs italic">
                                            {inspection.notes || 'Sin observaciones adicionales.'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-slate-500 italic">
                                            No se han registrado inspecciones aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InspeccionesScreen;
