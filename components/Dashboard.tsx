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
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const statsData = await db.getStats();
      setStats(statsData);

      const logs = await db.getActivityLogs(6);
      setActivityLogs(logs);
    };

    loadData();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return 'add_circle';
      case 'update': return 'edit';
      case 'delete': return 'delete';
      case 'inspection': return 'fact_check';
      default: return 'history';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'text-blue-400';
      case 'update': return 'text-amber-400';
      case 'delete': return 'text-red-400';
      case 'inspection': return 'text-primary';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="p-4 lg:p-0 space-y-6 max-w-7xl mx-auto h-full">
      {/* Top Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Risk Metric Card */}
        <section className="lg:col-span-2 bg-white/5 rounded-3xl p-5 lg:p-8 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-8 relative z-10">
            <div className="text-center md:text-left flex-1">
              <h2 className="text-[10px] lg:text-sm font-bold text-primary uppercase tracking-widest mb-2">Estado de Cumplimiento</h2>
              <h3 className="text-2xl lg:text-3xl font-black text-white mb-4 leading-tight">Decreto 372/023 <br /><span className="text-slate-500">Seguridad Industrial</span></h3>

              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                <div className={`px-4 py-2 rounded-full border ${stats.compliance > 70 ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-status-red/10 border-status-red/30 text-status-red'} font-bold flex items-center gap-2 text-xs lg:text-sm`}>
                  <span className="material-symbols-outlined !text-lg">{stats.compliance > 70 ? 'verified' : 'warning'}</span>
                  {stats.compliance > 70 ? 'Bajo Riesgo' : 'Riesgo Alto'}
                </div>
                <span className="text-xs text-slate-400 font-medium">Total: {stats.total} equipos</span>
              </div>
            </div>

            <div className="shrink-0 scale-90 lg:scale-100">
              <ComplianceGauge percentage={stats.compliance} />
            </div>
          </div>
        </section>

        {/* Quick Actions & Stats Column */}
        <div className="flex flex-col gap-4 lg:gap-6">
          <button
            onClick={() => onStartInspection()}
            className="flex-1 flex items-center gap-4 lg:gap-6 bg-primary hover:bg-green-400 p-5 lg:p-6 rounded-3xl text-background-dark shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all group min-h-[100px] lg:min-h-[140px]"
          >
            <div className="bg-black/10 size-12 lg:size-16 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shrink-0">
              <span className="material-symbols-outlined !text-3xl lg:text-[40px] fill-1">qr_code_scanner</span>
            </div>
            <div className="text-left">
              <span className="block text-xl lg:text-2xl font-black leading-tight mb-0.5">Nueva<br className="hidden lg:block" />Inspección</span>
              <span className="block text-[10px] font-bold opacity-70 uppercase tracking-widest">Iniciar Escaneo</span>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => onNavigateAlerts('expired')}
              className="bg-white/5 border border-white/10 p-4 lg:p-5 rounded-3xl hover:bg-white/10 transition-colors cursor-pointer group flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              <span className="material-symbols-outlined text-status-red mb-2 lg:mb-3 !text-2xl lg:!text-3xl group-hover:scale-110 transition-transform">event_busy</span>
              <div className="flex flex-col items-center lg:items-start">
                <span className="block text-3xl lg:text-4xl font-black text-white leading-none">{stats.expired.toString().padStart(2, '0')}</span>
                <p className="text-[9px] lg:text-xs font-bold text-slate-400 uppercase leading-tight mt-1.5 lg:mt-2">Críticos / Vencidos</p>
              </div>
            </div>
            <div
              onClick={() => onNavigateAlerts('pending')}
              className="bg-white/5 border border-white/10 p-4 lg:p-5 rounded-3xl hover:bg-white/10 transition-colors cursor-pointer group flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              <span className="material-symbols-outlined text-status-yellow mb-2 lg:mb-3 !text-2xl lg:!text-3xl group-hover:scale-110 transition-transform">inventory_2</span>
              <div className="flex flex-col items-center lg:items-start">
                <span className="block text-3xl lg:text-4xl font-black text-white leading-none">{stats.pending.toString().padStart(2, '0')}</span>
                <p className="text-[9px] lg:text-xs font-bold text-slate-400 uppercase leading-tight mt-1.5 lg:mt-2">Pendientes Revisión</p>
              </div>
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
            <button className="text-xs font-bold text-slate-500 hover:text-white transition-colors">Ver Logs Completos</button>
          </div>

          <div className="space-y-3">
            {activityLogs.length > 0 ? activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 p-4 bg-black/20 hover:bg-black/40 rounded-2xl border border-white/5 transition-colors group cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className={`size-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-white/10 group-hover:border-primary/50 transition-colors`}>
                  <span className={`material-symbols-outlined ${getActionColor(log.action)}`}>{getActionIcon(log.action)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-bold text-white truncate capitalize">{log.action === 'inspection' ? 'Nueva Inspección' : log.action}: {log.entity_name}</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined !text-[12px]">person</span>
                      {log.profiles?.full_name || log.profiles?.email || 'Sistema'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined !text-[12px]">schedule</span>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-600 !text-lg">info</span>
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
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#1a1c1e] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${getActionColor(selectedLog.action)}`}>{getActionIcon(selectedLog.action)}</span>
                <h3 className="text-xl font-black text-white">Detalles del Log</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Entidad</p>
                  <p className="text-sm font-bold text-white uppercase">{selectedLog.entity_type}: {selectedLog.entity_id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Usuario</p>
                  <p className="text-sm font-bold text-white">{selectedLog.profiles?.full_name || selectedLog.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Acción</p>
                  <p className={`text-sm font-bold uppercase ${getActionColor(selectedLog.action)}`}>{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fecha</p>
                  <p className="text-sm font-bold text-white">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Datos Técnicos / Cambios</p>
                <pre className="bg-black/40 rounded-2xl p-4 text-[11px] font-mono text-primary border border-white/5 overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
            <div className="p-6 bg-white/[0.02] flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-2xl transition-all"
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

export default Dashboard;
