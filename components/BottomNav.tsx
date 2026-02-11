
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
        { id: 'equipos', label: 'Equipos', icon: 'fire_extinguisher' },
        { id: 'tecnicos', label: 'Técnicos', icon: 'engineering' },
        { id: 'mapa', label: 'Mapa', icon: 'location_on' },
        { id: 'reportes', label: 'Reportes', icon: 'bar_chart' },
        { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-dark/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around p-3 pb-8 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id as Screen)}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 active:scale-90 ${currentScreen === item.id ? 'text-primary' : 'text-slate-500'
            }`}
        >
          <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${currentScreen === item.id ? 'bg-primary/10' : ''
            }`}>
            <span className={`material-symbols-outlined !text-2xl ${currentScreen === item.id ? 'fill-1' : ''}`}>
              {item.icon}
            </span>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider transition-opacity duration-300 ${currentScreen === item.id ? 'opacity-100' : 'opacity-60'
            }`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
