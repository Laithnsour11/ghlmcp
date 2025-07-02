/**
 * Vercel API handler for multi-tenant GoHighLevel MCP server
 * This is a simplified handler that provides multi-tenant support
 */

const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Tenant-ID'],
  maxAge: 86400
};

// Apply CORS
const corsMiddleware = cors(corsOptions);

// Store tenant configurations (in production, use a database)
const tenantStore = new Map();

// Initialize default tenant from environment variables
if (process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID) {
  tenantStore.set('default', {
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

// Helper to get tenant from request
function getTenantFromRequest(req) {
  // Check header first
  const tenantId = req.headers['x-tenant-id'] || 
                   req.query.tenant || 
                   req.query.tenantId ||
                   'default';
  
  return tenantStore.get(tenantId);
}

// Helper to create JSON-RPC response
function createJsonRpcResponse(id, result = null, error = null) {
  const response = {
    jsonrpc: "2.0",
    id: id
  };
  
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  
  return response;
}

// Helper to send SSE
function sendSSE(res, data) {
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  res.write(`data: ${message}\n\n`);
}

// Main handler
module.exports = async (req, res) => {
  // Apply CORS
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const tenant = getTenantFromRequest(req);
  console.log(`[Multi-Tenant] Request from tenant: ${tenant?.tenantId || 'unknown'}`);

  // Health check
  if (req.url === '/' || req.url === '/health') {
    res.status(200).json({
      status: 'healthy',
      mode: 'multi-tenant',
      tenant: tenant ? {
        id: tenant.tenantId,
        name: tenant.name,
        active: tenant.isActive
      } : null,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Tenant management endpoints
  if (req.url === '/api/tenants' && req.method === 'GET') {
    // List tenants (admin only - add auth in production)
    const tenants = Array.from(tenantStore.values()).map(t => ({
      tenantId: t.tenantId,
      name: t.name,
      isActive: t.isActive,
      createdAt: t.createdAt
    }));
    
    res.status(200).json({ tenants });
    return;
  }

  if (req.url === '/api/tenants' && req.method === 'POST') {
    // Create tenant (admin only - add auth in production)
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    
    await new Promise(resolve => req.on('end', resolve));
    
    try {
      const data = JSON.parse(body);
      
      if (!data.tenantId || !data.apiKey || !data.locationId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      const newTenant = {
        tenantId: data.tenantId,
        name: data.name || data.tenantId,
        apiKey: data.apiKey,
        locationId: data.locationId,
        baseUrl: data.baseUrl || 'https://services.leadconnectorhq.com',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      tenantStore.set(data.tenantId, newTenant);
      
      res.status(201).json({ 
        message: 'Tenant created',
        tenant: {
          tenantId: newTenant.tenantId,
          name: newTenant.name,
          isActive: newTenant.isActive
        }
      });
    } catch (error) {
      res.status(400).json({ error: 'Invalid JSON' });
    }
    return;
  }

  // SSE endpoint
  if (req.url === '/sse') {
    if (!tenant) {
      res.status(401).json({ error: 'Tenant not found' });
      return;
    }

    if (!tenant.isActive) {
      res.status(403).json({ error: 'Tenant is not active' });
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Handle GET (SSE connection)
    if (req.method === 'GET') {
      console.log(`[Multi-Tenant] SSE connection established for tenant: ${tenant.tenantId}`);
      
      // Send initialization
      sendSSE(res, {
        jsonrpc: "2.0",
        method: "notification/initialized",
        params: {
          tenantId: tenant.tenantId,
          tenantName: tenant.name
        }
      });

      // Heartbeat
      const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
      }, 25000);

      // Cleanup
      req.on('close', () => {
        clearInterval(heartbeat);
      });

      // Auto-close before Vercel timeout
      setTimeout(() => {
        clearInterval(heartbeat);
        res.end();
      }, 50000);

      return;
    }

    // Handle POST (JSON-RPC)
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      
      req.on('end', () => {
        try {
          const message = JSON.parse(body);
          console.log(`[Multi-Tenant] Processing ${message.method} for tenant: ${tenant.tenantId}`);
          
          let response;
          
          switch (message.method) {
            case "initialize":
              response = createJsonRpcResponse(message.id, {
                protocolVersion: "2024-11-05",
                capabilities: { tools: {} },
                serverInfo: {
                  name: "ghl-mcp-server-multi-tenant",
                  version: "1.0.0"
                }
              });
              break;
              
            case "tools/list":
              // Return tools based on tenant configuration
              response = createJsonRpcResponse(message.id, {
                tools: [
                  {
                    name: "search_contacts",
                    description: `Search contacts in GoHighLevel for ${tenant.name}`,
                    inputSchema: {
                      type: "object",
                      properties: {
                        query: { type: "string" }
                      }
                    }
                  },
                  {
                    name: "create_contact",
                    description: `Create a contact in GoHighLevel for ${tenant.name}`,
                    inputSchema: {
                      type: "object",
                      properties: {
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        email: { type: "string" },
                        phone: { type: "string" }
                      },
                      required: ["email"]
                    }
                  }
                ]
              });
              break;
              
            case "tools/call":
              // Mock tool execution with tenant context
              const { name, arguments: args } = message.params;
              response = createJsonRpcResponse(message.id, {
                content: [{
                  type: "text",
                  text: `Executed ${name} for tenant ${tenant.name} (${tenant.tenantId}) with args: ${JSON.stringify(args)}`
                }]
              });
              break;
              
            default:
              response = createJsonRpcResponse(message.id, null, {
                code: -32601,
                message: `Method not found: ${message.method}`
              });
          }
          
          sendSSE(res, response);
          setTimeout(() => res.end(), 100);
          
        } catch (error) {
          sendSSE(res, createJsonRpcResponse(null, null, {
            code: -32700,
            message: "Parse error"
          }));
          res.end();
        }
      });
      
      return;
    }
  }

  // 404
  res.status(404).json({ error: 'Not found' });
};