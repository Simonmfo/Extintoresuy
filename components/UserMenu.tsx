
import React, { useState, useRef, useEffect } from 'react';
import { Screen } from '../types';

interface UserMenuProps {
    onNavigate: (screen: Screen) => void;
    onLogout: () => Promise<void>;
    role?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ onNavigate, onLogout, role }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        { id: 'ajustes', label: 'Configuración', icon: 'settings', action: () => onNavigate('ajustes') },
        { id: 'soporte', label: 'Contactar Soporte', icon: 'support_agent', action: () => window.open('https://wa.me/598000000', '_blank') },
        { id: 'acerca', label: 'Acerca de', icon: 'info', action: () => { setShowAbout(true); setIsOpen(false); } },
        { id: 'logout', label: 'Cerrar Sesión', icon: 'logout', action: onLogout, danger: true },
    ];

    return (
        <>
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="size-10 rounded-full bg-gradient-to-tr from-primary to-emerald-600 border-2 border-background-dark shadow-xl hover:scale-105 transition-transform active:scale-95 flex items-center justify-center overflow-hidden"
                >
                    <div className="size-full bg-black/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-xl">person</span>
                    </div>
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-[#1a1c1e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[1000] animate-fadeIn">
                        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Usuario Conectado</p>
                            <p className="text-sm font-bold text-white truncate capitalize">{role || 'Empresa'}</p>
                        </div>
                        <div className="p-2">
                            {menuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        item.action();
                                        if (item.id !== 'acerca') setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-sm font-bold ${item.danger
                                        ? 'text-red-400 hover:bg-red-500/10'
                                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <span className="material-symbols-outlined !text-xl">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* DEFINITIVE MODAL FIX: Using fixed inset-0 for absolute centering regardless of parent */}
            {showAbout && (
                <div
                    className="fixed inset-0 w-screen h-screen bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-6"
                    style={{ zIndex: 10000000 }}
                >
                    <style>{`
                        @keyframes modalEntry {
                            from { opacity: 0; transform: scale(0.95) translateY(10px); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                        .animate-modal-entry { animation: modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    `}</style>

                    <div className="bg-[#1a1c1e] border border-white/10 rounded-[40px] w-full max-w-md max-h-[90vh] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-modal-entry relative">
                        {/* Header Fixed inside modal */}
                        <div className="absolute top-0 right-0 p-6 z-20">
                            <button
                                onClick={() => setShowAbout(false)}
                                className="size-11 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90 border border-white/5"
                            >
                                <span className="material-symbols-outlined !text-xl">close</span>
                            </button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-12 space-y-8">
                            <div className="flex flex-col items-center text-center space-y-4 pt-4">
                                <div className="size-20 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary shadow-inner border border-primary/10">
                                    <span className="material-symbols-outlined !text-5xl">verified_user</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-white tracking-tight">Extintor<span className="text-primary">.uy</span></h3>
                                    <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.3em]">Compliance Edition 1.2.0</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <section className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-4">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <span className="material-symbols-outlined text-sm">gavel</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Información Legal</p>
                                    </div>
                                    <div className="text-[11px] text-slate-400 leading-relaxed space-y-3 font-medium">
                                        <p>Esta plataforma es una herramienta especializada para la gestión del cumplimiento normativo de equipos contra incendios.</p>
                                        <p>Todos los registros cumplen con las directivas de la <strong>Dirección Nacional de Bomberos</strong> y las ordenanzas municipales vigentes.</p>
                                        <p><strong>Seguridad de Datos:</strong> Utilizamos protocolos de encriptación de grado industrial para proteger el historial de sus activos. La infraestructura se aloja en centros de datos seguros con redundancia y respaldos automáticos.</p>
                                        <p><strong>Privacidad:</strong> Los datos se gestionan bajo estrictos estándares de confidencialidad y según lo establecido en la Ley N° 18.331. La información técnica se utiliza exclusivamente para fines de auditoría y seguridad industrial.</p>
                                        <p><strong>Integridad:</strong> Cada inspección genera un registro inmutable con marca de tiempo para garantizar la trazabilidad total ante cualquier peritaje.</p>
                                    </div>
                                </section>

                                <div className="px-4 py-2 bg-black/40 rounded-2xl flex items-center justify-between border border-white/5">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Soporte Técnico</span>
                                    <span className="text-[10px] text-primary font-black">ACTIVO 24/7</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={() => setShowAbout(false)}
                                    className="w-full bg-primary text-background-dark font-black py-4 rounded-[20px] text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all"
                                >
                                    Cerrar Información
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default UserMenu;
