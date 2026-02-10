
import React from 'react';

interface HeaderProps {
  role?: 'admin' | 'tecnico' | 'empresa';
}

const Header: React.FC<HeaderProps> = ({ role }) => {
  return (
    <header className="flex items-center justify-between p-4 pb-2 sticky top-0 bg-background-dark/80 backdrop-blur-md z-50">
      <div className="flex items-center gap-3">
        <div className="text-primary flex size-10 shrink-0 items-center justify-center bg-primary/10 rounded-lg">
          <span className="material-symbols-outlined !text-[28px]">fire_extinguisher</span>
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">Extintoruy</h1>
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
            {role === 'tecnico' ? 'Portal Técnico' : 'Plataforma Empresa'}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-white border border-white/10 active:bg-white/10 transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-white border border-white/10 active:bg-white/10 transition-colors">
          <span className="material-symbols-outlined">sync</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
