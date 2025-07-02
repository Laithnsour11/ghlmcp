# GHL Multi-Tenant Admin Dashboard

A modern web interface for managing multiple GoHighLevel sub-accounts with the Multi-Tenant MCP Server.

## Features

- 🔐 **Secure Authentication** - JWT-based admin authentication
- 👥 **Tenant Management** - Add, edit, and manage multiple GHL sub-accounts
- 🎨 **Template System** - Pre-configured templates for common use cases
- 🧪 **Connection Testing** - Test API connections for each tenant
- 🌓 **Dark Mode** - Built-in theme switching
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ installed
- GoHighLevel MCP Server running (backend)
- GoHighLevel API credentials for your sub-accounts

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your MCP server URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Build for production:

```bash
npm run build
npm start
```

## Usage

### 1. Login

Use the admin credentials configured in your MCP server:
- Username: `admin`
- Password: (from your server's `ADMIN_PASSWORD` env var)

### 2. Add Tenants

1. Click "Add Tenant" on the dashboard
2. Choose a template or start with custom configuration
3. Enter your GoHighLevel credentials:
   - **Tenant ID**: Unique identifier (e.g., `voice-agent-1`)
   - **Display Name**: Friendly name for the tenant
   - **API Key**: Your GHL Private App API key
   - **Location ID**: Your GHL sub-account location ID

### 3. Available Templates

- **📞 Voice AI Agent** - For voice-powered customer support
- **💬 SMS Appointment Bot** - Automated appointment scheduling
- **📊 Sales AI Dashboard** - Analytics and pipeline management
- **🎯 Marketing Automation** - Multi-channel campaigns
- **⚙️ Custom** - Start with blank configuration

### 4. Test Connections

Click the test button on any tenant card to verify the API connection.

### 5. Manage Tenants

- **Edit**: Modify tenant configurations
- **Activate/Deactivate**: Enable or disable tenants
- **Delete**: Remove tenant configurations

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | MCP Server URL | `http://localhost:8000` |

## API Endpoints Used

The frontend connects to these MCP server endpoints:

- `POST /mt/api/auth/login` - Admin authentication
- `GET /mt/api/tenants` - List all tenants
- `POST /mt/api/tenants` - Create new tenant
- `PUT /mt/api/tenants/:id` - Update tenant
- `DELETE /mt/api/tenants/:id` - Delete tenant
- `POST /mt/api/tenants/:id/test` - Test tenant connection

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Deploy with Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## Security

- API keys are sent over HTTPS only
- Authentication tokens stored in localStorage
- Automatic logout on 401 responses
- Input validation on all forms

## Troubleshooting

### Cannot connect to server

1. Verify MCP server is running
2. Check `NEXT_PUBLIC_API_URL` in `.env`
3. Ensure CORS is configured on server

### Authentication fails

1. Verify admin credentials match server config
2. Check server logs for errors
3. Clear browser localStorage and retry

### Tenant test fails

1. Verify API key is correct
2. Check location ID matches sub-account
3. Ensure API key has required permissions

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

Same as main project - see LICENSE file.