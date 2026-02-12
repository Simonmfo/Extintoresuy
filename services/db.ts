
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

const mapAsset = (asset: any): InspectionAsset => ({
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
});

export const db = {
  logActivity: async (action: string, entityType: string, entityId?: string, entityName?: string, details?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        details
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  },


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

  updateProfile: async (id: string, updates: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  },

  createUser: async (userData: { email: string; password?: string; fullName: string; role: string; companyId?: string | null }): Promise<{ success: boolean; message?: string }> => {
    try {
      // Create auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password || 'Temporary123!', // Default password if none provided
        options: {
          data: {
            full_name: userData.fullName,
            role: userData.role,
            company_id: userData.companyId || null
          }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        // Create/Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: userData.email,
            full_name: userData.fullName,
            role: userData.role,
            company_id: userData.companyId || null
          });

        if (profileError) throw profileError;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error creating user:', error);
      return { success: false, message: error.message };
    }
  },

  getAllProfiles: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, clients(name)');

    if (error) {
      console.error('Error fetching all profiles:', error);
      return [];
    }
    return data;
  },

  getTechniciansWithStats: async (companyId?: string): Promise<any[]> => {
    // Fetch profiles with role 'tecnico'
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'tecnico');

    if (companyId && companyId !== 'ALL') {
      query = query.eq('company_id', companyId);
    }

    const { data: profiles, error: profileError } = await query;

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

  getClients: async (companyId?: string): Promise<any[]> => {
    // SECURITY: If no companyId and not 'ALL', return empty (unless admin, but we use 'ALL' for that)
    if (!companyId) return [];

    let query = supabase
      .from('clients')
      .select('*')
      .order('name');

    if (companyId !== 'ALL') {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    return data;
  },

  addClient: async (clientData: { name: string; address: string; contact_email: string; rut?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          company_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      await db.logActivity('create', 'client', data.id, data.name, clientData);
      return data;
    } catch (error) {
      console.error('Error adding client:', error);
      return null;
    }
  },

  updateClient: async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await db.logActivity('update', 'client', id, updates.name || id, updates);
      return true;
    } catch (error) {
      console.error('Error updating client:', error);
      return false;
    }
  },

  deleteClient: async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await db.logActivity('delete', 'client', id, `Eliminación de cliente ${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  },

  getAssetsByClient: async (clientId: string): Promise<InspectionAsset[]> => {
    let allAssets: any[] = [];
    let from = 0;
    const limit = 1000;
    let done = false;

    while (!done) {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('client_id', clientId)
        .range(from, from + limit - 1);

      if (error) {
        console.error('Error fetching client assets:', error);
        return allAssets.map(mapAsset);
      }

      if (data && data.length > 0) {
        allAssets = [...allAssets, ...data];
        if (data.length < limit) {
          done = true;
        } else {
          from += limit;
        }
      } else {
        done = true;
      }
    }

    return allAssets.map(mapAsset);
  },

  getAsset: async (id: string): Promise<InspectionAsset | null> => {
    const { data, error } = await supabase
      .from('assets')
      .select('*, clients(company_id)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching asset:', error);
      return null;
    }

    const asset = mapAsset(data);
    if ((data as any).clients) {
      asset.companyId = (data as any).clients.company_id;
    }
    return asset;
  },

  getAssets: async (companyId?: string): Promise<InspectionAsset[]> => {
    // SECURITY: Requirement check
    if (!companyId) return [];

    let allAssets: any[] = [];
    let from = 0;
    const limit = 1000;
    let done = false;

    // If companyId is provided and not 'ALL', first get their clients
    let allowedClientIds: string[] | null = null;
    if (companyId !== 'ALL') {
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', companyId);

      allowedClientIds = clients?.map(c => c.id) || [];

      // If the company has no clients, it can't have assets
      if (allowedClientIds.length === 0) return [];
    }

    while (!done) {
      let query = supabase
        .from('assets')
        .select('*')
        .range(from, from + limit - 1);

      if (allowedClientIds) {
        query = query.in('client_id', allowedClientIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching assets:', error);
        return allAssets.map(mapAsset);
      }

      if (data && data.length > 0) {
        allAssets = [...allAssets, ...data];
        if (data.length < limit) {
          done = true;
        } else {
          from += limit;
        }
      } else {
        done = true;
      }
    }

    return allAssets.map(mapAsset);
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

      // Log the inspection
      await db.logActivity('inspection', 'asset', record.assetId, `Inspección ${record.status === 'passed' ? 'Aprobada' : 'Fallida'}`, { result: record.status, details: record.details });

      return { success: true };
    } catch (error: any) {
      console.error('Error adding inspection:', error);
      return { success: false, message: `Error desconocido: ${error.message || error}` };
    }
  },

  getActivityLogs: async (limit: number = 10, companyId?: string): Promise<any[]> => {
    if (!companyId) return [];

    let query = supabase
      .from('activity_logs')
      .select('*, profiles!inner(full_name, email, company_id)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (companyId !== 'ALL') {
      // Filter logs by users belonging to this company or the company owner itself
      query = query.or(`company_id.eq.${companyId},id.eq.${companyId}`, { foreignTable: 'profiles' });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }
    return data;
  },

  getStats: async (companyId?: string) => {
    const assets = await db.getAssets(companyId);
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
          location_lat: -34.9011,
          location_lng: -56.1645,
          id: 'TEMP'
        } as any)
        .select()
        .single();

      if (error) throw error;

      await db.logActivity('create', 'asset', data.id, data.name || data.id, assetData);

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
          status: updates.status,
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

      await db.logActivity('update', 'asset', id, updates.name || id, updates);

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

      await db.logActivity('delete', 'asset', id, id);

      return true;
    } catch (error) {
      console.error('Error deleting asset:', error);
      return false;
    }
  },

  getInvoices: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients(name)')
      .order('invoice_date', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
    return data;
  },

  createInvoice: async (invoiceData: {
    client_id: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    due_date: string;
    items: any[];
  }) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;

      await db.logActivity('invoice_created', 'invoice', data.id, `Factura para cliente ${data.client_id}`, invoiceData);

      return data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      return null;
    }
  },

  updateInvoiceStatus: async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status } as any)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return false;
    }
  }
};
