
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

            {/* DEFINITIVE MODAL FIX: Fixed at root with extreme Z-index */}
            {showAbout && (
                <div
                    className="fixed inset-0 bg-black/95 backdrop-blur-2xl animate-fadeIn p-4 flex items-center justify-center"
                    style={{ zIndex: 999999 }}
                >
                    <div className="bg-[#1a1c1e] border border-white/10 rounded-[40px] w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-scaleIn">
                        <div className="p-8 space-y-8">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="size-20 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary shadow-inner">
                                    <span className="material-symbols-outlined !text-5xl">verified_user</span>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tight">Extintoruy</h3>
                                    <p className="text-primary text-xs font-black uppercase tracking-[0.2em]">Versión 1.2.0 stable</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-4">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <span className="material-symbols-outlined text-sm">gavel</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Políticas & Privacidad</p>
                                    </div>
                                    <div className="text-xs text-slate-400 leading-relaxed space-y-4 max-h-[25vh] overflow-y-auto custom-scrollbar pr-2 font-medium">
                                        <p>Esta plataforma gestiona el cumplimiento normativo de equipos contra incendios bajo las ordenanzas de la Dirección Nacional de Bomberos de Uruguay.</p>
                                        <p><strong>Seguridad:</strong> La integridad de la trazabilidad y los registros de inspección están garantizados mediante tecnologías de cifrado y auditoría persistente.</p>
                                        <p>Software optimizado para operaciones de alta logística.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAbout(false)}
                                className="w-full bg-primary text-background-dark font-black py-5 rounded-[24px] text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserMenu;
