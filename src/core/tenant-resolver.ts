/**
 * Tenant Resolver
 * Identifies and resolves tenants from various request sources
 */

import { IncomingMessage } from 'http';
import { TenantStore } from '../storage/tenant-store.js';

export interface TenantIdentifier {
  tenantId: string;
  source: 'header' | 'query' | 'env' | 'default';
}

export class TenantResolver {
  constructor(
    private tenantStore: TenantStore,
    private options: {
      headerName?: string;
      queryParam?: string;
      enableEnvFallback?: boolean;
    } = {}
  ) {
    this.options = {
      headerName: 'x-tenant-id',
      queryParam: 'tenant',
      enableEnvFallback: true,
      ...options
    };
  }

  /**
   * Resolve tenant from HTTP request
   */
  async resolveFromHttpRequest(req: IncomingMessage & { query?: any }): Promise<TenantIdentifier | null> {
    // 1. Check header
    if (this.options.headerName) {
      const headerValue = this.getHeaderValue(req, this.options.headerName);
      if (headerValue) {
        const exists = await this.tenantStore.exists(headerValue);
        if (exists) {
          return { tenantId: headerValue, source: 'header' };
        }
      }
    }

    // 2. Check query parameter
    if (this.options.queryParam && req.query) {
      const queryValue = req.query[this.options.queryParam];
      if (queryValue) {
        const exists = await this.tenantStore.exists(queryValue);
        if (exists) {
          return { tenantId: queryValue, source: 'query' };
        }
      }
    }

    // 3. Check URL path for tenant ID pattern (e.g., /api/tenant/123/...)
    const urlMatch = req.url?.match(/\/tenant\/([^\/]+)/);
    if (urlMatch && urlMatch[1]) {
      const pathTenantId = urlMatch[1];
      const exists = await this.tenantStore.exists(pathTenantId);
      if (exists) {
        return { tenantId: pathTenantId, source: 'query' };
      }
    }

    // 4. Fallback to environment/default
    if (this.options.enableEnvFallback) {
      const defaultExists = await this.tenantStore.exists('default');
      if (defaultExists) {
        return { tenantId: 'default', source: 'env' };
      }
    }

    return null;
  }

  /**
   * Resolve tenant from command line arguments or environment
   */
  async resolveFromCLI(args?: string[]): Promise<TenantIdentifier | null> {
    // Check for --tenant flag
    if (args) {
      const tenantIndex = args.findIndex(arg => arg === '--tenant');
      if (tenantIndex !== -1 && args[tenantIndex + 1]) {
        const tenantId = args[tenantIndex + 1];
        const exists = await this.tenantStore.exists(tenantId);
        if (exists) {
          return { tenantId, source: 'query' };
        }
      }
    }

    // Check environment variable
    if (process.env.GHL_TENANT_ID) {
      const exists = await this.tenantStore.exists(process.env.GHL_TENANT_ID);
      if (exists) {
        return { tenantId: process.env.GHL_TENANT_ID, source: 'env' };
      }
    }

    // Fallback to default
    if (this.options.enableEnvFallback) {
      const defaultExists = await this.tenantStore.exists('default');
      if (defaultExists) {
        return { tenantId: 'default', source: 'default' };
      }
    }

    return null;
  }

  /**
   * Resolve tenant from MCP message metadata
   */
  async resolveFromMCPMetadata(metadata?: Record<string, any>): Promise<TenantIdentifier | null> {
    if (metadata?.tenantId) {
      const exists = await this.tenantStore.exists(metadata.tenantId);
      if (exists) {
        return { tenantId: metadata.tenantId, source: 'header' };
      }
    }

    // Fallback to default for MCP
    const defaultExists = await this.tenantStore.exists('default');
    if (defaultExists) {
      return { tenantId: 'default', source: 'default' };
    }

    return null;
  }

  /**
   * Get header value (case-insensitive)
   */
  private getHeaderValue(req: IncomingMessage, headerName: string): string | undefined {
    const headers = req.headers;
    const lowerHeaderName = headerName.toLowerCase();
    
    // Direct match
    if (headers[lowerHeaderName]) {
      const value = headers[lowerHeaderName];
      return Array.isArray(value) ? value[0] : value;
    }

    // Case-insensitive search
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === lowerHeaderName) {
        return Array.isArray(value) ? value[0] : value;
      }
    }

    return undefined;
  }

  /**
   * Validate tenant has required configuration
   */
  async validateTenant(tenantId: string): Promise<{ valid: boolean; error?: string }> {
    const tenant = await this.tenantStore.get(tenantId);
    
    if (!tenant) {
      return { valid: false, error: 'Tenant not found' };
    }

    if (!tenant.isActive) {
      return { valid: false, error: 'Tenant is not active' };
    }

    if (!tenant.apiKey || !tenant.locationId) {
      return { valid: false, error: 'Tenant configuration incomplete' };
    }

    return { valid: true };
  }
}