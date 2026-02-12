
import React from 'react';
import { Screen } from '../types';

interface TechnicianDashboardProps {
    onStartInspection: (assetId?: string) => void;
    onNavigate: (screen: Screen) => void;
    onNavigateAlerts: (type: 'expired' | 'pending') => void;
}

const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({
    onStartInspection,
    onNavigate,
    onNavigateAlerts
}) => {
    return (
        <div className="p-4 lg:p-0 space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-white">Panel de Técnico</h1>
                <p className="text-slate-400">Acceso rápido a tareas de inspección y mantenimiento.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Scan / New Inspection */}
                <button
                    onClick={() => onStartInspection()}
                    className="col-span-1 md:col-span-2 flex items-center gap-8 bg-primary hover:bg-green-400 p-8 rounded-3xl text-background-dark shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all group"
                >
                    <div className="bg-black/10 p-6 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <span className="material-symbols-outlined !text-[48px] fill-1">qr_code_scanner</span>
                    </div>
                    <div className="text-left">
                        <span className="block text-3xl font-black leading-none mb-1">Nueva Inspección</span>
                        <span className="block text-sm font-bold opacity-70 uppercase tracking-widest">Escaneo de Códigos QR</span>
                    </div>
                </button>

                {/* Expired / Critical */}
                <button
                    onClick={() => onNavigateAlerts('expired')}
                    className="flex flex-col items-start gap-4 bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group active:scale-[0.98]"
                >
                    <div className="size-14 rounded-2xl bg-status-red/10 flex items-center justify-center text-status-red group-hover:bg-status-red/20 transition-colors">
                        <span className="material-symbols-outlined !text-3xl">event_busy</span>
                    </div>
                    <div className="text-left">
                        <h3 className="text-xl font-bold text-white mb-1">Críticos / Vencidos</h3>
                        <p className="text-sm text-slate-500">Equipos con vigencia caducada o fallas.</p>
                    </div>
                </button>

                {/* Pending Reviews */}
                <button
                    onClick={() => onNavigateAlerts('pending')}
                    className="flex flex-col items-start gap-4 bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group active:scale-[0.98]"
                >
                    <div className="size-14 rounded-2xl bg-status-yellow/10 flex items-center justify-center text-status-yellow group-hover:bg-status-yellow/20 transition-colors">
                        <span className="material-symbols-outlined !text-3xl">inventory_2</span>
                    </div>
                    <div className="text-left">
                        <h3 className="text-xl font-bold text-white mb-1">Pendientes de Revisión</h3>
                        <p className="text-sm text-slate-500">Equipos que requieren inspección rutinaria.</p>
                    </div>
                </button>

                {/* Inspection List */}
                <button
                    onClick={() => onNavigate('inspecciones')}
                    className="flex flex-col items-start gap-4 bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group active:scale-[0.98]"
                >
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined !text-3xl">history</span>
                    </div>
                    <div className="text-left">
                        <h3 className="text-xl font-bold text-white mb-1">Lista de Inspecciones</h3>
                        <p className="text-sm text-slate-500">Historial de trabajos realizados.</p>
                    </div>
                </button>

                {/* Map View */}
                <button
                    onClick={() => onNavigate('mapa')}
                    className="flex flex-col md:flex-row items-center gap-4 bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group active:scale-[0.98] md:col-span-2"
                >
                    <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <span className="material-symbols-outlined">map</span>
                    </div>
                    <span className="text-lg font-bold text-white">Ver Mapa de Equipos</span>
                    <span className="material-symbols-outlined text-slate-600 ml-auto group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
            </div>

            {/* Helpful Hint or Status */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex items-start gap-4">
                <span className="material-symbols-outlined text-primary">info</span>
                <div>
                    <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Consejo de Seguridad</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Asegúrese de verificar siempre el estado físico del soporte y la manguera, incluso si la carga está conforme.
                        Su firma digital es responsable de la seguridad de la zona.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TechnicianDashboard;
