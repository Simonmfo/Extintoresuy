import { useState, useEffect, type FC } from 'react';
import { Screen } from '../types';
import ComplianceGauge from './ComplianceGauge';
import { db } from '../services/db';

interface DashboardProps {
  onStartInspection: () => void;
  onNavigate: (screen: Screen) => void;
  pendingCount: number;
  companyId: string;
}

const Dashboard: FC<DashboardProps> = ({ onStartInspection, onNavigate, pendingCount, companyId }) => {
  const [stats, setStats] = useState({ total: 0, expired: 0, pending: 0, compliance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [companyId]);

  const loadStats = async () => {
    setLoading(true);
    const data = await db.getStats(companyId);
    setStats(data);
    setLoading(false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Risk Metric Section */}
      <section className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-medium text-slate-400 mb-6 font-black uppercase tracking-widest">Cumplimiento Global</h2>

          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : (
            <ComplianceGauge percentage={stats.compliance} />
          )}

          <div className="flex justify-between w-full mt-6 items-center">
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full animate-pulse ${stats.compliance > 80 ? 'bg-primary' : stats.compliance > 50 ? 'bg-orange-500' : 'bg-red-500'}`}></div>
              <span className={`text-xs font-black uppercase tracking-tight ${stats.compliance > 80 ? 'text-primary' : stats.compliance > 50 ? 'text-orange-500' : 'text-red-500'}`}>
                {stats.compliance > 80 ? 'Estado: Bajo Riesgo' : stats.compliance > 50 ? 'Estado: Riesgo Medio' : 'Estado: Riesgo Crítico'}
              </span>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stats.total} Equipos Totales</span>
          </div>
        </div>
      </section>

      {/* Main Actions and Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Actions */}
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={onStartInspection}
            className="flex items-center gap-4 w-full bg-primary p-5 rounded-xl text-background-dark shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <div className="bg-black/10 p-3 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined !text-[32px] fill-1">qr_code_scanner</span>
            </div>
            <div className="text-left">
              <span className="block text-lg font-bold">Iniciar Inspección</span>
              <span className="block text-xs font-medium opacity-80 uppercase tracking-tight">Escanear código QR del equipo</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('mapa')}
            className="flex items-center gap-4 w-full bg-white/5 border border-white/10 p-5 rounded-xl text-white hover:bg-white/10 active:scale-[0.98] transition-all"
          >
            <div className="bg-white/10 p-3 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined !text-[32px]">distance</span>
            </div>
            <div className="text-left">
              <span className="block text-lg font-bold">Rutas de Inspección</span>
              <span className="block text-xs font-medium text-slate-400 uppercase tracking-tight">Optimizar recorridos hoy</span>
            </div>
          </button>
        </div>

        {/* Right Column: Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col justify-center h-full">
            <span className="material-symbols-outlined text-orange-500 mb-2">event_busy</span>
            <span className="block text-3xl lg:text-4xl font-black mt-2">{String(stats.expired).padStart(2, '0')}</span>
            <p className="text-xs font-bold text-slate-400 uppercase leading-tight mt-1">Vencimientos<br />(30 días)</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col justify-center h-full">
            <span className="material-symbols-outlined text-primary mb-2 !text-3xl">inventory_2</span>
            <span className="block text-3xl lg:text-4xl font-black mt-2">{String(stats.pending).padStart(2, '0')}</span>
            <p className="text-xs font-bold text-slate-400 uppercase leading-tight mt-1">Equipos<br />Pendientes</p>
          </div>
        </div>
      </div>

      {/* Quick Access List */}
      <div className="space-y-4 pt-4 border-t border-white/5 lg:border-none lg:pt-0">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Ubicaciones Recientes</h3>
          <button className="text-sm font-bold text-primary">Ver todo</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { id: '1', name: 'Depósito Central - Sector A', time: 'Hace 2 horas', count: 15, img: 'https://picsum.photos/id/122/400/400' },
            { id: '2', name: 'Oficinas Administrativas', time: 'Ayer', count: 8, img: 'https://picsum.photos/id/160/400/400' }
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 active:bg-white/10 transition-colors">
              <div className="size-11 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                <img className="w-full h-full object-cover" src={item.img} alt={item.name} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate">{item.name}</h4>
                <p className="text-[11px] text-slate-500 font-medium">{item.time} • {item.count} Equipos</p>
              </div>
              <span className="material-symbols-outlined text-slate-600">chevron_right</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Finalize Session Button */}
      {pendingCount > 0 && (
        <div className="fixed bottom-24 right-4 left-4 lg:left-auto lg:right-8 z-40 animate-bounce-slow">
          <button
            onClick={() => onNavigate('validacion')}
            className="w-full lg:w-auto bg-primary text-black px-8 py-5 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined !text-2xl fill-1">draw</span>
            <span>Finalizar Visita ({pendingCount})</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
