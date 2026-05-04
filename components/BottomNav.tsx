
import { type FC } from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const BottomNav: FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: 'dashboard' },
    { id: 'clientes', label: 'Clientes', icon: 'groups' },
    { id: 'equipos', label: 'Equipos', icon: 'fire_extinguisher' },
    { id: 'mapa', label: 'Mapa', icon: 'location_on' },
    { id: 'reportes', label: 'Reportes', icon: 'bar_chart' },
    { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
  ];

  return (
    <nav className="sticky bottom-0 bg-background-dark border-t border-white/10 flex items-center justify-around p-3 pb-8 z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id as Screen)}
          className={`flex flex-col items-center gap-1 transition-colors ${currentScreen === item.id ? 'text-primary' : 'text-slate-500'
            }`}
        >
          <span className={`material-symbols-outlined ${currentScreen === item.id ? 'fill-1' : ''}`}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
