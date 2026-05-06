import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import ClientesScreen from './ClientesScreen';
import TecnicosScreen from './TecnicosScreen';
import EquiposScreen from './EquiposScreen';

const FabricasScreen: React.FC = () => {
    const [fabricas, setFabricas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFabrica, setSelectedFabrica] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'clientes' | 'tecnicos' | 'equipos'>('clientes');

    useEffect(() => {
        loadFabricas();
    }, []);

    const loadFabricas = async () => {
        setLoading(true);
        const data = await db.getFabricasWithStats();
        setFabricas(data);
        setLoading(false);
    };

    const filteredFabricas = fabricas.filter(f => 
        f.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedFabrica) {
        return (
            <div className="px-6 py-4 lg:p-8 pt-20 lg:pt-8 h-full max-w-7xl mx-auto space-y-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <button 
                        onClick={() => setSelectedFabrica(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined !text-lg">arrow_back</span>
                        Volver a Plantas de Recarga
                    </button>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 sm:p-8 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center border border-white/10 shrink-0">
                        <span className="material-symbols-outlined text-primary !text-3xl sm:!text-4xl">factory</span>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white">{selectedFabrica.full_name}</h1>
                        <p className="text-slate-400 mt-1 text-sm sm:text-base">{selectedFabrica.email}</p>
                    </div>
                </div>

                <div className="flex gap-4 border-b border-white/10 overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setActiveTab('clientes')}
                        className={`pb-4 px-2 font-bold whitespace-nowrap transition-colors flex items-center gap-2 text-sm sm:text-base ${activeTab === 'clientes' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <span className="material-symbols-outlined !text-lg">corporate_fare</span>
                        Empresas <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{selectedFabrica.clientsCount}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('tecnicos')}
                        className={`pb-4 px-2 font-bold whitespace-nowrap transition-colors flex items-center gap-2 text-sm sm:text-base ${activeTab === 'tecnicos' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <span className="material-symbols-outlined !text-lg">engineering</span>
                        Técnicos <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{selectedFabrica.techniciansCount}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('equipos')}
                        className={`pb-4 px-2 font-bold whitespace-nowrap transition-colors flex items-center gap-2 text-sm sm:text-base ${activeTab === 'equipos' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <span className="material-symbols-outlined !text-lg">fire_extinguisher</span>
                        Equipos <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{selectedFabrica.assetsCount}</span>
                    </button>
                </div>

                <div className="flex-1">
                    {activeTab === 'clientes' && <ClientesScreen companyId={selectedFabrica.id} readOnly={true} />}
                    {activeTab === 'tecnicos' && <TecnicosScreen companyId={selectedFabrica.id} readOnly={true} />}
                    {activeTab === 'equipos' && <EquiposScreen companyId={selectedFabrica.id} readOnly={true} />}
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 py-4 lg:p-8 pt-20 lg:pt-8 h-full max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Plantas de Recarga</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestiona las fábricas y monitorea toda su actividad (empresas, técnicos y equipos creados).
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar planta de recarga..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                        </div>
                    ) : filteredFabricas.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <span className="material-symbols-outlined text-gray-400 !text-5xl mb-3">factory</span>
                            <p className="text-lg font-medium text-gray-900">No hay plantas registradas</p>
                            <p className="text-sm mt-1">Las plantas de recarga aparecerán aquí.</p>
                        </div>
                    ) : (
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-4 px-4 sm:px-6 font-medium text-gray-600 text-xs sm:text-sm">Planta / Usuario</th>
                                    <th className="text-center py-4 px-4 sm:px-6 font-medium text-gray-600 text-xs sm:text-sm">Empresas</th>
                                    <th className="text-center py-4 px-4 sm:px-6 font-medium text-gray-600 text-xs sm:text-sm">Técnicos</th>
                                    <th className="text-center py-4 px-4 sm:px-6 font-medium text-gray-600 text-xs sm:text-sm">Equipos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredFabricas.map((fabrica) => (
                                    <tr 
                                        key={fabrica.id} 
                                        className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedFabrica(fabrica)}
                                    >
                                        <td className="py-4 px-4 sm:px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm sm:text-base shrink-0">
                                                    {fabrica.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{fabrica.full_name}</p>
                                                    <p className="text-xs sm:text-sm text-gray-500 truncate">{fabrica.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 sm:px-6">
                                            <div className="flex flex-col items-center">
                                                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-xs sm:text-sm border border-blue-200">
                                                    <span className="material-symbols-outlined !text-[14px] sm:!text-sm">corporate_fare</span>
                                                    {fabrica.clientsCount}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 sm:px-6">
                                            <div className="flex flex-col items-center">
                                                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium text-xs sm:text-sm border border-emerald-200">
                                                    <span className="material-symbols-outlined !text-[14px] sm:!text-sm">engineering</span>
                                                    {fabrica.techniciansCount}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 sm:px-6">
                                            <div className="flex flex-col items-center">
                                                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-orange-50 text-orange-700 font-medium text-xs sm:text-sm border border-orange-200">
                                                    <span className="material-symbols-outlined !text-[14px] sm:!text-sm">fire_extinguisher</span>
                                                    {fabrica.assetsCount}
                                                </span>
                                            </div>
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

export default FabricasScreen;
