import React, { useEffect, useState } from 'react';
import { db } from '../services/db';

const UsuariosScreen: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'empresa',
        companyId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [userData, clientData] = await Promise.all([
            db.getAllProfiles(),
            db.getClients('ALL')
        ]);
        setUsers(userData);
        setClients(clientData);
        setLoading(false);
    };

    const handleOpenModal = (user: any = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                fullName: user.full_name || '',
                email: user.email || '',
                password: '', // Don't show password on edit
                role: user.role || 'empresa',
                companyId: user.company_id || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                fullName: '',
                email: '',
                password: '',
                role: 'empresa',
                companyId: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingUser) {
                // Update existing profile
                const ok = await db.updateProfile(editingUser.id, {
                    full_name: formData.fullName,
                    role: formData.role,
                    company_id: formData.role === 'admin' ? null : (formData.companyId || null)
                });
                if (ok) {
                    alert('Usuario actualizado exitosamente');
                    setIsModalOpen(false);
                    loadData();
                } else {
                    alert('Error al actualizar el perfil');
                }
            } else {
                // Create new user
                const res = await db.createUser({
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                    role: formData.role,
                    companyId: formData.role === 'admin' ? null : (formData.companyId || null)
                });
                if (res.success) {
                    alert('Usuario creado exitosamente');
                    setIsModalOpen(false);
                    loadData();
                } else {
                    alert('Error: ' + res.message);
                }
            }
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (user: any) => {
        if (window.confirm(`¿Estás seguro de eliminar al usuario "${user.full_name || user.email}"? Esta acción eliminará su perfil de acceso y rol.`)) {
            const ok = await db.deleteProfile(user.id);
            if (ok) {
                alert('Usuario eliminado del sistema');
                loadData();
            } else {
                alert('Error al eliminar el usuario. Es posible que tenga registros asociados.');
            }
        }
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col p-4 lg:p-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary !text-4xl">manage_accounts</span>
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Control de acceso y roles para todos los usuarios de la plataforma.</p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-background-dark px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-green-400 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined">person_add</span>
                    Nuevo Usuario
                </button>
            </div>

            {/* toolbar */}
            <div className="bg-white/5 border border-white/10 p-2 rounded-2xl flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 ml-4">search</span>
                <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none text-white text-sm focus:ring-0 placeholder-slate-600 flex-1 py-3"
                />
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
                                    <th className="p-6">Usuario</th>
                                    <th className="p-6">Empresa Asoc.</th>
                                    <th className="p-6 text-center">Rol</th>
                                    <th className="p-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-slate-400 text-xs">
                                                    {user.full_name?.substring(0, 2).toUpperCase() || user.email.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white leading-tight">{user.full_name || 'Sin nombre'}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-slate-600 !text-sm">corporate_fare</span>
                                                <span className="text-sm text-slate-300 font-medium">
                                                    {user.role === 'admin' ? 'Acceso Total (Admin)' :
                                                        user.role === 'empresa' ? 'Dueño de Empresa' :
                                                            user.clients?.name || 'Sin asignar'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                user.role === 'tecnico' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    'bg-primary/10 text-primary border-primary/20'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(user)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all"
                                                >
                                                    <span className="material-symbols-outlined !text-sm">edit</span>
                                                    Editar
                                                </button>
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all"
                                                    >
                                                        <span className="material-symbols-outlined !text-sm">delete</span>
                                                        Eliminar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center">
                                            <span className="material-symbols-outlined text-slate-700 !text-5xl mb-4">search_off</span>
                                            <p className="text-slate-500 font-medium">No se encontraron usuarios que coincidan con la búsqueda.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal de Creación / Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-[#1a1c1e] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scaleIn">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                                <p className="text-slate-500 text-sm">Define el acceso y la empresa asociada.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="size-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all"
                                    placeholder="Nombre del usuario"
                                />
                            </div>

                            {!editingUser && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all"
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Rol del Sistema</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                                >
                                    <option value="empresa">Empresa / Dueño</option>
                                    <option value="tecnico">Técnico Operativo</option>
                                    <option value="admin">Administrador Global</option>
                                </select>
                            </div>

                            {formData.role === 'tecnico' && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Empresa / Patrón Asociado</label>
                                    <select
                                        value={formData.companyId}
                                        onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                                        required={formData.role === 'tecnico'}
                                    >
                                        <option value="">Seleccione la empresa empleadora...</option>
                                        {users.filter(u => u.role === 'empresa').map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary text-background-dark font-black py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-green-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 uppercase tracking-widest text-sm"
                            >
                                {isSubmitting ? 'GUARDANDO...' : (editingUser ? 'GUARDAR CAMBIOS' : 'CREAR USUARIO')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsuariosScreen;
