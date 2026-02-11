
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';

const UsuariosScreen: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const data = await db.getAllProfiles();
        setUsers(data);
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        const ok = await db.updateProfile(userId, { role: newRole });
        if (ok) loadUsers();
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary !text-4xl">manage_accounts</span>
                    Gestión de Usuarios
                </h1>
                <p className="text-slate-400 text-sm mt-1">Control de acceso y roles para todos los usuarios de la plataforma.</p>
            </div>

            <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-auto h-full custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-6">Nombre / Email</th>
                                    <th className="p-6">Empresa Asoc.</th>
                                    <th className="p-6">Rol Actual</th>
                                    <th className="p-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6">
                                            <p className="font-bold text-white">{user.full_name || 'Sin nombre'}</p>
                                            <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-sm text-slate-300 font-medium">
                                                {user.clients?.name || 'Acceso Global'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    user.role === 'tecnico' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                        'bg-primary/10 text-primary border-primary/20'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-primary"
                                            >
                                                <option value="empresa">Empresa</option>
                                                <option value="tecnico">Técnico</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsuariosScreen;
