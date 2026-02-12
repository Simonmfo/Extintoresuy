import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { Html5Qrcode } from 'html5-qrcode';
import { InspectionAsset } from '../types';

interface InspectionScreenProps {
  onBack: () => void;
  assetId?: string | null;
  userCompanyId?: string;
  userRole?: string;
}

const processImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxDim = 1000;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
          resolve(resizedFile);
        } else {
          reject(new Error("Error al procesar imagen"));
        }
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => reject(new Error("Error al cargar la imagen."));
  });
};

const InspectionScreen: React.FC<InspectionScreenProps> = ({ onBack, assetId, userCompanyId, userRole }) => {
  const [checklist, setChecklist] = useState({
    manometro: true,
    precinto: true,
    acceso: true,
    carteleria: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<InspectionAsset | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);

  const [targetAsset, setTargetAsset] = useState<InspectionAsset | null>(null);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Clear scanner on unmount or when leaving scanning mode
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, []);

  // Fetch target asset if assetId provided, but don't auto-scan
  useEffect(() => {
    if (assetId) {
      db.getAsset(assetId).then(setTargetAsset);
    }
  }, [assetId]);

  const startScanner = async () => {
    if (scannerRef.current) return; // Already running

    // Basic support check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanError("Cámara no soportada por el navegador. Use 'Tomar Foto'.");
      return;
    }

    setScanError(null);
    try {
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      // Try to get cameras first
      let videoConfig: any = { facingMode: "environment" };
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCamera = cameras.find((c: any) => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment'));
          if (backCamera) {
            videoConfig = backCamera.id;
          }
        }
      } catch (e) {
        console.warn("Could not list cameras", e);
      }

      // First attempt with detected camera
      try {
        await scanner.start(
          videoConfig,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => handleScanSuccess(decodedText),
          (errMsg) => { }
        );
      } catch (firstErr) {
        console.warn("First attempt failed, trying fallback...", firstErr);
        // Fallback to basic environment constraint
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => handleScanSuccess(decodedText),
          (errMsg) => { }
        );
      }
      setIsScannerActive(true);
    } catch (err: any) {
      console.error("Error starting scanner", err);
      let msg = `Error: ${err?.message || err}`;
      if (err?.toString().includes("NotAllowedError") || err?.toString().includes("Permission denied")) {
        msg = "Permiso denegado. Revise config.";
      } else if (err?.toString().includes("not supported")) {
        msg = "Navegador no compatible. Use 'Tomar Foto'.";
      }
      setScanError(msg);
      scannerRef.current = null;
      setIsScannerActive(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Ensure any running scanner is stopped
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) { console.warn(e); }
      scannerRef.current = null;
    }

    setScanError("Procesando imagen...");

    try {
      // 1. Process image (Resize + Normalize)
      const processedFile = await processImage(file);

      // 2. Scan
      const scanner = new Html5Qrcode("reader");
      const result = await scanner.scanFileV2(processedFile, false);

      const decodedText = (typeof result === 'string') ? result : (result as any)?.decodedText;

      if (decodedText) {
        handleScanSuccess(decodedText);
      } else {
        throw new Error("No QR found");
      }
    } catch (err) {
      console.error("Error scanning file", err);
      setScanError("No se detectó el código QR. Intente acercarse más o mejorar la iluminación.");
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScannerActive(false);
      } catch (e) { console.error(e); }
    }

    try {
      let scannedId = decodedText;
      try {
        const data = JSON.parse(decodedText);
        if (data.id) scannedId = data.id;
      } catch (e) {
        // Not JSON
      }

      const asset = await db.getAsset(scannedId);
      if (asset) {
        // Ownership validation: Check if user has permission for this asset
        if (userRole !== 'admin' && asset.companyId !== userCompanyId) {
          setScanError(`Acceso Denegado: El equipo ${scannedId} pertenece a otra empresa o cliente fuera de su jurisdicción.`);
          return;
        }

        // If we came for a specific asset, validate it
        if (assetId && asset.id !== assetId) {
          setScanError(`Código incorrecto. Escaneaste "${asset.name}" (${asset.id}), pero se esperaba el equipo solicitado.`);
          return;
        }

        setScannedAsset(asset);
        setIsScanning(false);
        setScanError(null);
      } else {
        setScanError(`Equipo no encontrado: ${scannedId}`);
      }
    } catch (err) {
      console.error(err);
      setScanError("Error al procesar el código QR.");
    }
  };

  const [evidenceImage, setEvidenceImage] = useState<string | null>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setEvidenceImage(imageUrl);
    }
  };

  const handleFinish = async () => {
    if (!scannedAsset) return;

    setIsSaving(true);
    const allPassed = Object.values(checklist).every(v => v === true);

    const result = await db.addInspection({
      id: Math.random().toString(36).substring(2, 9),
      assetId: scannedAsset.id,
      date: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),
      inspector: 'Inspector Jefe',
      status: allPassed ? 'passed' : 'failed',
      details: {
        ...checklist,
        evidenceImage
      }
    });

    setIsSaving(false);

    if (result.success) {
      onBack();
    } else {
      alert(result.message || "Error al guardar la inspección.");
    }
  };

  if (isScanning) {
    return (
      <div className="flex flex-col h-screen bg-black text-white relative">
        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
        />

        <div className="flex items-center justify-between p-4 z-10 absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onBack} className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="font-bold text-sm uppercase tracking-widest text-white/80">Escanear QR</h1>
            {targetAsset && (
              <p className="text-[10px] text-primary font-black uppercase tracking-tighter bg-primary/10 px-2 py-0.5 rounded-full mt-1 border border-primary/20">
                Confirmar: {targetAsset.name}
              </p>
            )}
          </div>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 flex flex-col justify-center bg-black relative overflow-hidden">
          <div id="reader" className="w-full h-full bg-black"></div>

          {/* Start Screen / Fallback Options */}
          {!isScannerActive && !scanError && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm flex-col gap-6 p-4">
              <button
                onClick={startScanner}
                className="flex flex-col items-center gap-4 group"
              >
                <div className="p-6 rounded-full bg-primary/20 border-2 border-primary text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined !text-4xl">qr_code_scanner</span>
                </div>
                <span className="font-bold uppercase tracking-widest text-sm">Cámara en Vivo</span>
              </button>

              <div className="flex items-center gap-4 text-white/30 text-xs uppercase tracking-widest font-bold w-full justify-center">
                <span className="h-px w-12 bg-white/20"></span>
                O
                <span className="h-px w-12 bg-white/20"></span>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xs flex items-center justify-center gap-3 bg-white/10 px-6 py-4 rounded-xl border border-white/10 hover:bg-white/20 transition-all font-bold text-sm uppercase tracking-wider"
              >
                <span className="material-symbols-outlined">photo_camera</span>
                Tomar Foto del QR
              </button>
            </div>
          )}

          {/* Error / Retry Overlay */}
          {scanError && (
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex flex-col items-center justify-center z-30 pointer-events-none p-4">
              <div className="bg-red-500/90 text-white px-6 py-6 rounded-2xl text-center backdrop-blur-md shadow-2xl max-w-sm mx-auto animate-bounce pointer-events-auto">
                <p className="font-bold text-sm mb-4">{scanError}</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={startScanner}
                    className="bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Reintentar Cámara Vivo
                  </button>
                  <button
                    onClick={() => { setScanError(null); fileInputRef.current?.click(); }}
                    className="bg-white text-red-600 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined !text-lg">photo_camera</span>
                    Tomar Foto (Recomendado)
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-4 z-20 pointer-events-none">
            <button
              onClick={() => {
                const id = prompt("Ingrese el ID del extintor manualmente:");
                if (id) handleScanSuccess(id);
              }}
              className="pointer-events-auto bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-colors"
            >
              Ingresar ID Manualmente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Scanned Asset VIew
  return (
    <div className="flex flex-col h-screen bg-background-dark text-white overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between bg-background-dark/95 backdrop-blur-lg z-40 border-b border-white/10 lg:px-8">
        <button onClick={() => setIsScanning(true)} className="p-2 -ml-2 rounded-full active:bg-white/10 hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined text-white">qr_code_scanner</span>
        </button>
        <h1 className="text-lg font-black tracking-tight">Inspección de Equipo</h1>
        <div className="w-10 flex justify-end">
          <span className={`material-symbols-outlined text-primary ${isSaving ? 'animate-spin' : ''}`}>
            {isSaving ? 'sync' : 'cloud_upload'}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 max-w-2xl mx-auto lg:py-8">

          {/* Scanned Asset Info Card */}
          {scannedAsset && (
            <section className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-sm space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-9xl">fire_extinguisher</span>
              </div>

              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">ID del Activo</span>
                  <h2 className="text-3xl font-black text-white leading-none mt-1 break-all">{scannedAsset.id}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="bg-white/10 px-2 py-1 rounded text-xs text-slate-300 font-medium">
                      {scannedAsset.type}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${scannedAsset.status === 'ok' ? 'bg-emerald-500/20 text-emerald-500' :
                      scannedAsset.status === 'expired' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
                      }`}>
                      {scannedAsset.status === 'ok' ? 'Habilitado' : scannedAsset.status === 'expired' ? 'Vencido' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 relative z-10">
                <p className="text-sm text-slate-400 font-medium">Ubicación:</p>
                <p className="text-base text-white">{scannedAsset.description || 'Sin ubicación registrada'}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 relative z-10 pt-3 border-t border-white/5">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Agente</p>
                  <p className="text-white font-bold text-xs truncate" title={scannedAsset.agent}>{scannedAsset.agent || '-'}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Clase</p>
                  <p className="text-white font-bold text-xs truncate">{scannedAsset.fireClass || '-'}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Vence</p>
                  <p className={`text-xs font-bold ${scannedAsset.expirationDate && new Date(scannedAsset.expirationDate) < new Date() ? 'text-red-500' : 'text-emerald-400'}`}>
                    {scannedAsset.expirationDate ? new Date(scannedAsset.expirationDate).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 text-xs text-slate-500 flex justify-between items-center relative z-10">
                <span>Última inspección: {scannedAsset.lastInspection || 'Nunca'}</span>
                <button onClick={() => setIsScanning(true)} className="text-primary hover:underline">Escanear otro</button>
              </div>
            </section>
          )}

          {/* Checklist */}
          {scannedAsset ? (
            <div className="space-y-4 pt-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">Verificación de Campo</h3>
              <div className="space-y-3">
                {[
                  { id: 'manometro', label: 'Manómetro OK', icon: 'speed' },
                  { id: 'precinto', label: 'Precinto Intacto', icon: 'verified' },
                  { id: 'acceso', label: 'Acceso Despejado', icon: 'door_front' },
                  { id: 'carteleria', label: 'Cartelería Visible', icon: 'visibility' }
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 active:bg-white/10 transition-all cursor-pointer hover:bg-white/10"
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
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checklist[item.id as keyof typeof checklist] ? 'bg-primary' : 'bg-white/10'}`}
                    >
                      <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checklist[item.id as keyof typeof checklist] ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-6">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={evidenceInputRef}
                  onChange={handleEvidenceUpload}
                />

                {evidenceImage ? (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-white/20 group">
                    <img src={evidenceImage} alt="Evidencia" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setEvidenceImage(null)}
                      className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors backdrop-blur-md"
                    >
                      <span className="material-symbols-outlined !text-lg">close</span>
                    </button>
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-xs font-bold text-center">Evidencia Cargada</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => evidenceInputRef.current?.click()}
                    className="w-full h-20 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 active:bg-white/10 transition-all hover:bg-white/10 hover:border-primary/30 hover:text-primary group"
                  >
                    <span className="material-symbols-outlined !text-3xl group-hover:scale-110 transition-transform">photo_camera</span>
                    <span className="font-black text-[10px] uppercase tracking-widest">Tomar Foto Evidencia</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-500">No se ha seleccionado ningún equipo.</p>
              <button onClick={() => setIsScanning(true)} className="mt-4 text-primary font-bold">Abrir Escáner</button>
            </div>
          )}

          {/* Desktop finish button */}
          {scannedAsset && (
            <div className="hidden lg:block pt-6">
              <button
                onClick={handleFinish}
                disabled={isSaving}
                className="w-full py-5 rounded-2xl bg-primary text-black font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.97] disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined !text-2xl fill-1">draw</span>
                    Finalizar y Firmar
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Button */}
      {scannedAsset && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 p-6 bg-background-dark/95 backdrop-blur-xl border-t border-white/10 z-50">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleFinish}
              disabled={isSaving}
              className="w-full py-5 rounded-2xl bg-primary text-black font-black text-lg shadow-[0_15px_30px_rgba(19,236,91,0.3)] active:scale-[0.97] disabled:opacity-50 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Sincronizando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined !text-2xl fill-1">draw</span>
                  Finalizar y Firmar
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionScreen;
