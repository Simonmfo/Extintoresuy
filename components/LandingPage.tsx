import type { FC } from 'react';

interface LandingPageProps {
  onLogin: () => void;
  onNavigateTo: (page: 'soporte' | 'terminos' | 'privacidad') => void;
}

const LandingPage: FC<LandingPageProps> = ({ onLogin, onNavigateTo }) => {
  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-black overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 backdrop-blur-md bg-background-dark/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-background-dark font-bold">fire_extinguisher</span>
            </div>
            <span className="text-2xl font-black tracking-tight">extintores<span className="text-primary">.uy</span></span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#solucion" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Solución</a>
            <a href="#como-funciona" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Cómo Funciona</a>
            <a href="#beneficios" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Beneficios</a>
            <a href="#faq" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">FAQ</a>
            <button 
              onClick={onLogin}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              Iniciar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden px-6">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full opacity-50 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col items-start gap-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Software N°1 de Mantenimiento en Uruguay
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight">
              Gestión inteligente de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">extintores</span> y normativas.
            </h1>
            <p className="text-lg lg:text-xl text-slate-400 leading-relaxed max-w-xl">
              Digitalizá el control, mantenimiento e inspecciones de tus equipos contra incendios. Asegurá el cumplimiento ante la DNB y optimizá el trabajo de tus técnicos en terreno.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button onClick={onLogin} className="px-8 py-4 rounded-full bg-primary hover:bg-green-400 text-background-dark font-bold text-lg transition-all duration-300 shadow-[0_0_30px_rgba(19,236,91,0.3)] hover:shadow-[0_0_40px_rgba(19,236,91,0.5)] transform hover:-translate-y-1">
                Comenzar ahora
              </button>
              <button className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-all duration-300 backdrop-blur-sm">
                Agendar Demo
              </button>
            </div>
            
            <div className="pt-8 border-t border-white/10 w-full flex items-center gap-8">
              <div>
                <p className="text-3xl font-black text-white">+10k</p>
                <p className="text-sm text-slate-500">Equipos Activos</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">100%</p>
                <p className="text-sm text-slate-500">Cumplimiento Legal</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">24/7</p>
                <p className="text-sm text-slate-500">Monitoreo</p>
              </div>
            </div>
          </div>
          
          <div className="relative mx-auto lg:mx-0 w-full max-w-[400px] lg:max-w-none">
            <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 backdrop-blur-xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              <img 
                src="/hero-image.png" 
                alt="Extintor con código QR para inspección digital" 
                className="rounded-2xl w-full h-[500px] object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
              />
              {/* Floating Badge */}
              <div className="absolute bottom-8 left-8 bg-background-dark/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-xl animate-bounce">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Escaneo exitoso</p>
                  <p className="text-lg font-bold text-white">Equipo Aprobado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-12 border-y border-white/5 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-around items-center text-center gap-8">
          <div>
            <h3 className="text-4xl font-black text-primary mb-2">99%</h3>
            <p className="text-slate-400 font-medium uppercase tracking-wider text-sm">Reducción en tiempos de auditoría</p>
          </div>
          <div className="hidden md:block w-px h-16 bg-white/10"></div>
          <div>
            <h3 className="text-4xl font-black text-primary mb-2">0</h3>
            <p className="text-slate-400 font-medium uppercase tracking-wider text-sm">Multas por vencimientos</p>
          </div>
        </div>
      </section>

      {/* Solución Section */}
      <section id="solucion" className="py-24 px-6 relative">
        <div className="absolute left-0 top-1/3 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">La Solución Integral</span>
            <h2 className="text-4xl lg:text-5xl font-black mb-6">Todo bajo control en la palma de tu mano</h2>
            <p className="text-slate-400 text-lg">Nuestra plataforma conecta un panel administrativo central con una aplicación móvil intuitiva, eliminando el papel y los errores humanos.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-3xl">qr_code_scanner</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Etiquetas QR Únicas</h3>
              <p className="text-slate-400 leading-relaxed">Cada extintor o manguera de incendio es identificado de forma única. Los técnicos y supervisores solo necesitan escanear el QR para acceder al historial técnico al instante.</p>
            </div>

            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-blue-400 text-3xl">notifications_active</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Alertas Predictivas</h3>
              <p className="text-slate-400 leading-relaxed">No dependas más de planillas de cálculo olvidadas. El software envía notificaciones automáticas previas a vencimientos de recargas y pruebas hidráulicas.</p>
            </div>

            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-purple-400 text-3xl">description</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Reportes DNB Oficiales</h3>
              <p className="text-slate-400 leading-relaxed">Generá los certificados requeridos por la Dirección Nacional de Bomberos en un clic. Auditorías 100% transparentes, exportables y siempre listas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-24 bg-black/40 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">Proceso Simple</span>
            <h2 className="text-4xl lg:text-5xl font-black mb-6">¿Cómo funciona Extintores.uy?</h2>
            <p className="text-slate-400 text-lg">Hemos diseñado un flujo de trabajo que no interrumpe tus operaciones diarias, sino que las agiliza por completo.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative">
              <div className="text-7xl font-black text-white/5 absolute -top-8 -left-4 z-0 pointer-events-none">1</div>
              <div className="relative z-10">
                <span className="material-symbols-outlined text-4xl text-primary mb-4">inventory</span>
                <h3 className="text-xl font-bold mb-3">Relevamiento</h3>
                <p className="text-slate-400">Registramos todos tus equipos y activos de seguridad en la plataforma web.</p>
              </div>
            </div>
            <div className="relative">
              <div className="text-7xl font-black text-white/5 absolute -top-8 -left-4 z-0 pointer-events-none">2</div>
              <div className="relative z-10">
                <span className="material-symbols-outlined text-4xl text-primary mb-4">sticky_note_2</span>
                <h3 className="text-xl font-bold mb-3">Etiquetado QR</h3>
                <p className="text-slate-400">Pegamos stickers resistentes e ignífugos en cada extintor o manguera.</p>
              </div>
            </div>
            <div className="relative">
              <div className="text-7xl font-black text-white/5 absolute -top-8 -left-4 z-0 pointer-events-none">3</div>
              <div className="relative z-10">
                <span className="material-symbols-outlined text-4xl text-primary mb-4">mobile_friendly</span>
                <h3 className="text-xl font-bold mb-3">Escaneo Mensual</h3>
                <p className="text-slate-400">Tus técnicos utilizan nuestra app para certificar que el equipo está en óptimas condiciones.</p>
              </div>
            </div>
            <div className="relative">
              <div className="text-7xl font-black text-white/5 absolute -top-8 -left-4 z-0 pointer-events-none">4</div>
              <div className="relative z-10">
                <span className="material-symbols-outlined text-4xl text-primary mb-4">analytics</span>
                <h3 className="text-xl font-bold mb-3">Control y Auditoría</h3>
                <p className="text-slate-400">Supervisas desde tu oficina y presentas reportes legales siempre que se requiera.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl mb-4">trending_down</span>
              <h4 className="text-lg font-bold mb-2">Reducción de Costos</h4>
              <p className="text-sm text-slate-400">Evitá multas severas de bomberos e intendencias al mantener todo al día.</p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl mb-4">security</span>
              <h4 className="text-lg font-bold mb-2">Máxima Seguridad</h4>
              <p className="text-sm text-slate-400">Garantizá que tus sistemas funcionen perfectamente ante una emergencia.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl mb-4">schedule</span>
              <h4 className="text-lg font-bold mb-2">Ahorro de Tiempo</h4>
              <p className="text-sm text-slate-400">Reemplazá tediosas planillas Excel por un dashboard automático en tiempo real.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl mb-4">groups</span>
              <h4 className="text-lg font-bold mb-2">Transparencia</h4>
              <p className="text-sm text-slate-400">Todos los empleados pueden leer el QR para saber si un extintor está utilizable.</p>
            </div>
          </div>

          <div>
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-4 block">El Valor Real</span>
            <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">Por qué las empresas eligen nuestra plataforma</h2>
            <p className="text-xl text-slate-400 leading-relaxed mb-8">
              El mantenimiento tradicional de extintores es caótico. Etiquetas de papel borradas, mantenimientos que se olvidan, y multas costosas por incumplimiento en inspecciones de la DNB. 
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                <span className="text-slate-300">Auditoría centralizada para múltiples sucursales u oficinas.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                <span className="text-slate-300">Informes automatizados listos para presentar en inspecciones municipales.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                <span className="text-slate-300">Trazabilidad total: sabe exactamente qué técnico inspeccionó cada equipo.</span>
              </li>
            </ul>
            <button onClick={onLogin} className="mt-10 px-8 py-3 rounded-full bg-white text-black font-bold text-lg hover:bg-primary hover:text-black transition-colors">
              Explorar la Plataforma
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-black/20 border-y border-white/5 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black mb-6">Preguntas Frecuentes</h2>
            <p className="text-slate-400 text-lg">Respondemos las dudas más comunes sobre la implementación del sistema.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <h4 className="text-xl font-bold mb-3">¿Necesito equipamiento especial para escanear los QR?</h4>
              <p className="text-slate-400">No, nuestro sistema está diseñado para que cualquier técnico pueda utilizar la cámara de su smartphone estándar (Android o iOS) instalando nuestra aplicación ligera.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <h4 className="text-xl font-bold mb-3">¿Los reportes son válidos para la Dirección Nacional de Bomberos?</h4>
              <p className="text-slate-400">Sí. Todos los registros y certificados se generan siguiendo las normativas técnicas nacionales y pueden ser exportados firmados digitalmente para presentar en auditorías.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <h4 className="text-xl font-bold mb-3">¿Qué pasa si mi empresa tiene múltiples sucursales?</h4>
              <p className="text-slate-400">La plataforma es escalable. Puedes gestionar infinitas locaciones desde el panel principal, asignando diferentes permisos a gerentes de sucursal y a técnicos de terreno.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          
          <h2 className="text-4xl lg:text-6xl font-black mb-6 relative z-10">¿Listo para modernizar tu gestión?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto relative z-10">Unite a las empresas líderes que ya confían en extintores.uy para mantener sus instalaciones seguras y en regla.</p>
          
          <button onClick={onLogin} className="relative z-10 px-10 py-5 rounded-full bg-primary text-background-dark font-black text-lg transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(19,236,91,0.4)] flex items-center justify-center gap-3 mx-auto group">
            Ingresar a la Plataforma
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 bg-black/40 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">fire_extinguisher</span>
            <span className="font-bold text-lg">extintores<span className="text-primary">.uy</span></span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Extintores.uy. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <button onClick={() => onNavigateTo('soporte')} className="text-slate-500 hover:text-white transition-colors text-sm">Soporte</button>
            <button onClick={() => onNavigateTo('terminos')} className="text-slate-500 hover:text-white transition-colors text-sm">Términos</button>
            <button onClick={() => onNavigateTo('privacidad')} className="text-slate-500 hover:text-white transition-colors text-sm">Privacidad</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
