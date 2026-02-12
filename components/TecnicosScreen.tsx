
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { supabase } from '../services/supabase';

interface TecnicosScreenProps {
    companyId: string;
}

const TecnicosScreen: React.FC<TecnicosScreenProps> = ({ companyId }) => {
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTecnico, setNewTecnico] = useState({ email: '', fullName: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadTechnicians();
    }, []);

    const loadTechnicians = async () => {
        if (!companyId) return;
        setLoading(true);
        const data = await db.getTechniciansWithStats(companyId);
        setTechnicians(data);
        setLoading(false);
    };

    const handleCreateTecnico = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Note: Creating an Auth user usually needs a separate flow or Edge Function
            // For now, we sign them up through the public API (which creates the Auth user and usually a profile via trigger)
            const { data, error } = await supabase.auth.signUp({
                email: newTecnico.email,
                password: newTecnico.password,
                options: {
                    data: {
                        full_name: newTecnico.fullName,
                        role: 'tecnico',
                        company_id: companyId === 'ALL' ? null : companyId
                    }
                }
            });

            if (error) throw error;

            // Ensure profile is created/updated with the technician role
            if (data.user) {
                await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        role: 'tecnico',
                        full_name: newTecnico.fullName,
                        email: newTecnico.email,
                        company_id: companyId === 'ALL' ? null : companyId
                    });
            }

            alert('Técnico creado exitosamente. Se ha enviado un correo de confirmación (si está habilitado).');
            setIsAddModalOpen(false);
            setNewTecnico({ email: '', fullName: '', password: '' });
            loadTechnicians();
        } catch (error: any) {
            if (error.message?.includes('rate limit')) {
                alert('Límite de correos alcanzado. Para solucionar esto en desarrollo: \n\n1. Ve a Supabase Dashboard > Auth > Providers > Email.\n2. Desactiva "Confirm Email".\n\nEsto permitirá crear técnicos instantáneamente sin esperar un correo.');
            } else {
                alert('Error al crear técnico: ' + error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar al técnico ${name || 'este técnico'}? Esta acción no se puede deshacer.`)) {
            return;
        }

        const success = await db.deleteTechnician(id);
        if (success) {
            loadTechnicians();
        } else {
            alert('Error al eliminar el técnico. Es posible que tenga inspecciones asociadas.');
        }
    };

    return (
        <div className="p-4 lg:p-8 space-y-8 max-w-6xl mx-auto h-full overflow-y-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary !text-4xl">engineering</span>
                        Gestión de Técnicos
                    </h1>
                    <p className="text-slate-400 mt-1">Administra el personal de campo y visualiza su rendimiento.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-green-400 text-background-dark px-6 py-4 rounded-2xl font-black transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                    <span className="material-symbols-outlined">person_add</span>
                    NUEVO TÉCNICO
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-2">Total Técnicos</span>
                    <span className="text-4xl font-black text-white">{technicians.length.toString().padStart(2, '0')}</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-2">Inspecciones Totales</span>
                    <span className="text-4xl font-black text-white">
                        {technicians.reduce((sum, t) => sum + (t.performedCount || 0) + (t.pendingCount || 0), 0).toString().padStart(2, '0')}
                    </span>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-2">Promedio p/ Técnico</span>
                    <span className="text-4xl font-black text-white">
                        {technicians.length > 0
                            ? Math.round(technicians.reduce((sum, t) => sum + (t.performedCount || 0) + (t.pendingCount || 0), 0) / technicians.length).toString().padStart(2, '0')
                            : '00'}
                    </span>
                </div>
            </div>

            {/* Technicians List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {technicians.map((tecnico) => (
                        <div key={tecnico.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.08] transition-all group border-b-4 border-b-transparent hover:border-b-primary">
                            <div className="flex items-start justify-between mb-6">
                                <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center border border-white/10">
                                    <span className="material-symbols-outlined text-primary !text-4xl">person</span>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <span className="inline-flex px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">
                                        ACTIVO
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(tecnico.id, tecnico.full_name);
                                        }}
                                        className="size-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center group/del"
                                        title="Eliminar Técnico"
                                    >
                                        <span className="material-symbols-outlined !text-xl">delete</span>
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1">{tecnico.full_name || 'Sin Nombre'}</h3>
                            <p className="text-slate-500 text-sm mb-6 truncate">{tecnico.email}</p>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Realizadas</span>
                                    </div>
                                    <span className="text-white font-black text-lg">{tecnico.performedCount || 0}</span>
                                </div>
                                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="material-symbols-outlined text-status-yellow text-sm">schedule</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Pendientes</span>
                                    </div>
                                    <span className="text-white font-black text-lg">{tecnico.pendingCount || 0}</span>
                                </div>
                            </div>

                            <button className="w-full mt-4 py-3 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-base">analytics</span>
                                VER DETALLE COMPLETOS
                            </button>
                        </div>
                    ))}

                    {technicians.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">group_off</span>
                            <p className="text-slate-500 font-medium">No se encontraron técnicos registrados.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Technician Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-background-dark border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white">Nuevo Técnico</h2>
                                <p className="text-slate-500 text-sm">Crea una cuenta para acceso en campo.</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="size-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreateTecnico} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={newTecnico.fullName}
                                    onChange={e => setNewTecnico({ ...newTecnico, fullName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newTecnico.email}
                                    onChange={e => setNewTecnico({ ...newTecnico, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all"
                                    placeholder="tecnico@empresa.com"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña Temporal</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newTecnico.password}
                                    onChange={e => setNewTecnico({ ...newTecnico, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
                                <p className="text-[10px] text-primary/80 font-medium leading-relaxed uppercase">
                                    Nota: Esto creará una cuenta de usuario en el sistema. El técnico recibirá un correo para confirmar su acceso.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary text-background-dark font-black py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-green-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {isSubmitting ? 'CREANDO...' : 'CREAR ACCESO TÉCNICO'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TecnicosScreen;
