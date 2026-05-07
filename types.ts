
export type Screen = 'home' | 'equipos' | 'clientes' | 'mapa' | 'reportes' | 'ajustes' | 'inspeccion' | 'usuarios' | 'facturacion' | 'tecnicos' | 'inspecciones' | 'fabricas';

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
  capacity?: string;
  unit?: string;
  matricula?: string;
  assignedTechnicianId?: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  contact_email: string;
  rut?: string;
  created_at: string;
  company_id?: string;
  creatorName?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'tecnico' | 'empresa' | 'fabrica';
  company_id: string | null;
  avatar_url?: string;
  logo_url?: string;
  created_at?: string;
  creatorName?: string;
}
export interface InspectionRecord {
  id: string;
  assetId: string;
  date: string;
  inspector: string;
  status: 'passed' | 'failed';
  details: any;
}
