/**
 * Tenant Store Interface and Implementations
 * Provides storage abstraction for tenant configurations
 */

export interface TenantConfig {
  tenantId: string;
  name: string;
  apiKey: string;
  locationId: string;
  baseUrl?: string;
  version?: string;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TenantStore {
  get(tenantId: string): Promise<TenantConfig | null>;
  getAll(): Promise<TenantConfig[]>;
  create(config: Omit<TenantConfig, 'createdAt' | 'updatedAt'>): Promise<TenantConfig>;
  update(tenantId: string, config: Partial<TenantConfig>): Promise<TenantConfig>;
  delete(tenantId: string): Promise<boolean>;
  exists(tenantId: string): Promise<boolean>;
}

/**
 * In-Memory Tenant Store
 * Simple implementation for development and testing
 */
export class InMemoryTenantStore implements TenantStore {
  private tenants: Map<string, TenantConfig> = new Map();

  async get(tenantId: string): Promise<TenantConfig | null> {
    return this.tenants.get(tenantId) || null;
  }

  async getAll(): Promise<TenantConfig[]> {
    return Array.from(this.tenants.values());
  }

  async create(config: Omit<TenantConfig, 'createdAt' | 'updatedAt'>): Promise<TenantConfig> {
    const now = new Date();
    const tenant: TenantConfig = {
      ...config,
      createdAt: now,
      updatedAt: now
    };
    
    this.tenants.set(tenant.tenantId, tenant);
    return tenant;
  }

  async update(tenantId: string, config: Partial<TenantConfig>): Promise<TenantConfig> {
    const existing = await this.get(tenantId);
    if (!existing) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const updated: TenantConfig = {
      ...existing,
      ...config,
      tenantId: existing.tenantId, // Prevent ID change
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date()
    };

    this.tenants.set(tenantId, updated);
    return updated;
  }

  async delete(tenantId: string): Promise<boolean> {
    return this.tenants.delete(tenantId);
  }

  async exists(tenantId: string): Promise<boolean> {
    return this.tenants.has(tenantId);
  }
}

/**
 * Environment Variable Tenant Store
 * Maintains backward compatibility by reading from env vars
 */
export class EnvVarTenantStore implements TenantStore {
  private defaultTenant: TenantConfig | null = null;

  constructor() {
    // Initialize from environment variables if available
    if (process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID) {
      this.defaultTenant = {
        tenantId: 'default',
        name: 'Default Tenant',
        apiKey: process.env.GHL_API_KEY,
        locationId: process.env.GHL_LOCATION_ID,
        baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
        version: '2021-07-28',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  async get(tenantId: string): Promise<TenantConfig | null> {
    if (tenantId === 'default' && this.defaultTenant) {
      return this.defaultTenant;
    }
    return null;
  }

  async getAll(): Promise<TenantConfig[]> {
    return this.defaultTenant ? [this.defaultTenant] : [];
  }

  async create(): Promise<TenantConfig> {
    throw new Error('EnvVarTenantStore is read-only');
  }

  async update(): Promise<TenantConfig> {
    throw new Error('EnvVarTenantStore is read-only');
  }

  async delete(): Promise<boolean> {
    throw new Error('EnvVarTenantStore is read-only');
  }

  async exists(tenantId: string): Promise<boolean> {
    return tenantId === 'default' && this.defaultTenant !== null;
  }
}

/**
 * Composite Tenant Store
 * Combines multiple stores with fallback mechanism
 */
export class CompositeTenantStore implements TenantStore {
  constructor(
    private primaryStore: TenantStore,
    private fallbackStore: TenantStore
  ) {}

  async get(tenantId: string): Promise<TenantConfig | null> {
    const primary = await this.primaryStore.get(tenantId);
    if (primary) return primary;
    
    return this.fallbackStore.get(tenantId);
  }

  async getAll(): Promise<TenantConfig[]> {
    const primary = await this.primaryStore.getAll();
    const fallback = await this.fallbackStore.getAll();
    
    // Merge, avoiding duplicates
    const merged = new Map<string, TenantConfig>();
    [...fallback, ...primary].forEach(tenant => {
      merged.set(tenant.tenantId, tenant);
    });
    
    return Array.from(merged.values());
  }

  async create(config: Omit<TenantConfig, 'createdAt' | 'updatedAt'>): Promise<TenantConfig> {
    return this.primaryStore.create(config);
  }

  async update(tenantId: string, config: Partial<TenantConfig>): Promise<TenantConfig> {
    // Check if exists in primary first
    if (await this.primaryStore.exists(tenantId)) {
      return this.primaryStore.update(tenantId, config);
    }
    
    // If exists only in fallback, create in primary with updated config
    const fallbackTenant = await this.fallbackStore.get(tenantId);
    if (fallbackTenant) {
      const newTenant = { ...fallbackTenant, ...config };
      const { createdAt, updatedAt, ...createConfig } = newTenant;
      return this.primaryStore.create(createConfig);
    }
    
    throw new Error(`Tenant ${tenantId} not found`);
  }

  async delete(tenantId: string): Promise<boolean> {
    return this.primaryStore.delete(tenantId);
  }

  async exists(tenantId: string): Promise<boolean> {
    return (await this.primaryStore.exists(tenantId)) || 
           (await this.fallbackStore.exists(tenantId));
  }
}

/**
 * Factory function to create appropriate tenant store
 */
export function createTenantStore(): TenantStore {
  // Use composite store for backward compatibility
  const memoryStore = new InMemoryTenantStore();
  const envStore = new EnvVarTenantStore();
  
  return new CompositeTenantStore(memoryStore, envStore);
}