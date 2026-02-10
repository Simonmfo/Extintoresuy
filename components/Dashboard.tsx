import React, { useEffect, useState } from 'react';
import { Screen } from '../types';
import ComplianceGauge from './ComplianceGauge';
import { db } from '../services/db';
import ComplianceAI from './ComplianceAI';

interface DashboardProps {
  onStartInspection: (assetId?: string) => void;
  onNavigate: (screen: Screen) => void;
  onViewAsset: (assetId: string) => void;
  onNavigateAlerts: (type: 'expired' | 'pending') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartInspection, onNavigate, onViewAsset, onNavigateAlerts }) => {
  const [stats, setStats] = useState({ total: 0, expired: 0, pending: 0, compliance: 0 });
  const [recentAssets, setRecentAssets] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const statsData = await db.getStats();
      setStats(statsData);

      const assets = await db.getAssets();
      setRecentAssets(assets.slice(0, 2));
    };

    loadData();
  }, []);

  return (
    <div className="p-4 lg:p-0 space-y-6 max-w-7xl mx-auto">
      {/* Top Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Risk Metric Card */}
        <section className="lg:col-span-2 bg-white/5 rounded-3xl p-6 lg:p-8 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Estado de Cumplimiento</h2>
              <h3 className="text-3xl font-black text-white mb-4">Decreto 372/023 <br /><span className="text-slate-500">Seguridad Industrial</span></h3>

              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className={`px-4 py-2 rounded-full border ${stats.compliance > 70 ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-status-red/10 border-status-red/30 text-status-red'} font-bold flex items-center gap-2`}>
                  <span className="material-symbols-outlined !text-lg">{stats.compliance > 70 ? 'verified' : 'warning'}</span>
                  {stats.compliance > 70 ? 'Bajo Riesgo' : 'Riesgo Alto'}
                </div>
                <span className="text-sm text-slate-400 font-medium">Total: {stats.total} equipos</span>
              </div>
            </div>

            <div className="shrink-0 scale-110 lg:scale-125">
              <ComplianceGauge percentage={stats.compliance} />
            </div>
          </div>
        </section>

        {/* Quick Actions & Stats Column */}
        <div className="space-y-6 flex flex-col">
          <button
            onClick={() => onStartInspection()}
            className="flex-1 flex items-center gap-6 bg-primary hover:bg-green-400 p-6 rounded-3xl text-background-dark shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all group lg:min-h-[140px]"
          >
            <div className="bg-black/10 p-4 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined !text-[40px] fill-1">qr_code_scanner</span>
            </div>
            <div className="text-left">
              <span className="block text-2xl font-black leading-none mb-1">Nueva<br />Inspección</span>
              <span className="block text-xs font-bold opacity-70 uppercase tracking-widest">Iniciar Escaneo</span>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-4 flex-1">
            <div
              onClick={() => onNavigateAlerts('expired')}
              className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <span className="material-symbols-outlined text-status-red mb-3 !text-3xl group-hover:scale-110 transition-transform">event_busy</span>
              <span className="block text-4xl font-black text-white">{stats.expired.toString().padStart(2, '0')}</span>
              <p className="text-xs font-bold text-slate-400 uppercase leading-tight mt-2">Críticos /<br />Vencidos</p>
            </div>
            <div
              onClick={() => onNavigateAlerts('pending')}
              className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <span className="material-symbols-outlined text-status-yellow mb-3 !text-3xl group-hover:scale-110 transition-transform">inventory_2</span>
              <span className="block text-4xl font-black text-white">{stats.pending.toString().padStart(2, '0')}</span>
              <p className="text-xs font-bold text-slate-400 uppercase leading-tight mt-2">Pendientes<br />Revisión</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <section className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Actividad Reciente
            </h3>
            <button className="text-xs font-bold text-primary hover:text-white transition-colors bg-primary/10 px-3 py-1.5 rounded-lg">Ver Logs Completos</button>
          </div>

          <div className="space-y-3">
            {recentAssets.length > 0 ? recentAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-4 p-4 bg-black/20 hover:bg-black/40 rounded-2xl border border-white/5 transition-colors group cursor-pointer"
                onClick={() => onViewAsset(asset.id)}
              >
                <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-white/10 group-hover:border-primary/50 transition-colors">
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">database</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-bold text-white truncate">Actualización: {asset.name || asset.id}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${asset.status === 'ok' ? 'bg-primary/20 text-primary' : 'bg-status-red/20 text-status-red'}`}>
                      {asset.status === 'ok' ? 'Conforme' : 'Alerta'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined !text-[10px]">calendar_month</span>
                    Sincronizado: {asset.lastInspection || 'N/A'}
                  </p>
                </div>
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-bold text-slate-400 block">ID: {asset.id}</span>
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider">{asset.type}</span>
                </div>
                <span className="material-symbols-outlined text-slate-600 !text-lg">chevron_right</span>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-500 text-sm italic">No hay actividad reciente registrada.</div>
            )}
          </div>
        </section>

        {/* AI Assistant - Sidebar Style on Desktop */}
        <div className="lg:col-span-1 h-full">
          <ComplianceAI />
        </div>
      </div >
    </div >
  );
};

export default Dashboard;
