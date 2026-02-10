
import { supabase } from './supabase';
import { InspectionAsset } from '../types';

export interface InspectionRecord {
  id: string;
  assetId: string;
  date: string;
  inspector: string;
  status: 'passed' | 'failed';
  details: any;
}

export const db = {
  getProfile: async (id: string): Promise<any> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  getTechniciansWithStats: async (companyId: string): Promise<any[]> => {
    // Fetch profiles with role 'tecnico' and related to this company
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'tecnico')
      .eq('company_id', companyId);

    if (profileError) {
      console.error('Error fetching technicians:', profileError);
      return [];
    }

    // Fetch performed inspections count
    const { data: performedInspections, error: inspectionError } = await supabase
      .from('inspections')
      .select('inspector_id');

    // Fetch pending assets assigned to technicians
    const { data: pendingAssets, error: assetsError } = await supabase
      .from('assets')
      .select('assigned_technician_id' as any)
      .eq('status', 'pending');

    if (inspectionError || assetsError) {
      console.error('Error fetching stats:', inspectionError || assetsError);
      return profiles.map(p => ({ ...p, performedCount: 0, pendingCount: 0 }));
    }

    // Map counts to profiles
    return profiles.map(profile => {
      const performedCount = performedInspections?.filter(i => i.inspector_id === profile.id).length || 0;
      const pendingCount = (pendingAssets as any[])?.filter(a => a.assigned_technician_id === profile.id).length || 0;
      return { ...profile, performedCount, pendingCount };
    });
  },

  deleteTechnician: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting technician profile:', error);
      return false;
    }
  },

  assignAssetToTechnician: async (assetId: string, technicianId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('assets')
        .update({ assigned_technician_id: technicianId } as any)
        .eq('id', assetId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning asset:', error);
      return false;
    }
  },

  assignAllClientAssetsToTechnician: async (clientId: string, technicianId: string, status: string = 'pending'): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('assets')
        .update({ assigned_technician_id: technicianId } as any)
        .eq('client_id', clientId)
        .eq('status', status);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error batch assigning assets:', error);
      return false;
    }
  },

  // Init is now a no-op or could check auth
  init: async () => {
    // No-op for now
  },

  getClients: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    return data;
  },

  getAssetsByClient: async (clientId: string): Promise<InspectionAsset[]> => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching client assets:', error);
      return [];
    }

    return data.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      description: asset.description,
      lastInspection: asset.last_inspection,
      lat: asset.location_lat,
      lng: asset.location_lng,
      status: asset.status,
      imageUrl: asset.image_url,
      clientId: asset.client_id,
      agent: asset.agent,
      fireClass: asset.fire_class,
      expirationDate: asset.expiration_date,
      lifecycleStatus: asset.location_status,
      nextInspection: asset.next_inspection_date,
      lastRecharge: (asset as any).last_recharge_date,
      lastHydrotest: (asset as any).last_hydrotest_date,
      nextHydrotest: (asset as any).next_hydrotest_date,
      assignedTechnicianId: (asset as any).assigned_technician_id
    }));
  },

  getAsset: async (id: string): Promise<InspectionAsset | null> => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching asset:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      description: data.description,
      lastInspection: data.last_inspection,
      lat: data.location_lat,
      lng: data.location_lng,
      status: data.status,
      imageUrl: data.image_url,
      clientId: data.client_id,
      agent: (data as any).agent,
      fireClass: (data as any).fire_class,
      expirationDate: (data as any).expiration_date,
      lifecycleStatus: (data as any).location_status,
      nextInspection: (data as any).next_inspection_date,
      lastRecharge: (data as any).last_recharge_date,
      lastHydrotest: (data as any).last_hydrotest_date,
      nextHydrotest: (data as any).next_hydrotest_date,
      assignedTechnicianId: (data as any).assigned_technician_id
    } as InspectionAsset;
  },

  getAssets: async (): Promise<InspectionAsset[]> => {
    const { data, error } = await supabase.from('assets').select('*');

    if (error) {
      console.error('Error fetching assets:', error);
      return [];
    }

    return data.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      description: asset.description,
      lastInspection: asset.last_inspection,
      lat: asset.location_lat,
      lng: asset.location_lng,
      status: asset.status,
      imageUrl: asset.image_url,
      clientId: asset.client_id,
      agent: asset.agent,
      fireClass: asset.fire_class,
      expirationDate: asset.expiration_date,
      lifecycleStatus: asset.location_status,
      nextInspection: asset.next_inspection_date,
      lastRecharge: asset.last_recharge_date,
      lastHydrotest: asset.last_hydrotest_date,
      nextHydrotest: asset.next_hydrotest_date,
      assignedTechnicianId: asset.assigned_technician_id
    }));
  },

  addInspection: async (record: InspectionRecord): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('Adding inspection:', record);

      const { error: inspError } = await supabase.from('inspections').insert({
        asset_id: record.assetId,
        status: 'completed',
        result: record.status === 'passed' ? 'pass' : 'fail',
        notes: JSON.stringify(record.details),
        date: new Date().toISOString()
      });

      if (inspError) {
        console.error('Inspection insert error', inspError);
        return { success: false, message: `Error al crear inspección: ${inspError.message}` };
      }

      // Calculate next inspection date (2 years from now)
      // Calculate next inspection date (Monthly frequency by default)
      const nextDate = new Date(record.date);
      nextDate.setMonth(nextDate.getMonth() + 1);

      const { data: updatedAsset, error: assetError } = await supabase.from('assets').update({
        last_inspection: record.date,
        next_inspection_date: nextDate.toISOString().split('T')[0],
        status: record.status === 'passed' ? 'ok' : 'failed'
      })
        .eq('id', record.assetId)
        .select();

      if (assetError) {
        console.error('Asset update error', assetError);
        return { success: false, message: `Error al actualizar activo: ${assetError.message}` };
      }

      if (!updatedAsset || updatedAsset.length === 0) {
        console.error('No asset row updated. ID not found or RLS issue.', record.assetId);
        return { success: false, message: "No se pudo actualizar el activo. Posible error de permisos o ID incorrecto." };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error adding inspection:', error);
      return { success: false, message: `Error desconocido: ${error.message || error}` };
    }
  },

  getStats: async () => {
    const assets = await db.getAssets();
    const expired = assets.filter(a => a.status === 'expired' || a.status === 'failed').length;
    const pending = assets.filter(a => a.status === 'pending').length;
    const total = assets.length;
    const compliance = total > 0 ? Math.round(((total - expired) / total) * 100) : 0;

    return { total, expired, pending, compliance };
  },

  addAsset: async (assetData: {
    name: string;
    type: string;
    description: string;
    clientId: string;
    agent?: string;
    fireClass?: string;
    expirationDate?: string;
    nextInspection?: string;
    lastRecharge?: string;
    lastHydrotest?: string;
    nextHydrotest?: string;
    lastInspection?: string;
    lifecycleStatus?: 'active' | 'maintenance' | 'discarded';
  }) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert({
          name: assetData.name,
          type: assetData.type,
          description: assetData.description,
          client_id: assetData.clientId,
          agent: assetData.agent,
          fire_class: assetData.fireClass,
          expiration_date: assetData.expirationDate,
          next_inspection_date: assetData.nextInspection,
          last_recharge_date: assetData.lastRecharge,
          last_hydrotest_date: assetData.lastHydrotest,
          next_hydrotest_date: assetData.nextHydrotest,
          last_inspection: assetData.lastInspection,
          location_status: assetData.lifecycleStatus || 'active',
          status: 'pending',
          // Default location for now, or could generate
          location_lat: -34.9011,
          location_lng: -56.1645,
          id: 'TEMP' // Valid ID to satisfy types, will be overwritten by trigger
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding asset:', error);
      return null;
    }
  },

  updateAsset: async (id: string, updates: Partial<InspectionAsset>) => {
    try {
      const { error } = await supabase
        .from('assets')
        .update({
          name: updates.name,
          type: updates.type,
          description: updates.description,
          status: updates.status, // Allow manual status update if needed
          agent: updates.agent,
          fire_class: updates.fireClass,
          expiration_date: updates.expirationDate,
          location_status: updates.lifecycleStatus,
          last_inspection: updates.lastInspection,
          next_inspection_date: updates.nextInspection,
          last_recharge_date: updates.lastRecharge,
          last_hydrotest_date: updates.lastHydrotest,
          next_hydrotest_date: updates.nextHydrotest
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating asset:', error);
      return false;
    }
  },

  deleteAsset: async (id: string) => {
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting asset:', error);
      return false;
    }
  }
};
