
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
    onComplete: () => void;
    isLoggedIn?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, isLoggedIn = false }) => {
    const [stage, setStage] = useState(0);
    // 0: Init
    // 1: Shoot (Powder)
    // 2: Reveal Text & Settle
    // 3: Exit

    const duration = isLoggedIn ? 5000 : 10000;

    useEffect(() => {
        const t1 = setTimeout(() => setStage(1), 400);
        const t2 = setTimeout(() => setStage(2), 2000);
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
                    100% { transform: translateX(150px) scale(3); opacity: 0; }
                }
                .particle {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    filter: blur(2px);
                }
            `}</style>

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                {/* Main Identity Block - Forced absolute center */}
                <div className="flex items-center justify-center transition-all duration-1000 ease-in-out relative z-10">
                    {/* Extinguisher */}
                    <div className="relative z-20 flex items-center justify-center transition-all duration-1000 ease-in-out">
                        <div className={`${stage === 1 ? 'animate-[shake_0.2s_infinite]' : ''} relative`}>
                            <span className="material-symbols-outlined text-[75px] sm:text-[120px] text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                fire_extinguisher
                            </span>

                            {stage === 1 && (
                                <div className="absolute top-1/2 right-0 translate-x-4 -translate-y-1/2 w-10 h-10 pointer-events-none">
                                    {[...Array(15)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="particle"
                                            style={{
                                                width: Math.random() * 6 + 3 + 'px',
                                                height: Math.random() * 6 + 3 + 'px',
                                                animation: `spray ${0.4 + Math.random() * 0.4}s linear infinite`,
                                                top: (Math.random() - 0.5) * 20 + 'px',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Text Container */}
                    <div
                        className="flex flex-col items-start overflow-hidden transition-all duration-1000 ease-in-out"
                        style={{
                            maxWidth: stage >= 2 ? '600px' : '0px',
                            opacity: stage >= 2 ? 1 : 0,
                            marginLeft: stage >= 2 ? '1.5rem' : '0px',
                            transform: stage >= 2 ? 'translateX(0)' : 'translateX(20px)',
                        }}
                    >
                        <h1 className="text-3xl sm:text-6xl font-black text-white italic tracking-tighter leading-none whitespace-nowrap">
                            Extintor<span className="text-primary not-italic">.uy</span>
                        </h1>
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-primary/80 mt-1 whitespace-nowrap">
                            Logística & Seguridad 4.0
                        </p>
                    </div>
                </div>

                {/* Status Message - Positioned absolutely below the center */}
                <div
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-700 delay-500 flex flex-col items-center gap-3"
                    style={{ opacity: stage >= 1 ? 0.3 : 0 }}
                >
                    <div className="flex gap-1.5">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                    </div>
                    <p className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-[0.6em] whitespace-nowrap">
                        Iniciando Sistema
                    </p>
                </div>
            </div>

            {/* Ambient detail to enhance centering */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(10,21,14,0.8)_100%)]"></div>
            </div>
        </div>
    );
};

export default SplashScreen;
