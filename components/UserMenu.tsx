
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

            {/* About Modal */}
            {showAbout && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
                    <div className="bg-[#1a1c1e] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="size-16 bg-primary/10 rounded-3xl flex items-center justify-center">
                                    <span className="material-symbols-outlined !text-4xl text-primary">shield</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">Extintoruy v1.2.0</h3>
                                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Compliance Hub & Logistics</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Términos y Privacidad</h4>
                                    <div className="text-xs text-slate-400 space-y-3 font-medium h-48 overflow-y-auto custom-scrollbar pr-2">
                                        <p>Esta plataforma ha sido desarrollada para el control estricto de cumplimiento normativo en equipos contra incendios según las regulaciones vigentes en Uruguay.</p>
                                        <p><strong>Privacidad:</strong> Todos los datos de inventario y trazabilidad son propiedad de la empresa contratante. Extintoruy actúa exclusivamente como procesador de datos bajo estándares de seguridad ISO.</p>
                                        <p><strong>Uso:</strong> Queda prohibida la reproducción parcial o total de la interfaz y la logística de procesos sin autorización expresa.</p>
                                        <p>Software diseñado por Antigravity AI para optimización logística avanzada.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAbout(false)}
                                className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-widest"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
