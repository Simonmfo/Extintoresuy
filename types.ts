
export type Screen = 'home' | 'equipos' | 'mapa' | 'reportes' | 'ajustes' | 'inspeccion' | 'alertas' | 'inspecciones' | 'tecnicos' | 'facturacion' | 'usuarios' | 'clientes' | 'nueva-inspeccion';

export interface LocationItem {
  id: string;
  name: string;
  timeAgo: string;
  equipmentCount: number;
  imageUrl: string;
}

export interface InspectionAsset {
  id: string;
  name: string;
  type: string;
  description: string;
  lastInspection: string;
  lat: number;
  lng: number;
  status: 'ok' | 'pending' | 'expired' | 'failed';
  imageUrl: string;
  clientId?: string;
  agent?: string;
  fireClass?: string;
  expirationDate?: string;
  nextInspection?: string;
  lastRecharge?: string;
  lastHydrotest?: string;
  nextHydrotest?: string;
  assignedTechnicianId?: string;
  lifecycleStatus?: 'active' | 'maintenance' | 'discarded';
  companyId?: string;
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
  role: 'admin' | 'tecnico' | 'empresa';
  avatar_url?: string;
  company_id?: string;
  created_at?: string;
}
