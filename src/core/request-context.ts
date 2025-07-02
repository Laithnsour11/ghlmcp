/**
 * Request Context
 * Carries tenant information and request-specific data through the application
 */

import { TenantConfig } from '../storage/tenant-store.js';

export interface RequestMetadata {
  requestId: string;
  timestamp: Date;
  source: 'stdio' | 'http' | 'sse';
  userAgent?: string;
  ip?: string;
}

export class RequestContext {
  private static requestCounter = 0;

  constructor(
    public readonly tenant: TenantConfig,
    public readonly metadata: RequestMetadata
  ) {}

  /**
   * Create a new request context
   */
  static create(
    tenant: TenantConfig,
    source: 'stdio' | 'http' | 'sse',
    additionalMetadata?: Partial<RequestMetadata>
  ): RequestContext {
    const requestId = `req_${Date.now()}_${++this.requestCounter}`;
    
    const metadata: RequestMetadata = {
      requestId,
      timestamp: new Date(),
      source,
      ...additionalMetadata
    };

    return new RequestContext(tenant, metadata);
  }

  /**
   * Get tenant ID
   */
  getTenantId(): string {
    return this.tenant.tenantId;
  }

  /**
   * Get request ID
   */
  getRequestId(): string {
    return this.metadata.requestId;
  }

  /**
   * Create a log prefix for consistent logging
   */
  getLogPrefix(): string {
    return `[${this.metadata.requestId}] [Tenant: ${this.tenant.tenantId}]`;
  }

  /**
   * Log with context
   */
  log(message: string, data?: any): void {
    const prefix = this.getLogPrefix();
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Log error with context
   */
  error(message: string, error?: any): void {
    const prefix = this.getLogPrefix();
    console.error(`${prefix} ERROR: ${message}`, error);
  }
}

/**
 * Async Local Storage for Request Context
 * Allows accessing context anywhere in the async call chain
 */
import { AsyncLocalStorage } from 'async_hooks';

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Run a function with a request context
 */
export function runWithContext<T>(
  context: RequestContext,
  fn: () => T | Promise<T>
): T | Promise<T> {
  return requestContextStorage.run(context, fn);
}

/**
 * Get current request context
 */
export function getCurrentContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Require current request context (throws if not found)
 */
export function requireContext(): RequestContext {
  const context = getCurrentContext();
  if (!context) {
    throw new Error('No request context available');
  }
  return context;
}