
import { useState, useEffect, useRef, type FC } from 'react';
import { db } from '../services/db';
import { offlineService } from '../services/offline';
import SignatureCanvas from 'react-signature-canvas';
import { InspectionAsset, InspectionRecord } from '../types';

interface InspectionScreenProps {
  onBack: () => void;
  onSave: (record: InspectionRecord) => void;
  assetId: string;
}

const InspectionScreen: FC<InspectionScreenProps> = ({ onBack, onSave, assetId }) => {
  const [asset, setAsset] = useState<InspectionAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [checklist, setChecklist] = useState({
    manometro: true,
    precinto: true,
    acceso: true,
    carteleria: true
  });
  const [editedAsset, setEditedAsset] = useState<Partial<InspectionAsset>>({});

  const addYears = (dateStr: string, years: number) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    loadAsset();
  }, [assetId]);

  const loadAsset = async () => {
    setLoading(true);
    // Try to get asset details
    const data = await db.getAsset(assetId);
    setAsset(data);
    if (data) {
      setEditedAsset({
        name: data.name,
        type: data.type,
        unit: data.unit,
        matricula: data.matricula,
        lastRecharge: data.lastRecharge,
        lastHydrotest: data.lastHydrotest,
        expirationDate: data.expirationDate,
        nextHydrotest: data.nextHydrotest,
        description: data.description,
        lifecycleStatus: data.lifecycleStatus
      });
    }
    setLoading(false);
  };

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    
    let uploadedImageUrl = undefined;
    if (imageFile) {
      uploadedImageUrl = await db.uploadInspectionPhoto(imageFile) || undefined;
    }

    // Determine overall status
    const allOk = Object.values(checklist).every(v => v);
    
    const record: InspectionRecord = {
      assetId,
      status: allOk ? 'ok' : 'failed',
      technicianId: 'current-user', // This should be the actual user ID
      date: new Date().toISOString(),
      notes: editedAsset.description || '',
      imageUrl: uploadedImageUrl
    };

    // Compare and log changes if any
    const changes: any[] = [];
    const fieldsToCompare: (keyof InspectionAsset)[] = [
      'name', 'type', 'unit', 'matricula', 'lastRecharge', 
      'lastHydrotest', 'expirationDate', 'nextHydrotest', 
      'description', 'lifecycleStatus'
    ];

    fieldsToCompare.forEach(field => {
      const oldValue = asset ? asset[field] : undefined;
      const newValue = editedAsset[field as keyof typeof editedAsset];
      if (oldValue !== newValue) {
        changes.push({
          field,
          old: oldValue || 'N/A',
          new: newValue || 'N/A'
        });
      }
    });

    if (changes.length > 0) {
      await db.saveAuditLog({
        assetId: assetId,
        changes,
        context: 'Modificación durante inspección'
      });
      // Update the asset itself
      await db.updateAsset(assetId, editedAsset);
    }

    onSave(record);
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

        {/* Editable Fields Section */}
        <section className="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Modificar Datos del Equipo</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Lugar / Referencia</label>
              <input
                type="text"
                value={editedAsset.name || ''}
                onChange={e => setEditedAsset({ ...editedAsset, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Ej. Planta Alta - Cocina"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Tipo / Cap</label>
                <select
                  value={editedAsset.type || ''}
                  onChange={e => setEditedAsset({ ...editedAsset, type: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                >
                  <option value="1 PABC">1 PABC</option>
                  <option value="2 PABC">2 PABC</option>
                  <option value="4 PABC">4 PABC</option>
                  <option value="8 PABC">8 PABC</option>
                  <option value="25 PABC">25 PABC</option>
                  <option value="50 PABC">50 PABC</option>
                  <option value="CO2 3.5 kg">CO2 3.5 kg</option>
                  <option value="CO2 7.5kg">CO2 7.5kg</option>
                  <option value="CO2 10kg">CO2 10kg</option>
                  <option value="Espumigeno 10L">Espumigeno 10L</option>
                  <option value="Hallotron ABC 2kg">Hallotron ABC 2kg</option>
                  <option value="Hallotron ABC 4kg">Hallotron ABC 4kg</option>
                  <option value="Hallotron ABC 8kg">Hallotron ABC 8kg</option>
                  <option value="Clase K acetato de potasio 6L">Clase K acetato de potasio 6L</option>
                  <option value="Clase k acetato de potasio 10L">Clase k acetato de potasio 10L</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Sello de Recarga</label>
                <input
                  type="text"
                  value={editedAsset.matricula || ''}
                  onChange={e => setEditedAsset({ ...editedAsset, matricula: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="Sello"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">UNIT Fábrica</label>
                <input
                  type="text"
                  value={editedAsset.unit || ''}
                  onChange={e => setEditedAsset({ ...editedAsset, unit: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="UNIT"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Retirado</label>
                <select
                  value={editedAsset.lifecycleStatus || 'active'}
                  onChange={e => setEditedAsset({ ...editedAsset, lifecycleStatus: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none"
                >
                  <option value="active">NO</option>
                  <option value="maintenance">SÍ (En Taller)</option>
                  <option value="discarded">SÍ (Descarte)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Fecha Carga</label>
                <input
                  type="date"
                  value={editedAsset.lastRecharge || ''}
                  onChange={e => {
                    const date = e.target.value;
                    setEditedAsset({ 
                      ...editedAsset, 
                      lastRecharge: date,
                      expirationDate: addYears(date, 1)
                    });
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Vto. Carga</label>
                <input
                  type="date"
                  value={editedAsset.expirationDate || ''}
                  onChange={e => setEditedAsset({ ...editedAsset, expirationDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Fecha Ensayo</label>
                <input
                  type="date"
                  value={editedAsset.lastHydrotest || ''}
                  onChange={e => {
                    const date = e.target.value;
                    setEditedAsset({ 
                      ...editedAsset, 
                      lastHydrotest: date,
                      nextHydrotest: addYears(date, 5)
                    });
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Próxima PH</label>
                <input
                  type="date"
                  value={editedAsset.nextHydrotest || ''}
                  onChange={e => setEditedAsset({ ...editedAsset, nextHydrotest: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Observaciones</label>
              <textarea
                value={editedAsset.description || ''}
                onChange={e => setEditedAsset({ ...editedAsset, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors h-20 resize-none"
                placeholder="Notas adicionales..."
              />
            </div>
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
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Checklist Rápido</h3>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Toque para Validar</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'manometro', label: 'Manómetro', icon: 'speed' },
              { id: 'precinto', label: 'Precinto', icon: 'verified' },
              { id: 'acceso', label: 'Acceso', icon: 'door_front' },
              { id: 'carteleria', label: 'Cartelería', icon: 'visibility' }
            ].map((item) => {
              const isChecked = checklist[item.id as keyof typeof checklist];
              return (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id as keyof typeof checklist)}
                  className={`flex flex-col items-center justify-center p-6 rounded-[32px] border-2 transition-all duration-300 relative overflow-hidden group ${
                    isChecked 
                    ? 'bg-primary/20 border-primary shadow-[0_10px_20px_rgba(19,236,91,0.15)]' 
                    : 'bg-white/5 border-white/10 active:scale-95'
                  }`}
                >
                  <div className={`size-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                    isChecked ? 'bg-primary text-background-dark' : 'bg-white/5 text-slate-500'
                  }`}>
                    <span className="material-symbols-outlined !text-3xl">{isChecked ? 'check_circle' : item.icon}</span>
                  </div>
                  <span className={`font-black text-xs uppercase tracking-widest text-center ${
                    isChecked ? 'text-white' : 'text-slate-500'
                  }`}>
                    {item.label}
                  </span>
                  
                  {isChecked && (
                    <div className="absolute top-3 right-3">
                      <div className="size-2 bg-primary rounded-full animate-ping"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>


        <div className="pt-6">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 active:bg-white/10 transition-all overflow-hidden relative"
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                  <span className="material-symbols-outlined !text-2xl text-white">cached</span>
                  <span className="text-[9px] text-white uppercase font-black">Cambiar Foto</span>
                </div>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined !text-3xl">photo_camera</span>
                <span className="font-black text-[10px] uppercase tracking-widest">Tomar Foto de Evidencia</span>
              </>
            )}
          </button>
          <p className="text-center text-[9px] text-slate-600 mt-3 uppercase font-black tracking-[0.2em]">Requerido por normativa UNIT 549</p>
        </div>

        {/* Signature and Signer Info Section - REMOVED, now in ValidationScreen */}
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 inset-x-0 p-6 bg-background-dark/95 backdrop-blur-xl border-t border-white/10 z-[60]">
        <div className="max-w-md mx-auto space-y-6">
          <button
            onClick={handleFinish}
            disabled={isSubmitting}
            className={`w-full py-5 rounded-2xl bg-primary text-black font-black text-lg shadow-[0_15px_30px_rgba(19,236,91,0.3)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined !text-2xl fill-1">save</span>
            {isSubmitting ? 'Procesando...' : 'Guardar y Continuar'}
          </button>
          <div className="w-32 h-1.5 bg-white/10 rounded-full mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default InspectionScreen;
