
import React, { useState } from 'react';
import { Screen } from './types';
import Dashboard from './components/Dashboard';
import MapScreen from './components/MapScreen';
import InspectionScreen from './components/InspectionScreen';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import EquiposScreen from './components/EquiposScreen';
import AlertasScreen from './components/AlertasScreen';
import TechnicianDashboard from './components/TechnicianDashboard';
import InspeccionesScreen from './components/InspeccionesScreen';
import TecnicosScreen from './components/TecnicosScreen';
import AjustesScreen from './components/AjustesScreen';
import ReportesScreen from './components/ReportesScreen';
import AdminDashboard from './components/AdminDashboard';
import FacturacionScreen from './components/FacturacionScreen';
import UsuariosScreen from './components/UsuariosScreen';
import ClientesScreen from './components/ClientesScreen';
import UserMenu from './components/UserMenu';
import SplashScreen from './components/SplashScreen';
import { supabase } from './services/supabase';
import { db } from './services/db';
import { UserProfile } from './types';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [viewAssetId, setViewAssetId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [alertType, setAlertType] = useState<'expired' | 'pending'>('pending');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = async (userId: string) => {
    const data = await db.getProfile(userId);
    if (data) {
      setProfile({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role as any,
        company_id: (data as any).company_id
      });
    }
  };

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleStartInspection = (assetId: string) => {
    setSelectedAssetId(assetId);
    setCurrentScreen('inspeccion');
  };

  const handleViewAsset = (assetId: string) => {
    setViewAssetId(assetId);
    setCurrentScreen('equipos');
  };

  const handleNavigateAlerts = (type: 'expired' | 'pending') => {
    setAlertType(type);
    setCurrentScreen('alertas');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        if (profile?.role === 'admin') {
          return <AdminDashboard onNavigate={setCurrentScreen} />;
        }
        if (profile?.role === 'tecnico') {
          return (
            <TechnicianDashboard
              onStartInspection={handleStartInspection}
              onNavigate={handleNavigate}
              onNavigateAlerts={handleNavigateAlerts}
            />
          );
        }
        return (
          <Dashboard
            onStartInspection={handleStartInspection}
            onNavigate={handleNavigate}
            onViewAsset={handleViewAsset}
            onNavigateAlerts={handleNavigateAlerts}
          />
        );
      case 'facturacion':
        return <FacturacionScreen />;
      case 'usuarios':
        return <UsuariosScreen />;
      case 'clientes':
        return <ClientesScreen />;
      case 'equipos':
        return <EquiposScreen initialAssetId={viewAssetId} onClearInitialId={() => setViewAssetId(null)} />;
      case 'alertas':
        return (
          <AlertasScreen
            type={alertType}
            companyId={profile?.role === 'tecnico' ? profile.company_id || '' : profile?.id || ''}
            onBack={() => setCurrentScreen('home')}
            onAction={profile?.role === 'tecnico' ? handleStartInspection : handleViewAsset}
            profile={profile}
          />
        );
      case 'inspecciones':
        return <InspeccionesScreen onBack={() => setCurrentScreen('home')} profile={profile} onStartInspection={handleStartInspection} />;
      case 'tecnicos':
        return <TecnicosScreen companyId={profile?.id || ''} />;
      case 'mapa':
        return <MapScreen onStartInspection={() => handleStartInspection('#UY-9921-24')} />;
      case 'inspeccion':
        return <InspectionScreen onBack={() => setCurrentScreen('home')} assetId={selectedAssetId} />;
      case 'reportes':
        return <ReportesScreen />;
      case 'ajustes':
        return <AjustesScreen profile={profile} onLogout={handleLogout} onRefreshProfile={() => profile && fetchProfile(profile.id)} />;
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

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLoginSuccess={() => { }} />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div className="min-h-screen bg-background-dark flex text-white font-sans selection:bg-primary/30">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:block w-20 shrink-0 transition-all duration-300">
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          role={profile?.role || 'empresa'}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        {/* Header - Show only on mobile/tablet or customize for desktop */}
        <div className="lg:hidden">
          {currentScreen !== 'inspeccion' && currentScreen !== 'mapa' && (
            <Header
              role={profile?.role || 'empresa'}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          )}
        </div>

        {/* Desktop Header / Top Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm z-20">
          <h2 className="text-xl font-bold text-white capitalize tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500">
              {currentScreen === 'home' ? 'dashboard' : currentScreen === 'mapa' ? 'location_on' : 'grid_view'}
            </span>
            {currentScreen === 'home' ? 'Dashboard General' : currentScreen}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <div className="size-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-xs font-medium text-slate-300">Sistema Operativo</span>
            </div>
            <button className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-slate-300">notifications</span>
            </button>
            <UserMenu onNavigate={handleNavigate} onLogout={handleLogout} role={profile?.role} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative no-scrollbar">
          <div className="p-4 pb-24 lg:p-8 h-full"> {/* Added padding for desktop and mobile bottom nav */}
            {renderScreen()}
          </div>
        </main>

        {/* Bottom Nav for Mobile */}
        {currentScreen !== 'inspeccion' && (
          <div className="lg:hidden">
            <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} role={profile?.role || 'empresa'} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
