
export type Screen = 'home' | 'equipos' | 'clientes' | 'mapa' | 'reportes' | 'ajustes' | 'inspeccion' | 'usuarios' | 'facturacion' | 'tecnicos' | 'inspecciones';

export interface LocationItem {
  id: string;
  name: string;
  timeAgo: string;
  equipmentCount: number;
  imageUrl: string;
}

export interface InspectionAsset {
  id: string;
  equipmentCategory?: string;
  type: string;
  lastInspection: string;
  lat: number;
  lng: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'tecnico' | 'empresa' | 'fabrica';
  company_id: string | null;
}
