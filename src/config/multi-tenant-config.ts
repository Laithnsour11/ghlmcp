/**
 * Multi-Tenant Configuration Loader
 * Handles loading and managing tenant configurations from various sources
 */

import fs from 'fs';
import path from 'path';
import { TenantConfig } from '../storage/tenant-store.js';

export interface MultiTenantConfig {
  mode: 'single' | 'multi';
  tenants: TenantConfig[];
  defaultSettings: {
    rateLimits: {
      maxRequestsPerMinute: number;
      maxContactsPerDay: number;
      maxSMSPerDay: number;
      maxEmailsPerDay: number;
    };
    features: {
      voiceAI: boolean;
      sms: boolean;
      appointments: boolean;
      contacts: boolean;
      conversations: boolean;
    };
    security: {
      requireHTTPS: boolean;
      encryptAPIKeys: boolean;
      auditLogging: boolean;
    };
  };
}

export class MultiTenantConfigLoader {
  private config: MultiTenantConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration from environment and files
   */
  private loadConfiguration(): MultiTenantConfig {
    // Check if multi-tenant mode is enabled
    const isMultiTenant = process.env.MULTI_TENANT_MODE === 'true';

    if (!isMultiTenant) {
      // Single tenant mode - use environment variables
      return this.createSingleTenantConfig();
    }

    // Multi-tenant mode - load from file or environment
    const configPath = process.env.TENANT_CONFIG_PATH || 
                      path.join(process.cwd(), 'config', 'tenants.json');

    if (fs.existsSync(configPath)) {
      return this.loadFromFile(configPath);
    }

    // Fall back to environment-based multi-tenant config
    return this.createMultiTenantConfigFromEnv();
  }

  /**
   * Create single tenant configuration from environment
   */
  private createSingleTenantConfig(): MultiTenantConfig {
    const apiKey = process.env.GHL_API_KEY;
    const locationId = process.env.GHL_LOCATION_ID;

    if (!apiKey || !locationId) {
      throw new Error('GHL_API_KEY and GHL_LOCATION_ID must be set for single tenant mode');
    }

    return {
      mode: 'single',
      tenants: [{
        tenantId: 'default',
        name: 'Default Tenant',
        apiKey,
        locationId,
        baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }],
      defaultSettings: this.getDefaultSettings()
    };
  }

  /**
   * Load configuration from JSON file
   */
  private loadFromFile(configPath: string): MultiTenantConfig {
    try {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      const data = JSON.parse(fileContent);

      // Validate and transform tenant data
      const tenants: TenantConfig[] = (data.tenants || []).map((t: any) => ({
        tenantId: t.tenantId,
        name: t.name || t.tenantId,
        apiKey: t.apiKey,
        locationId: t.locationId,
        baseUrl: t.baseUrl || 'https://services.leadconnectorhq.com',
        isActive: t.isActive !== false,
        config: t.config || {},
        rateLimits: t.rateLimits || data.defaultSettings?.rateLimits || {},
        metadata: t.metadata || {},
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString()
      }));

      return {
        mode: 'multi',
        tenants,
        defaultSettings: data.defaultSettings || this.getDefaultSettings()
      };
    } catch (error) {
      console.error('Error loading tenant configuration from file:', error);
      throw new Error(`Failed to load tenant configuration from ${configPath}`);
    }
  }

  /**
   * Create multi-tenant config from environment variables
   */
  private createMultiTenantConfigFromEnv(): MultiTenantConfig {
    const tenants: TenantConfig[] = [];

    // Check for default tenant
    if (process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID) {
      tenants.push({
        tenantId: 'default',
        name: 'Default Tenant',
        apiKey: process.env.GHL_API_KEY,
        locationId: process.env.GHL_LOCATION_ID,
        baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Check for additional tenants (TENANT_1_*, TENANT_2_*, etc.)
    for (let i = 1; i <= 10; i++) {
      const apiKey = process.env[`TENANT_${i}_API_KEY`];
      const locationId = process.env[`TENANT_${i}_LOCATION_ID`];
      const tenantId = process.env[`TENANT_${i}_ID`] || `tenant-${i}`;
      const name = process.env[`TENANT_${i}_NAME`] || `Tenant ${i}`;

      if (apiKey && locationId) {
        tenants.push({
          tenantId,
          name,
          apiKey,
          locationId,
          baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    return {
      mode: 'multi',
      tenants,
      defaultSettings: this.getDefaultSettings()
    };
  }

  /**
   * Get default settings
   */
  private getDefaultSettings() {
    return {
      rateLimits: {
        maxRequestsPerMinute: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60'),
        maxContactsPerDay: parseInt(process.env.MAX_CONTACTS_PER_DAY || '1000'),
        maxSMSPerDay: parseInt(process.env.MAX_SMS_PER_DAY || '500'),
        maxEmailsPerDay: parseInt(process.env.MAX_EMAILS_PER_DAY || '1000')
      },
      features: {
        voiceAI: process.env.ENABLE_VOICE_AI_TOOLS === 'true',
        sms: process.env.ENABLE_SMS_TOOLS === 'true',
        appointments: process.env.ENABLE_APPOINTMENT_TOOLS === 'true',
        contacts: process.env.ENABLE_CONTACT_TOOLS !== 'false',
        conversations: process.env.ENABLE_CONVERSATION_TOOLS !== 'false'
      },
      security: {
        requireHTTPS: process.env.NODE_ENV === 'production',
        encryptAPIKeys: process.env.ENCRYPT_API_KEYS !== 'false',
        auditLogging: process.env.ENABLE_AUDIT_LOGGING === 'true'
      }
    };
  }

  /**
   * Get the loaded configuration
   */
  getConfig(): MultiTenantConfig {
    return this.config;
  }

  /**
   * Get configuration for a specific tenant
   */
  getTenantConfig(tenantId: string): TenantConfig | undefined {
    return this.config.tenants.find(t => t.tenantId === tenantId);
  }

  /**
   * Check if running in multi-tenant mode
   */
  isMultiTenant(): boolean {
    return this.config.mode === 'multi';
  }

  /**
   * Reload configuration (useful for hot-reloading)
   */
  reload(): void {
    this.config = this.loadConfiguration();
  }
}