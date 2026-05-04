
import { useState, type FC } from 'react';
import { Screen } from './types';
import Dashboard from './components/Dashboard';
import MapScreen from './components/MapScreen';
import InspectionScreen from './components/InspectionScreen';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';

const App: FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleStartInspection = (assetId: string) => {
    setSelectedAssetId(assetId);
    setCurrentScreen('inspeccion');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <Dashboard onStartInspection={() => handleStartInspection('#UY-9921-24')} onNavigate={handleNavigate} />;
      case 'mapa':
        return <MapScreen onStartInspection={() => handleStartInspection('#UY-9921-24')} />;
      case 'inspeccion':
        return <InspectionScreen onBack={() => setCurrentScreen('home')} />;
      case 'clientes':
        return (
          <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500">
            <span className="material-symbols-outlined text-6xl mb-4">groups</span>
            <p className="text-xl font-bold uppercase tracking-widest">Clientes</p>
            <p className="text-sm mt-2">Listado de clientes pronto...</p>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500">
            <span className="material-symbols-outlined text-6xl mb-4">construction</span>
            <p className="text-xl font-bold uppercase tracking-widest">En Construcción</p>
            <button
              onClick={() => handleNavigate('home')}
              className="mt-6 text-primary font-bold border border-primary/20 px-4 py-2 rounded-lg"
            >
              Volver al Inicio
            </button>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    if (showLogin) {
      return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
    }
    return <LandingPage onLogin={() => setShowLogin(true)} />;
  }

  return (
    <div className="min-h-screen bg-background-dark flex relative overflow-x-hidden text-white">
      {/* Desktop Sidebar */}
      {currentScreen !== 'inspeccion' && currentScreen !== 'mapa' && (
        <Sidebar 
          currentScreen={currentScreen} 
          onNavigate={handleNavigate} 
          onLogout={() => setIsAuthenticated(false)}
          role="admin"
          fullName="Administrador"
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${currentScreen !== 'inspeccion' && currentScreen !== 'mapa' ? 'lg:pl-20' : ''}`}>
        {currentScreen !== 'inspeccion' && currentScreen !== 'mapa' && (
          <div className="lg:hidden">
            <Header />
          </div>
        )}

        {/* Desktop Topbar */}
        {currentScreen !== 'inspeccion' && currentScreen !== 'mapa' && (
          <header className="hidden lg:flex items-center justify-between p-6 bg-background-dark/80 backdrop-blur-md sticky top-0 z-40 border-b border-white/5">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">ExtintoresUY</h1>
              <p className="text-sm font-medium text-slate-400">Plataforma de Mantenimiento</p>
            </div>
            <div className="flex gap-3">
              <button className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-8 relative">
          {renderScreen()}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {currentScreen !== 'inspeccion' && currentScreen !== 'mapa' && (
        <div className="lg:hidden">
          <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
        </div>
      )}
    </div>
  );
};

export default App;
