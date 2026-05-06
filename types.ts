
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
  name?: string;
  equipmentCategory?: string;
  type: string;
  description?: string;
  lastInspection: string;
  lat: number;
  lng: number;
  status?: string;
  imageUrl?: string;
  clientId?: string;
  companyId?: string;
  agent?: string;
  fireClass?: string;
  expirationDate?: string;
  lifecycleStatus?: 'active' | 'maintenance' | 'discarded';
  nextInspection?: string;
  lastRecharge?: string;
  lastHydrotest?: string;
  nextHydrotest?: string;
  assignedTechnicianId?: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  contact_email: string;
  rut?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'tecnico' | 'empresa' | 'fabrica';
  company_id: string | null;
  avatar_url?: string;
  created_at?: string;
}
