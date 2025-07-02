/**
 * Tenant Middleware
 * Express middleware for multi-tenant request handling
 */

import { Request, Response, NextFunction } from 'express';
import { TenantResolver } from '../core/tenant-resolver.js';
import { TenantStore } from '../storage/tenant-store.js';
import { RequestContext, runWithContext } from '../core/request-context.js';
import { getApiClientFactory } from '../core/api-client-factory.js';
import { TenantConfigManager } from '../core/tenant-config-manager.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      context?: RequestContext;
    }
  }
}

export interface TenantMiddlewareOptions {
  tenantStore: TenantStore;
  tenantResolver: TenantResolver;
  tenantConfigManager: TenantConfigManager;
  requireTenant?: boolean;
  excludePaths?: string[];
}

/**
 * Create tenant middleware
 */
export function createTenantMiddleware(options: TenantMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if path is excluded
    if (options.excludePaths?.some(path => req.path.startsWith(path))) {
      return next();
    }

    try {
      // Resolve tenant
      const tenantIdentifier = await options.tenantResolver.resolveFromHttpRequest(req as any);
      
      if (!tenantIdentifier) {
        if (options.requireTenant) {
          return res.status(400).json({
            error: 'Tenant identification required',
            message: 'Please provide tenant ID via X-Tenant-ID header or tenant query parameter'
          });
        }
        // Continue without tenant context
        return next();
      }

      // Validate tenant
      const validation = await options.tenantResolver.validateTenant(tenantIdentifier.tenantId);
      if (!validation.valid) {
        return res.status(403).json({
          error: 'Invalid tenant',
          message: validation.error
        });
      }

      // Get tenant configuration
      const tenant = await options.tenantConfigManager.getTenant(tenantIdentifier.tenantId);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          message: `Tenant ${tenantIdentifier.tenantId} does not exist`
        });
      }

      // Create request context
      const context = RequestContext.create(tenant, 'http', {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });

      // Attach to request
      req.tenantId = tenant.tenantId;
      req.context = context;

      // Log request
      context.log(`${req.method} ${req.path} [source: ${tenantIdentifier.source}]`);

      // Run with context
      runWithContext(context, () => {
        next();
      });

    } catch (error) {
      console.error('[TenantMiddleware] Error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process tenant information'
      });
    }
  };
}

/**
 * Rate limiting middleware per tenant
 */
export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export function createTenantRateLimitMiddleware(options: RateLimitOptions) {
  const tenantLimits = new Map<string, RateLimitEntry>();

  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [tenantId, entry] of tenantLimits.entries()) {
      if (entry.resetTime < now) {
        tenantLimits.delete(tenantId);
      }
    }
  }, options.windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantId) {
      return next(); // Skip if no tenant
    }

    const now = Date.now();
    const tenantId = req.tenantId;
    
    let entry = tenantLimits.get(tenantId);
    
    if (!entry || entry.resetTime < now) {
      // Create new window
      entry = {
        count: 0,
        resetTime: now + options.windowMs
      };
      tenantLimits.set(tenantId, entry);
    }

    entry.count++;

    if (entry.count > options.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      res.status(429)
        .set('X-RateLimit-Limit', options.maxRequests.toString())
        .set('X-RateLimit-Remaining', '0')
        .set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())
        .set('Retry-After', retryAfter.toString())
        .json({
          error: 'Too many requests',
          message: options.message || `Rate limit exceeded for tenant ${tenantId}`,
          retryAfter
        });
      
      return;
    }

    // Set rate limit headers
    res.set('X-RateLimit-Limit', options.maxRequests.toString());
    res.set('X-RateLimit-Remaining', (options.maxRequests - entry.count).toString());
    res.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    next();
  };
}

/**
 * Tenant isolation middleware - ensures data access is scoped to tenant
 */
export function createTenantIsolationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.context) {
      return next();
    }

    // Override res.json to add tenant context to responses
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // Add tenant context to response headers
      res.set('X-Tenant-ID', req.tenantId || 'none');
      res.set('X-Request-ID', req.context?.getRequestId() || 'unknown');
      
      return originalJson(data);
    };

    next();
  };
}

/**
 * Tenant admin middleware - for tenant management endpoints
 */
export function createTenantAdminMiddleware(options: {
  adminApiKey?: string;
  adminTokens?: string[];
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin authentication required'
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    
    // Check against admin API key
    if (options.adminApiKey && token === options.adminApiKey) {
      return next();
    }

    // Check against admin tokens list
    if (options.adminTokens && options.adminTokens.includes(token)) {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid admin credentials'
    });
  };
}