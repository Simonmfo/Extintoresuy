
import { type FC, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { db } from '../services/db';
import { Client } from '../types';

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapScreenProps {
  onStartInspection: () => void;
  companyId?: string;
}

const LocationPicker: FC<{ onLocationPicked: (lat: number, lng: number) => void }> = ({ onLocationPicked }) => {
    useMapEvents({
        click(e) {
            onLocationPicked(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const MapScreen: FC<MapScreenProps> = ({ onStartInspection, companyId }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientForLocation, setSelectedClientForLocation] = useState<string | null>(null);
  const [isSettingLocation, setIsSettingLocation] = useState(false);

  useEffect(() => {
    loadClients();
  }, [companyId]);

  const loadClients = async () => {
    if (!companyId) return;
    setLoading(true);
    const data = await db.getClients(companyId);
    setClients(data);
    setLoading(false);
  };

  const handleLocationPicked = async (lat: number, lng: number) => {
    if (selectedClientForLocation) {
        const ok = await db.updateClientLocation(selectedClientForLocation, lat, lng);
        if (ok) {
            setSelectedClientForLocation(null);
            setIsSettingLocation(false);
            loadClients();
        }
    }
  };

  const clientsWithLocation = clients.filter(c => c.latitude && c.longitude);
  const clientsWithoutLocation = clients.filter(c => !c.latitude || !c.longitude);

  return (
    <div className="relative h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-[#102216]">
      {/* Header */}
      <header className="bg-background-dark/95 backdrop-blur-md border-b border-white/10 px-6 py-4 z-[1000]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">map</span>
                Ubicación de Clientes
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Geolocalización del Parque de Extintores
            </p>
          </div>
          <div className="flex gap-2">
              <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-primary text-[10px] font-black uppercase">
                  {clientsWithLocation.length} Ubicados
              </div>
              {clientsWithoutLocation.length > 0 && (
                <div className="bg-status-yellow/10 border border-status-yellow/20 px-3 py-1 rounded-full text-status-yellow text-[10px] font-black uppercase">
                    {clientsWithoutLocation.length} Sin Ubicación
                </div>
              )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Sidebar for clients without location */}
        {clientsWithoutLocation.length > 0 && (
            <div className="w-full lg:w-80 bg-background-dark/80 backdrop-blur-xl border-r border-white/10 overflow-y-auto p-4 absolute lg:relative z-[1000] bottom-0 lg:bottom-auto max-h-[40%] lg:max-h-full">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-sm">not_listed_location</span>
                    Pendientes de Ubicar
                </h3>
                <div className="space-y-2">
                    {clientsWithoutLocation.map(client => (
                        <button
                            key={client.id}
                            onClick={() => {
                                setSelectedClientForLocation(client.id);
                                setIsSettingLocation(true);
                            }}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${
                                selectedClientForLocation === client.id 
                                ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20' 
                                : 'bg-white/5 border-white/10 hover:border-white/20'
                            }`}
                        >
                            <p className="text-sm font-black text-white">{client.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{client.address || 'Sin dirección'}</p>
                            {selectedClientForLocation === client.id && (
                                <div className="mt-2 text-[10px] text-primary font-black uppercase flex items-center gap-1 animate-pulse">
                                    <span className="material-symbols-outlined !text-xs">touch_app</span>
                                    Toca el mapa para ubicar
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative">
            {loading ? (
                <div className="absolute inset-0 z-[2000] bg-background-dark/50 backdrop-blur-sm flex items-center justify-center">
                    <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                </div>
            ) : (
                <MapContainer 
                    center={[-34.9011, -56.1645]} // Montevideo center
                    zoom={13} 
                    className="w-full h-full z-0"
                    style={{ background: '#102216' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    
                    {clientsWithLocation.map(client => (
                        <Marker key={client.id} position={[client.latitude, client.longitude]}>
                            <Popup className="custom-popup">
                                <div className="p-2 min-w-[200px]">
                                    <h4 className="font-black text-slate-900 text-lg mb-1">{client.name}</h4>
                                    <p className="text-xs text-slate-600 mb-3">{client.address}</p>
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={onStartInspection}
                                            className="w-full bg-primary text-background-dark font-black py-2 rounded-xl text-xs uppercase tracking-tight flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined !text-sm">qr_code_scanner</span>
                                            Nueva Inspección
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setSelectedClientForLocation(client.id);
                                                setIsSettingLocation(true);
                                            }}
                                            className="w-full bg-slate-100 text-slate-600 font-bold py-2 rounded-xl text-[10px] uppercase tracking-tight"
                                        >
                                            Cambiar Ubicación
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {isSettingLocation && (
                        <LocationPicker onLocationPicked={handleLocationPicked} />
                    )}
                </MapContainer>
            )}

            {isSettingLocation && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                    <div className="bg-primary text-background-dark px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl animate-bounce flex items-center gap-3 border-2 border-white/20">
                        <span className="material-symbols-outlined !text-lg">location_on</span>
                        Selecciona el punto en el mapa
                    </div>
                </div>
            )}
        </div>
      </div>

      <style>{`
        .leaflet-container {
            width: 100%;
            height: 100%;
        }
        .custom-popup .leaflet-popup-content-wrapper {
            background: white;
            border-radius: 20px;
            padding: 0;
            overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
            margin: 0;
        }
        .leaflet-popup-tip-container {
            display: none;
        }
      `}</style>
    </div>
  );
};

export default MapScreen;
