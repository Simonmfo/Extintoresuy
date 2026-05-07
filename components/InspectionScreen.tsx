
import { useState, useEffect, type FC } from 'react';
import { db } from '../services/db';
import { offlineService } from '../services/offline';
import { InspectionAsset, InspectionRecord } from '../types';

interface InspectionScreenProps {
  onBack: () => void;
  assetId: string;
}

const InspectionScreen: FC<InspectionScreenProps> = ({ onBack, assetId }) => {
  const [asset, setAsset] = useState<InspectionAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklist, setChecklist] = useState({
    manometro: true,
    precinto: true,
    acceso: true,
    carteleria: true
  });

  useEffect(() => {
    loadAsset();
  }, [assetId]);

  const loadAsset = async () => {
    setLoading(true);
    // Try to get asset details
    const data = await db.getAsset(assetId);
    setAsset(data);
    setLoading(false);
  };

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    
    // Determine overall status
    const allOk = Object.values(checklist).every(v => v);
    
    const record: InspectionRecord = {
      id: `insp_${Date.now()}`,
      assetId: assetId,
      date: new Date().toISOString(),
      inspector: 'Técnico Actual', // In a real app, get from auth profile
      status: allOk ? 'passed' : 'failed',
      details: checklist
    };

    const isOnline = await offlineService.isOnline();

    if (isOnline) {
      const res = await db.addInspection(record);
      if (res.success) {
        alert('Inspección guardada y sincronizada correctamente.');
        onBack();
      } else {
        alert('Error al sincronizar: ' + res.message + '. Se guardará localmente.');
        await offlineService.saveToQueue(record);
        onBack();
      }
    } else {
      await offlineService.saveToQueue(record);
      alert('Sin conexión. La inspección se guardó localmente y se sincronizará cuando recuperes internet.');
      onBack();
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background-dark text-white">
        <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></span>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Activo...</p>
      </div>
    );
  }

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
          <span className={`material-symbols-outlined text-primary ${isSubmitting ? 'animate-spin' : ''}`}>sync</span>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Asset ID Card */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">ID del Activo</span>
              <h2 className="text-3xl font-black text-white leading-none mt-1">{asset?.id || assetId}</h2>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase border border-primary/30 tracking-widest">
              {asset?.type || 'Decreto 372/023'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[9px] uppercase font-black text-slate-500 block mb-1 tracking-widest">Estado Actual</span>
              <p className={`font-bold text-sm ${asset?.status === 'ok' ? 'text-primary' : 'text-orange-500'}`}>
                {asset?.status === 'ok' ? 'Operativo' : asset?.status === 'failed' ? 'Con Fallas' : 'Pendiente'}
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[9px] uppercase font-black text-slate-500 block mb-1 tracking-widest">Vencimiento</span>
              <p className="font-bold text-sm">{asset?.expirationDate || 'N/A'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[9px] uppercase font-black text-slate-500 block mb-1 tracking-widest">Ubicación / Notas</span>
            <p className="text-xs text-slate-300">{asset?.description || 'Sin descripción de ubicación registrada.'}</p>
          </div>
        </section>

        {/* Warning Alert if expired */}
        {asset?.expirationDate && new Date(asset.expirationDate) < new Date() && (
          <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-2xl flex items-center gap-4 animate-pulse-slow">
            <span className="material-symbols-outlined text-red-500 !text-3xl fill-1">warning</span>
            <div>
              <p className="text-sm font-black text-red-400 uppercase tracking-tight leading-none mb-1">Carga Vencida</p>
              <p className="text-xs text-red-200/60 font-medium">Este equipo requiere recarga inmediata.</p>
            </div>
          </div>
        )}

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
            onClick={handleFinish}
            disabled={isSubmitting}
            className={`w-full py-5 rounded-2xl bg-primary text-black font-black text-lg shadow-[0_15px_30px_rgba(19,236,91,0.3)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined !text-2xl fill-1">draw</span>
            {isSubmitting ? 'Sincronizando...' : 'Finalizar y Firmar'}
          </button>
          <div className="w-32 h-1.5 bg-white/10 rounded-full mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default InspectionScreen;

