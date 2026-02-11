
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
    onComplete: () => void;
    isLoggedIn?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isLoggedIn = false }) => {
    const [stage, setStage] = useState(0);
    // 0: Init
    // 1: Shoot (Powder)
    // 2: Reveal Text
    // 3: Exit

    const duration = isLoggedIn ? 5000 : 10000;

    useEffect(() => {
        // Core Animation Stages
        const t1 = setTimeout(() => setStage(1), 400);  // Start shooting
        const t2 = setTimeout(() => setStage(2), 1800); // Reveal Text

        // Final exit based on the requested duration
        // We start the fade out (Stage 3) slightly before the total duration
        const t3 = setTimeout(() => setStage(3), duration - 600);
        const t4 = setTimeout(onComplete, duration);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
        };
    }, [duration, onComplete]);

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center bg-[#0a150e] transition-opacity duration-500 ease-in-out`}
            style={{
                zIndex: 99999,
                opacity: stage === 3 ? 0 : 1,
                pointerEvents: stage === 3 ? 'none' : 'auto'
            }}
        >
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-5deg); }
                    75% { transform: rotate(5deg); }
                }
                @keyframes spray {
                    0% { transform: translateX(0) scale(0.5); opacity: 0.8; }
                    100% { transform: translateX(200px) scale(3); opacity: 0; }
                }
                .particle {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    filter: blur(2px);
                }
            `}</style>

            <div className="relative flex flex-col items-center justify-center w-full max-w-[90vw]">

                <div className="relative flex items-center justify-center w-full">
                    {/* Extinguisher Container */}
                    <div
                        className={`relative z-20 flex flex-col items-center justify-center transition-all duration-700 ease-out`}
                        style={{
                            transform: stage >= 2 ? 'translateX(-20%)' : 'translateX(0)',
                        }}
                    >
                        <div className={`${stage === 1 ? 'animate-[shake_0.2s_infinite]' : ''} relative`}>
                            <span className="material-symbols-outlined text-[80px] sm:text-[120px] text-white drop-shadow-2xl">
                                fire_extinguisher
                            </span>

                            {stage === 1 && (
                                <div className="absolute top-1/2 right-0 translate-x-4 -translate-y-1/2 w-10 h-10 pointer-events-none">
                                    {[...Array(15)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="particle"
                                            style={{
                                                width: Math.random() * 8 + 4 + 'px',
                                                height: Math.random() * 8 + 4 + 'px',
                                                animation: `spray ${0.4 + Math.random() * 0.4}s linear infinite`,
                                                top: (Math.random() - 0.5) * 30 + 'px',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Text Container */}
                    <div
                        className={`absolute left-1/2 ml-4 flex flex-col items-start transition-all duration-1000 ease-out`}
                        style={{
                            opacity: stage >= 2 ? 1 : 0,
                            transform: stage >= 2 ? 'translateX(-5%)' : 'translateX(10%)',
                            zIndex: 10
                        }}
                    >
                        <h1 className="text-3xl sm:text-5xl font-black text-white italic tracking-tighter leading-none whitespace-nowrap drop-shadow-lg">
                            Extintor<span className="text-primary not-italic">UY</span>
                        </h1>
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary/80 mt-1">
                            Logística & Seguridad
                        </p>
                    </div>
                </div>

                {/* Loading Message */}
                <div className={`mt-12 transition-opacity duration-500 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-[0.4em]">
                            Cargando experiencia...
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
