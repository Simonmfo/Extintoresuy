
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Delay initialization to ensure the DOM element is ready
            const timer = setTimeout(() => {
                try {
                    const scanner = new Html5QrcodeScanner(
                        "qr-reader",
                        { 
                            fps: 10, 
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        },
                        /* verbose= */ false
                    );
                    
                    scanner.render((decodedText) => {
                        scanner.clear();
                        onScan(decodedText);
                    }, (err) => {
                        // ignore scan errors
                    });
                    
                    scannerRef.current = scanner;
                } catch (err: any) {
                    setError(err.message || 'Error initializing camera');
                }
            }, 100);
            
            return () => {
                clearTimeout(timer);
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(console.error);
                    scannerRef.current = null;
                }
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-background-dark border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-white">Escanear Código QR</h2>
                        <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Apunta la cámara al extintor</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-white">close</span>
                    </button>
                </div>

                <div className="p-6">
                    {error ? (
                        <div className="bg-status-red/10 border border-status-red/20 p-4 rounded-2xl text-center">
                            <span className="material-symbols-outlined text-status-red text-4xl mb-2">videocam_off</span>
                            <p className="text-status-red text-sm font-bold">{error}</p>
                            <button 
                                onClick={onClose}
                                className="mt-4 px-6 py-2 bg-white/5 text-white rounded-xl text-xs font-bold uppercase tracking-widest"
                            >
                                Cerrar
                            </button>
                        </div>
                    ) : (
                        <div id="qr-reader" className="overflow-hidden rounded-2xl border border-white/10 bg-black/40"></div>
                    )}
                </div>

                <div className="p-6 bg-white/5 flex items-center gap-4">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">info</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
                        Asegúrate de tener buena iluminación y que el código esté dentro del recuadro para una lectura rápida.
                    </p>
                </div>
            </div>

            <style>{`
                #qr-reader {
                    border: none !important;
                }
                #qr-reader__dashboard {
                    padding: 20px !important;
                    background: transparent !important;
                }
                #qr-reader__status_span {
                    display: none !important;
                }
                #qr-reader img {
                    display: none !important;
                }
                #qr-reader__camera_selection {
                    background: #1e293b !important;
                    color: white !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    padding: 8px !important;
                    border-radius: 12px !important;
                    margin-bottom: 10px !important;
                    width: 100% !important;
                }
                #qr-reader__dashboard_btn {
                    background: #10b981 !important;
                    color: #020617 !important;
                    border: none !important;
                    padding: 12px 24px !important;
                    border-radius: 12px !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    font-size: 12px !important;
                    margin: 10px 0 !important;
                    cursor: pointer !important;
                    width: 100% !important;
                }
            `}</style>
        </div>
    );
};

export default QRScannerModal;
