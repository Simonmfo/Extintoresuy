import React, { useEffect, useState } from 'react';
import { db } from '../services/db';

const FabricasScreen: React.FC = () => {
    const [fabricas, setFabricas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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

    return (
        <div className="p-4 lg:p-8 pt-20 lg:pt-8 h-full max-w-7xl mx-auto space-y-6">
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
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm">Planta / Usuario</th>
                                    <th className="text-center py-4 px-6 font-medium text-gray-600 text-sm">Empresas (Clientes)</th>
                                    <th className="text-center py-4 px-6 font-medium text-gray-600 text-sm">Técnicos</th>
                                    <th className="text-center py-4 px-6 font-medium text-gray-600 text-sm">Equipos Gestionados</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredFabricas.map((fabrica) => (
                                    <tr key={fabrica.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                                                    {fabrica.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{fabrica.full_name}</p>
                                                    <p className="text-sm text-gray-500">{fabrica.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col items-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-sm border border-blue-200">
                                                    <span className="material-symbols-outlined !text-sm">corporate_fare</span>
                                                    {fabrica.clientsCount}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col items-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm border border-emerald-200">
                                                    <span className="material-symbols-outlined !text-sm">engineering</span>
                                                    {fabrica.techniciansCount}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col items-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 font-medium text-sm border border-orange-200">
                                                    <span className="material-symbols-outlined !text-sm">fire_extinguisher</span>
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
