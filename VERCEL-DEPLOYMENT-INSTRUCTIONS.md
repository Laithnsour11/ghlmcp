# 🚀 Vercel Deployment Instructions

Due to the existing project configuration, please follow these manual steps to deploy:

## Option 1: Fix Existing Project (Recommended)

1. **Visit Vercel Dashboard**
   - Go to: https://vercel.com/laithnsour11s-projects/ghlmcp/settings
   
2. **Change Framework Settings**
   - In Settings → General
   - Find "Framework Preset"
   - Change from "Next.js" to "Other"
   - Save changes

3. **Deploy via CLI**
   ```bash
   vercel --prod
   ```

## Option 2: Delete and Redeploy

1. **Delete Existing Project**
   - Go to: https://vercel.com/laithnsour11s-projects/ghlmcp/settings
   - Scroll to bottom
   - Click "Delete Project"

2. **Clean Local Files**
   ```bash
   rm -rf .vercel
   ```

3. **Deploy as New Project**
   ```bash
   vercel
   ```
   
   When prompted:
   - Set up and deploy: Y
   - Scope: Select your account
   - Link to existing project: N
   - Project name: ghl-mcp-multi-tenant (or your choice)
   - Directory: ./
   - Override settings: N

## Option 3: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new

2. **Import Git Repository**
   - Click "Import Git Repository"
   - Select your repository or use:
     ```
     https://github.com/mastanley13/GoHighLevel-MCP
     ```

3. **Configure Project**
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: `npm run build` (leave empty if no build needed)
   - Output Directory: (leave empty)

4. **Add Environment Variables**
   Click "Add" for each:
   ```
   MULTI_TENANT_MODE=true
   ENCRYPTION_SECRET=your-32-character-secret-here
   JWT_SECRET=your-jwt-secret-here
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=secure-password-here
   
   # Optional default tenant
   GHL_API_KEY=your_private_integrations_api_key
   GHL_LOCATION_ID=your_location_id
   GHL_BASE_URL=https://services.leadconnectorhq.com
   ```

5. **Deploy**
   - Click "Deploy"

## 📋 Post-Deployment

Once deployed, your endpoints will be:

### Health Check
```
https://your-app.vercel.app/
https://your-app.vercel.app/health
```

### Single-Tenant Mode (Legacy)
```
https://your-app.vercel.app/sse
```

### Multi-Tenant Mode
```
https://your-app.vercel.app/mt/sse
https://your-app.vercel.app/mt/health
https://your-app.vercel.app/mt/api/tenants
```

### Test Multi-Tenant Endpoint
```bash
curl https://your-app.vercel.app/mt/health

# Should return:
{
  "status": "healthy",
  "mode": "multi-tenant",
  "timestamp": "2024-01-15T..."
}
```

### Add a Tenant
```bash
curl -X POST https://your-app.vercel.app/mt/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "test-tenant",
    "name": "Test Tenant",
    "apiKey": "ghl_xxx",
    "locationId": "loc_xxx"
  }'
```

### Test Tenant Connection
```bash
curl https://your-app.vercel.app/mt/sse \
  -H "X-Tenant-ID: test-tenant"
```

## 🎯 Next Steps

1. Configure your tenants
2. Test the endpoints
3. Integrate with your voice AI and SMS bots
4. Monitor usage in Vercel dashboard

## 🆘 Troubleshooting

If deployment fails:
1. Check Vercel logs: `vercel logs`
2. Ensure all dependencies are in package.json
3. Verify environment variables are set
4. Check function logs in Vercel dashboard

For support, check:
- Vercel Documentation: https://vercel.com/docs
- Project Issues: https://github.com/mastanley13/GoHighLevel-MCP/issues