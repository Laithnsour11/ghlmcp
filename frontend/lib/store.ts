import { create } from 'zustand'
import { Tenant } from './api'

interface AuthState {
  isAuthenticated: boolean
  token: string | null
  setAuth: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  setAuth: (token) => {
    if (token) {
      localStorage.setItem('auth_token', token)
      set({ isAuthenticated: true, token })
    } else {
      localStorage.removeItem('auth_token')
      set({ isAuthenticated: false, token: null })
    }
  },
  logout: () => {
    localStorage.removeItem('auth_token')
    set({ isAuthenticated: false, token: null })
  },
}))

interface TenantState {
  tenants: Tenant[]
  loading: boolean
  error: string | null
  setTenants: (tenants: Tenant[]) => void
  addTenant: (tenant: Tenant) => void
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => void
  removeTenant: (tenantId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useTenantStore = create<TenantState>((set) => ({
  tenants: [],
  loading: false,
  error: null,
  setTenants: (tenants) => set({ tenants }),
  addTenant: (tenant) => set((state) => ({ 
    tenants: [...state.tenants, tenant] 
  })),
  updateTenant: (tenantId, updates) => set((state) => ({
    tenants: state.tenants.map((t) => 
      t.tenantId === tenantId ? { ...t, ...updates } : t
    ),
  })),
  removeTenant: (tenantId) => set((state) => ({
    tenants: state.tenants.filter((t) => t.tenantId !== tenantId),
  })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))