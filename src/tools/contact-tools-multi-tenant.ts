/**
 * GoHighLevel Contact Tools - Multi-Tenant Version
 * Example of updating tools to support multi-tenancy
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseTool } from './base-tool.js';
import {
  MCPCreateContactParams,
  MCPSearchContactsParams,
  MCPUpdateContactParams,
  MCPAddContactTagsParams,
  MCPRemoveContactTagsParams,
  // ... other imports
  GHLContact,
  GHLSearchContactsResponse,
  GHLContactTagsResponse,
} from '../types/ghl-types.js';

/**
 * Contact Tools class with multi-tenant support
 * Extends BaseTool for automatic tenant context handling
 */
export class ContactToolsMultiTenant extends BaseTool {
  /**
   * Get tool definitions for all contact operations
   */
  getToolDefinitions(): Tool[] {
    return [
      // Basic Contact Management
      {
        name: 'create_contact',
        description: 'Create a new contact in GoHighLevel',
        inputSchema: {
          type: 'object',
          properties: {
            firstName: { type: 'string', description: 'Contact first name' },
            lastName: { type: 'string', description: 'Contact last name' },
            email: { type: 'string', description: 'Contact email address' },
            phone: { type: 'string', description: 'Contact phone number' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Tags to assign to contact' },
            source: { type: 'string', description: 'Source of the contact' }
          },
          required: ['email']
        }
      },
      {
        name: 'search_contacts',
        description: 'Search for contacts with advanced filtering options',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query string' },
            email: { type: 'string', description: 'Filter by email address' },
            phone: { type: 'string', description: 'Filter by phone number' },
            limit: { type: 'number', description: 'Maximum number of results (default: 25)' }
          }
        }
      },
      {
        name: 'get_contact',
        description: 'Get a specific contact by ID',
        inputSchema: {
          type: 'object',
          properties: {
            contactId: { type: 'string', description: 'Contact ID' }
          },
          required: ['contactId']
        }
      },
      {
        name: 'update_contact',
        description: 'Update an existing contact',
        inputSchema: {
          type: 'object',
          properties: {
            contactId: { type: 'string', description: 'Contact ID to update' },
            firstName: { type: 'string', description: 'Updated first name' },
            lastName: { type: 'string', description: 'Updated last name' },
            email: { type: 'string', description: 'Updated email' },
            phone: { type: 'string', description: 'Updated phone' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Updated tags' }
          },
          required: ['contactId']
        }
      },
      // ... other tool definitions
    ];
  }

  /**
   * Execute a contact tool
   */
  async executeTool(toolName: string, params: any): Promise<any> {
    // Use base class logging with tenant context
    this.log(`Executing contact tool: ${toolName}`, { params });

    try {
      switch (toolName) {
        case 'create_contact':
          return await this.createContact(params);
        case 'search_contacts':
          return await this.searchContacts(params);
        case 'get_contact':
          return await this.getContact(params);
        case 'update_contact':
          return await this.updateContact(params);
        // ... other cases
        default:
          throw new Error(`Unknown contact tool: ${toolName}`);
      }
    } catch (error) {
      this.logError(`Failed to execute ${toolName}`, error);
      throw error;
    }
  }

  /**
   * Create a new contact
   * Now uses tenant-specific API client automatically
   */
  private async createContact(params: MCPCreateContactParams): Promise<GHLContact> {
    return this.executeWithLogging('createContact', params, async () => {
      // Validate and sanitize parameters
      this.validateRequired(params, ['email']);
      const sanitized = this.sanitizeParams(params);
      
      // Get tenant-specific client
      const client = this.getClient();
      
      // Make API call
      const response = await client.createContact({
        ...sanitized,
        locationId: client.config.locationId // Use tenant's location ID
      });
      
      this.log(`Created contact: ${response.id} for tenant: ${this.getTenantId()}`);
      return response;
    });
  }

  /**
   * Search contacts
   * Automatically scoped to tenant's data
   */
  private async searchContacts(params: MCPSearchContactsParams): Promise<GHLSearchContactsResponse> {
    return this.executeWithLogging('searchContacts', params, async () => {
      const sanitized = this.sanitizeParams(params);
      const client = this.getClient();
      
      const response = await client.searchContacts({
        ...sanitized,
        locationId: client.config.locationId
      });
      
      this.log(`Found ${response.contacts?.length || 0} contacts for tenant: ${this.getTenantId()}`);
      return response;
    });
  }

  /**
   * Get specific contact
   */
  private async getContact(params: { contactId: string }): Promise<GHLContact> {
    return this.executeWithLogging('getContact', params, async () => {
      this.validateRequired(params, ['contactId']);
      const client = this.getClient();
      
      return client.getContact(params.contactId);
    });
  }

  /**
   * Update contact
   */
  private async updateContact(params: MCPUpdateContactParams): Promise<GHLContact> {
    return this.executeWithLogging('updateContact', params, async () => {
      this.validateRequired(params, ['contactId']);
      const sanitized = this.sanitizeParams(params);
      const client = this.getClient();
      
      const { contactId, ...updateData } = sanitized;
      const response = await client.updateContact(contactId, updateData);
      
      this.log(`Updated contact: ${contactId} for tenant: ${this.getTenantId()}`);
      return response;
    });
  }

  // Additional methods would follow the same pattern...
}