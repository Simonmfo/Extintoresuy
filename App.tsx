
import { useState, type FC } from 'react';
import { Screen } from './types';
import Dashboard from './components/Dashboard';
import MapScreen from './components/MapScreen';
import InspectionScreen from './components/InspectionScreen';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import LandingPage from './components/LandingPage';

const App: FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    return <LandingPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background-dark flex flex-col relative overflow-x-hidden">
      {currentScreen !== 'inspeccion' && currentScreen !== 'mapa' && <Header />}

      <main className="flex-1">
        {renderScreen()}
      </main>

      {currentScreen !== 'inspeccion' && (
        <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
      )}
    </div>
  );
};

export default App;
