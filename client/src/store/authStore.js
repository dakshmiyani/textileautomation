import { useState, useEffect } from 'react';

// Read initial state from localStorage safely
const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('erp_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

let globalState = {
  user: getInitialUser(),
  token: localStorage.getItem('erp_access_token') || null,
  isAuthenticated: !!localStorage.getItem('erp_access_token'),
  activeTenant: localStorage.getItem('erp_active_tenant') ? JSON.parse(localStorage.getItem('erp_active_tenant')) : null,
  sidebarOpen: true
};

const listeners = new Set();

function emitChange() {
  listeners.forEach((listener) => listener(globalState));
}

export const authStore = {
  getState: () => globalState,

  setUser: (user, tokens) => {
    let defaultTenant = globalState.activeTenant;
    if (!defaultTenant && user?.tenants?.length > 0) {
      defaultTenant = user.tenants[0];
    }

    globalState = {
      ...globalState,
      user,
      activeTenant: defaultTenant,
      token: tokens?.accessToken || globalState.token,
      isAuthenticated: true
    };
    if (user) localStorage.setItem('erp_user', JSON.stringify(user));
    if (defaultTenant) localStorage.setItem('erp_active_tenant', JSON.stringify(defaultTenant));
    if (tokens?.accessToken) localStorage.setItem('erp_access_token', tokens.accessToken);
    if (tokens?.refreshToken) localStorage.setItem('erp_refresh_token', tokens.refreshToken);
    emitChange();
  },

  clearAuth: () => {
    globalState = {
      ...globalState,
      user: null,
      token: null,
      activeTenant: null,
      isAuthenticated: false
    };
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_access_token');
    localStorage.removeItem('erp_refresh_token');
    localStorage.removeItem('erp_active_tenant');
    emitChange();
  },

  toggleSidebar: () => {
    globalState = {
      ...globalState,
      sidebarOpen: !globalState.sidebarOpen
    };
    emitChange();
  },

  setActiveTenant: (tenantId) => {
    if (!globalState.user || !globalState.user.tenants) return;
    const tenant = globalState.user.tenants.find(t => t.id === tenantId);
    if (tenant) {
      globalState = {
        ...globalState,
        activeTenant: tenant
      };
      localStorage.setItem('erp_active_tenant', JSON.stringify(tenant));
      emitChange();
    }
  },

  hasPermission: (permission) => {
    if (!globalState.user || !globalState.activeTenant) return false;
    const tenant = globalState.user.tenants.find(t => t.id === globalState.activeTenant.id);
    if (!tenant) return false;
    if (tenant.role_name === 'SUPER_ADMIN') return true;
    const permissions = tenant.permissions || [];
    return permissions.includes(permission);
  },

  hasAnyPermission: (...requiredPermissions) => {
    if (!globalState.user || !globalState.activeTenant) return false;
    const tenant = globalState.user.tenants.find(t => t.id === globalState.activeTenant.id);
    if (!tenant) return false;
    if (tenant.role_name === 'SUPER_ADMIN') return true;
    const permissions = tenant.permissions || [];
    return requiredPermissions.some((p) => permissions.includes(p));
  }
};

export function useAuth() {
  const [state, setState] = useState(globalState);

  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);

  return {
    ...state,
    setUser: authStore.setUser,
    logout: authStore.clearAuth,
    toggleSidebar: authStore.toggleSidebar,
    setActiveTenant: authStore.setActiveTenant,
    isSaasOwner: state.user?.tenants?.some(t => t.id === 1 && t.role_name === 'SUPER_ADMIN') || false,
    hasPermission: authStore.hasPermission,
    hasAnyPermission: authStore.hasAnyPermission
  };
}
