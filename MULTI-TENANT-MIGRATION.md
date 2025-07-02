# Multi-Tenant Migration Guide

This guide helps you migrate from single-tenant to multi-tenant mode for the GoHighLevel MCP Server.

## Overview

The multi-tenant architecture allows a single server instance to handle multiple GoHighLevel accounts (tenants) simultaneously. Each tenant has isolated data access and separate API credentials.

## Key Features

- **Backward Compatible**: Existing single-tenant deployments continue to work without changes
- **Multiple Identification Methods**: Tenants can be identified via headers, query params, or URL paths
- **Secure Storage**: API keys are encrypted at rest
- **Connection Pooling**: Efficient resource usage with cached API clients
- **Rate Limiting**: Per-tenant rate limits to prevent abuse
- **Admin API**: RESTful endpoints for tenant management

## Migration Steps

### 1. Environment Variables

Update your `.env` file with the new configuration:

```env
# Existing variables (keep these for backward compatibility)
GHL_API_KEY=your-api-key
GHL_LOCATION_ID=your-location-id
GHL_BASE_URL=https://services.leadconnectorhq.com

# New multi-tenant variables
ADMIN_API_KEY=generate-a-secure-admin-key
TENANT_ENCRYPTION_KEY=generate-a-secure-encryption-key
```

### 2. Update Server Entry Point

#### For HTTP Server (ChatGPT/Web)

Replace usage of `http-server.ts` with `http-server-multi-tenant.ts`:

```bash
# Old
npm run start:http

# New (update package.json script)
node dist/http-server-multi-tenant.js
```

#### For STDIO Server (Claude Desktop)

The STDIO server (`server.ts`) automatically supports multi-tenancy when environment variables are configured.

### 3. Tenant Identification

Clients can identify their tenant using:

#### HTTP Header (Recommended)
```javascript
fetch('https://your-server.com/sse', {
  headers: {
    'X-Tenant-ID': 'tenant_123'
  }
});
```

#### Query Parameter
```
https://your-server.com/sse?tenant=tenant_123
```

#### URL Path
```
https://your-server.com/tenant/tenant_123/sse
```

### 4. Admin API Usage

#### Create a New Tenant

```bash
curl -X POST https://your-server.com/admin/tenants \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "apiKey": "ghl-api-key-for-acme",
    "locationId": "acme-location-id"
  }'
```

#### List All Tenants

```bash
curl https://your-server.com/admin/tenants \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

#### Update Tenant

```bash
curl -X PUT https://your-server.com/admin/tenants/tenant_123 \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "new-api-key",
    "isActive": true
  }'
```

#### Delete Tenant

```bash
curl -X DELETE https://your-server.com/admin/tenants/tenant_123 \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

## Code Changes for Tool Classes

If you have custom tools, update them to extend `BaseTool`:

### Before (Single-Tenant)
```typescript
export class MyCustomTool {
  constructor(private ghlClient: GHLApiClient) {}
  
  async doSomething() {
    return this.ghlClient.makeRequest(...);
  }
}
```

### After (Multi-Tenant)
```typescript
import { BaseTool } from './base-tool';

export class MyCustomTool extends BaseTool {
  async doSomething() {
    const client = this.getClient(); // Gets tenant-specific client
    this.log('Doing something'); // Tenant-aware logging
    return client.makeRequest(...);
  }
}
```

## Testing Multi-Tenancy

### 1. Create Test Tenants

```bash
# Create tenant A
curl -X POST http://localhost:8000/admin/tenants \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-a",
    "name": "Test Tenant A",
    "apiKey": "test-api-key-a",
    "locationId": "test-location-a"
  }'

# Create tenant B
curl -X POST http://localhost:8000/admin/tenants \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-b",
    "name": "Test Tenant B",
    "apiKey": "test-api-key-b",
    "locationId": "test-location-b"
  }'
```

### 2. Test Tenant Isolation

```bash
# Request as Tenant A
curl http://localhost:8000/tools \
  -H "X-Tenant-ID: test-a"

# Request as Tenant B
curl http://localhost:8000/tools \
  -H "X-Tenant-ID: test-b"
```

## Security Considerations

1. **Admin API Key**: Keep the `ADMIN_API_KEY` secure and rotate regularly
2. **Encryption Key**: The `TENANT_ENCRYPTION_KEY` encrypts API keys at rest. Never change this in production without re-encrypting all tenant data
3. **Rate Limiting**: Default is 100 requests/minute per tenant. Adjust in `http-server-multi-tenant.ts` if needed
4. **HTTPS**: Always use HTTPS in production to protect tenant credentials in transit

## Troubleshooting

### "No tenant identified" Error
- Ensure you're sending the `X-Tenant-ID` header or `tenant` query parameter
- Check that the tenant exists and is active

### "Rate limit exceeded" Error
- The tenant has exceeded their rate limit
- Wait for the time specified in the `Retry-After` header

### Connection Pool Issues
- The server caches API clients for performance
- If you update tenant credentials, they take effect on the next request
- Cache entries expire after 60 minutes of inactivity

## Rollback Plan

If you need to rollback to single-tenant mode:

1. Keep the original environment variables (`GHL_API_KEY`, `GHL_LOCATION_ID`)
2. Switch back to using `http-server.ts` instead of `http-server-multi-tenant.ts`
3. The system will automatically use the environment variables as the "default" tenant

## Performance Considerations

- **Connection Pooling**: Each tenant's API client is cached for 60 minutes
- **Maximum Cache Size**: Default is 100 concurrent tenants
- **Memory Usage**: Approximately 1MB per cached tenant
- **Cleanup**: Inactive tenant connections are cleaned up every 15 minutes

## Next Steps

1. Test in a staging environment first
2. Monitor memory usage and adjust cache settings if needed
3. Implement monitoring for per-tenant usage
4. Consider adding webhook support for tenant provisioning
5. Add audit logging for compliance requirements