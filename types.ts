
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
  type: string;
  lastInspection: string;
  lat: number;
  lng: number;
}
