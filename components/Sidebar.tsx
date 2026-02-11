
import React from 'react';
import { Screen } from '../types';

interface SidebarProps {
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
    onLogout?: () => void;
    role: 'admin' | 'tecnico' | 'empresa';
}

const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate, onLogout, role }) => {
    const navItems = role === 'admin'
        ? [
            { id: 'home', label: 'Admin Panel', icon: 'admin_panel_settings' },
            { id: 'usuarios', label: 'Usuarios', icon: 'manage_accounts' },
            { id: 'facturacion', label: 'Facturación', icon: 'payments' },
            { id: 'reportes', label: 'Reportes', icon: 'bar_chart' },
            { id: 'equipos', label: 'Equipos', icon: 'fire_extinguisher' },
            { id: 'tecnicos', label: 'Técnicos', icon: 'engineering' },
            { id: 'mapa', label: 'Mapa', icon: 'location_on' },
            { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
        ]
        : role === 'tecnico'
            ? [
                { id: 'home', label: 'Inicio', icon: 'dashboard' },
                { id: 'inspecciones', label: 'Inspecciones', icon: 'assignment' },
                { id: 'mapa', label: 'Mapa', icon: 'location_on' },
                { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
            ]
            : [
                { id: 'home', label: 'Inicio', icon: 'dashboard' },
                { id: 'equipos', label: 'Equipos', icon: 'fire_extinguisher' },
                { id: 'tecnicos', label: 'Técnicos', icon: 'engineering' },
                { id: 'mapa', label: 'Mapa', icon: 'location_on' },
                { id: 'reportes', label: 'Reportes', icon: 'bar_chart' },
                { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
            ];

    return (
        <aside className="w-20 lg:w-20 hover:w-64 h-screen bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col fixed left-0 top-0 transition-all duration-300 ease-in-out z-[100] group overflow-hidden shadow-2xl">
            {/* Brand Header */}
            <div className="p-4 lg:p-6 border-b border-white/5 overflow-hidden">
                <div className="flex items-center gap-4">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 shadow-inner">
                        <span className="material-symbols-outlined !text-2xl">
                            {role === 'admin' ? 'shield_person' : 'fire_extinguisher'}
                        </span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                        <h1 className="text-lg font-bold text-white tracking-tight">Extintoruy</h1>
                        <p className="text-[10px] uppercase font-bold text-primary tracking-widest">
                            {role === 'admin' ? 'Panel de Control' : role === 'tecnico' ? 'Portal Técnico' : 'Plataforma Empresa'}
                        </p>
                    </div>
                </div>
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
                        <span className="text-sm tracking-wide font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {item.label}
                        </span>
                        {currentScreen === item.id && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-background-dark/50 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        )}
                    </button>
                ))}
            </nav>

            {/* User Section */}
            <div className="p-3 lg:p-4 border-t border-white/5 bg-white/[0.02]">
                <button
                    onClick={onLogout}
                    className="w-full h-12 flex items-center gap-4 px-3 py-3 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all group/logout overflow-hidden whitespace-nowrap"
                >
                    <div className="size-8 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 group-hover/logout:border-red-500/30 shrink-0">
                        <span className="material-symbols-outlined !text-sm group-hover/logout:text-red-500">logout</span>
                    </div>
                    <div className="flex-1 text-left opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="block text-xs font-black text-white group-hover/logout:text-red-500">Cerrar Sesión</span>
                        <span className="block text-[10px] font-medium opacity-50 uppercase tracking-tighter">Usuario Activo</span>
                    </div>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
