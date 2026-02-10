
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface LoginScreenProps {
    onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                // Auto login after signup might not work if email confirmation is on, but for dev it's often off or we just tell them to check email.
                // Supabase returns a session on signup if email confirmation is disabled.
                alert('Registro exitoso. Por favor revisa tu email si es necesario o inicia sesión.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onLoginSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Ha ocurrido un error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark flex relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background-dark to-background-dark opacity-40"></div>
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary/10 via-background-dark to-transparent opacity-30"></div>
            </div>

            {/* Left Column - Brand (Visible on Desktop) */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative z-10 border-r border-white/5 bg-black/20 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                            <span className="material-symbols-outlined !text-3xl">fire_extinguisher</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">Extintoruy Plataforma Empresa</span>
                    </div>
                </div>

                <div className="max-w-md">
                    <h2 className="text-5xl font-black text-white mb-6 leading-tight">
                        Gestión Inteligente de <span className="text-primary">Seguridad Industrial</span>
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed mb-8">
                        Plataforma integral para cumplimiento normativo, inspecciones digitales y monitoreo en tiempo real de activos contra incendios.
                    </p>

                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1">
                            <span className="material-symbols-outlined text-primary mb-2">verified_user</span>
                            <p className="text-sm font-bold text-white">Cumplimiento 100%</p>
                            <p className="text-xs text-slate-500">Normativa vigente</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1">
                            <span className="material-symbols-outlined text-primary mb-2">cloud_sync</span>
                            <p className="text-sm font-bold text-white">Sincronización</p>
                            <p className="text-xs text-slate-500">Tiempo real</p>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-slate-600 font-medium">
                    © 2026 ExtintorUY Plataforma Empresa. Todos los derechos reservados.
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl shadow-black/50">
                    <div className="text-center mb-10 lg:hidden">
                        <span className="material-symbols-outlined text-6xl text-primary mb-4">local_fire_department</span>
                        <h1 className="text-3xl font-bold text-white">ExtintorUY</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Bienvenido de nuevo</h2>
                        <p className="text-slate-400 text-sm">Ingresa tus credenciales para acceder al panel de control.</p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Corporativo</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-3.5 material-symbols-outlined text-slate-500 group-focus-within:text-primary transition-colors text-xl">mail</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="nombre@empresa.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-3.5 material-symbols-outlined text-slate-500 group-focus-within:text-primary transition-colors text-xl">lock</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-status-red/10 border border-status-red/20 text-status-red text-xs font-medium p-3 rounded-xl flex items-center gap-2 animate-pulse">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-green-400 text-background-dark font-black text-sm uppercase tracking-wide py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20 hover:shadow-primary/40 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                isSignUp ? 'Crear Cuenta' : 'Acceder al Sistema'
                            )}
                        </button>

                        <div className="text-center pt-4">
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-slate-400 hover:text-white text-xs font-medium transition-colors border-b border-transparent hover:border-white/20 pb-0.5"
                            >
                                {isSignUp ? '¿Ya tienes acceso? Inicia sesión' : '¿Nuevo usuario? Solicitar acceso'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
