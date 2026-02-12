
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
  const [sidebarOpen, setSidebarOpen] = useState(false);


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

  const handleNavigate = (screen: Screen, assetId?: string, isView?: boolean) => {
    if (assetId) {
      if (isView) setViewAssetId(assetId);
      else setSelectedAssetId(assetId);
    }
    setCurrentScreen(screen);
    setSidebarOpen(false); // Close sidebar on navigation
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const renderScreen = () => {
    const effectiveCompanyId = profile?.role === 'admin' ? 'ALL' : (profile?.role === 'tecnico' ? profile.company_id : profile?.id);

    switch (currentScreen) {
      case 'home':
        if (profile?.role === 'admin') return <AdminDashboard onNavigate={handleNavigate} />;
        if (profile?.role === 'tecnico') return (
          <TechnicianDashboard
            onStartInspection={() => handleNavigate('nueva-inspeccion')}
            onNavigate={handleNavigate}
            onNavigateAlerts={(type) => {
              setAlertType(type);
              handleNavigate('alertas');
            }}
          />
        );
        return (
          <Dashboard
            onStartInspection={() => handleNavigate('nueva-inspeccion')}
            onNavigate={handleNavigate}
            onViewAsset={(id) => handleNavigate('equipos', id, true)}
            onNavigateAlerts={(type) => {
              setAlertType(type);
              handleNavigate('alertas');
            }}
            companyId={effectiveCompanyId}
          />
        );
      case 'mapa':
        return <MapScreen onStartInspection={() => handleNavigate('nueva-inspeccion')} companyId={effectiveCompanyId} />;
      case 'ajustes':
        return <AjustesScreen onNavigate={handleNavigate} currentScreen={currentScreen} />;
      case 'reportes':
        return <ReportesScreen companyId={effectiveCompanyId} />;
      case 'usuarios':
        if (profile?.role === 'admin') return <UsuariosScreen />;
        if (profile?.role === 'tecnico') return (
          <TechnicianDashboard
            onStartInspection={() => handleNavigate('nueva-inspeccion')}
            onNavigate={handleNavigate}
            onNavigateAlerts={(type) => {
              setAlertType(type);
              handleNavigate('alertas');
            }}
          />
        );
        return (
          <Dashboard
            onStartInspection={() => handleNavigate('nueva-inspeccion')}
            onNavigate={handleNavigate}
            onViewAsset={(id) => handleNavigate('equipos', id, true)}
            onNavigateAlerts={(type) => {
              setAlertType(type);
              handleNavigate('alertas');
            }}
            companyId={effectiveCompanyId}
          />
        );
      case 'clientes':
        return <ClientesScreen companyId={effectiveCompanyId} />;
      case 'tecnicos':
        return (profile?.role === 'admin' || profile?.role === 'empresa') ? (
          <TecnicosScreen companyId={effectiveCompanyId || ''} />
        ) : <Dashboard onStartInspection={() => handleNavigate('nueva-inspeccion')} onNavigate={handleNavigate} onViewAsset={(id) => handleNavigate('equipos', id, true)} onNavigateAlerts={(type) => { setAlertType(type); handleNavigate('alertas'); }} companyId={effectiveCompanyId} />;
      case 'facturacion':
        return <FacturacionScreen />;
      case 'inspecciones':
        return <InspeccionesScreen />;
      case 'alertas':
        return (
          <AlertasScreen
            onViewAsset={(id) => {
              setViewAssetId(id);
              handleNavigate('equipos', id, true);
            }}
            type={alertType}
            companyId={effectiveCompanyId || ''}
            onAction={(id) => handleNavigate('equipos', id, true)}
            onBack={() => handleNavigate('home')}
            profile={profile}
          />
        );
      case 'equipos':
        return (
          <EquiposScreen
            initialAssetId={viewAssetId || selectedAssetId}
            companyId={effectiveCompanyId}
            onClearInitialId={() => {
              setSelectedAssetId(null);
              setViewAssetId(null);
            }}
          />
        );
      case 'nueva-inspeccion':
        return (
          <InspectionScreen
            onBack={() => {
              setSelectedAssetId(null);
              handleNavigate('home');
            }}
            assetId={selectedAssetId}
            userCompanyId={effectiveCompanyId}
            userRole={profile?.role}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-3xl border border-white/10">
            <span className="material-symbols-outlined text-6xl text-slate-500 mb-4 animate-bounce">construction</span>
            <h2 className="text-2xl font-black text-white mb-2">Pantalla en Construcción</h2>
            <p className="text-slate-400 text-center max-w-xs">Esta función está siendo optimizada para su despliegue en la plataforma.</p>
            <button
              onClick={() => handleNavigate('home')}
              className="mt-6 text-primary font-bold border border-primary/20 px-4 py-2 rounded-lg hover:bg-primary/5 transition-all"
            >
              Volver al Inicio
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary/30">
      {showSplash && (
        <SplashScreen
          isLoggedIn={!!session}
          onComplete={() => setShowSplash(false)}
        />
      )}

      {!session ? (
        <div className={`transition-opacity duration-1000 ${showSplash ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <LoginScreen onLoginSuccess={() => { }} />
        </div>
      ) : (
        <div className={`flex h-screen overflow-hidden transition-opacity duration-1000 ${showSplash ? 'opacity-0 blur-lg' : 'opacity-100 blur-0'}`}>
          {/* Sidebar for Desktop */}
          <div className="hidden lg:block w-20 shrink-0 transition-all duration-300">
            <Sidebar
              currentScreen={currentScreen}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              role={profile?.role || 'empresa'}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* Sidebar for Mobile */}
          <div className="lg:hidden">
            <Sidebar
              currentScreen={currentScreen}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              role={profile?.role || 'empresa'}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
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
                  onMenuClick={() => setSidebarOpen(true)}
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

            <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative no-scrollbar bg-background-dark/30">
              <div className="w-full max-w-7xl mx-auto p-3 sm:p-4 lg:p-8 pb-40 lg:pb-12 animate-fadeIn transition-all duration-700">
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
      )}
    </div>
  );
};

export default App;
