
import { useState, type FC } from 'react';

interface InspectionScreenProps {
  onBack: () => void;
}

const InspectionScreen: FC<InspectionScreenProps> = ({ onBack }) => {
  const [checklist, setChecklist] = useState({
    manometro: true,
    precinto: false,
    acceso: true,
    carteleria: true
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-screen bg-background-dark text-white overflow-y-auto pb-40">
      {/* iOS Style Status Bar */}
      <div className="h-11 flex items-center justify-between px-6 shrink-0 sticky top-0 bg-background-dark/95 z-50">
        <span className="text-sm font-bold">9:41</span>
        <div className="flex gap-1.5 items-center">
          <span className="material-symbols-outlined !text-base">signal_cellular_alt</span>
          <span className="material-symbols-outlined !text-base">wifi</span>
          <span className="material-symbols-outlined !text-base">battery_full</span>
        </div>
      </div>

      {/* Header */}
      <header className="px-4 py-2 flex items-center justify-between sticky top-11 bg-background-dark/95 backdrop-blur-lg z-40 border-b border-white/10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-white/10">
          <span className="material-symbols-outlined text-white">arrow_back_ios</span>
        </button>
        <h1 className="text-lg font-black tracking-tight">Inspección de Extintor</h1>
        <div className="w-10 flex justify-end">
          <span className="material-symbols-outlined text-primary animate-spin-slow">sync</span>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Asset ID Card */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">ID del Activo</span>
              <h2 className="text-3xl font-black text-white leading-none mt-1">#UY-9921-24</h2>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase border border-primary/30 tracking-widest">
              Decreto 372/023
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[9px] uppercase font-black text-slate-500 block mb-1 tracking-widest">Tipo</span>
              <p className="font-bold text-sm">ABC Polvo 4kg</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[9px] uppercase font-black text-slate-500 block mb-1 tracking-widest">Última Insp.</span>
              <p className="font-bold text-sm">12 Oct 2023</p>
            </div>
          </div>

          {/* Mini Map */}
          <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-white/10 group">
            <img
              className="w-full h-full object-cover opacity-40 transition-transform group-hover:scale-110"
              src="https://picsum.photos/seed/map-mini/600/300"
              alt="Localización"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] text-white font-bold flex items-center gap-1.5 border border-white/10">
              <span className="material-symbols-outlined !text-xs text-primary fill-1">location_on</span>
              -34.9011, -56.1645
            </div>
          </div>
        </section>

        {/* Warning Alert */}
        <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4 rounded-r-2xl flex items-center gap-4 animate-pulse-slow">
          <span className="material-symbols-outlined text-orange-500 !text-3xl fill-1">warning</span>
          <div>
            <p className="text-sm font-black text-orange-400 uppercase tracking-tight leading-none mb-1">Alerta de Ubicación</p>
            <p className="text-xs text-orange-200/60 font-medium">Fuera de radio de seguridad ({'>'}15m del punto original).</p>
          </div>
        </div>

        {/* Checklist Section */}
        <div className="space-y-4 pt-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">Checklist Inteligente</h3>
          <div className="space-y-3">
            {[
              { id: 'manometro', label: 'Manómetro OK', icon: 'speed' },
              { id: 'precinto', label: 'Precinto Intacto', icon: 'verified' },
              { id: 'acceso', label: 'Acceso Despejado', icon: 'door_front' },
              { id: 'carteleria', label: 'Cartelería Visible', icon: 'visibility' }
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 active:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl bg-white/5 ${checklist[item.id as keyof typeof checklist] ? 'text-primary' : 'text-slate-600'}`}>
                    <span className="material-symbols-outlined !text-2xl">{item.icon}</span>
                  </div>
                  <span className={`font-black text-sm tracking-tight ${checklist[item.id as keyof typeof checklist] ? 'text-white' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </div>

                {/* Custom Toggle Switch */}
                <div
                  onClick={() => toggleCheck(item.id as keyof typeof checklist)}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checklist[item.id as keyof typeof checklist] ? 'bg-primary' : 'bg-white/10'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checklist[item.id as keyof typeof checklist] ? 'translate-x-6' : 'translate-x-0'
                      }`}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Evidence Button */}
        <div className="pt-6">
          <button className="w-full h-20 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 active:bg-white/10 transition-all">
            <span className="material-symbols-outlined !text-3xl">photo_camera</span>
            <span className="font-black text-[10px] uppercase tracking-widest">Tomar Foto de Evidencia</span>
          </button>
          <p className="text-center text-[9px] text-slate-600 mt-3 uppercase font-black tracking-[0.2em]">Requerido por normativa UNIT 549</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 inset-x-0 p-6 bg-background-dark/95 backdrop-blur-xl border-t border-white/10 z-[60]">
        <div className="max-w-md mx-auto space-y-6">
          <button
            onClick={() => {
              alert('¡Inspección Finalizada con éxito!');
              onBack();
            }}
            className="w-full py-5 rounded-2xl bg-primary text-black font-black text-lg shadow-[0_15px_30px_rgba(19,236,91,0.3)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
          >
            <span className="material-symbols-outlined !text-2xl fill-1">draw</span>
            Finalizar y Firmar
          </button>
          {/* iOS Indicator Mock */}
          <div className="w-32 h-1.5 bg-white/10 rounded-full mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default InspectionScreen;
