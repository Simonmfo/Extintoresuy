
import { type FC } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="flex items-center justify-between p-4 pb-2 sticky top-0 bg-background-dark/80 backdrop-blur-md z-50 border-b border-white/5">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden flex size-10 items-center justify-center rounded-xl bg-white/5 text-white border border-white/10 active:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="text-primary flex size-9 shrink-0 items-center justify-center bg-primary/10 rounded-lg">
          <span className="material-symbols-outlined !text-[24px]">shield_with_heart</span>
        </div>
        <div>
          <h1 className="text-base font-bold leading-tight tracking-tight">Extintoruy</h1>
          <p className="text-[9px] uppercase tracking-widest text-primary font-bold">Compliance</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-white border border-white/10 active:bg-white/10 transition-colors">
          <span className="material-symbols-outlined !text-xl">notifications</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
