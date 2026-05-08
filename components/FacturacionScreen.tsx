import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { supabase } from '../services/supabase';
import { Client, UserProfile } from '../types';
import { generateInvoicePDF } from '../utils/pdfGenerator';

interface Invoice {
    id: string;
    client_id: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    invoice_date: string;
    due_date: string;
    items: any[];
    equipment_count?: number;
    clients?: { name: string, address?: string, rut?: string };
}


interface FacturacionScreenProps {
    companyId: string;
    profile: UserProfile | null;
}

const FacturacionScreen: React.FC<FacturacionScreenProps> = ({ companyId, profile }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
    const [newInvoice, setNewInvoice] = useState({
        client_id: '',
        amount: 0,
        equipment_count: 0,
        unit_price: 0,
        description: '',
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [] as any[]
    });

    const [isManualDescription, setIsManualDescription] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Auto-calculate amount and items when equipment_count or unit_price changes
    useEffect(() => {
        const total = newInvoice.equipment_count * newInvoice.unit_price;
        const defaultDesc = `Gestión digital de ${newInvoice.equipment_count} equipos`;
        
        setNewInvoice(prev => ({
            ...prev,
            amount: total,
            description: isManualDescription ? prev.description : defaultDesc,
            items: [{
                description: isManualDescription ? prev.description : defaultDesc,
                qty: prev.equipment_count,
                price: prev.unit_price
            }]
        }));
    }, [newInvoice.equipment_count, newInvoice.unit_price, newInvoice.description, isManualDescription]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [invData, clientData] = await Promise.all([
            db.getInvoices(companyId),
            db.getClients(companyId)
        ]);

        let finalEntities = [...clientData];
        
        // If admin, also fetch fabricas to allow invoicing them
        if (profile?.role === 'admin') {
            const fabricas = await db.getFabricasWithStats();
            const fabricaEntities = fabricas.map(f => ({
                id: f.id, // Warning: this is a profile ID, not a client ID.
                name: `🏭 ${f.full_name || 'Taller'}`,
                isFabrica: true
            }));
            finalEntities = [...fabricaEntities, ...finalEntities];
        }

        setInvoices(invData);
        setClients(finalEntities);

        if (profile?.role === 'admin') {
            const sugData = await db.getBillingSuggestions();
            setSuggestions(sugData);
        }
        setLoading(false);
    };

    const handleCreateInvoice = async () => {
        if (!newInvoice.client_id || newInvoice.amount <= 0) return;

        let targetClientId = newInvoice.client_id;

        // If it's a fabrica (detected by the prefix or state)
        const selectedEntity = clients.find(c => c.id === newInvoice.client_id);
        if (selectedEntity?.isFabrica) {
            // We need to ensure this fabrica exists in the 'clients' table to satisfy foreign keys
            // Search for a client with the same name or a special marker
            const cleanName = selectedEntity.name.replace('🏭 ', '');
            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('name', cleanName)
                .single();

            if (existingClient) {
                targetClientId = existingClient.id;
            } else {
                // Create a shadow client for this workshop
                const newClient = await db.addClient({
                    name: cleanName,
                    address: 'Taller Interno',
                    contact_email: '',
                    phone: '',
                    rut: ''
                });
                if (newClient) {
                    targetClientId = newClient.id;
                } else {
                    alert('Error al vincular el taller como cliente.');
                    return;
                }
            }
        }

        if (editingInvoiceId) {
            const ok = await db.updateInvoice(editingInvoiceId, {
                client_id: targetClientId,
                amount: newInvoice.amount,
                equipment_count: newInvoice.equipment_count,
                due_date: newInvoice.due_date,
                items: newInvoice.items
            });
            if (ok) {
                setShowCreateModal(false);
                setEditingInvoiceId(null);
                loadData();
            }
            return;
        }

        const res = await db.createInvoice({
            client_id: targetClientId,
            amount: newInvoice.amount,
            equipment_count: newInvoice.equipment_count,
            status: 'pending',
            due_date: newInvoice.due_date,
            items: newInvoice.items
        });

        if (res) {
            setShowCreateModal(false);
            loadData();
        }
    };

    const handleDeleteInvoice = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta factura? Esta acción no se puede deshacer.')) return;
        const ok = await db.deleteInvoice(id);
        if (ok) loadData();
    };

    const openEditModal = (invoice: Invoice) => {
        setEditingInvoiceId(invoice.id);
        const firstItem = invoice.items?.[0] || {};
        setNewInvoice({
            client_id: invoice.client_id,
            amount: Number(invoice.amount),
            equipment_count: invoice.equipment_count || 0,
            unit_price: firstItem.price || (invoice.equipment_count ? Number(invoice.amount) / invoice.equipment_count : 0),
            description: firstItem.description || '',
            due_date: invoice.due_date,
            items: invoice.items
        });
        setIsManualDescription(true);
        setShowCreateModal(true);
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        const ok = await db.updateInvoiceStatus(id, newStatus);
        if (ok) loadData();
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-primary/20 text-primary border-primary/20';
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'overdue': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary !text-4xl">payments</span>
                        Facturación y Cobranzas
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Gestione las facturas de mantenimiento enviadas a los clientes.</p>
                </div>
                <div className="flex gap-3">
                    {profile?.role === 'admin' && suggestions.length > 0 && (
                        <button
                            onClick={() => setShowSuggestions(true)}
                            className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black px-6 py-3 rounded-2xl hover:bg-amber-500 hover:text-background-dark transition-all flex items-center gap-2 uppercase text-xs tracking-wider animate-pulse"
                        >
                            <span className="material-symbols-outlined !text-lg">notifications_active</span>
                            Sugerencias ({suggestions.length})
                        </button>
                    )}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary text-background-dark font-black px-6 py-3 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 uppercase text-xs tracking-wider"
                    >
                        <span className="material-symbols-outlined !text-lg">add</span>
                        Nueva Factura
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Pendiente</p>
                    <p className="text-3xl font-black text-white">$ {invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cobrado (Mes)</p>
                    <p className="text-3xl font-black text-primary">$ {invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Facturas Vencidas</p>
                    <p className="text-3xl font-black text-red-500">{invoices.filter(i => i.status === 'overdue').length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Facturado</p>
                    <p className="text-3xl font-black text-slate-300">$ {invoices.reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()}</p>
                </div>
            </div>

            {/* Invoices List */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Historial de Facturación</h3>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/5">
                                    <th className="p-6">Factura ID</th>
                                    <th className="p-6">Cliente</th>
                                    <th className="p-6">Equipos</th>
                                    <th className="p-6">Fecha / Vto</th>
                                    <th className="p-6">Monto</th>
                                    <th className="p-6 text-center">Estado</th>
                                    <th className="p-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => (
                                    <tr key={invoice.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6">
                                            <p className="text-[10px] font-mono text-primary font-bold">#{invoice.id.substring(0, 8).toUpperCase()}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm font-bold text-white">{invoice.clients?.name}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm font-bold text-slate-300">{invoice.equipment_count || 0}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-xs text-slate-300 font-medium">{invoice.invoice_date}</p>
                                            <p className="text-[10px] text-slate-500">Vto: {invoice.due_date}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-lg font-black text-white">$ {Number(invoice.amount).toLocaleString()}</p>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${getStatusStyle(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right space-x-2">
                                            <button 
                                                onClick={() => generateInvoicePDF(invoice)}
                                                className="size-8 rounded-lg bg-white/5 text-primary border border-white/10 hover:bg-primary/20 transition-all"
                                                title="Descargar PDF"
                                            >
                                                <span className="material-symbols-outlined !text-lg">picture_as_pdf</span>
                                            </button>
                                            {invoice.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusChange(invoice.id, 'paid')}
                                                    className="size-8 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-background-dark transition-all"
                                                    title="Marcar como Pago"
                                                >
                                                    <span className="material-symbols-outlined !text-lg">check</span>
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => openEditModal(invoice)}
                                                className="size-8 rounded-lg bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-all"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined !text-lg">edit</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteInvoice(invoice.id)}
                                                className="size-8 rounded-lg bg-white/5 text-red-500 border border-white/10 hover:bg-red-500/10 transition-all"
                                                title="Eliminar"
                                            >
                                                <span className="material-symbols-outlined !text-lg">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-[#1a1c1e] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">{editingInvoiceId ? 'edit_document' : 'add_card'}</span>
                                {editingInvoiceId ? 'Editar Factura' : 'Generar Factura'}
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Cliente</label>
                                    <select
                                        value={newInvoice.client_id}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const sug = suggestions.find(s => s.fabricaId === val);
                                            setNewInvoice({ 
                                                ...newInvoice, 
                                                client_id: val,
                                                equipment_count: sug ? sug.count : newInvoice.equipment_count,
                                                unit_price: sug ? sug.suggestedUnitPrice : newInvoice.unit_price
                                            });
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none"
                                    >
                                        <option value="">Seleccionar empresa...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Descripción del Servicio</label>
                                    <input
                                        type="text"
                                        value={newInvoice.description}
                                        onChange={(e) => {
                                            setIsManualDescription(true);
                                            setNewInvoice({ ...newInvoice, description: e.target.value });
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none"
                                        placeholder="Ej: Gestión digital de equipos"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Cant. Equipos</label>
                                        <input
                                            type="number"
                                            value={newInvoice.equipment_count}
                                            onChange={(e) => setNewInvoice({ ...newInvoice, equipment_count: Number(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Valor Unitario ($)</label>
                                        <input
                                            type="number"
                                            value={newInvoice.unit_price}
                                            onChange={(e) => setNewInvoice({ ...newInvoice, unit_price: Number(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Total Calculado</label>
                                        <div className="w-full bg-primary/10 border border-primary/20 rounded-2xl p-4 text-primary font-black text-xl">
                                            $ {newInvoice.amount.toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Vencimiento</label>
                                        <input
                                            type="date"
                                            value={newInvoice.due_date}
                                            onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-white/[0.02] flex gap-4">
                            <button
                                onClick={() => { setShowCreateModal(false); setEditingInvoiceId(null); }}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateInvoice}
                                className="flex-1 bg-primary text-background-dark font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                            >
                                {editingInvoiceId ? 'Guardar Cambios' : 'Crear Factura'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showSuggestions && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-[#1a1c1e] border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-amber-500">notifications_active</span>
                                Sugerencias de Facturación Mensual
                            </h3>
                            <button onClick={() => setShowSuggestions(false)} className="text-slate-500 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-auto custom-scrollbar">
                            <div className="grid gap-4">
                                {suggestions.map(sug => (
                                    <div key={sug.fabricaId} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between hover:border-primary/30 transition-all">
                                        <div>
                                            <p className="text-sm font-black text-white">{sug.fabricaName}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                <span className="text-primary font-bold">{sug.count} equipos</span> gestionados este mes
                                            </p>
                                        </div>
                                        <div className="text-right flex items-center gap-6">
                                            <div>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Sugerido</p>
                                                <p className="text-lg font-black text-white">$ {sug.total.toLocaleString()}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setNewInvoice({
                                                        ...newInvoice,
                                                        client_id: sug.fabricaId,
                                                        equipment_count: sug.count,
                                                        unit_price: sug.suggestedUnitPrice,
                                                        description: `Gestión digital de ${sug.count} equipos`
                                                    });
                                                    setIsManualDescription(false);
                                                    setShowSuggestions(false);
                                                    setShowCreateModal(true);
                                                }}
                                                className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-background-dark font-black px-4 py-2 rounded-xl transition-all text-xs"
                                            >
                                                FACTURAR
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 bg-white/[0.02] text-center border-t border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                Estas sugerencias se basan en las inspecciones realizadas este mes
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacturacionScreen;
