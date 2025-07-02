# 🏢 Multi-Tenant Deployment Guide for GoHighLevel MCP Server

This guide provides comprehensive instructions for deploying the GoHighLevel MCP Server in multi-tenant mode, enabling multiple GHL sub-accounts to use the same deployment as a tool for voice AI, SMS appointment setting, and AI-powered dashboards.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Deployment Options](#deployment-options)
4. [Configuration](#configuration)
5. [Tenant Management](#tenant-management)
6. [Security](#security)
7. [Monitoring](#monitoring)
8. [Use Cases](#use-cases)

## 🎯 Overview

The multi-tenant mode allows a single deployment to serve multiple GoHighLevel sub-accounts, each with:
- Isolated API credentials and data access
- Custom rate limiting and usage quotas
- Tenant-specific configurations
- Separate webhook endpoints
- Individual monitoring and logging

### Key Benefits

- **Cost Efficiency**: Single deployment serves multiple clients
- **Centralized Management**: Manage all tenants from one location
- **Scalability**: Easy to add/remove tenants
- **Security**: Complete isolation between tenants
- **Flexibility**: Per-tenant feature flags and configurations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│  Voice AI   │  SMS Bot    │  Dashboard  │  Custom Apps    │
│  Agent 1    │  Agent 1    │  Agent 1    │                 │
└──────┬──────┴──────┬──────┴──────┬──────┴─────────────────┘
       │             │             │
       │ X-Tenant-ID │             │
       ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│              Multi-Tenant MCP Server                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Tenant    │  │   Request   │  │    Rate     │        │
│  │  Resolver   │  │   Context   │  │   Limiter   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Tenant    │  │  API Client │  │    Tool     │        │
│  │    Store    │  │   Factory   │  │   Router    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  GoHighLevel API                             │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ Sub-Account │ Sub-Account │ Sub-Account │ Sub-Account     │
│      1      │      2      │      3      │      N          │
└─────────────┴─────────────┴─────────────┴─────────────────┘
```

## 🚀 Deployment Options

### 1. Vercel Deployment (Recommended)

#### Step 1: Clone and Configure

```bash
git clone https://github.com/mastanley13/GoHighLevel-MCP.git
cd GoHighLevel-MCP
cp .env.multi-tenant.example .env
```

#### Step 2: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 3: Configure Environment Variables

Edit `.env` and set:

```env
MULTI_TENANT_MODE=true
TENANT_STORE_TYPE=memory  # or redis for production

# Optional: Default tenant for backward compatibility
GHL_API_KEY=your_default_api_key
GHL_LOCATION_ID=your_default_location_id

# Security
ENCRYPTION_SECRET=your-32-character-secret-here
JWT_SECRET=your-jwt-secret-here

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password-here
```

#### Step 4: Deploy to Vercel

```bash
vercel --prod
```

#### Step 5: Configure Vercel Environment Variables

In Vercel dashboard, add all environment variables from your `.env` file.

#### Step 6: Access Endpoints

Your multi-tenant server will be available at:
- Main endpoint: `https://your-app.vercel.app/`
- Multi-tenant SSE: `https://your-app.vercel.app/mt/sse`
- Tenant management: `https://your-app.vercel.app/mt/api/tenants`

### 2. Docker Deployment

#### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8000

# Start multi-tenant server
CMD ["node", "dist/http-server-multi-tenant.js"]
```

#### Build and Run

```bash
# Build image
docker build -t ghl-mcp-multi-tenant .

# Run with environment file
docker run -d \
  --name ghl-mcp \
  -p 8000:8000 \
  --env-file .env \
  ghl-mcp-multi-tenant
```

### 3. Cloud Platform Deployment

#### AWS ECS/Fargate

```yaml
# task-definition.json
{
  "family": "ghl-mcp-multi-tenant",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "ghl-mcp",
      "image": "your-ecr-repo/ghl-mcp:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "MULTI_TENANT_MODE",
          "value": "true"
        },
        {
          "name": "TENANT_STORE_TYPE",
          "value": "redis"
        }
      ],
      "secrets": [
        {
          "name": "ENCRYPTION_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:encryption-key"
        }
      ]
    }
  ]
}
```

## ⚙️ Configuration

### 1. Environment-Based Configuration

For simple deployments, use environment variables:

```env
# Enable multi-tenant mode
MULTI_TENANT_MODE=true

# Add tenants via environment
TENANT_1_ID=voice-ai-agent
TENANT_1_NAME=Voice AI Customer Support
TENANT_1_API_KEY=ghl_xxx
TENANT_1_LOCATION_ID=loc_xxx

TENANT_2_ID=sms-bot
TENANT_2_NAME=SMS Appointment Bot
TENANT_2_API_KEY=ghl_yyy
TENANT_2_LOCATION_ID=loc_yyy
```

### 2. File-Based Configuration

For complex deployments, use `config/tenants.json`:

```bash
cp config/tenants.example.json config/tenants.json
# Edit config/tenants.json with your tenant details
```

### 3. Database-Based Configuration

For production, use Redis or PostgreSQL:

```env
TENANT_STORE_TYPE=redis
REDIS_URL=redis://your-redis-instance:6379
```

## 👥 Tenant Management

### Adding a New Tenant

#### Via API

```bash
curl -X POST https://your-app.vercel.app/mt/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "tenantId": "new-tenant",
    "name": "New Tenant Name",
    "apiKey": "ghl_xxx",
    "locationId": "loc_xxx"
  }'
```

#### Via Configuration File

Add to `config/tenants.json`:

```json
{
  "tenantId": "new-tenant",
  "name": "New Tenant Name",
  "apiKey": "ghl_xxx",
  "locationId": "loc_xxx",
  "isActive": true,
  "features": {
    "voiceAI": true,
    "sms": true
  }
}
```

### Tenant Identification

Clients identify themselves using one of these methods:

1. **HTTP Header** (Recommended)
```javascript
fetch('https://your-app.vercel.app/mt/sse', {
  headers: {
    'X-Tenant-ID': 'voice-ai-agent'
  }
});
```

2. **Query Parameter**
```
https://your-app.vercel.app/mt/sse?tenant=voice-ai-agent
```

3. **URL Path** (For webhooks)
```
https://your-app.vercel.app/tenant/voice-ai-agent/webhook
```

## 🔒 Security

### API Key Encryption

All API keys are encrypted at rest:

```env
ENCRYPTION_SECRET=your-32-character-encryption-secret
```

### Rate Limiting

Per-tenant rate limiting is automatically enforced:

```json
{
  "rateLimits": {
    "maxRequestsPerMinute": 60,
    "maxContactsPerDay": 1000,
    "maxSMSPerDay": 500
  }
}
```

### Authentication

Admin endpoints require authentication:

```bash
# Get JWT token
curl -X POST https://your-app.vercel.app/mt/api/auth/login \
  -d '{"username": "admin", "password": "your-password"}'

# Use token for admin operations
curl -H "Authorization: Bearer your-jwt-token" \
  https://your-app.vercel.app/mt/api/tenants
```

## 📊 Monitoring

### Health Checks

Monitor individual tenant health:

```bash
# Overall health
curl https://your-app.vercel.app/mt/health

# Tenant-specific health
curl https://your-app.vercel.app/mt/health/voice-ai-agent
```

### Metrics

Enable metrics collection:

```env
MONITORING_PROVIDER=datadog
DATADOG_API_KEY=your-api-key
```

### Logging

Tenant-aware logging includes tenant ID in all log entries:

```
[2024-01-15T10:30:00Z] [voice-ai-agent] [INFO] Processing contact search
[2024-01-15T10:30:01Z] [sms-bot] [INFO] Sending appointment reminder
```

## 📱 Use Cases

### 1. Voice AI Agent

Configure a tenant for voice AI customer support:

```json
{
  "tenantId": "voice-support",
  "name": "Voice AI Support Agent",
  "config": {
    "voiceProvider": "twilio",
    "voiceSettings": {
      "voice": "en-US-Neural2-F",
      "webhookUrl": "https://your-voice-ai.com/webhook"
    }
  }
}
```

Integration example:

```javascript
// Voice AI integration
const response = await fetch('https://your-app.vercel.app/mt/sse', {
  method: 'POST',
  headers: {
    'X-Tenant-ID': 'voice-support',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'search_contacts',
      arguments: { query: callerPhoneNumber }
    },
    id: 1
  })
});
```

### 2. SMS Appointment Bot

Configure for automated appointment scheduling:

```json
{
  "tenantId": "sms-scheduler",
  "name": "SMS Appointment Scheduler",
  "config": {
    "smsSettings": {
      "fromNumber": "+1234567890",
      "webhookUrl": "https://your-sms-bot.com/webhook"
    },
    "appointmentSettings": {
      "calendarId": "your-calendar-id",
      "defaultDuration": 30
    }
  }
}
```

### 3. Sales Dashboard

Configure for analytics and reporting:

```json
{
  "tenantId": "sales-dashboard",
  "name": "AI Sales Dashboard",
  "config": {
    "dashboardSettings": {
      "refreshInterval": 300,
      "enableRealTimeUpdates": true
    },
    "features": {
      "opportunities": true,
      "pipelines": true,
      "analytics": true
    }
  }
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Tenant Not Found**
   - Verify tenant ID in request headers
   - Check tenant is active in configuration
   - Ensure API keys are correct

2. **Rate Limit Exceeded**
   - Check tenant-specific rate limits
   - Implement exponential backoff
   - Consider upgrading tenant limits

3. **Authentication Failures**
   - Verify API key is correct
   - Check if tenant is active
   - Ensure proper encryption secret

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

### Support

For issues or questions:
- GitHub Issues: [https://github.com/mastanley13/GoHighLevel-MCP/issues](https://github.com/mastanley13/GoHighLevel-MCP/issues)
- Documentation: [https://github.com/mastanley13/GoHighLevel-MCP/wiki](https://github.com/mastanley13/GoHighLevel-MCP/wiki)

## 🎉 Next Steps

1. Deploy your multi-tenant server
2. Configure your tenants
3. Integrate with your applications
4. Monitor usage and performance
5. Scale as needed

The multi-tenant GoHighLevel MCP Server provides a robust foundation for building scalable AI-powered applications across multiple GHL sub-accounts.