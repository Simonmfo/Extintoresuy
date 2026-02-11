
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Client } from '../types';

interface Invoice {
    id: string;
    client_id: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    invoice_date: string;
    due_date: string;
    items: any[];
    clients?: { name: string };
}

const FacturacionScreen: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newInvoice, setNewInvoice] = useState({
        client_id: '',
        amount: 0,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ description: 'Mantenimiento de extintores', qty: 1, price: 0 }]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [invData, clientData] = await Promise.all([
            db.getInvoices(),
            db.getClients()
        ]);
        setInvoices(invData);
        setClients(clientData);
        setLoading(false);
    };

    const handleCreateInvoice = async () => {
        if (!newInvoice.client_id || newInvoice.amount <= 0) return;

        const res = await db.createInvoice({
            client_id: newInvoice.client_id,
            amount: newInvoice.amount,
            status: 'pending',
            due_date: newInvoice.due_date,
            items: newInvoice.items
        });

        if (res) {
            setShowCreateModal(false);
            loadData();
        }
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
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary text-background-dark font-black px-6 py-3 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 uppercase text-xs tracking-wider"
                >
                    <span className="material-symbols-outlined !text-lg">add</span>
                    Nueva Factura
                </button>
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
                                            {invoice.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusChange(invoice.id, 'paid')}
                                                    className="size-8 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-background-dark transition-all"
                                                    title="Marcar como Pago"
                                                >
                                                    <span className="material-symbols-outlined !text-lg">check</span>
                                                </button>
                                            )}
                                            <button className="size-8 rounded-lg bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-all">
                                                <span className="material-symbols-outlined !text-lg">visibility</span>
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
                                <span className="material-symbols-outlined text-primary">add_card</span>
                                Generar Factura
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
                                        onChange={(e) => setNewInvoice({ ...newInvoice, client_id: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none"
                                    >
                                        <option value="">Seleccionar empresa...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Monto Total</label>
                                        <input
                                            type="number"
                                            value={newInvoice.amount}
                                            onChange={(e) => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary outline-none"
                                            placeholder="0.00"
                                        />
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
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateInvoice}
                                className="flex-1 bg-primary text-background-dark font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                            >
                                Crear Factura
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacturacionScreen;
