#!/bin/bash

echo "🚀 GoHighLevel MCP Server - Vercel Deployment Script"
echo "===================================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

echo "📋 Pre-deployment checklist:"
echo ""

# Check for environment variables
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cp .env.multi-tenant.example .env
    echo "✅ Created .env file - Please edit it with your configuration"
    echo ""
fi

# Clean up any existing Vercel configuration
if [ -d .vercel ]; then
    echo "🧹 Cleaning up existing Vercel configuration..."
    rm -rf .vercel
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Configuration Instructions:"
echo "==============================="
echo ""
echo "1. If you have an existing project on Vercel:"
echo "   - Go to: https://vercel.com/dashboard"
echo "   - Find your 'ghlmcp' project"
echo "   - Go to Settings → General"
echo "   - Change Framework Preset to: Other"
echo "   - OR delete the project to start fresh"
echo ""
echo "2. Deploy with Vercel CLI:"
echo "   vercel --yes"
echo ""
echo "3. Set environment variables in Vercel Dashboard:"
echo "   - MULTI_TENANT_MODE=true"
echo "   - ENCRYPTION_SECRET=your-32-char-secret"
echo "   - JWT_SECRET=your-jwt-secret"
echo "   - ADMIN_USERNAME=admin"
echo "   - ADMIN_PASSWORD=your-password"
echo ""
echo "   For default tenant (optional):"
echo "   - GHL_API_KEY=your-api-key"
echo "   - GHL_LOCATION_ID=your-location-id"
echo ""
echo "4. Your endpoints will be available at:"
echo "   - https://your-app.vercel.app/ (health check)"
echo "   - https://your-app.vercel.app/sse (single-tenant)"
echo "   - https://your-app.vercel.app/mt/sse (multi-tenant)"
echo "   - https://your-app.vercel.app/mt/api/tenants (tenant management)"
echo ""
echo "📝 Example tenant configuration:"
echo "================================"
echo ""
echo "curl -X POST https://your-app.vercel.app/mt/api/tenants \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"tenantId\": \"voice-ai-agent\","
echo "    \"name\": \"Voice AI Customer Support\","
echo "    \"apiKey\": \"ghl_xxx\","
echo "    \"locationId\": \"loc_xxx\""
echo "  }'"
echo ""
echo "Ready to deploy? Run: vercel --yes"