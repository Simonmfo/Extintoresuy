
import { supabase } from './supabase';
import { InspectionAsset, InspectionRecord } from '../types';



const mapAsset = (asset: any): InspectionAsset => ({
  id: asset.id,
  name: asset.name,
  equipmentCategory: asset.equipment_category,
  type: asset.type,
  description: asset.description,
  lastInspection: asset.last_inspection,
  lat: asset.location_lat,
  lng: asset.location_lng,
  status: asset.status,
  imageUrl: asset.image_url,
  clientId: asset.client_id,
  expirationDate: asset.expiration_date,
  lifecycleStatus: asset.location_status,
  nextInspection: asset.next_inspection_date,
  lastRecharge: asset.last_recharge_date,
  lastHydrotest: asset.last_hydrotest_date,
  nextHydrotest: asset.next_hydrotest_date,
  unit: asset.unit,
  matricula: asset.matricula,
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

  deleteProfile: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
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
    const profilesMap = await db.getProfilesMap();
    return profiles.map(profile => {
      const performedCount = performedInspections?.filter(i => i.inspector_id === profile.id).length || 0;
      const pendingCount = (pendingAssets as any[])?.filter(a => a.assigned_technician_id === profile.id).length || 0;
      return { 
        ...profile, 
        performedCount, 
        pendingCount,
        creatorName: profilesMap[profile.company_id] || 'Administrador'
      };
    });
  },

  getBillingSuggestions: async (): Promise<any[]> => {
    try {
      const { data: fabricas } = await supabase.from('profiles').select('*').eq('role', 'fabrica');
      if (!fabricas) return [];

      const { data: allClients } = await supabase.from('clients').select('id, company_id' as any);
      const { data: allAssets } = await supabase.from('assets').select('id, client_id' as any);

      return fabricas.map(fabrica => {
        const fabricaClients = allClients?.filter(c => (c as any).company_id === fabrica.id) || [];
        const clientIds = fabricaClients.map(c => (c as any).id);
        const assetsCount = allAssets?.filter(a => clientIds.includes((a as any).client_id)).length || 0;

        return {
          fabricaId: fabrica.id,
          fabricaName: fabrica.full_name || 'Taller',
          count: assetsCount,
          suggestedUnitPrice: 50, // Default price per managed equipment
          total: assetsCount * 50
        };
      }).filter(s => s.count > 0); // Only suggest if they have assets
    } catch (error) {
      console.error('Error getting billing suggestions:', error);
      return [];
    }
  },

  getFabricasWithStats: async (): Promise<any[]> => {
    const { data: fabricas, error: fabricasError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'fabrica');

    if (fabricasError) {
      console.error('Error fetching fabricas:', fabricasError);
      return [];
    }

    const { data: allTechnicians } = await supabase.from('profiles').select('id, company_id').eq('role', 'tecnico');
    const { data: allClients } = await supabase.from('clients').select('id, company_id' as any);
    const { data: allAssets } = await supabase.from('assets').select('id, client_id' as any);

    return fabricas.map(fabrica => {
      const techniciansCount = allTechnicians?.filter(t => t.company_id === fabrica.id).length || 0;
      
      const fabricaClients = allClients?.filter(c => (c as any).company_id === fabrica.id) || [];
      const clientsCount = fabricaClients.length;
      
      const clientIds = fabricaClients.map(c => (c as any).id);
      const assetsCount = allAssets?.filter(a => clientIds.includes((a as any).client_id)).length || 0;

      return {
        ...fabrica,
        techniciansCount,
        clientsCount,
        assetsCount
      };
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

  assignAllClientAssetsToTechnician: async (clientId: string, technicianId: string, statuses: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('assets')
        .update({ assigned_technician_id: technicianId } as any)
        .eq('client_id', clientId)
        .in('status', statuses);

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

  getProfilesMap: async (): Promise<Record<string, string>> => {
    const { data } = await supabase.from('profiles').select('id, full_name');
    if (!data) return {};
    return data.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.full_name || 'Usuario' }), {});
  },

  getClients: async (companyId?: string): Promise<any[]> => {
    // SECURITY: If no companyId and not 'ALL', return empty (unless admin, but we use 'ALL' for that)
    if (!companyId) return [];

    let query = supabase
      .from('clients')
      .select('*')
      .order('name');

    if (companyId !== 'ALL') {
      query = (query as any).eq('company_id', companyId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }

    const profiles = await db.getProfilesMap();
    return data.map((client: any) => ({
      ...client,
      creatorName: profiles[client.company_id] || 'Administrador'
    }));
  },

  updateClientLocation: async (id: string, lat: number, lng: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ latitude: lat, longitude: lng } as any)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating client location:', error);
      return false;
    }
  },

  addClient: async (clientData: { name: string; address: string; contact_email: string; phone?: string; rut?: string; company_id?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          company_id: user.id
        } as any)
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
    // Try searching by ID first
    let { data, error } = await supabase
      .from('assets')
      .select('*, clients(company_id)')
      .eq('id', id)
      .maybeSingle();

    // If not found, try searching by matricula (Sello)
    if (!data && !error) {
      const { data: dataByMatricula, error: errorByMatricula } = await supabase
        .from('assets')
        .select('*, clients(company_id)')
        .eq('matricula', id)
        .maybeSingle();
      
      data = dataByMatricula;
      error = errorByMatricula;
    }

    if (error) {
      console.error('Error fetching asset:', error);
      return null;
    }

    if (!data) return null;

    const asset = mapAsset(data);
    const clientsData = (data as any).clients;
    if (clientsData) {
      asset.companyId = Array.isArray(clientsData) ? clientsData[0]?.company_id : clientsData.company_id;
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
      const { data: clients } = await (supabase
        .from('clients')
        .select('id') as any)
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
        date: new Date().toISOString(),
        image_url: record.imageUrl,
        signature_url: record.signatureUrl,
        signer_name: record.signerName,
        signer_document: record.signerDocument
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
      } as any)
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
    const today = new Date().toISOString().split('T')[0];

    // A asset is expired if its expirationDate is strictly less than today
    const expiredCount = assets.filter(a =>
      (a.expirationDate && a.expirationDate < today) ||
      a.status === 'failed'
    ).length;

    const pendingCount = assets.filter(a => a.status === 'pending').length;
    const total = assets.length;
    const compliance = total > 0 ? Math.round(((total - expiredCount) / total) * 100) : 0;

    return { total, expired: expiredCount, pending: pendingCount, compliance };
  },

  addAsset: async (assetData: {
    name: string;
    equipmentCategory?: string;
    type: string;
    description: string;
    clientId: string;
    expirationDate?: string;
    nextInspection?: string;
    lastRecharge?: string;
    lastHydrotest?: string;
    nextHydrotest?: string;
    lastInspection?: string;
    lifecycleStatus?: 'active' | 'maintenance' | 'discarded';
    unit?: string;
    matricula?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert({
          name: assetData.name,
          equipment_category: assetData.equipmentCategory || 'Extintor',
          type: assetData.type,
          description: assetData.description,
          client_id: assetData.clientId,
          expiration_date: assetData.expirationDate,
          next_inspection_date: assetData.nextInspection,
          last_recharge_date: assetData.lastRecharge,
          last_hydrotest_date: assetData.lastHydrotest,
          next_hydrotest_date: assetData.nextHydrotest,
          last_inspection: assetData.lastInspection,
          location_status: assetData.lifecycleStatus || 'active',
          unit: assetData.unit,
          matricula: assetData.matricula,
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
          equipment_category: (updates as any).equipmentCategory,
          type: updates.type,
          description: updates.description,
          status: updates.status,
          expiration_date: updates.expirationDate,
          location_status: updates.lifecycleStatus,
          last_inspection: updates.lastInspection,
          next_inspection_date: updates.nextInspection,
          last_recharge_date: updates.lastRecharge,
          last_hydrotest_date: updates.lastHydrotest,
          next_hydrotest_date: updates.nextHydrotest,
          unit: updates.unit,
          matricula: updates.matricula
        } as any)
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

  updateInvoice: async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await db.logActivity('update', 'invoice', id, `Factura editada`, updates);
      return true;
    } catch (error) {
      console.error('Error updating invoice:', error);
      return false;
    }
  },

  deleteInvoice: async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await db.logActivity('delete', 'invoice', id, `Factura eliminada`);
      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
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
  },

  uploadFile: async (file: File | Blob, bucket: string, folder: string): Promise<string | null> => {
    try {
      const fileExt = file instanceof File ? file.name.split('.').pop() : 'png';
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      return null;
    }
  },

  uploadInspectionPhoto: async (file: File): Promise<string | null> => {
    return db.uploadFile(file, 'inspection-photos', 'inspections');
  },

  uploadSignature: async (blob: Blob): Promise<string | null> => {
    return db.uploadFile(blob, 'inspection-photos', 'signatures');
  },

  saveAuditLog: async (logData: { assetId: string; changes: any[]; context?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();

      const { error } = await supabase.from('asset_audit_logs').insert({
        asset_id: logData.assetId,
        user_id: user?.id,
        user_name: profile?.full_name || 'Técnico',
        changes: logData.changes,
        context: logData.context
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving audit log:', error);
      return false;
    }
  },

  getAuditLogs: async (assetId?: string): Promise<any[]> => {
    let query = supabase
      .from('asset_audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (assetId) {
      query = query.eq('asset_id', assetId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
    return data;
  },

  getAuditLogsByClient: async (clientId: string): Promise<any[]> => {
    try {
      // First get all asset IDs for this client
      const { data: assets } = await supabase
        .from('assets')
        .select('id')
        .eq('client_id', clientId);

      if (!assets || assets.length === 0) return [];

      const assetIds = assets.map(a => a.id);

      // Then get logs for these assets
      const { data, error } = await supabase
        .from('asset_audit_logs')
        .select('*')
        .in('asset_id', assetIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching audit logs by client:', error);
      return [];
    }
  }
};
