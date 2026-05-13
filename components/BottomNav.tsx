
import { type FC } from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  role: 'admin' | 'tecnico' | 'empresa' | 'fabrica';
}

const BottomNav: FC<BottomNavProps> = ({ currentScreen, onNavigate, role }) => {
  const allItems = [
    { id: 'home', label: 'Inicio', icon: 'home', roles: ['admin', 'tecnico', 'empresa', 'fabrica'] },
    { id: 'equipos', label: 'Equipos', icon: 'fire_extinguisher', roles: ['admin', 'tecnico', 'empresa', 'fabrica'] },
    { id: 'inspecciones', label: 'Sesión', icon: 'rule', roles: ['tecnico'] },
    { id: 'mapa', label: 'Mapa', icon: 'map', roles: ['admin', 'tecnico', 'empresa'] },
    { id: 'ajustes', label: 'Perfil', icon: 'person', roles: ['admin', 'tecnico', 'empresa', 'fabrica'] },
  ];

  const navItems = allItems.filter(item => item.roles.includes(role));

  return (
    <div className="fixed bottom-0 inset-x-0 p-4 z-[100] flex justify-center pointer-events-none">
      <nav className="bg-background-dark/80 backdrop-blur-2xl border border-white/10 flex items-center justify-around px-2 py-3 rounded-[32px] w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Screen)}
              className={`relative flex flex-col items-center justify-center py-1 transition-all duration-300 ${
                isActive ? 'w-20' : 'w-14'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-fadeIn"></div>
              )}
              <span className={`material-symbols-outlined !text-[28px] transition-all duration-300 ${
                isActive ? 'text-primary fill-1 scale-110' : 'text-slate-500 hover:text-slate-300'
              }`}>
                {item.icon}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest mt-1 transition-all duration-300 ${
                isActive ? 'text-white scale-100 opacity-100' : 'text-slate-600 scale-90 opacity-0 h-0'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 size-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(19,236,91,0.5)]"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
