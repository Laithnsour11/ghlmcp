/**
 * Vercel API handler for multi-tenant GoHighLevel MCP server
 * This file acts as a bridge between Vercel's serverless environment and the multi-tenant MCP server
 */

// Import the multi-tenant server
import path from 'path';
import { fileURLToPath } from 'url';

// Handle ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically import the multi-tenant server
async function getServer() {
  const serverModule = await import('../dist/http-server-multi-tenant.js');
  return serverModule.default || serverModule.GHLMCPHttpMultiTenantServer;
}

// Cache the server instance
let serverInstance = null;

// Main Vercel handler
export default async function handler(req, res) {
  // Log request details
  console.log(`[Vercel] ${req.method} ${req.url}`);
  console.log(`[Vercel] Headers:`, req.headers);
  
  try {
    // Get or create server instance
    if (!serverInstance) {
      const ServerClass = await getServer();
      serverInstance = new ServerClass();
      await serverInstance.start();
      console.log('[Vercel] Multi-tenant server instance created');
    }
    
    // Get the Express app from the server
    const app = serverInstance.getApp();
    
    if (!app) {
      throw new Error('Failed to get Express app from server');
    }
    
    // Forward the request to the Express app
    app(req, res);
    
  } catch (error) {
    console.error('[Vercel] Error handling request:', error);
    
    // Return error response
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Export config for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    // Disable response size limit for SSE
    responseLimit: false,
  },
};