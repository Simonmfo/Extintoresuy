
import { type FC } from 'react';

interface MapScreenProps {
  onStartInspection: () => void;
}

const MapScreen: FC<MapScreenProps> = ({ onStartInspection }) => {
  return (
    <div className="relative h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-[#0a140d]">
      {/* Header Overlay */}
      <header className="absolute top-0 inset-x-0 z-20 bg-background-dark/95 backdrop-blur-md border-b border-white/10 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors">
              <span className="material-symbols-outlined text-white">arrow_back</span>
            </div>
            <div>
              <h1 className="text-white text-base font-bold leading-tight">Mapa de Inspección</h1>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Decreto 372/023 • Montevideo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex size-10 items-center justify-center rounded-full bg-white/10">
              <span className="material-symbols-outlined text-white">search</span>
            </button>
            <button className="flex size-10 items-center justify-center rounded-full bg-white/10">
              <span className="material-symbols-outlined text-primary fill-1">cloud_done</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'Todos (40)', icon: 'filter_list', color: 'primary', active: true },
            { id: 'ok', label: '15 Al día', icon: 'check_circle', color: 'primary' },
            { id: 'pending', label: '20 Pendientes', icon: 'pending', color: 'status-yellow' },
            { id: 'expired', label: '5 Vencidos', icon: 'warning', color: 'status-red' }
          ].map(filter => (
            <div
              key={filter.id}
              className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-xl px-4 border transition-colors ${filter.active
                  ? 'bg-primary/20 border-primary/30'
                  : 'bg-white/5 border-white/10'
                }`}
            >
              <span className={`material-symbols-outlined text-${filter.color} !text-sm`}>{filter.icon}</span>
              <p className="text-white text-xs font-bold">{filter.label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Map Implementation Mock */}
      <main className="relative flex-1">
        {/* Placeholder Map Pattern */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute inset-0 w-full h-full bg-center bg-no-repeat bg-cover opacity-60 grayscale-[0.2]"
          style={{ backgroundImage: `url('https://picsum.photos/seed/map1/800/1200')` }}>
        </div>

        {/* GPS Pulse */}
        <div className="absolute top-1/2 left-1/3 flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <div className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping"></div>
          <div className="w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-2xl z-10"></div>
        </div>

        {/* Markers */}
        {/* Green */}
        <div className="absolute top-[28%] right-[22%] flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-white/20 shadow-[0_0_15px_rgba(19,236,91,0.4)]">
            <span className="material-symbols-outlined text-background-dark font-black !text-lg">check</span>
          </div>
          <span className="bg-background-dark/90 px-2 py-0.5 rounded text-[10px] text-white font-bold">EXT-001</span>
        </div>

        {/* Yellow */}
        <div className="absolute bottom-[40%] left-[28%] flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-status-yellow flex items-center justify-center border-2 border-white/20 shadow-[0_0_15px_rgba(255,193,7,0.4)]">
            <span className="material-symbols-outlined text-background-dark font-black !text-lg">schedule</span>
          </div>
          <span className="bg-background-dark/90 px-2 py-0.5 rounded text-[10px] text-white font-bold">EXT-024</span>
        </div>

        {/* Red */}
        <div className="absolute top-[42%] left-[52%] flex flex-col items-center gap-1" onClick={onStartInspection}>
          <div className="w-11 h-11 rounded-full bg-status-red flex items-center justify-center border-2 border-white/30 shadow-[0_0_20px_rgba(255,77,77,0.5)] cursor-pointer active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-white font-black !text-lg">priority_high</span>
          </div>
          <span className="bg-background-dark/90 px-2 py-1 rounded text-[10px] text-white font-black border border-white/10">EXT-012</span>
        </div>

        {/* Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
          <button className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center active:bg-white/20">
            <span className="material-symbols-outlined text-white">add</span>
          </button>
          <button className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center active:bg-white/20">
            <span className="material-symbols-outlined text-white">remove</span>
          </button>
          <button className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center active:bg-white/20">
            <span className="material-symbols-outlined text-primary">my_location</span>
          </button>
        </div>

        {/* Floating Action */}
        <div className="absolute bottom-[240px] right-4">
          <button onClick={onStartInspection} className="flex items-center justify-center gap-3 bg-primary text-background-dark h-14 px-6 rounded-2xl shadow-2xl shadow-primary/40 font-black transform active:scale-95 transition-all">
            <span className="material-symbols-outlined !text-2xl fill-1">qr_code_scanner</span>
            <span className="uppercase tracking-tight text-sm">Escanear QR</span>
          </button>
        </div>
      </main>

      {/* Bottom Sheet */}
      <section className="relative z-30 bg-background-dark border-t border-white/10 rounded-t-[2.5rem] px-6 pt-3 pb-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
        <div className="flex justify-center mb-5">
          <div className="w-12 h-1.5 rounded-full bg-white/20"></div>
        </div>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white text-lg font-black leading-tight tracking-tight">Ruta: Planta Industrial A</h3>
            <p className="text-white/50 text-xs font-medium">Progreso de inspección actual</p>
          </div>
          <div className="text-right">
            <span className="text-primary text-2xl font-black italic">38%</span>
            <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">Completado</p>
          </div>
        </div>

        {/* Progress */}
        <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden mb-8">
          <div className="absolute top-0 left-0 h-full bg-primary w-[38%] rounded-full shadow-[0_0_10px_rgba(19,236,91,0.5)]"></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-white font-black text-xl tracking-tighter">15/40</span>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Inspeccionados</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-status-red font-black text-xl tracking-tighter">05</span>
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Alertas</span>
            </div>
          </div>
          <button className="flex items-center gap-2 text-primary font-black text-xs bg-primary/10 border border-primary/20 px-5 py-3 rounded-2xl hover:bg-primary/20 transition-colors uppercase tracking-widest">
            <span className="material-symbols-outlined !text-lg">list_alt</span>
            Ver Listado
          </button>
        </div>
      </section>
    </div>
  );
};

export default MapScreen;
