import type { FC } from 'react';

interface TermsScreenProps {
  onBack: () => void;
}

const TermsScreen: FC<TermsScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-background-dark text-white p-6 relative">
      <div className="max-w-4xl mx-auto pt-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-10">
          <span className="material-symbols-outlined">arrow_back</span>
          Volver al Inicio
        </button>

        <h1 className="text-4xl md:text-5xl font-black mb-4">Términos y Condiciones</h1>
        <p className="text-xl text-slate-400 mb-12">Última actualización: Mayo 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Aceptación de los Términos</h2>
            <p className="text-slate-400 leading-relaxed">
              Al acceder y utilizar Extintores.uy, usted acepta estar sujeto a estos términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio. Nuestra plataforma proporciona herramientas de gestión y trazabilidad, pero la responsabilidad legal sobre el estado físico de los equipos recae enteramente en la empresa contratante.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Uso de la Plataforma</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Usted se compromete a utilizar la plataforma únicamente con fines legales y de acuerdo con estos Términos. Queda estrictamente prohibido:
            </p>
            <ul className="list-disc pl-6 text-slate-400 space-y-2">
              <li>Falsificar registros de inspecciones o mantenimientos.</li>
              <li>Compartir credenciales de acceso técnico con personal no autorizado.</li>
              <li>Intentar vulnerar la seguridad del sistema o realizar ingeniería inversa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Responsabilidad Legal</h2>
            <p className="text-slate-400 leading-relaxed">
              Extintores.uy provee el software para facilitar la gestión documental exigida por la Dirección Nacional de Bomberos (DNB). No obstante, no somos responsables por multas, siniestros o clausuras derivadas de negligencia, falta de mantenimiento físico o carga incorrecta de datos por parte de los usuarios en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Cancelación de Servicio</h2>
            <p className="text-slate-400 leading-relaxed">
              Podemos suspender o cancelar su acceso al servicio de forma inmediata, sin previo aviso ni responsabilidad, por cualquier motivo, incluyendo sin limitación el incumplimiento de los Términos o la falta de pago de la suscripción correspondiente.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsScreen;
