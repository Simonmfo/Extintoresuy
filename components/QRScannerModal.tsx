
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const html5QrCode = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cameras, setCameras] = useState<any[]>([]);
    const [activeCameraId, setActiveCameraId] = useState<string>("");

    const stopScanner = async () => {
        if (html5QrCode.current && html5QrCode.current.isScanning) {
            try {
                await html5QrCode.current.stop();
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    };

    useEffect(() => {
        if (isOpen) {
            setError(null);
            
            // Check for secure context
            if (!window.isSecureContext && window.location.hostname !== 'localhost') {
                setError("La cámara requiere una conexión segura (HTTPS). Por favor, asegúrate de que el sitio use SSL.");
                return;
            }

            const startScanner = async () => {
                try {
                    // 1. Get cameras
                    const devices = await Html5Qrcode.getCameras();
                    if (devices && devices.length > 0) {
                        setCameras(devices);
                        // Prefer back camera
                        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera'));
                        const cameraId = backCamera ? backCamera.id : devices[0].id;
                        setActiveCameraId(cameraId);

                        // 2. Start scanning
                        const scanner = new Html5Qrcode("qr-reader");
                        html5QrCode.current = scanner;

                        await scanner.start(
                            cameraId, 
                            {
                                fps: 10,
                                qrbox: { width: 250, height: 250 }
                            },
                            (decodedText) => {
                                stopScanner().then(() => onScan(decodedText));
                            },
                            (errorMessage) => {
                                // ignore
                            }
                        );
                    } else {
                        setError("No se encontraron cámaras en este dispositivo.");
                    }
                } catch (err: any) {
                    console.error(err);
                    if (err.toString().includes("NotAllowedError")) {
                        setError("Permiso de cámara denegado. Por favor, habilita el acceso en tu navegador.");
                    } else {
                        setError("Error al iniciar la cámara: " + err.message);
                    }
                }
            };

            // Small delay to ensure DOM is ready
            const timer = setTimeout(startScanner, 300);
            return () => {
                clearTimeout(timer);
                stopScanner();
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
                        <div className="bg-status-red/10 border border-status-red/20 p-6 rounded-3xl text-center">
                            <span className="material-symbols-outlined text-status-red text-4xl mb-4 font-light">videocam_off</span>
                            <p className="text-status-red text-sm font-bold leading-relaxed">{error}</p>
                            <button 
                                onClick={onClose}
                                className="mt-6 px-8 py-3 bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    ) : (
                        <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                            <div id="qr-reader" className="w-full h-full"></div>
                            {/* Overlay focus frame */}
                            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                                <div className="w-full h-full border-2 border-primary/50 relative">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white/5 flex items-center gap-4">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">info</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
                        Si tienes problemas, asegúrate de estar en un sitio con <b>HTTPS</b> y de haber aceptado los permisos de cámara.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
