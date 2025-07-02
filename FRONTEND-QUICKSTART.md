# 🚀 Frontend Quick Start Guide

Get your GHL Multi-Tenant Admin Dashboard running in 5 minutes!

## Prerequisites

- Multi-Tenant MCP Server deployed (backend)
- Node.js 18+ installed
- Your GoHighLevel API credentials

## Step 1: Start the Backend

First, ensure your multi-tenant MCP server is running:

```bash
# In the main project directory
npm run dev:multi
```

The server should be running at `http://localhost:8000`

## Step 2: Install Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

## Step 3: Start the Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 4: Login

Default credentials:
- Username: `admin`
- Password: Check your backend `.env` file for `ADMIN_PASSWORD`

## Step 5: Add Your First Tenant

1. Click "Add Tenant"
2. Choose a template (e.g., Voice AI Agent)
3. Fill in your GHL credentials:
   ```
   Tenant ID: voice-agent-1
   Display Name: My Voice AI Agent
   API Key: ghl_xxxx (your actual API key)
   Location ID: loc_xxxx (your actual location ID)
   ```
4. Click "Create Tenant"

## Step 6: Test the Connection

Click the "Test Connection" button on your new tenant card to verify everything works!

## Using with Your Applications

Once configured, your applications can connect using:

```javascript
// Example: Voice AI Agent
fetch('http://localhost:8000/mt/sse', {
  headers: {
    'X-Tenant-ID': 'voice-agent-1',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'search_contacts',
      arguments: { query: 'john@example.com' }
    }
  })
})
```

## Deployment

### Deploy Frontend to Vercel

```bash
cd frontend
vercel
```

### Deploy Backend to Vercel

```bash
# In main directory
vercel
```

Update your frontend `.env` with the production URL:
```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

## Common Issues

### "Cannot connect to server"
- Make sure backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in frontend/.env

### "Login failed"
- Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` in backend .env
- Try with default: admin / your-password

### "Test connection failed"
- Double-check your GHL API key and location ID
- Ensure API key has required permissions

## Next Steps

1. Add more tenants for different use cases
2. Configure rate limits and features
3. Set up monitoring and alerts
4. Deploy to production

Need help? Check the [full documentation](./README.md) or [create an issue](https://github.com/Laithnsour11/ghlmcp/issues).