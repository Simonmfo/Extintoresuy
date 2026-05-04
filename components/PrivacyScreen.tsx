import type { FC } from 'react';

interface PrivacyScreenProps {
  onBack: () => void;
}

const PrivacyScreen: FC<PrivacyScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-background-dark text-white p-6 relative">
      <div className="max-w-4xl mx-auto pt-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-10">
          <span className="material-symbols-outlined">arrow_back</span>
          Volver al Inicio
        </button>

        <h1 className="text-4xl md:text-5xl font-black mb-4">Políticas de Privacidad</h1>
        <p className="text-xl text-slate-400 mb-12">Cómo protegemos y gestionamos tus datos</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Recopilación de Información</h2>
            <p className="text-slate-400 leading-relaxed">
              Recopilamos información cuando te registras en nuestro sitio, accedes a tu cuenta, realizas inspecciones y/o te desconectas. La información recopilada incluye tu nombre, dirección de correo electrónico, ubicación geográfica (durante las inspecciones) y datos específicos de los equipos contra incendios de tu empresa.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Uso de la Información</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Toda la información que recopilamos puede ser utilizada para:
            </p>
            <ul className="list-disc pl-6 text-slate-400 space-y-2">
              <li>Personalizar tu experiencia y satisfacer tus necesidades individuales.</li>
              <li>Proporcionar contenido personalizado en los reportes de cumplimiento normativo.</li>
              <li>Mejorar nuestra plataforma y atención al cliente.</li>
              <li>Contactarte vía correo electrónico para alertas de vencimientos de equipos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Geolocalización y Datos Móviles</h2>
            <p className="text-slate-400 leading-relaxed">
              La aplicación móvil requiere acceso a la cámara (para escanear códigos QR) y puede requerir ubicación GPS para certificar que el técnico se encuentra físicamente en las instalaciones al momento de realizar la auditoría. Estos datos se utilizan estrictamente para fines de cumplimiento DNB y no son compartidos con terceros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Seguridad de la Información</h2>
            <p className="text-slate-400 leading-relaxed">
              Implementamos una variedad de medidas de seguridad para mantener la seguridad de tu información personal. Utilizamos encriptación de última generación para proteger la información confidencial transmitida en línea (HTTPS). Los servidores que utilizamos para almacenar información de identificación personal se mantienen en un entorno seguro en la nube.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyScreen;
