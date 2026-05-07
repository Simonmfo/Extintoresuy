
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Client } from '../types';

interface ClientesScreenProps {
    companyId?: string;
    readOnly?: boolean;
}

const ClientesScreen: React.FC<ClientesScreenProps> = ({ companyId, readOnly = false }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editClient, setEditClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({ name: '', address: '', contact_email: '', phone: '', rut: '' });

    useEffect(() => {
        loadClients();
    }, [companyId]);

    const loadClients = async () => {
        setLoading(true);
        const data = await db.getClients(companyId);
        setClients(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editClient) {
            const ok = await db.updateClient(editClient.id, formData);
            if (ok) setIsModalOpen(false);
        } else {
            const res = await db.addClient(formData);
            if (res) setIsModalOpen(false);
        }
        loadClients();
    };

    const openModal = (client: Client | null = null) => {
        setEditClient(client);
        setFormData(client ? {
            name: client.name,
            address: client.address || '',
            contact_email: client.contact_email || '',
            phone: client.phone || '',
            rut: client.rut || ''
        } : { name: '', address: '', contact_email: '', phone: '', rut: '' });
        setIsModalOpen(true);
    };

    return (
        <div className={`space-y-6 px-6 max-w-7xl mx-auto h-full flex flex-col animate-fadeIn ${readOnly ? '' : 'py-6 lg:py-8'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary !text-4xl">corporate_fare</span>
                        Directorio de Clientes
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gestiona los clientes y sus sucursales</p>
                </div>
                {!readOnly && (
                    <button
                        onClick={() => openModal()}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <span className="material-symbols-outlined !text-xl">add</span>
                        Añadir Cliente
                    </button>
                )}
            </div>

            <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-auto h-full custom-scrollbar">
                    {loading && clients.length === 0 ? (
                        <div className="flex items-center justify-center p-20">
                            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-0">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-4 sm:p-6">Razón Social / RUT</th>
                                    <th className="p-4 sm:p-6 hidden sm:table-cell">Dirección Principal</th>
                                    <th className="p-4 sm:p-6">Contacto / Correo</th>
                                    {!readOnly && <th className="p-4 sm:p-6 text-right">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 sm:p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 sm:size-10 rounded-xl bg-slate-800 flex items-center justify-center text-primary font-bold shrink-0 text-sm sm:text-base">
                                                    {client.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                                        <p className="font-bold text-white text-base sm:text-lg truncate max-w-[150px] sm:max-w-xs">{client.name}</p>
                                                        {(!companyId || companyId === 'ALL') && (
                                                            <span className="text-[9px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-md uppercase tracking-widest font-black border border-white/10 shrink-0">
                                                                Por: {(client as any).creatorName}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {client.rut && <p className="text-[10px] font-mono text-primary font-black uppercase tracking-widest mt-0.5">RUT: {client.rut}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 sm:p-6 hidden sm:table-cell">
                                            <p className="text-sm text-slate-400 font-medium">
                                                <span className="material-symbols-outlined !text-sm align-middle mr-1">location_on</span>
                                                {client.address || 'Sin dirección registrada'}
                                            </p>
                                        </td>
                                        <td className="p-4 sm:p-6">
                                            <p className="text-sm text-slate-400 font-medium">
                                                <span className="material-symbols-outlined !text-sm align-middle mr-1">mail</span>
                                                {client.contact_email || 'N/A'}
                                            </p>
                                            {client.phone && (
                                                <p className="text-[11px] text-primary/80 font-bold mt-1">
                                                    <span className="material-symbols-outlined !text-[12px] align-middle mr-1">whatsapp</span>
                                                    {client.phone}
                                                </p>
                                            )}
                                        </td>

                                        {!readOnly && (
                                            <td className="p-4 sm:p-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(client)}
                                                        className="size-10 rounded-xl bg-white/5 text-slate-400 border border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/20 transition-all flex items-center justify-center shadow-lg"
                                                        title="Editar Cliente"
                                                    >
                                                        <span className="material-symbols-outlined !text-lg">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm(`¿Estás seguro de eliminar a "${client.name}"? Esta acción no se puede deshacer y podría fallar si tiene equipos asociados.`)) {
                                                                const ok = await db.deleteClient(client.id);
                                                                if (ok) loadClients();
                                                                else alert('Error al eliminar: Verifica que el cliente no tenga equipos o facturas asociadas.');
                                                            }
                                                        }}
                                                        className="size-10 rounded-xl bg-white/5 text-slate-500 border border-white/10 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/20 transition-all flex items-center justify-center shadow-lg"
                                                        title="Eliminar Cliente"
                                                    >
                                                        <span className="material-symbols-outlined !text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {clients.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-20 text-center text-slate-500 italic">
                                            No tienes empresas registradas aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-[#1a1c1e] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary">{editClient ? 'edit_note' : 'business_center'}</span>
                                    {editClient ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                                </h3>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nombre del Cliente / Razón Social</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none transition-colors"
                                            placeholder="Ej: Industrias Uruguay S.A."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">RUT del Cliente</label>
                                        <input
                                            type="text"
                                            value={formData.rut}
                                            onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none transition-colors"
                                            placeholder="Ej: 21XXXXXXX001"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Dirección Principal</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none transition-colors"
                                            placeholder="Calle, Número, Localidad"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Celular (WhatsApp Avisos)</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none transition-colors"
                                            placeholder="Ej: 099123456"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/[0.02] flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary text-background-dark font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                                >
                                    {editClient ? 'Guardar Cambios' : 'Registrar Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientesScreen;
