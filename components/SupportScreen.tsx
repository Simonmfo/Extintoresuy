import type { FC } from 'react';

interface SupportScreenProps {
  onBack: () => void;
}

const SupportScreen: FC<SupportScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-background-dark text-white p-6 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto pt-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-10">
          <span className="material-symbols-outlined">arrow_back</span>
          Volver al Inicio
        </button>

        <h1 className="text-4xl md:text-5xl font-black mb-4">Centro de Soporte</h1>
        <p className="text-xl text-slate-400 mb-12">Estamos aquí para ayudarte a sacar el máximo provecho a Extintores.uy</p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <span className="material-symbols-outlined text-primary !text-4xl mb-4">chat</span>
            <h3 className="text-xl font-bold mb-2">Chat en Vivo</h3>
            <p className="text-slate-400 mb-6">Habla directamente con un asesor técnico de nuestro equipo de soporte.</p>
            <button className="bg-primary text-background-dark px-6 py-2 rounded-full font-bold w-full hover:bg-green-400 transition-colors">
              Iniciar Chat
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <span className="material-symbols-outlined text-blue-400 !text-4xl mb-4">mail</span>
            <h3 className="text-xl font-bold mb-2">Correo Electrónico</h3>
            <p className="text-slate-400 mb-6">Envíanos un detalle de tu problema y te responderemos en menos de 24 horas.</p>
            <a href="mailto:soporte@extintores.uy" className="flex items-center justify-center bg-white/10 text-white border border-white/10 px-6 py-2 rounded-full font-bold w-full hover:bg-white/20 transition-colors">
              soporte@extintores.uy
            </a>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Documentación Rápida</h2>
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
            <span className="font-medium">¿Cómo registro un nuevo extintor en el panel?</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
            <span className="font-medium">¿Qué significa el estado "Peligro" en una inspección?</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
            <span className="font-medium">Pasos para generar un reporte para la DNB</span>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportScreen;
