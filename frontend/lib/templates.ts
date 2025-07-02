export interface TenantTemplate {
  id: string
  name: string
  description: string
  icon: string
  config: {
    features: Record<string, boolean>
    config?: Record<string, any>
    rateLimits?: Record<string, number>
  }
}

export const tenantTemplates: TenantTemplate[] = [
  {
    id: 'voice-ai',
    name: 'Voice AI Agent',
    description: 'AI-powered voice assistant for customer support calls',
    icon: '📞',
    config: {
      features: {
        voiceAI: true,
        sms: true,
        appointments: true,
        contacts: true,
        conversations: true,
      },
      config: {
        voiceProvider: 'twilio',
        voiceSettings: {
          voice: 'en-US-Neural2-F',
          language: 'en-US',
          speed: 1.0,
          pitch: 0.0,
        },
      },
      rateLimits: {
        maxRequestsPerMinute: 60,
        maxContactsPerDay: 1000,
        maxSMSPerDay: 500,
      },
    },
  },
  {
    id: 'sms-bot',
    name: 'SMS Appointment Bot',
    description: 'Automated SMS bot for scheduling and managing appointments',
    icon: '💬',
    config: {
      features: {
        voiceAI: false,
        sms: true,
        appointments: true,
        contacts: true,
        conversations: true,
        calendar: true,
      },
      config: {
        smsProvider: 'gohighlevel',
        appointmentSettings: {
          defaultDuration: 30,
          bufferTime: 15,
          maxAdvanceBooking: 30,
          confirmationRequired: true,
          reminderHours: [24, 2],
        },
      },
      rateLimits: {
        maxRequestsPerMinute: 30,
        maxSMSPerDay: 1000,
        maxAppointmentsPerDay: 50,
      },
    },
  },
  {
    id: 'sales-dashboard',
    name: 'Sales AI Dashboard',
    description: 'AI-powered sales analytics and pipeline management',
    icon: '📊',
    config: {
      features: {
        voiceAI: false,
        sms: false,
        appointments: true,
        contacts: true,
        opportunities: true,
        pipelines: true,
        analytics: true,
        reports: true,
      },
      config: {
        dashboardSettings: {
          refreshInterval: 300,
          defaultView: 'pipeline',
          enableRealTimeUpdates: true,
        },
        aiSettings: {
          enablePredictions: true,
          enableAnomalyDetection: true,
          enableAutoInsights: true,
        },
      },
      rateLimits: {
        maxRequestsPerMinute: 100,
        maxReportsPerDay: 50,
      },
    },
  },
  {
    id: 'marketing',
    name: 'Marketing Automation',
    description: 'Multi-channel marketing campaigns and automation',
    icon: '🎯',
    config: {
      features: {
        voiceAI: false,
        sms: true,
        email: true,
        campaigns: true,
        workflows: true,
        socialMedia: true,
        blogs: true,
        surveys: true,
      },
      config: {
        campaignSettings: {
          defaultSender: 'marketing@company.com',
          trackingEnabled: true,
          utmTracking: true,
        },
        workflowSettings: {
          maxActiveWorkflows: 10,
          enableConditionalLogic: true,
          enableABTesting: true,
        },
      },
      rateLimits: {
        maxRequestsPerMinute: 60,
        maxEmailsPerDay: 10000,
        maxSMSPerDay: 5000,
      },
    },
  },
  {
    id: 'custom',
    name: 'Custom Configuration',
    description: 'Start with a blank configuration and customize as needed',
    icon: '⚙️',
    config: {
      features: {
        contacts: true,
        conversations: true,
      },
      rateLimits: {
        maxRequestsPerMinute: 60,
      },
    },
  },
]