import { Capacitor } from '@capacitor/core';
import { useState, useEffect, type FC } from 'react';
import { supabase } from './services/supabase';
import { db } from './services/db';
import { Screen, UserProfile, InspectionRecord } from './types';
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
import FabricasScreen from './components/FabricasScreen';
import BajasScreen from './components/BajasScreen';
import MapScreen from './components/MapScreen';
import InspectionScreen from './components/InspectionScreen';
import ValidationScreen from './components/ValidationScreen';
import BottomNav from './components/BottomNav';
import MobileTechnicianLayout from './components/MobileTechnicianLayout';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import SupportScreen from './components/SupportScreen';
import TermsScreen from './components/TermsScreen';
import PrivacyScreen from './components/PrivacyScreen';
import QRScannerModal from './components/QRScannerModal';
import { offlineService } from './services/offline';
import { hasPermission } from './utils/permissions';

const App: FC = () => {
  const isNative = Capacitor.isNativePlatform();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [publicScreen, setPublicScreen] = useState<'landing' | 'login' | 'soporte' | 'terminos' | 'privacidad'>(isNative ? 'login' : 'landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    try {
      const saved = localStorage.getItem('pending_inspections_session');
      console.log('[DEBUG] App currentScreen init - Raw localStorage:', saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('[DEBUG] App currentScreen init - Session active, routing to inspecciones');
          return 'inspecciones';
        }
      }
    } catch (e) {
      console.error('[DEBUG] App currentScreen init - Error reading localStorage:', e);
    }
    return 'home';
  });
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pendingInspections, setPendingInspections] = useState<InspectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pending_inspections_session');
      console.log('[DEBUG] App pendingInspections init - Raw localStorage:', saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          console.log('[DEBUG] App pendingInspections init - Loaded records count:', parsed.length);
          return parsed;
        }
      }
    } catch (e) {
      console.error('[DEBUG] App pendingInspections init - Error parsing localStorage:', e);
    }
    return [];
  });
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    try {
      console.log('[DEBUG] App pendingInspections state changed. Saving to localStorage. Count:', pendingInspections.length);
      localStorage.setItem('pending_inspections_session', JSON.stringify(pendingInspections));
    } catch (e) {
      console.error('[DEBUG] App pendingInspections useEffect - Error writing to localStorage:', e);
    }
  }, [pendingInspections]);

  const handleScan = async (decodedText: string) => {
    if (!hasPermission(profile, 'inspecciones', 'write')) {
      alert('Error: No tienes permisos para registrar o modificar inspecciones.');
      setIsScannerOpen(false);
      return;
    }
    let assetId = decodedText;
    
    // Check if it's a JSON string (like {"id":"..."})
    if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
      try {
        const parsed = JSON.parse(decodedText);
        if (parsed.id) assetId = parsed.id;
      } catch (e) {
        console.error('Error parsing QR JSON:', e);
      }
    }

    if (decodedText.includes('asset/')) {
      assetId = decodedText.split('asset/')[1];
    }

    // Check if asset belongs to technician's company
    const asset = await db.getAsset(assetId);
    
    // SECURITY: Allow scanning if:
    // 1. User is Admin
    // 2. User is Fabrica (they should have access to their own clients' assets)
    // 3. User is Tecnico and works for the owner of the client
    const isOwner = asset && (
      profile?.role === 'admin' || 
      profile?.role === 'fabrica' || 
      asset.companyId === profile?.id || 
      asset.companyId === profile?.company_id || 
      !profile?.company_id 
    );

    if (!asset || !isOwner) {
      const debugMsg = asset 
        ? `Permisos denegados para el rol "${profile?.role}".\nID Usuario: ${profile?.id}\nID Empresa: ${profile?.company_id}\nDueño Equipo: ${asset.companyId}`
        : `El equipo no existe en la base de datos.\nTexto escaneado: "${assetId}"`;
      
      alert(`No se puede escanear:\n\n${debugMsg}`);
      setIsScannerOpen(false);
      return;
    }

    // Prevent duplicate scans in the same session
    const alreadyInspected = pendingInspections.some(insp => insp.assetId === assetId);
    if (alreadyInspected) {
      alert('Este equipo ya fue inspeccionado en esta sesión.');
      setIsScannerOpen(false);
      return;
    }

    setIsScannerOpen(false);
    handleStartInspection(assetId);
  };

  useEffect(() => {
    let mounted = true;

    const timer = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 2000);

    // Initialize offline sync
    offlineService.initAutoSync((results) => {
      console.log('Sincronización completada:', results);
    });

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
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
        if (mounted) setIsLoading(false);
      }
    }).catch(() => {
      if (mounted) setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        // Use setTimeout to escape the internal GoTrue lock and prevent deadlocks
        setTimeout(async () => {
          try {
            const userProfile = await db.getProfile(session.user.id);
            if (mounted) {
              setProfile(userProfile as UserProfile);
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error("Error on auth state change:", error);
          } finally {
            if (mounted) setIsLoading(false);
          }
        }, 0);
      } else {
        setProfile(null);
        setIsAuthenticated(false);
        if (mounted) setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const companyId = profile?.role === 'admin' ? 'ALL' : profile?.role === 'fabrica' ? profile.id : (profile?.company_id || 'ALL');

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRefreshProfile = async () => {
    if (profile?.id) {
      const userProfile = await db.getProfile(profile.id);
      setProfile(userProfile as UserProfile);
    }
  };

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleStartInspection = (assetId: string) => {
    if (!hasPermission(profile, 'inspecciones', 'write')) {
      alert('Error: No tienes permisos para registrar o modificar inspecciones.');
      return;
    }
    setSelectedAssetId(assetId);
    setCurrentScreen('inspeccion');
  };

  const handleSaveInspection = (record: InspectionRecord) => {
    setPendingInspections(prev => [...prev, record]);
    setCurrentScreen('inspecciones');
    setSelectedAssetId(null);
  };

  const handleRemovePendingInspection = (assetId: string) => {
    setPendingInspections(prev => prev.filter(insp => insp.assetId !== assetId));
  };

  const handleCancelSession = () => {
    if (confirm('¿Estás seguro de cancelar la inspección? Se perderán todos los equipos escaneados en esta sesión.')) {
      setPendingInspections([]);
    }
  };

  const handleFinalizeSession = async (signerData: { name: string, document: string, signatureUrl: string }) => {
    setIsLoading(true);
    try {
      // Update all pending inspections with the signature data
      const finalInspections = pendingInspections.map(insp => ({
        ...insp,
        signerName: signerData.name,
        signerDocument: signerData.document,
        signatureUrl: signerData.signatureUrl
      }));

      const online = await offlineService.isOnline();
      if (online) {
        // Send all to DB
        for (const record of finalInspections) {
          await db.addInspection(record);
        }
        alert('Todas las inspecciones han sido guardadas y firmadas.');
      } else {
        // Save to offline queue
        for (const record of finalInspections) {
          await offlineService.saveToQueue(record);
        }
        alert('Sin conexión: Las inspecciones se guardaron localmente y se sincronizarán al recuperar conexión.');
      }

      setPendingInspections([]);
      setCurrentScreen('home');
    } catch (error) {
      console.error('Error finalizando sesión:', error);
      alert('Error al guardar la sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderScreen = () => {
    const bypassScreens = ['home', 'ajustes', 'inspeccion', 'validacion'];
    if (!bypassScreens.includes(currentScreen) && !hasPermission(profile, currentScreen, 'read')) {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 p-4">
          <span className="material-symbols-outlined text-6xl mb-4 text-red-500">gavel</span>
          <h2 className="text-xl font-bold uppercase tracking-widest text-red-500">Acceso Denegado</h2>
          <p className="text-slate-400 text-sm mt-2 text-center">No tienes los permisos requeridos para acceder a este módulo.</p>
          <button
            onClick={() => handleNavigate('home')}
            className="mt-6 text-primary font-bold border border-primary/20 px-6 py-2.5 rounded-xl uppercase tracking-wider text-xs bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
          >
            Volver al Inicio
          </button>
        </div>
      );
    }

    switch (currentScreen) {
      case 'home':
        return (
          <>
            <div className="hidden lg:block h-full">
              <AdminDashboard 
                onNavigate={handleNavigate} 
                onStartInspection={() => setIsScannerOpen(true)} 
                companyId={companyId} 
                profile={profile}
              />
            </div>
            <div className="block lg:hidden h-full">
              <Dashboard 
                onStartInspection={() => setIsScannerOpen(true)} 
                onNavigate={handleNavigate} 
                pendingCount={pendingInspections.length} 
                companyId={companyId} 
              />
            </div>
          </>
        );
      case 'usuarios':
        return <UsuariosScreen profile={profile} readOnly={!hasPermission(profile, 'usuarios', 'write')} />;
      case 'clientes':
        return <ClientesScreen companyId={companyId} profile={profile} readOnly={!hasPermission(profile, 'clientes', 'write')} />;
      case 'facturacion':
        return <FacturacionScreen companyId={companyId} profile={profile} />;
      case 'reportes':
        return <ReportesScreen companyId={companyId} profile={profile} />;
      case 'equipos':
        return <EquiposScreen companyId={companyId} readOnly={!hasPermission(profile, 'equipos', 'write')} />;
      case 'tecnicos':
        return <TecnicosScreen companyId={companyId} readOnly={!hasPermission(profile, 'tecnicos', 'write')} />;
      case 'ajustes':
        return <AjustesScreen profile={profile} onLogout={handleLogout} onRefreshProfile={handleRefreshProfile} />;
      case 'fabricas':
        return <FabricasScreen />;
      case 'bajas':
        return <BajasScreen companyId={companyId} profile={profile} />;
      case 'inspecciones':
        return (
          <InspeccionesScreen 
            onBack={() => setCurrentScreen('home')} 
            profile={profile} 
            onStartInspection={() => setIsScannerOpen(true)} 
            pendingInspections={pendingInspections}
            onFinalize={() => setCurrentScreen('validacion')}
            onRemoveInspection={handleRemovePendingInspection}
            onCancelSession={handleCancelSession}
          />
        );
      case 'mapa':
        return <MapScreen onStartInspection={() => handleStartInspection('#UY-9921-24')} companyId={companyId} />;
      case 'inspeccion':
        return <InspectionScreen onBack={() => setCurrentScreen('home')} onSave={handleSaveInspection} assetId={selectedAssetId || ''} />;
      case 'validacion':
        return <ValidationScreen onBack={() => setCurrentScreen('home')} onFinalize={handleFinalizeSession} inspectionCount={pendingInspections.length} />;
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
    if (isNative) {
      return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
    }
    switch (publicScreen) {
      case 'login':
        return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
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

  // Native Technician Flow - COMPLETELY SEPARATE FROM WEB UI
  if (isNative && profile?.role === 'tecnico') {
    return (
      <MobileTechnicianLayout 
        profile={profile}
        onLogout={handleLogout}
        pendingInspections={pendingInspections}
        setPendingInspections={setPendingInspections}
        onFinalize={handleFinalizeSession}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans flex flex-col lg:flex-row">
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
      {/* Sidebar (Fixed/Hidden on mobile) */}
      {currentScreen !== 'inspeccion' && currentScreen !== 'mapa' && (
        <Sidebar 
          currentScreen={currentScreen} 
          onNavigate={handleNavigate} 
          onLogout={handleLogout}
          role={profile?.role || 'admin'}
          fullName={profile?.full_name || 'Administrador'}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          profile={profile}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${currentScreen !== 'inspeccion' ? 'lg:pl-20' : ''}`}>
        {currentScreen !== 'inspeccion' && currentScreen !== 'mapa' && (
          <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
          </div>
        )}

        {/* Desktop Topbar */}
        {currentScreen !== 'inspeccion' && currentScreen !== 'mapa' && (
          <header className="hidden lg:flex items-center justify-between p-6 bg-background-dark/80 backdrop-blur-md sticky top-0 z-40 border-b border-white/5">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Extintor.uy</h1>
              <p className="text-sm font-medium text-slate-400">Plataforma de Mantenimiento</p>
            </div>
            <div className="flex gap-3">
            </div>
          </header>
        )}

        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          <div className={`min-h-full ${currentScreen !== 'inspeccion' && currentScreen !== 'mapa' ? 'pt-16 lg:pt-0 pb-20 lg:pb-8' : ''}`}>
            {renderScreen()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {currentScreen !== 'inspeccion' && currentScreen !== 'mapa' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} role={profile?.role || 'admin'} profile={profile} />
        </div>
      )}
    </div>
  );
};

export default App;
