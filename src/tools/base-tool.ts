/**
 * Base Tool Class
 * Provides multi-tenant support for all tool implementations
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';
import { RequestContext, getCurrentContext } from '../core/request-context.js';
import { getApiClientFactory } from '../core/api-client-factory.js';

export abstract class BaseTool {
  private singleTenantClient?: GHLApiClient;

  constructor(ghlClient?: GHLApiClient) {
    // Support legacy single-tenant mode
    this.singleTenantClient = ghlClient;
  }

  /**
   * Get API client for current request context
   */
  protected getClient(): GHLApiClient {
    // Try to get from request context first (multi-tenant mode)
    const context = getCurrentContext();
    if (context) {
      return getApiClientFactory().getClient(context.tenant);
    }

    // Fall back to single-tenant mode
    if (this.singleTenantClient) {
      return this.singleTenantClient;
    }

    throw new Error('No API client available. Either provide a client in constructor or ensure request context is set.');
  }

  /**
   * Get current request context
   */
  protected getContext(): RequestContext | undefined {
    return getCurrentContext();
  }

  /**
   * Log with context if available
   */
  protected log(message: string, data?: any): void {
    const context = this.getContext();
    if (context) {
      context.log(message, data);
    } else {
      console.log(`[${this.constructor.name}] ${message}`, data || '');
    }
  }

  /**
   * Log error with context if available
   */
  protected logError(message: string, error?: any): void {
    const context = this.getContext();
    if (context) {
      context.error(message, error);
    } else {
      console.error(`[${this.constructor.name}] ERROR: ${message}`, error || '');
    }
  }

  /**
   * Get tenant ID from context or default
   */
  protected getTenantId(): string {
    const context = this.getContext();
    return context ? context.getTenantId() : 'default';
  }

  /**
   * Check if running in multi-tenant mode
   */
  protected isMultiTenantMode(): boolean {
    return getCurrentContext() !== undefined;
  }

  /**
   * Execute with error handling and logging
   */
  protected async executeWithLogging<T>(
    operation: string,
    params: any,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    this.log(`Executing ${operation}`, params);

    try {
      const result = await fn();
      
      const duration = Date.now() - startTime;
      this.log(`Completed ${operation} in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError(`Failed ${operation} after ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Validate required parameters
   */
  protected validateRequired(params: any, required: string[]): void {
    const missing = required.filter(field => !params[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * Sanitize parameters to prevent injection
   */
  protected sanitizeParams<T extends Record<string, any>>(params: T): T {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'string') {
        // Basic sanitization - can be enhanced based on needs
        sanitized[key] = value.trim();
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(v => 
          typeof v === 'string' ? v.trim() : v
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }
}