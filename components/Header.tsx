
import React from 'react';
import UserMenu from './UserMenu';
import { Screen } from '../types';

interface HeaderProps {
  role?: 'admin' | 'tecnico' | 'empresa';
  onNavigate: (screen: Screen) => void;
  onLogout: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({ role, onNavigate, onLogout }) => {
  return (
    <header className="flex items-center justify-between px-5 py-4 sticky top-0 bg-[#0f1113]/80 backdrop-blur-2xl z-50 border-b border-white/[0.03]">
      <div className="flex items-center gap-3.5">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full"></div>
          <div className="relative text-primary flex size-10 shrink-0 items-center justify-center bg-primary/10 rounded-xl border border-primary/20 shadow-inner">
            <span className="material-symbols-outlined !text-[26px]">fire_extinguisher</span>
          </div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-black leading-tight tracking-tight text-white flex items-center gap-1.5">
            Extintores<span className="text-primary">UY</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">
            {role === 'admin' ? 'Control Master' : role === 'tecnico' ? 'Operaciones' : 'Empresa Portal'}
          </p>
        </div>
      </div>
      <div className="flex gap-3 items-center">
        <button className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 border border-white/10 active:bg-white/10 transition-colors relative">
          <span className="material-symbols-outlined !text-xl">notifications</span>
          <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full border-2 border-[#0f1113]"></span>
        </button>
        <UserMenu onNavigate={onNavigate} onLogout={onLogout} role={role} />
      </div>
    </header>
  );
};

export default Header;
