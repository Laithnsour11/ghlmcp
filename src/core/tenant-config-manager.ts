/**
 * Tenant Configuration Manager
 * Handles CRUD operations for tenant configurations with validation
 */

import { TenantStore, TenantConfig } from '../storage/tenant-store.js';
import { getApiClientFactory } from './api-client-factory.js';
import * as crypto from 'crypto';

export interface CreateTenantRequest {
  tenantId?: string; // Optional, will be generated if not provided
  name: string;
  apiKey: string;
  locationId: string;
  baseUrl?: string;
  version?: string;
  settings?: Record<string, any>;
}

export interface UpdateTenantRequest {
  name?: string;
  apiKey?: string;
  locationId?: string;
  baseUrl?: string;
  version?: string;
  settings?: Record<string, any>;
  isActive?: boolean;
}

export class TenantConfigManager {
  private encryptionKey: string;

  constructor(
    private tenantStore: TenantStore,
    options?: {
      encryptionKey?: string;
    }
  ) {
    // Use provided key or generate from env/default
    this.encryptionKey = options?.encryptionKey || 
                         process.env.TENANT_ENCRYPTION_KEY || 
                         'default-encryption-key-change-in-production';
  }

  /**
   * Create a new tenant
   */
  async createTenant(request: CreateTenantRequest): Promise<TenantConfig> {
    // Validate request
    this.validateCreateRequest(request);

    // Generate tenant ID if not provided
    const tenantId = request.tenantId || this.generateTenantId();

    // Check if tenant already exists
    if (await this.tenantStore.exists(tenantId)) {
      throw new Error(`Tenant ${tenantId} already exists`);
    }

    // Encrypt sensitive data
    const encryptedApiKey = this.encrypt(request.apiKey);

    // Create tenant config
    const config: Omit<TenantConfig, 'createdAt' | 'updatedAt'> = {
      tenantId,
      name: request.name,
      apiKey: encryptedApiKey,
      locationId: request.locationId,
      baseUrl: request.baseUrl || 'https://services.leadconnectorhq.com',
      version: request.version || '2021-07-28',
      settings: request.settings || {},
      isActive: true
    };

    // Test the configuration
    await this.testTenantConfig(config);

    // Save to store
    const tenant = await this.tenantStore.create(config);
    
    console.log(`[TenantConfigManager] Created tenant: ${tenantId}`);
    return tenant;
  }

  /**
   * Get tenant configuration (with decrypted API key)
   */
  async getTenant(tenantId: string): Promise<TenantConfig | null> {
    const tenant = await this.tenantStore.get(tenantId);
    if (!tenant) return null;

    // Decrypt API key
    return {
      ...tenant,
      apiKey: this.decrypt(tenant.apiKey)
    };
  }

  /**
   * Get all tenants (without decrypted API keys for security)
   */
  async getAllTenants(): Promise<Array<Omit<TenantConfig, 'apiKey'>>> {
    const tenants = await this.tenantStore.getAll();
    return tenants.map(({ apiKey, ...tenant }) => tenant);
  }

  /**
   * Update tenant configuration
   */
  async updateTenant(tenantId: string, request: UpdateTenantRequest): Promise<TenantConfig> {
    // Check if tenant exists
    const existing = await this.tenantStore.get(tenantId);
    if (!existing) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Prepare update
    const update: Partial<TenantConfig> = {};
    
    if (request.name !== undefined) update.name = request.name;
    if (request.locationId !== undefined) update.locationId = request.locationId;
    if (request.baseUrl !== undefined) update.baseUrl = request.baseUrl;
    if (request.version !== undefined) update.version = request.version;
    if (request.settings !== undefined) update.settings = request.settings;
    if (request.isActive !== undefined) update.isActive = request.isActive;
    
    if (request.apiKey !== undefined) {
      update.apiKey = this.encrypt(request.apiKey);
    }

    // Test new configuration if critical fields changed
    if (request.apiKey || request.locationId || request.baseUrl) {
      const testConfig = {
        ...existing,
        ...update,
        apiKey: request.apiKey ? request.apiKey : this.decrypt(existing.apiKey)
      };
      await this.testTenantConfig(testConfig);
    }

    // Update in store
    const updated = await this.tenantStore.update(tenantId, update);
    
    // Clear API client cache for this tenant
    getApiClientFactory().clearTenantCache(tenantId);
    
    console.log(`[TenantConfigManager] Updated tenant: ${tenantId}`);
    return {
      ...updated,
      apiKey: this.decrypt(updated.apiKey)
    };
  }

  /**
   * Delete tenant
   */
  async deleteTenant(tenantId: string): Promise<boolean> {
    // Prevent deletion of default tenant
    if (tenantId === 'default') {
      throw new Error('Cannot delete default tenant');
    }

    // Clear API client cache
    getApiClientFactory().clearTenantCache(tenantId);

    // Delete from store
    const deleted = await this.tenantStore.delete(tenantId);
    
    if (deleted) {
      console.log(`[TenantConfigManager] Deleted tenant: ${tenantId}`);
    }
    
    return deleted;
  }

  /**
   * Activate/deactivate tenant
   */
  async setTenantActive(tenantId: string, isActive: boolean): Promise<TenantConfig> {
    return this.updateTenant(tenantId, { isActive });
  }

  /**
   * Test tenant configuration
   */
  private async testTenantConfig(config: Partial<TenantConfig>): Promise<void> {
    if (!config.apiKey || !config.locationId) {
      throw new Error('API key and location ID are required');
    }

    // Create a test client
    const { GHLApiClient } = await import('../clients/ghl-api-client.js');
    const testClient = new GHLApiClient({
      accessToken: config.apiKey,
      baseUrl: config.baseUrl || 'https://services.leadconnectorhq.com',
      version: config.version || '2021-07-28',
      locationId: config.locationId
    });

    // Test connection
    try {
      await testClient.testConnection();
    } catch (error) {
      throw new Error(`Invalid tenant configuration: ${error}`);
    }
  }

  /**
   * Validate create request
   */
  private validateCreateRequest(request: CreateTenantRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Tenant name is required');
    }

    if (!request.apiKey || request.apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }

    if (!request.locationId || request.locationId.trim().length === 0) {
      throw new Error('Location ID is required');
    }

    // Validate tenant ID format if provided
    if (request.tenantId) {
      if (!/^[a-zA-Z0-9_-]+$/.test(request.tenantId)) {
        throw new Error('Tenant ID must contain only alphanumeric characters, hyphens, and underscores');
      }
    }
  }

  /**
   * Generate tenant ID
   */
  private generateTenantId(): string {
    return `tenant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        // Handle unencrypted data (for backward compatibility)
        return encryptedText;
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // If decryption fails, assume it's not encrypted (backward compatibility)
      console.warn('[TenantConfigManager] Failed to decrypt, assuming plain text');
      return encryptedText;
    }
  }
}