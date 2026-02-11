
import React from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  role?: 'admin' | 'tecnico' | 'empresa';
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, role }) => {
  const navItems = role === 'admin'
    ? [
      { id: 'home', label: 'Admin', icon: 'admin_panel_settings' },
      { id: 'facturacion', label: 'Invoices', icon: 'payments' },
      { id: 'usuarios', label: 'Users', icon: 'manage_accounts' },
      { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
    ]
    : role === 'tecnico'
      ? [
        { id: 'home', label: 'Inicio', icon: 'dashboard' },
        { id: 'inspecciones', label: 'Historial', icon: 'history' },
        { id: 'mapa', label: 'Mapa', icon: 'location_on' },
        { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
      ]
      : [
        { id: 'home', label: 'Inicio', icon: 'dashboard' },
        { id: 'clientes', label: 'Clientes', icon: 'corporate_fare' },
        { id: 'equipos', label: 'Equipos', icon: 'fire_extinguisher' },
        { id: 'mapa', label: 'Mapa', icon: 'location_on' },
        { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
      ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 bg-[#1a1c1e]/80 backdrop-blur-2xl border border-white/[0.08] flex items-center justify-around p-2 rounded-3xl z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] lg:hidden">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id as Screen)}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-300 active:scale-90 relative ${currentScreen === item.id ? 'text-primary' : 'text-slate-500'
            }`}
        >
          {currentScreen === item.id && (
            <div className="absolute inset-0 bg-primary/5 rounded-2xl animate-pulse"></div>
          )}
          <div className="relative">
            <span className={`material-symbols-outlined !text-[24px] transition-all duration-300 ${currentScreen === item.id ? 'fill-1 scale-110' : 'scale-100 opacity-70'}`}>
              {item.icon}
            </span>
            {currentScreen === item.id && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,157,0.8)]"></div>
            )}
          </div>
          <span className={`text-[8px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${currentScreen === item.id ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-0.5'
            }`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
