/**
 * GHL API Client Factory
 * Creates and manages API client instances per tenant with connection pooling
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';
import { GHLConfig } from '../types/ghl-types.js';
import { TenantConfig } from '../storage/tenant-store.js';

interface CachedClient {
  client: GHLApiClient;
  lastUsed: Date;
  tenantId: string;
}

export class GHLApiClientFactory {
  private clientCache: Map<string, CachedClient> = new Map();
  private readonly maxCacheSize: number;
  private readonly ttlMinutes: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options?: {
    maxCacheSize?: number;
    ttlMinutes?: number;
    cleanupIntervalMinutes?: number;
  }) {
    this.maxCacheSize = options?.maxCacheSize || 100;
    this.ttlMinutes = options?.ttlMinutes || 60;
    
    // Start cleanup interval
    const cleanupIntervalMinutes = options?.cleanupIntervalMinutes || 15;
    this.startCleanupInterval(cleanupIntervalMinutes);
  }

  /**
   * Get or create a GHL API client for a tenant
   */
  getClient(tenant: TenantConfig): GHLApiClient {
    const cacheKey = this.getCacheKey(tenant);
    
    // Check cache
    const cached = this.clientCache.get(cacheKey);
    if (cached) {
      cached.lastUsed = new Date();
      console.log(`[APIClientFactory] Returning cached client for tenant: ${tenant.tenantId}`);
      return cached.client;
    }

    // Create new client
    console.log(`[APIClientFactory] Creating new client for tenant: ${tenant.tenantId}`);
    const client = this.createClient(tenant);
    
    // Add to cache
    this.addToCache(cacheKey, {
      client,
      lastUsed: new Date(),
      tenantId: tenant.tenantId
    });

    return client;
  }

  /**
   * Create a new GHL API client
   */
  private createClient(tenant: TenantConfig): GHLApiClient {
    const config: GHLConfig = {
      accessToken: tenant.apiKey,
      baseUrl: tenant.baseUrl || 'https://services.leadconnectorhq.com',
      version: tenant.version || '2021-07-28',
      locationId: tenant.locationId
    };

    return new GHLApiClient(config);
  }

  /**
   * Generate cache key for tenant
   */
  private getCacheKey(tenant: TenantConfig): string {
    // Include API key hash to handle key rotation
    const keyHash = this.hashString(tenant.apiKey);
    return `${tenant.tenantId}_${keyHash}`;
  }

  /**
   * Simple string hash for cache key
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Add client to cache with LRU eviction
   */
  private addToCache(key: string, cached: CachedClient): void {
    // Check cache size
    if (this.clientCache.size >= this.maxCacheSize) {
      // Find and remove least recently used
      let oldestKey: string | null = null;
      let oldestTime = new Date();

      for (const [k, v] of this.clientCache.entries()) {
        if (v.lastUsed < oldestTime) {
          oldestTime = v.lastUsed;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        console.log(`[APIClientFactory] Evicting LRU client: ${this.clientCache.get(oldestKey)?.tenantId}`);
        this.clientCache.delete(oldestKey);
      }
    }

    this.clientCache.set(key, cached);
  }

  /**
   * Start cleanup interval to remove expired clients
   */
  private startCleanupInterval(intervalMinutes: number): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredClients();
    }, intervalMinutes * 60 * 1000);

    // Don't block process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Clean up expired clients
   */
  private cleanupExpiredClients(): void {
    const now = new Date();
    const expiryTime = this.ttlMinutes * 60 * 1000;
    let removedCount = 0;

    for (const [key, cached] of this.clientCache.entries()) {
      const age = now.getTime() - cached.lastUsed.getTime();
      if (age > expiryTime) {
        this.clientCache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`[APIClientFactory] Cleaned up ${removedCount} expired clients`);
    }
  }

  /**
   * Clear cache for a specific tenant
   */
  clearTenantCache(tenantId: string): void {
    const keysToRemove: string[] = [];
    
    for (const [key, cached] of this.clientCache.entries()) {
      if (cached.tenantId === tenantId) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.clientCache.delete(key));
    
    if (keysToRemove.length > 0) {
      console.log(`[APIClientFactory] Cleared ${keysToRemove.length} cached clients for tenant: ${tenantId}`);
    }
  }

  /**
   * Clear all cached clients
   */
  clearAllCache(): void {
    const size = this.clientCache.size;
    this.clientCache.clear();
    console.log(`[APIClientFactory] Cleared all ${size} cached clients`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    tenants: string[];
    oldestAccess: Date | null;
    newestAccess: Date | null;
  } {
    let oldest: Date | null = null;
    let newest: Date | null = null;
    const tenants = new Set<string>();

    for (const cached of this.clientCache.values()) {
      tenants.add(cached.tenantId);
      
      if (!oldest || cached.lastUsed < oldest) {
        oldest = cached.lastUsed;
      }
      if (!newest || cached.lastUsed > newest) {
        newest = cached.lastUsed;
      }
    }

    return {
      size: this.clientCache.size,
      tenants: Array.from(tenants),
      oldestAccess: oldest,
      newestAccess: newest
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearAllCache();
  }
}

// Singleton instance
let factoryInstance: GHLApiClientFactory | null = null;

/**
 * Get or create the singleton factory instance
 */
export function getApiClientFactory(): GHLApiClientFactory {
  if (!factoryInstance) {
    factoryInstance = new GHLApiClientFactory();
  }
  return factoryInstance;
}

/**
 * Reset the factory (mainly for testing)
 */
export function resetApiClientFactory(): void {
  if (factoryInstance) {
    factoryInstance.destroy();
    factoryInstance = null;
  }
}