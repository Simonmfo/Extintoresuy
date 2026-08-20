
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
  const [profile, setProfile] = useState<any>(null);

  const addYears = (dateStr: string, years: number) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString().split('T')[0];
  };

  const addMonths = (dateStr: string, months: number) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setMonth(date.getMonth() + months);
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
      const cleanDesc = (data.description || '')
        .replace(/\[Checklist:.*?\]/g, '')
        .replace(/M:.*?, P:.*?, A:.*?, C:.*?/g, '')
        .replace(/ACEPTABLE CON OBSERVACIONES:/g, '')
        .replace(/\|/g, '')
        .trim();

      setEditedAsset({
        name: data.name,
        type: data.type,
        unit: data.unit,
        matricula: data.matricula,
        lastRecharge: data.lastRecharge,
        lastHydrotest: data.lastHydrotest,
        expirationDate: data.expirationDate,
        nextHydrotest: data.nextHydrotest,
        description: cleanDesc,
        lifecycleStatus: data.lifecycleStatus
      });
    }

    // Also load profile info
    try {
      const p = await db.getCurrentProfile();
      if (p) setProfile(p);
    } catch (e) {
      console.error('Error loading profile in InspectionScreen:', e);
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
    try {
      console.log('Starting inspection save process...');
      const online = await offlineService.isOnline();
      let uploadedImageUrl = undefined;
      if (imageFile) {
        if (online) {
          console.log('Uploading photo...');
          uploadedImageUrl = await db.uploadInspectionPhoto(imageFile) || undefined;
        } else {
          console.log('Saving photo locally as Base64...');
          uploadedImageUrl = imagePreview || undefined;
        }
      }

      // Build compact checklist status (M, P, A, C)
      const compactStatus = [
        `M:${checklist.manometro ? 'OK' : 'FALLA'}`,
        `P:${checklist.precinto ? 'OK' : 'FALLA'}`,
        `A:${checklist.acceso ? 'OK' : 'FALLA'}`,
        `C:${checklist.carteleria ? 'OK' : 'FALLA'}`
      ].join(', ');
      
      // Clean existing description and name from previous checklist tags to avoid duplication/leaks
      let baseDescription = (editedAsset.description || '')
        .replace(/\[Checklist:.*?\]/g, '')
        .replace(/M:.*?, P:.*?, A:.*?, C:.*?/g, '') // Clean new format too
        .replace(/ACEPTABLE CON OBSERVACIONES:/g, '')
        .trim();

      let cleanName = (editedAsset.name || '')
        .replace(/\[Checklist:.*?\]/g, '')
        .replace(/M:.*?, P:.*?, A:.*?, C:.*?/g, '')
        .replace(/ACEPTABLE CON OBSERVACIONES:/g, '')
        .trim();

      const failedCount = Object.values(checklist).filter(v => !v).length;
      
      // Generate the notes for the inspection record
      let finalNotes = baseDescription ? `${baseDescription} | ${compactStatus}` : compactStatus;
      
      if (failedCount > 0) {
        finalNotes = `ACEPTABLE CON OBSERVACIONES: ${finalNotes}`;
      }
      
      let finalStatus: 'passed' | 'failed' = 'passed'; // Always pass as per user request ("Aceptable")

      const todayStr = new Date().toISOString().split('T')[0];
      
      // Create a final version of the asset with the updated notes and dates
      // IMPORTANT: name (Location) should stay CLEAN, only description gets the checklist
      const finalAssetToUpdate = {
        ...editedAsset,
        name: cleanName,
        description: finalNotes,
        lastInspection: todayStr,
        nextInspection: addMonths(todayStr, 1)
      };

      // Compare and log changes if any
      const changes: any[] = [];
      const fieldsToCompare: (keyof InspectionAsset)[] = [
        'name', 'type', 'unit', 'matricula', 'lastRecharge', 
        'lastHydrotest', 'expirationDate', 'nextHydrotest', 
        'description', 'lifecycleStatus', 'lastInspection', 'nextInspection'
      ];

      if (asset) {
        fieldsToCompare.forEach(field => {
          const oldValue = asset ? asset[field] : undefined;
          const newValue = (finalAssetToUpdate as any)[field];
          
          if (oldValue !== newValue) {
            changes.push({
              field,
              old: oldValue || 'N/A',
              new: newValue || 'N/A'
            });
          }
        });
      }

      const record: InspectionRecord = {
        id: Math.random().toString(36).substr(2, 9), // Temporary ID for session
        assetId: asset?.id || assetId,
        status: finalStatus,
        inspector: profile?.full_name || 'Técnico',
        technicianId: profile?.id || 'current-user', 
        date: new Date().toISOString(),
        notes: finalNotes,
        details: checklist,
        imageUrl: uploadedImageUrl,
        assetUpdate: finalAssetToUpdate,
        auditLog: changes.length > 0 ? {
          assetId: asset?.id || assetId,
          changes,
          context: 'Modificación durante inspección'
        } : undefined
      };

      if (asset) {
        if (online) {
          console.log('Saving audit log and updating asset online...', changes);
          if (changes.length > 0) {
            const logSuccess = await db.saveAuditLog({
              assetId: asset.id,
              changes,
              context: 'Modificación durante inspección'
            });
            if (!logSuccess) {
              console.warn('Audit log could not be saved, but continuing...');
            }
          }

          // Update the asset itself
          const updateSuccess = await db.updateAsset(asset.id, finalAssetToUpdate);
          if (!updateSuccess) {
            throw new Error('No se pudo actualizar la información del equipo en la base de datos.');
          }
        } else {
          console.log('Saving updates to offline asset cache...');
          const offlineAssets = offlineService.getOfflineAssets();
          const updatedOfflineAssets = offlineAssets.map(a => {
            if (a.id === asset.id) {
              return {
                ...a,
                ...finalAssetToUpdate,
                status: 'completed', // Mark as completed locally so it filters out of pending Tareas
                lastInspection: todayStr,
                nextInspection: addMonths(todayStr, 1),
                description: finalNotes
              };
            }
            return a;
          });
          localStorage.setItem('offline_assets', JSON.stringify(updatedOfflineAssets));
        }
      }

      console.log('Inspection saved successfully, calling onSave...');
      onSave(record);
    } catch (error: any) {
      console.error('Error saving inspection:', error);
      alert(`Error al guardar la inspección: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
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
      <header className="px-4 py-2 flex items-center justify-between sticky top-0 bg-background-dark/95 backdrop-blur-lg z-40 border-b border-white/10">
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
        </section>

        {/* EDITABLE FIELDS SECTION (REDESIGNED) */}
        <div className="space-y-6">
          {/* Card 1: Datos Técnicos del Extintor */}
          <section className="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-6 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
              <span className="material-symbols-outlined text-primary text-xl">info</span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Datos Técnicos del Extintor</h3>
            </div>

            <div className="space-y-4">
              {/* Lugar / Referencia */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">
                  <span className="material-symbols-outlined text-sm text-slate-500">location_on</span>
                  Lugar / Referencia
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    value={editedAsset.name || ''}
                    onChange={e => setEditedAsset({ ...editedAsset, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
                    placeholder="Ej. Planta Alta - Cocina"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none pointer-events-none group-focus-within:text-primary transition-colors text-lg">location_on</span>
                </div>
              </div>

              {/* Tipo / Capacidad */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">
                  <span className="material-symbols-outlined text-sm text-slate-500">fire_extinguisher</span>
                  Tipo / Capacidad
                </label>
                <div className="relative group">
                  <select
                    value={editedAsset.type || ''}
                    onChange={e => setEditedAsset({ ...editedAsset, type: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3.5 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all appearance-none cursor-pointer"
                  >
                    <option value="1 PABC" className="bg-background-dark">1 PABC</option>
                    <option value="2 PABC" className="bg-background-dark">2 PABC</option>
                    <option value="4 PABC" className="bg-background-dark">4 PABC</option>
                    <option value="8 PABC" className="bg-background-dark">8 PABC</option>
                    <option value="25 PABC" className="bg-background-dark">25 PABC</option>
                    <option value="50 PABC" className="bg-background-dark">50 PABC</option>
                    <option value="CO2 3.5 kg" className="bg-background-dark">CO2 3.5 kg</option>
                    <option value="CO2 7.5kg" className="bg-background-dark">CO2 7.5kg</option>
                    <option value="CO2 10kg" className="bg-background-dark">CO2 10kg</option>
                    <option value="Espumigeno 10L" className="bg-background-dark">Espumigeno 10L</option>
                    <option value="Hallotron ABC 2kg" className="bg-background-dark">Hallotron ABC 2kg</option>
                    <option value="Hallotron ABC 4kg" className="bg-background-dark">Hallotron ABC 4kg</option>
                    <option value="Hallotron ABC 8kg" className="bg-background-dark">Hallotron ABC 8kg</option>
                    <option value="Clase K acetato de potasio 6L" className="bg-background-dark">Clase K acetato de potasio 6L</option>
                    <option value="Clase k acetato de potasio 10L" className="bg-background-dark">Clase k acetato de potasio 10L</option>
                  </select>
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none pointer-events-none group-focus-within:text-primary transition-colors text-lg">fire_extinguisher</span>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 select-none pointer-events-none text-xl">arrow_drop_down</span>
                </div>
              </div>

              {/* Sello de Recarga y UNIT Fábrica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    <span className="material-symbols-outlined text-sm text-slate-500">label</span>
                    Sello Recarga
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={editedAsset.matricula || ''}
                      onChange={e => setEditedAsset({ ...editedAsset, matricula: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
                      placeholder="Ej. Sello"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none pointer-events-none group-focus-within:text-primary transition-colors text-lg">tag</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    <span className="material-symbols-outlined text-sm text-slate-500">verified</span>
                    UNIT Fábrica
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={editedAsset.unit || ''}
                      onChange={e => setEditedAsset({ ...editedAsset, unit: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all"
                      placeholder="Ej. UNIT"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none pointer-events-none group-focus-within:text-primary transition-colors text-lg">verified</span>
                  </div>
                </div>
              </div>

              {/* Estado / Retirado (Segmented Control) */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5 ml-1">
                  <span className="material-symbols-outlined text-sm text-slate-500">swap_horizontal_circle</span>
                  Estado / Ubicación
                </label>
                <div className="flex gap-2 w-full p-1 bg-white/5 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditedAsset({ ...editedAsset, lifecycleStatus: 'active' })}
                    className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      (editedAsset.lifecycleStatus || 'active') === 'active'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-100'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Activo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditedAsset({ ...editedAsset, lifecycleStatus: 'maintenance' })}
                    className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      editedAsset.lifecycleStatus === 'maintenance'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-100'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">build</span>
                    Taller
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditedAsset({ ...editedAsset, lifecycleStatus: 'discarded' })}
                    className={`flex-1 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      editedAsset.lifecycleStatus === 'discarded'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)] scale-100'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">cancel</span>
                    Descarte
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: Fechas y Vencimientos */}
          <section className="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-6 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Fechas y Vencimientos</h3>
              </div>
              <span className="text-[9px] text-slate-500 font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/5 uppercase tracking-wide">
                Cálculo Auto
              </span>
            </div>

            <div className="space-y-5">
              {/* Sección Cargas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    <span className="material-symbols-outlined text-sm text-slate-500">event_available</span>
                    Fecha Carga
                  </label>
                  <div className="relative group">
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3.5 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none pointer-events-none group-focus-within:text-primary transition-colors text-lg">event_available</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    <span className="material-symbols-outlined text-sm text-slate-500">event_busy</span>
                    Vto. Carga
                  </label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={editedAsset.expirationDate || ''}
                      onChange={e => setEditedAsset({ ...editedAsset, expirationDate: e.target.value })}
                      className={`w-full bg-white/5 border rounded-xl pl-10 pr-3 py-3.5 text-white text-sm focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                        editedAsset.expirationDate && new Date(editedAsset.expirationDate) < new Date()
                          ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/15'
                          : 'border-white/10 focus:border-primary/50 focus:ring-primary/15'
                      }`}
                    />
                    <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 select-none pointer-events-none transition-colors text-lg ${
                      editedAsset.expirationDate && new Date(editedAsset.expirationDate) < new Date()
                        ? 'text-rose-400'
                        : 'text-slate-500 group-focus-within:text-primary'
                    }`}>event_busy</span>
                  </div>
                </div>
              </div>

              {/* Sección Ensayos Hidrostáticos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    <span className="material-symbols-outlined text-sm text-slate-500">history</span>
                    Fecha Ensayo
                  </label>
                  <div className="relative group">
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3.5 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none pointer-events-none group-focus-within:text-primary transition-colors text-lg">history</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    <span className="material-symbols-outlined text-sm text-slate-500">schedule</span>
                    Próxima PH
                  </label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={editedAsset.nextHydrotest || ''}
                      onChange={e => setEditedAsset({ ...editedAsset, nextHydrotest: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-3.5 text-white text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all cursor-pointer"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none pointer-events-none group-focus-within:text-primary transition-colors text-lg">schedule</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

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

        {/* Observations Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Observaciones</h3>
          </div>
          <textarea
            value={editedAsset.description || ''}
            onChange={e => setEditedAsset({ ...editedAsset, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-3xl px-4 py-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors h-24 resize-none"
            placeholder="Escriba aquí cualquier comentario u observación sobre la inspección del equipo..."
          />
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
