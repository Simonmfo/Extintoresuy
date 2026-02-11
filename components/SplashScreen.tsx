
import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [animationStage, setAnimationStage] = useState(0); // 0: Start, 1: Spray, 2: Move & Logo, 3: FadeOut

    useEffect(() => {
        // Stage 1: Initial Delay then Spray
        const sprayTimer = setTimeout(() => setAnimationStage(1), 500);

        // Stage 2: Move left and show text
        const logoTimer = setTimeout(() => setAnimationStage(2), 2000);

        // Stage 3: Fade out splash
        const fadeTimer = setTimeout(() => setAnimationStage(3), 4000);

        // Finish
        const completeTimer = setTimeout(() => onComplete(), 4500);

        return () => {
            clearTimeout(sprayTimer);
            clearTimeout(logoTimer);
            clearTimeout(fadeTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete]);

    return (
        <div className={`fixed inset-0 z-[99999] bg-[#102216] flex items-center justify-center transition-opacity duration-500 ${animationStage === 3 ? 'opacity-0' : 'opacity-100'}`}>
            <style>{`
                @keyframes smokePrimary {
                    0% { transform: scale(0.5) translate(0, 0); opacity: 0; }
                    20% { opacity: 0.8; }
                    100% { transform: scale(2.5) translate(100px, -20px); opacity: 0; }
                }
                @keyframes smokeSecondary {
                    0% { transform: scale(0.3) translate(0, 0); opacity: 0; }
                    30% { opacity: 0.6; }
                    100% { transform: scale(2) translate(80px, 20px); opacity: 0; }
                }
                @keyframes shake {
                    0%, 100% { transform: rotate(-5deg); }
                    50% { transform: rotate(5deg); }
                }
                .particle {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    filter: blur(8px);
                    opacity: 0;
                }
            `}</style>

            <div className={`relative flex items-center transition-all duration-1000 ease-in-out ${animationStage >= 2 ? '-translate-x-12 sm:-translate-x-20' : 'translate-x-0'}`}>
                {/* Extinguisher Icon */}
                <div className={`relative z-10 transition-transform duration-700 ${animationStage === 1 ? 'scale-110' : 'scale-100'}`}>
                    <div className={`${animationStage === 1 ? 'animate-[shake_0.2s_infinite]' : ''}`}>
                        <span className="material-symbols-outlined !text-7xl sm:!text-9xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            fire_extinguisher
                        </span>
                    </div>

                    {/* Smoke/Powder Particles */}
                    {animationStage === 1 && (
                        <div className="absolute top-1/2 left-3/4 w-40 h-20 -translate-y-1/2 pointer-events-none">
                            {[...Array(15)].map((_, i) => (
                                <div
                                    key={i}
                                    className="particle"
                                    style={{
                                        width: Math.random() * 30 + 10 + 'px',
                                        height: Math.random() * 30 + 10 + 'px',
                                        animation: `${i % 2 === 0 ? 'smokePrimary' : 'smokeSecondary'} ${Math.random() * 0.8 + 0.5}s infinite`,
                                        animationDelay: Math.random() * 0.5 + 's',
                                        left: '0px',
                                        top: Math.random() * 40 - 20 + 'px'
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Logo and Slogan */}
                <div className={`ml-6 sm:ml-10 transition-all duration-1000 ${animationStage >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                    <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter italic">
                        Extintor<span className="text-primary font-black">uy</span>
                    </h1>
                    <div className="overflow-hidden h-6 mt-1">
                        <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] text-primary transition-transform duration-700 delay-500 ${animationStage >= 2 ? 'translate-y-0' : 'translate-y-full'}`}>
                            Logística & Seguridad 4.0
                        </p>
                    </div>
                </div>
            </div>

            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-emerald-600/5 rounded-full blur-[100px] animate-pulse"></div>
            </div>
        </div>
    );
};

export default SplashScreen;
