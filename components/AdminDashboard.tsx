
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import ComplianceGauge from './ComplianceGauge';
import { Screen } from '../types';

interface AdminDashboardProps {
    onNavigate: (screen: Screen) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState({ totalAssets: 0, totalClients: 0, totalInvoices: 0, globalCompliance: 0 });
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    useEffect(() => {
        const loadStats = async () => {
            const [assets, clients, invoices, logs] = await Promise.all([
                db.getAssets(),
                db.getClients(),
                db.getInvoices(),
                db.getActivityLogs(8)
            ]);

            const compliance = assets.length > 0
                ? Math.round(((assets.length - assets.filter(a => a.status === 'expired').length) / assets.length) * 100)
                : 100;

            setStats({
                totalAssets: assets.length,
                totalClients: clients.length,
                totalInvoices: invoices.length,
                globalCompliance: compliance
            });
            setRecentLogs(logs);
        };
        loadStats();
    }, []);

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-full animate-fadeIn">
            {/* Admin Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Panel Administrativo</h1>
                    <p className="text-slate-500 font-medium">Control total de la infraestructura Extintoruy</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Sistema</span>
                        <span className="text-sm font-bold text-white">Online / Estable</span>
                    </div>
                </div>
            </div>

            {/* Top Grid: Main Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-primary/10 to-transparent border border-white/10 rounded-[32px] p-8 flex items-center justify-between overflow-hidden relative group">
                    <div className="relative z-10">
                        <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Salud de la Red</p>
                        <h2 className="text-4xl font-black text-white mb-1">Cumplimiento Global</h2>
                        <p className="text-slate-500 text-sm">{stats.totalAssets} equipos monitoreados en tiempo real</p>
                    </div>
                    <div className="shrink-0 relative z-10">
                        <ComplianceGauge percentage={stats.globalCompliance} />
                    </div>
                    <div className="absolute -bottom-8 -right-8 size-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col justify-center">
                    <span className="material-symbols-outlined text-blue-400 !text-4xl mb-4">corporate_fare</span>
                    <p className="text-4xl font-black text-white leading-none">{stats.totalClients}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Empresas Activas</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col justify-center">
                    <span className="material-symbols-outlined text-amber-400 !text-4xl mb-4">account_balance_wallet</span>
                    <p className="text-4xl font-black text-white leading-none">{stats.totalInvoices}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Facturas Emitidas</p>
                </div>
            </div>

            {/* Middle Grid: Global Activity & Quick Access */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[32px] p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">analytics</span>
                            Trazabilidad Global
                        </h3>
                        <button
                            onClick={() => onNavigate('home')}
                            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                        >
                            Refrescar
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentLogs.map(log => (
                            <div key={log.id} className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-all group">
                                <div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined !text-lg text-slate-400 group-hover:text-primary transition-colors">
                                        {log.action === 'create' ? 'add' : log.action === 'delete' ? 'delete' : 'history'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">
                                        {log.profiles?.full_name || 'Admin'}: <span className="text-slate-400 font-medium capitalize">{log.action} en {log.entity_name}</span>
                                    </p>
                                    <p className="text-[10px] text-slate-500 uppercase font-black">{new Date(log.created_at).toLocaleString()}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-slate-400 font-bold border border-white/5 uppercase">
                                        {log.entity_type}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="space-y-6">
                    <h3 className="text-xl font-black text-white px-2">Accesos Rápidos</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <button
                            onClick={() => onNavigate('reportes')}
                            className="w-full p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl text-left hover:bg-blue-500/20 transition-all group"
                        >
                            <span className="material-symbols-outlined text-blue-400 !text-3xl mb-4 group-hover:scale-110 transition-transform">monitoring</span>
                            <p className="text-lg font-black text-white leading-tight">Métricas Globales de Auditoría</p>
                            <p className="text-xs text-blue-400/60 font-medium mt-1 uppercase tracking-wider">Reportes</p>
                        </button>

                        <button
                            onClick={() => onNavigate('mapa')}
                            className="w-full p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-left hover:bg-emerald-500/20 transition-all group"
                        >
                            <span className="material-symbols-outlined text-emerald-400 !text-3xl mb-4 group-hover:scale-110 transition-transform">map</span>
                            <p className="text-lg font-black text-white leading-tight">Mapa de Cobertura Nacional</p>
                            <p className="text-xs text-emerald-400/60 font-medium mt-1 uppercase tracking-wider">Logística</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
