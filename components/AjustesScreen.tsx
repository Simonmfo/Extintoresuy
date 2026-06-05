
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../services/db';
import { supabase } from '../services/supabase';
import QRCode from "react-qr-code";

interface AjustesScreenProps {
    profile: UserProfile | null;
    onLogout: () => void;
    onRefreshProfile: () => void;
}

const AjustesScreen: React.FC<AjustesScreenProps> = ({ profile, onLogout, onRefreshProfile }) => {
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [botStatus, setBotStatus] = useState<{ status: string, qr: string | null } | null>(null);

    React.useEffect(() => {
        const fetchBotStatus = async () => {
            const { data, error } = await supabase
                .from('bot_status')
                .select('*')
                .eq('id', 'whatsapp-bot')
                .single();
            
            if (!error && data) {
                setBotStatus(data);
            }
        };

        fetchBotStatus();
        const interval = setInterval(fetchBotStatus, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        setLoading(true);
        setMessage(null);

        const success = await db.updateProfile(profile.id, {
            full_name: fullName,
            phone: phone
        });

        if (success) {
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
            onRefreshProfile();
        } else {
            setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
        }
        setLoading(false);
    };

    const handleResetPassword = async () => {
        if (!profile?.email) return;

        setLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
            redirectTo: window.location.origin,
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Se ha enviado un correo para restablecer tu contraseña' });
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">Ajustes</h1>
                    <p className="text-slate-400">Gestiona tu perfil, seguridad y preferencias del sistema.</p>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 rounded-2xl border border-red-500/20 transition-all font-bold text-sm uppercase tracking-wider"
                >
                    <span className="material-symbols-outlined text-xl">logout</span>
                    Cerrar Sesión
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Avatar and Quick Info */}
                <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative z-10">
                            <div className="size-24 rounded-full bg-gradient-to-tr from-primary to-emerald-600 mx-auto p-1 shadow-2xl shadow-primary/20 mb-6">
                                <div className="w-full h-full rounded-full bg-background-dark flex items-center justify-center border-2 border-white/10 overflow-hidden">
                                    <span className="material-symbols-outlined text-4xl text-primary">person</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1">{profile?.full_name || 'Usuario'}</h3>
                            <p className="text-sm text-slate-400 mb-6">{profile?.email}</p>

                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                                <span className="text-[10px] font-black uppercase text-primary tracking-widest">{profile?.role}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4">
                        <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Estado de la cuenta</h4>
                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">verified</span>
                                <span className="text-sm font-medium text-slate-300">Verificada</span>
                            </div>
                            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">security</span>
                                <span className="text-sm font-medium text-slate-300">2FA</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Desactivado</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Detailed Settings */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Feedback Messages */}
                    {message && (
                        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${message.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                            <span className="material-symbols-outlined">
                                {message.type === 'success' ? 'check_circle' : 'error'}
                            </span>
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    {/* Profile Section */}
                    <section className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">person_outline</span>
                                <h2 className="text-lg font-bold text-white">Información del Perfil</h2>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                ID: {profile?.id.substring(0, 8)}...
                            </span>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Grid de Datos Informativos (Read Only) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Rol del Sistema</span>
                                    <span className="text-sm font-bold text-white flex items-center gap-2 capitalize">
                                        <span className={`size-2 rounded-full ${profile?.role === 'admin' ? 'bg-red-500' : 'bg-primary'}`}></span>
                                        {profile?.role}
                                    </span>
                                </div>
                                <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Fecha de Registro</span>
                                    <span className="text-sm font-bold text-white">
                                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No disponible'}
                                    </span>
                                </div>
                                <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">ID de Usuario (Completo)</span>
                                    <code className="text-[10px] font-mono text-slate-400 break-all">{profile?.id}</code>
                                </div>
                                {profile?.company_id && (
                                    <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Empresa Madre / ID</span>
                                        <code className="text-[10px] font-mono text-slate-400 break-all">{profile.company_id}</code>
                                    </div>
                                )}
                            </div>

                            {/* Formulario Editable */}
                            <form onSubmit={handleUpdateProfile} className="space-y-6 pt-4 border-t border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 shadow-inner"
                                            placeholder="Tu nombre completo"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Celular (Para Notificaciones)</label>
                                        <input
                                            type="text"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 shadow-inner"
                                            placeholder="Ej: 099123456"
                                        />
                                    </div>
                                    <div className="space-y-2 opacity-60">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email Principal</label>
                                        <div className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-3.5 text-slate-400 flex items-center justify-between shadow-inner">
                                            <span>{profile?.email}</span>
                                            <span className="material-symbols-outlined text-sm">lock</span>
                                        </div>
                                    </div>
                                </div>

                                 {profile?.role === 'fabrica' && (
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Logo de la Fábrica</label>
                                        <div className="flex items-center gap-6">
                                            <div className="size-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {profile?.logo_url ? (
                                                    <img src={profile.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-3xl text-slate-600">image</span>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file && profile) {
                                                            setLoading(true);
                                                            const fileName = `${profile.id}/logo_${Date.now()}`;
                                                            const { data, error } = await supabase.storage
                                                                .from('logos')
                                                                .upload(fileName, file, { upsert: true });

                                                            if (error) {
                                                                setMessage({ type: 'error', text: 'Error al subir el logo. Asegúrese de que el bucket "logos" existe.' });
                                                            } else {
                                                                const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
                                                                const success = await db.updateProfile(profile.id, { logo_url: publicUrl });
                                                                if (success) {
                                                                    setMessage({ type: 'success', text: 'Logo actualizado' });
                                                                    onRefreshProfile();
                                                                }
                                                            }
                                                            setLoading(false);
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id="logo-upload"
                                                />
                                                <label
                                                    htmlFor="logo-upload"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white cursor-pointer transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-lg">upload</span>
                                                    Subir Nuevo Logo
                                                </label>
                                                <p className="text-[10px] text-slate-500">Recomendado: PNG o JPG, fondo transparente, máx 2MB.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-primary hover:bg-emerald-500 text-background-dark font-black text-sm uppercase tracking-widest px-8 py-4 rounded-2xl transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <span className="size-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin"></span>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-xl">save</span>
                                                Actualizar Perfil
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* Security Section */}
                    <section className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="px-8 py-6 border-b border-white/5 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">shield</span>
                            <h2 className="text-lg font-bold text-white">Seguridad y Acceso</h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-black/20 rounded-3xl border border-white/5">
                                <div className="flex items-start gap-4">
                                    <div className="size-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shrink-0">
                                        <span className="material-symbols-outlined">password</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">Cambiar Contraseña</h3>
                                        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                                            Se enviará un enlace de seguridad a tu correo para que puedas establecer una nueva contraseña.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={loading}
                                    className="whitespace-nowrap bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl border border-white/10 transition-all"
                                >
                                    Restablecer
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-black/20 rounded-3xl border border-white/5 opacity-50">
                                <div className="flex items-start gap-4">
                                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                                        <span className="material-symbols-outlined">api</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white mb-1">Claves de API</h3>
                                        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                                            Genera tokens para integraciones externas con tus servicios de monitoreo.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest py-1 px-3 border border-white/10 rounded-full">Próximamente</span>
                            </div>
                        </div>
                    </section>
                    {/* WhatsApp Bot Section (Only for Admin) */}
                    {profile?.role === 'admin' && (
                        <section className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl mt-8">
                            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">chat</span>
                                    <h2 className="text-lg font-bold text-white">Bot de WhatsApp</h2>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                                    botStatus?.status === 'ready' 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                    : botStatus?.status === 'waiting_qr'
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                    <span className={`size-2 rounded-full ${
                                        botStatus?.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'
                                    } animate-pulse`}></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {botStatus?.status === 'ready' ? 'Conectado' : botStatus?.status === 'waiting_qr' ? 'Esperando QR' : 'Desconectado'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-8 space-y-6">
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    El bot se encarga de enviar avisos automáticos a los clientes 30 días antes del vencimiento de sus equipos.
                                </p>

                                {botStatus?.status === 'waiting_qr' && botStatus.qr && (
                                    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-3xl">
                                        <h3 className="text-background-dark font-black text-center">Escanea para conectar</h3>
                                        <div className="p-4 border-2 border-slate-100 rounded-2xl">
                                            <QRCode value={botStatus.qr} size={200} />
                                        </div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Abre WhatsApp &gt; Dispositivos vinculados</p>
                                    </div>
                                )}

                                {botStatus?.status === 'ready' && (
                                    <div className="flex items-center gap-4 p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                                        <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <span className="material-symbols-outlined">check_circle</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">Bot Vinculado</h3>
                                            <p className="text-xs text-slate-400">El sistema está enviando avisos automáticamente.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Testing Section */}
                            <div className="p-8 border-t border-white/5 bg-white/5 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="material-symbols-outlined text-primary text-sm">science</span>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Área de Pruebas</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Celular de Prueba</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: 099123456"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                                            id="test-phone"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Mensaje</label>
                                        <select 
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                                            id="test-msg-type"
                                        >
                                            <option value="test">Mensaje de Prueba Simple</option>
                                            <option value="vencimiento">Aviso de Vencimiento (Demo)</option>
                                            <option value="bienvenida">Bienvenida al Sistema</option>
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    onClick={async () => {
                                        const phone = (document.getElementById('test-phone') as HTMLInputElement).value;
                                        const type = (document.getElementById('test-msg-type') as HTMLSelectElement).value;
                                        
                                        if (!phone) {
                                            alert('Ingresa un número de celular');
                                            return;
                                        }

                                        let message = '';
                                        if (type === 'test') message = '¡Hola! Este es un mensaje de prueba desde el sistema Extintor.uy. El bot está funcionando correctamente. ✅';
                                        if (type === 'vencimiento') message = '*AVISO DE PRUEBA*\n\nHola, te informamos que tu Extintor ABC de 5kg está próximo a vencer. Por favor contactanos para coordinar la recarga.';
                                        if (type === 'bienvenida') message = 'Bienvenido a *Extintor.uy*. A partir de ahora recibirás avisos automáticos sobre el estado de tus equipos de seguridad.';

                                        const { error } = await supabase.from('bot_commands').insert({
                                            command: 'send_message',
                                            payload: { phone, message }
                                        });

                                        if (error) {
                                            alert('Error al enviar comando: ' + error.message);
                                        } else {
                                            alert('Comando enviado. El bot procesará el mensaje en unos segundos.');
                                        }
                                    }}
                                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-primary transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">send</span>
                                    Enviar Mensaje de Prueba
                                </button>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AjustesScreen;
