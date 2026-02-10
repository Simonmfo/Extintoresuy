
import React from 'react';

interface MapScreenProps {
  onStartInspection: () => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ onStartInspection }) => {
  return (
    <div className="relative w-full h-full lg:h-[calc(100vh-100px)] overflow-hidden flex flex-col bg-[#0a140d] rounded-3xl border border-white/5 shadow-2xl">
      {/* Search & Filter Header Overlay */}
      <header className="absolute top-0 inset-x-0 z-20 p-4 lg:p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pointer-events-auto">
          {/* Search Bar */}
          <div className="bg-background-dark/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex items-center gap-3 w-full max-w-md shadow-lg">
            <button className="size-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex-1">
              <input
                placeholder="Buscar activo, zona o ID..."
                className="w-full bg-transparent border-none text-white text-sm focus:ring-0 placeholder-slate-500 font-medium"
              />
            </div>
            <button className="size-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar max-w-full lg:justify-end">
            {[
              { id: 'all', label: 'Todos', count: 40, icon: 'filter_list', color: 'primary', active: true },
              { id: 'ok', label: 'Al día', count: 15, icon: 'check_circle', color: 'emerald-500' },
              { id: 'pending', label: 'Revisar', count: 20, icon: 'pending', color: 'amber-500' },
              { id: 'expired', label: 'Vencidos', count: 5, icon: 'warning', color: 'red-500' }
            ].map(filter => (
              <button
                key={filter.id}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-md transition-all whitespace-nowrap shadow-lg ${filter.active
                  ? 'bg-primary text-background-dark border-primary font-bold'
                  : 'bg-black/40 text-white border-white/10 hover:bg-black/60'
                  }`}
              >
                <span className={`material-symbols-outlined !text-lg ${filter.active ? '' : `text-${filter.color}`}`}>{filter.icon}</span>
                <span className="text-xs font-bold uppercase tracking-wide">{filter.label} <span className="opacity-60 ml-1">({filter.count})</span></span>
              </button>
            ))}
          </div>
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

      {/* Bottom Sheet - Responsive Floating Card on Desktop */}
      <section className="relative z-30 bg-background-dark/95 backdrop-blur-xl border-t lg:border border-white/10 rounded-t-[2.5rem] lg:rounded-3xl px-6 pt-3 pb-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] lg:shadow-2xl lg:absolute lg:bottom-6 lg:right-6 lg:w-[400px] lg:pt-6 group transition-all hover:bg-black/80">
        <div className="flex justify-center mb-5 lg:hidden">
          <div className="w-12 h-1.5 rounded-full bg-white/20"></div>
        </div>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white text-lg font-black leading-tight tracking-tight group-hover:text-primary transition-colors">Ruta: Planta Industrial A</h3>
            <p className="text-white/50 text-xs font-medium">Progreso de inspección actual</p>
          </div>
          <div className="text-right">
            <span className="text-primary text-2xl font-black italic">38%</span>
            <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">Completado</p>
          </div>
        </div>

        {/* Progress */}
        <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden mb-8">
          <div className="absolute top-0 left-0 h-full bg-primary w-[38%] rounded-full shadow-[0_0_10px_rgba(19,236,91,0.5)] animate-pulse"></div>
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
