
import { useState, useRef, type FC } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { db } from '../services/db';
import { offlineService } from '../services/offline';

interface ValidationScreenProps {
  onBack: () => void;
  onFinalize: (signerData: { name: string, document: string, signatureUrl: string }) => void;
  inspectionCount: number;
}

const ValidationScreen: FC<ValidationScreenProps> = ({ onBack, onFinalize, inspectionCount }) => {
  const [signerName, setSignerName] = useState('');
  const [signerDocument, setSignerDocument] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sigPadRef = useRef<SignatureCanvas>(null);

  const handleFinish = async () => {
    if (!signerName || !signerDocument) {
      alert('Por favor completa el nombre y la cédula del responsable.');
      return;
    }

    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      alert('Se requiere la firma del cliente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataUrl = sigPadRef.current.getTrimmedCanvas().toDataURL('image/png');
      const online = await offlineService.isOnline();
      let signatureUrl = '';

      if (online) {
        const blob = await (await fetch(dataUrl)).blob();
        const uploadedUrl = await db.uploadSignature(blob);
        if (uploadedUrl) {
          signatureUrl = uploadedUrl;
        } else {
          alert('Error al subir la firma. Reintenta.');
          setIsSubmitting(false);
          return;
        }
      } else {
        // If offline, use Base64 string directly
        signatureUrl = dataUrl;
      }

      onFinalize({
        name: signerName,
        document: signerDocument,
        signatureUrl: signatureUrl
      });
    } catch (error) {
      console.error('Error in validation:', error);
      alert('Error al procesar la validación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-dark text-white overflow-y-auto">
      {/* Header */}
      <header className="px-4 py-6 flex items-center justify-between sticky top-0 bg-background-dark/95 backdrop-blur-lg z-40 border-b border-white/10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-white/10">
          <span className="material-symbols-outlined text-white">arrow_back_ios</span>
        </button>
        <h1 className="text-lg font-black tracking-tight">Cierre de Inspección</h1>
        <div className="w-10"></div>
      </header>

      <div className="p-6 space-y-8">
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-xl">
              <span className="material-symbols-outlined text-black fill-1">verified</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Resumen de Visita</p>
              <h2 className="text-xl font-black">{inspectionCount} Equipos Inspeccionados</h2>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">Validación del Cliente</h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nombre del Responsable</label>
              <input 
                type="text" 
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-base focus:border-primary/50 outline-none transition-all placeholder:text-slate-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Cédula de Identidad</label>
              <input 
                type="text" 
                value={signerDocument}
                onChange={(e) => setSignerDocument(e.target.value)}
                placeholder="1.234.567-8"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-base focus:border-primary/50 outline-none transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Firma de Conformidad</label>
              <button 
                onClick={() => sigPadRef.current?.clear()}
                className="text-[9px] font-black text-primary uppercase tracking-widest"
              >
                Limpiar
              </button>
            </div>
            <div className="bg-white rounded-3xl overflow-hidden border-4 border-white/5 h-64 relative">
              <SignatureCanvas 
                ref={sigPadRef}
                penColor='black'
                canvasProps={{
                  className: 'signature-canvas w-full h-full'
                }}
              />
              <div className="absolute bottom-4 right-4 pointer-events-none opacity-20">
                <span className="text-[10px] text-slate-800 font-black uppercase tracking-widest">Firme aquí</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 bg-background-dark/95 backdrop-blur-xl border-t border-white/10">
        <button
          onClick={handleFinish}
          disabled={isSubmitting}
          className={`w-full py-5 rounded-2xl bg-primary text-black font-black text-lg shadow-[0_15px_30px_rgba(19,236,91,0.3)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter ${isSubmitting ? 'opacity-50' : ''}`}
        >
          {isSubmitting ? (
             <span className="material-symbols-outlined animate-spin">sync</span>
          ) : (
            <>
              <span className="material-symbols-outlined fill-1">check_circle</span>
              Finalizar y Enviar Reporte
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ValidationScreen;
