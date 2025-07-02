import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface Tenant {
  tenantId: string
  name: string
  apiKey: string
  locationId: string
  baseUrl?: string
  isActive: boolean
  features?: {
    voiceAI?: boolean
    sms?: boolean
    appointments?: boolean
    contacts?: boolean
    conversations?: boolean
    [key: string]: boolean | undefined
  }
  config?: Record<string, any>
  rateLimits?: {
    maxRequestsPerMinute?: number
    maxContactsPerDay?: number
    maxSMSPerDay?: number
  }
  createdAt?: string
  updatedAt?: string
}

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/mt/api/auth/login', { username, password })
    return response.data
  },
  
  verify: async () => {
    const response = await api.get('/mt/api/auth/verify')
    return response.data
  },
}

export const tenantApi = {
  list: async () => {
    const response = await api.get<{ tenants: Tenant[] }>('/mt/api/tenants')
    return response.data.tenants
  },
  
  get: async (tenantId: string) => {
    const response = await api.get<Tenant>(`/mt/api/tenants/${tenantId}`)
    return response.data
  },
  
  create: async (tenant: Omit<Tenant, 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Tenant>('/mt/api/tenants', tenant)
    return response.data
  },
  
  update: async (tenantId: string, updates: Partial<Tenant>) => {
    const response = await api.put<Tenant>(`/mt/api/tenants/${tenantId}`, updates)
    return response.data
  },
  
  delete: async (tenantId: string) => {
    const response = await api.delete(`/mt/api/tenants/${tenantId}`)
    return response.data
  },
  
  test: async (tenantId: string) => {
    const response = await api.post(`/mt/api/tenants/${tenantId}/test`)
    return response.data
  },
}