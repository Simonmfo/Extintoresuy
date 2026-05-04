import type { FC } from 'react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-black overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 backdrop-blur-md bg-background-dark/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-background-dark font-bold">fire_extinguisher</span>
            </div>
            <span className="text-2xl font-black tracking-tight">extintores<span className="text-primary">.uy</span></span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#solucion" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Solución</a>
            <a href="#beneficios" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">Beneficios</a>
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
      <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-hidden px-6">
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
              Plataforma N°1 en Uruguay
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight">
              Gestión inteligente de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">extintores</span> y normativas.
            </h1>
            <p className="text-lg lg:text-xl text-slate-400 leading-relaxed max-w-xl">
              Digitalizá el control, mantenimiento e inspecciones de tus equipos. Asegurá el cumplimiento con la DNB y optimizá el trabajo de tus técnicos en campo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button onClick={onLogin} className="px-8 py-4 rounded-full bg-primary hover:bg-green-400 text-background-dark font-bold text-lg transition-all duration-300 shadow-[0_0_30px_rgba(19,236,91,0.3)] hover:shadow-[0_0_40px_rgba(19,236,91,0.5)] transform hover:-translate-y-1">
                Comenzar ahora
              </button>
              <button className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-all duration-300 backdrop-blur-sm">
                Agendar Demo
              </button>
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
              <div className="absolute bottom-8 left-8 bg-background-dark/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Equipos inspeccionados</p>
                  <p className="text-xl font-bold text-white">+10.000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="solucion" className="py-24 bg-black/20 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl lg:text-5xl font-black mb-6">Todo bajo control en la palma de tu mano</h2>
            <p className="text-slate-400 text-lg">Nuestra plataforma integra un panel de control avanzado para administradores y una app móvil intuitiva para técnicos en el lugar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-3xl">qr_code_scanner</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Escaneo QR</h3>
              <p className="text-slate-400 leading-relaxed">Cada extintor cuenta con un código QR único. Escanealo para acceder a su historial completo, próximos mantenimientos y ubicación exacta.</p>
            </div>

            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-blue-400 text-3xl">notifications_active</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Alertas Automáticas</h3>
              <p className="text-slate-400 leading-relaxed">Olvidate de las planillas de cálculo. El sistema te avisa antes de que un equipo venza o requiera mantenimiento preventivo.</p>
            </div>

            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-purple-400 text-3xl">description</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Reportes DNB</h3>
              <p className="text-slate-400 leading-relaxed">Generá certificados y reportes de cumplimiento listos para presentar ante la Dirección Nacional de Bomberos en un solo clic.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          
          <h2 className="text-4xl lg:text-6xl font-black mb-6 relative z-10">¿Listo para modernizar tu gestión?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto relative z-10">Unite a las empresas líderes que ya confían en extintores.uy para mantener sus instalaciones seguras y en regla.</p>
          
          <button onClick={onLogin} className="relative z-10 px-10 py-5 rounded-full bg-white text-background-dark font-black text-lg transition-all duration-300 hover:scale-105 shadow-xl flex items-center justify-center gap-3 mx-auto group">
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
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Soporte</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Términos</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
