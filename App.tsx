
import { useState, useEffect, type FC } from 'react';
import { supabase } from './services/supabase';
import { db } from './services/db';
import { Screen, UserProfile } from './types';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import UsuariosScreen from './components/UsuariosScreen';
import ClientesScreen from './components/ClientesScreen';
import FacturacionScreen from './components/FacturacionScreen';
import ReportesScreen from './components/ReportesScreen';
import EquiposScreen from './components/EquiposScreen';
import TecnicosScreen from './components/TecnicosScreen';
import AjustesScreen from './components/AjustesScreen';
import InspeccionesScreen from './components/InspeccionesScreen';
import MapScreen from './components/MapScreen';
import InspectionScreen from './components/InspectionScreen';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import SupportScreen from './components/SupportScreen';
import TermsScreen from './components/TermsScreen';
import PrivacyScreen from './components/PrivacyScreen';

const App: FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [publicScreen, setPublicScreen] = useState<'landing' | 'login' | 'soporte' | 'terminos' | 'privacidad'>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          const userProfile = await db.getProfile(session.user.id);
          setProfile(userProfile as UserProfile);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    }).catch(() => {
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const userProfile = await db.getProfile(session.user.id);
          setProfile(userProfile as UserProfile);
          setIsAuthenticated(true);
        } else {
          setProfile(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error on auth state change:", error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const companyId = profile?.role === 'admin' ? 'ALL' : profile?.role === 'fabrica' ? profile.id : (profile?.company_id || 'ALL');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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
        return (
          <>
            <div className="hidden lg:block h-full"><AdminDashboard onNavigate={handleNavigate} companyId={companyId} /></div>
            <div className="block lg:hidden h-full"><Dashboard onStartInspection={() => handleStartInspection('#UY-9921-24')} onNavigate={handleNavigate} /></div>
          </>
        );
      case 'usuarios':
        return <UsuariosScreen />;
      case 'clientes':
        return <ClientesScreen onNavigate={handleNavigate} companyId={companyId} />;
      case 'facturacion':
        return <FacturacionScreen />;
      case 'reportes':
        return <ReportesScreen companyId={companyId} />;
      case 'equipos':
        return <EquiposScreen companyId={companyId} />;
      case 'tecnicos':
        return <TecnicosScreen companyId={companyId} />;
      case 'ajustes':
        return <AjustesScreen />;
      case 'inspecciones':
        return <InspeccionesScreen onBack={() => setCurrentScreen('home')} profile={profile} onStartInspection={(id) => handleStartInspection(id)} />;
      case 'mapa':
        return <MapScreen onStartInspection={() => handleStartInspection('#UY-9921-24')} />;
      case 'inspeccion':
        return <InspectionScreen onBack={() => setCurrentScreen('home')} />;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center text-white">
        <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></span>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Cargando Plataforma...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    switch (publicScreen) {
      case 'login':
        return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />; // LoginScreen might need onBack if supported later, but for now we'll just render it
      case 'soporte':
        return <SupportScreen onBack={() => setPublicScreen('landing')} />;
      case 'terminos':
        return <TermsScreen onBack={() => setPublicScreen('landing')} />;
      case 'privacidad':
        return <PrivacyScreen onBack={() => setPublicScreen('landing')} />;
      case 'landing':
      default:
        return <LandingPage onLogin={() => setPublicScreen('login')} onNavigateTo={(page) => setPublicScreen(page)} />;
    }
  }

  return (
    <div className="min-h-screen bg-background-dark flex relative overflow-x-hidden text-white">
      {/* Desktop Sidebar */}
      {currentScreen !== 'inspeccion' && currentScreen !== 'mapa' && (
        <Sidebar 
          currentScreen={currentScreen} 
          onNavigate={handleNavigate} 
          onLogout={handleLogout}
          role={profile?.role || 'admin'}
          fullName={profile?.full_name || 'Administrador'}
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
