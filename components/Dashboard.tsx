
import { type FC } from 'react';
import { Screen } from '../types';
import ComplianceGauge from './ComplianceGauge';

interface DashboardProps {
  onStartInspection: () => void;
  onNavigate: (screen: Screen) => void;
}

const Dashboard: FC<DashboardProps> = ({ onStartInspection, onNavigate }) => {
  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Risk Metric Section */}
      <section className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-medium text-slate-400 mb-6">Riesgo Punitivo (Dec. 372/023)</h2>

          <ComplianceGauge percentage={82} />

          <div className="flex justify-between w-full mt-6 items-center">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-xs font-medium text-primary">Estado: Bajo Riesgo</span>
            </div>
            <span className="text-xs text-slate-400">Próxima auditoría: 12 Oct</span>
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
              <span className="block text-lg font-bold">Nueva Inspección</span>
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
            <span className="block text-3xl lg:text-4xl font-black mt-2">04</span>
            <p className="text-xs font-bold text-slate-400 uppercase leading-tight mt-1">Vencimientos<br />(30 días)</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col justify-center h-full">
            <span className="material-symbols-outlined text-primary mb-2 !text-3xl">inventory_2</span>
            <span className="block text-3xl lg:text-4xl font-black mt-2">12</span>
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
    </div>
  );
};

export default Dashboard;
