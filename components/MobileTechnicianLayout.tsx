
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { UserProfile, InspectionRecord, InspectionAsset } from '../types';
import Dashboard from './Dashboard';
import InspeccionesScreen from './InspeccionesScreen';
import InspectionScreen from './InspectionScreen';
import ValidationScreen from './ValidationScreen';
import QRScannerModal from './QRScannerModal';

interface MobileTechnicianLayoutProps {
    profile: UserProfile;
    onLogout: () => void;
    pendingInspections: InspectionRecord[];
    setPendingInspections: React.Dispatch<React.SetStateAction<InspectionRecord[]>>;
    onFinalize: (signerData: { name: string, document: string, signatureUrl: string }) => Promise<void>;
}

const MobileTechnicianLayout: React.FC<MobileTechnicianLayoutProps> = ({ 
    profile, 
    onLogout, 
    pendingInspections, 
    setPendingInspections,
    onFinalize
}) => {
    const [view, setView] = useState<'assigned' | 'session' | 'inspecting' | 'validating'>('assigned');
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [assignedAssets, setAssignedAssets] = useState<InspectionAsset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAssigned();
    }, []);

    const loadAssigned = async () => {
        setLoading(true);
        const assets = await db.getAssets(profile.company_id || 'ALL');
        // Filter assets assigned to this technician and pending
        const myAssets = assets.filter(a => a.assignedTechnicianId === profile.id && a.status === 'pending');
        setAssignedAssets(myAssets);
        setLoading(false);
    };

    const handleScan = async (decodedText: string) => {
        let assetId = decodedText;

        // Check if it's a JSON string (like {"id":"..."})
        if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
            try {
                const parsed = JSON.parse(decodedText);
                if (parsed.id) assetId = parsed.id;
            } catch (e) {
                console.error('Error parsing QR JSON:', e);
            }
        }

        if (decodedText.includes('asset/')) {
            assetId = decodedText.split('asset/')[1];
        }

        const asset = await db.getAsset(assetId);
        // SECURITY: 
        // 1. Admins scan everything
        // 2. Technicians without company_id (Global) scan everything
        // 3. Technicians with company_id only scan their company's assets
        const isOwner = asset && (
            profile.role === 'admin' || 
            !profile.company_id || 
            asset.companyId === profile.company_id
        );

        if (!asset || !isOwner) {
            const debugMsg = asset 
                ? `Permisos denegados para el rol "${profile?.role}".\nID Usuario: ${profile?.id}\nID Empresa: ${profile?.company_id}\nDueño Equipo: ${asset.companyId}`
                : `El equipo no existe en la base de datos.\nTexto escaneado: "${assetId}"`;
            
            alert(`No se puede escanear:\n\n${debugMsg}`);
            setIsScannerOpen(false);
            return;
        }

        if (pendingInspections.some(i => i.assetId === assetId)) {
            alert('Ya escaneado en esta sesión.');
            setIsScannerOpen(false);
            return;
        }

        setIsScannerOpen(false);
        setSelectedAssetId(assetId);
        setView('inspecting');
    };

    const handleSaveInspection = (record: InspectionRecord) => {
        setPendingInspections(prev => [...prev, record]);
        setView('session');
    };

    if (view === 'inspecting' && selectedAssetId) {
        return (
            <InspectionScreen 
                assetId={selectedAssetId} 
                onBack={() => setView('assigned')} 
                onSave={handleSaveInspection}
            />
        );
    }

    if (view === 'validating') {
        return (
            <ValidationScreen 
                onBack={() => setView('session')} 
                onConfirm={async (data) => {
                    await onFinalize(data);
                    setView('assigned');
                    loadAssigned();
                }}
            />
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background-dark text-white">
            {/* Minimal Header */}
            <header className="p-6 pb-2 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black">Hola, {profile.full_name.split(' ')[0]}</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Técnico de Campo</p>
                </div>
                <button onClick={onLogout} className="size-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined">logout</span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                {view === 'assigned' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Inspecciones Asignadas</h2>
                            <span className="bg-primary/20 text-primary px-2 py-1 rounded-lg text-[10px] font-black">{assignedAssets.length} Pendientes</span>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                            </div>
                        ) : assignedAssets.length === 0 ? (
                            <div className="bg-white/5 rounded-3xl p-10 text-center border border-white/5">
                                <span className="material-symbols-outlined !text-5xl text-slate-600 mb-4">task_alt</span>
                                <p className="text-slate-400 font-bold">¡Todo al día!</p>
                                <p className="text-slate-600 text-xs mt-1">No tienes inspecciones pendientes.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {assignedAssets.map(asset => (
                                    <div key={asset.id} onClick={() => { setSelectedAssetId(asset.id); setView('inspecting'); }} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 active:bg-white/10 transition-all">
                                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">fire_extinguisher</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{asset.name || asset.id}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-black">{asset.type}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Equipos en Sesión</h2>
                            <span className="bg-primary/20 text-primary px-2 py-1 rounded-lg text-[10px] font-black">{pendingInspections.length} Escaneados</span>
                        </div>

                        {pendingInspections.length === 0 ? (
                            <div className="bg-white/5 rounded-3xl p-10 text-center border border-white/5">
                                <span className="material-symbols-outlined !text-5xl text-slate-600 mb-4">qr_code_scanner</span>
                                <p className="text-slate-400 font-bold">Sesión vacía</p>
                                <p className="text-slate-600 text-xs mt-1">Escanea un equipo para comenzar.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingInspections.map(insp => (
                                    <div key={insp.assetId} className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-4">
                                        <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">check_circle</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">Equipo {insp.assetId}</p>
                                            <p className="text-[10px] text-primary uppercase font-black">Escaneado</p>
                                        </div>
                                        <button 
                                            onClick={() => setPendingInspections(prev => prev.filter(i => i.assetId !== insp.assetId))}
                                            className="size-8 rounded-lg bg-status-red/10 text-status-red flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined !text-lg">delete</span>
                                        </button>
                                    </div>
                                ))}
                                
                                <button 
                                    onClick={() => setView('validating')}
                                    className="w-full py-5 rounded-2xl bg-primary text-black font-black text-lg mt-6 shadow-lg shadow-primary/20 uppercase tracking-tighter"
                                >
                                    Finalizar Inspección
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Floating Scan Button */}
            <div className="fixed bottom-24 right-6">
                <button 
                    onClick={() => setIsScannerOpen(true)}
                    className="size-16 rounded-full bg-primary text-black shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined !text-3xl">qr_code_scanner</span>
                </button>
            </div>

            {/* Bottom Nav */}
            <nav className="bg-background-dark/80 backdrop-blur-xl border-t border-white/10 p-2 pb-8 flex justify-around">
                <button onClick={() => setView('assigned')} className={`flex flex-col items-center gap-1 p-2 ${view === 'assigned' ? 'text-primary' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined">assignment</span>
                    <span className="text-[10px] font-black uppercase">Tareas</span>
                </button>
                <button onClick={() => setView('session')} className={`flex flex-col items-center gap-1 p-2 ${view === 'session' || view === 'validating' ? 'text-primary' : 'text-slate-500'}`}>
                    <div className="relative">
                        <span className="material-symbols-outlined">rule</span>
                        {pendingInspections.length > 0 && (
                            <span className="absolute -top-1 -right-1 size-4 bg-status-red text-[8px] font-black text-white rounded-full flex items-center justify-center border-2 border-background-dark">
                                {pendingInspections.length}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-black uppercase">Sesión</span>
                </button>
            </nav>

            <QRScannerModal 
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleScan}
            />
        </div>
    );
};

export default MobileTechnicianLayout;
