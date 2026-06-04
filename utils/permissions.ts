export type PermissionModule =
  | 'home'
  | 'usuarios'
  | 'clientes'
  | 'fabricas'
  | 'facturacion'
  | 'reportes'
  | 'equipos'
  | 'tecnicos'
  | 'inspecciones'
  | 'mapa'
  | 'ajustes';

export interface ModulePermission {
  read: boolean;
  write: boolean;
}

export type UserPermissions = Record<PermissionModule, ModulePermission>;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  admin: {
    home: { read: true, write: true },
    usuarios: { read: true, write: true },
    clientes: { read: true, write: true },
    fabricas: { read: true, write: true },
    facturacion: { read: true, write: true },
    reportes: { read: true, write: true },
    equipos: { read: true, write: true },
    tecnicos: { read: true, write: true },
    inspecciones: { read: true, write: true },
    mapa: { read: true, write: true },
    ajustes: { read: true, write: true }
  },
  tecnico: {
    home: { read: true, write: false },
    usuarios: { read: false, write: false },
    clientes: { read: false, write: false },
    fabricas: { read: false, write: false },
    facturacion: { read: false, write: false },
    reportes: { read: false, write: false },
    equipos: { read: true, write: true },
    tecnicos: { read: false, write: false },
    inspecciones: { read: true, write: true },
    mapa: { read: true, write: false },
    ajustes: { read: true, write: true }
  },
  fabrica: {
    home: { read: true, write: false },
    usuarios: { read: false, write: false },
    clientes: { read: true, write: true },
    fabricas: { read: false, write: false },
    facturacion: { read: false, write: false },
    reportes: { read: true, write: false },
    equipos: { read: true, write: true },
    tecnicos: { read: true, write: true },
    inspecciones: { read: true, write: true },
    mapa: { read: true, write: false },
    ajustes: { read: true, write: true }
  },
  empresa: {
    home: { read: true, write: false },
    usuarios: { read: false, write: false },
    clientes: { read: false, write: false },
    fabricas: { read: false, write: false },
    facturacion: { read: false, write: false },
    reportes: { read: false, write: false },
    equipos: { read: true, write: false },
    tecnicos: { read: false, write: false },
    inspecciones: { read: true, write: false },
    mapa: { read: true, write: false },
    ajustes: { read: true, write: true }
  }
};

export const hasPermission = (
  profile: any,
  module: string,
  action: 'read' | 'write'
): boolean => {
  if (!profile) return false;

  // Admin by default has everything unless specifically overridden
  if (profile.role === 'admin' && !profile.permissions) return true;

  // Check custom permissions first
  if (profile.permissions && typeof profile.permissions === 'object') {
    const modulePerms = profile.permissions[module];
    if (modulePerms && typeof modulePerms === 'object' && modulePerms[action] !== undefined) {
      return !!modulePerms[action];
    }
  }

  // Fallback to default role permissions
  const role = profile.role || 'empresa';
  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role];
  if (defaultPerms) {
    const modulePerms = defaultPerms[module as PermissionModule];
    if (modulePerms) {
      return !!modulePerms[action];
    }
  }

  return false;
};
