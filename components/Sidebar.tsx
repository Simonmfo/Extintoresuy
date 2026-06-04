
import React from 'react';
import { Screen } from '../types';
import { hasPermission } from '../utils/permissions';

interface SidebarProps {
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
    onLogout?: () => void;
    role: 'admin' | 'tecnico' | 'empresa' | 'fabrica';
    fullName?: string;
    isOpen?: boolean;
    onClose?: () => void;
    profile: any;
}

const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate, onLogout, role, fullName, isOpen, onClose, profile }) => {
    const allNavItems = [
        { id: 'home', label: role === 'admin' ? 'Admin Panel' : 'Inicio', icon: role === 'admin' ? 'admin_panel_settings' : 'dashboard' },
        { id: 'usuarios', label: 'Usuarios', icon: 'manage_accounts' },
        { id: 'clientes', label: 'Clientes', icon: 'corporate_fare' },
        { id: 'fabricas', label: 'Plantas Recarga', icon: 'factory' },
        { id: 'facturacion', label: 'Facturación', icon: 'payments' },
        { id: 'reportes', label: 'Reportes', icon: 'bar_chart' },
        { id: 'equipos', label: role === 'empresa' ? 'Mis Equipos' : 'Equipos', icon: 'fire_extinguisher' },
        { id: 'tecnicos', label: 'Técnicos', icon: 'engineering' },
        { id: 'inspecciones', label: 'Inspecciones', icon: 'assignment' },
        { id: 'mapa', label: 'Mapa', icon: 'location_on' },
        { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
    ];

    const navItems = allNavItems.filter(item => hasPermission(profile, item.id, 'read'));

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden animate-fadeIn"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed left-0 top-0 h-screen transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-[100] group overflow-hidden shadow-2xl flex flex-col
                bg-black/80 backdrop-blur-3xl border-r border-white/5
                ${isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0 lg:w-20 lg:hover:w-64'}
            `}>
                {/* Brand Header */}
                <div className="p-4 lg:p-6 border-b border-white/5 overflow-hidden relative">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-inner">
                            <span className="material-symbols-outlined !text-2xl">
                                {role === 'admin' ? 'shield_person' : 'fire_extinguisher'}
                            </span>
                        </div>
                        <div className={`transition-all duration-300 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <h1 className="text-lg font-bold text-white tracking-tight">ExtintoresUY</h1>
                            <p className="text-[10px] uppercase font-bold text-primary tracking-widest">
                                {role === 'admin' ? 'Panel de Control' : role === 'tecnico' ? 'Portal Técnico' : role === 'fabrica' ? 'Portal Fábrica' : 'Portal Empresa'}
                            </p>
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    {isOpen && (
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center text-slate-500 lg:hidden"
                        >
                            <span className="material-symbols-outlined text-xl">chevron_left</span>
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 lg:p-4 space-y-2 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as Screen)}
                            className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all group/item whitespace-nowrap h-12 ${currentScreen === item.id
                                ? 'bg-primary text-background-dark font-black shadow-lg shadow-primary/30'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className={`material-symbols-outlined shrink-0 transition-all duration-300 ${currentScreen === item.id ? 'fill-1 scale-110' : 'group-hover/item:text-primary scale-100'
                                } ${currentScreen !== item.id ? 'translate-x-1' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-sm tracking-wide font-bold transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                {item.label}
                            </span>
                            {currentScreen === item.id && (
                                <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-background-dark/50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User Section */}
                <div className="p-3 lg:p-4 border-t border-white/5 bg-white/[0.02]">
                    <div className="flex flex-col gap-2">
                        {/* User Profile Info (Quick View) */}
                        <div
                            onClick={() => onNavigate('ajustes')}
                            className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-all group/profile overflow-hidden whitespace-nowrap"
                        >
                            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                <span className="material-symbols-outlined !text-sm text-primary">person</span>
                            </div>
                            <div className={`flex-1 text-left transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                <span className="block text-[10px] font-medium opacity-50 uppercase tracking-tighter">Usuario Conectado</span>
                                <span className="block text-xs font-black text-white">{fullName || 'Sin nombre'}</span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={onLogout}
                            className="w-full h-10 flex items-center gap-4 px-3 py-2 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all group/logout overflow-hidden whitespace-nowrap"
                        >
                            <div className="size-8 rounded-lg flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined !text-sm group-hover/logout:text-red-500">logout</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                Cerrar Sesión
                            </span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
