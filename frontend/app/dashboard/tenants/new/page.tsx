'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { tenantApi, Tenant } from '@/lib/api'
import { useTenantStore } from '@/lib/store'
import { tenantTemplates } from '@/lib/templates'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Zap } from 'lucide-react'
import Link from 'next/link'

interface TenantForm {
  tenantId: string
  name: string
  apiKey: string
  locationId: string
  template: string
}

export default function NewTenantPage() {
  const router = useRouter()
  const addTenant = useTenantStore((state) => state.addTenant)
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('custom')
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TenantForm>({
    defaultValues: {
      template: 'custom'
    }
  })

  const watchTemplate = watch('template')

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    setValue('template', templateId)
    
    const template = tenantTemplates.find(t => t.id === templateId)
    if (template && templateId !== 'custom') {
      // Pre-fill tenant ID based on template
      setValue('tenantId', `${templateId}-${Date.now()}`)
      setValue('name', template.name)
    }
  }

  const onSubmit = async (data: TenantForm) => {
    setLoading(true)
    try {
      const template = tenantTemplates.find(t => t.id === data.template)
      
      const newTenant: Omit<Tenant, 'createdAt' | 'updatedAt'> = {
        tenantId: data.tenantId,
        name: data.name,
        apiKey: data.apiKey,
        locationId: data.locationId,
        isActive: true,
        features: template?.config.features,
        config: template?.config.config,
        rateLimits: template?.config.rateLimits,
      }
      
      const created = await tenantApi.create(newTenant)
      addTenant(created)
      toast.success('Tenant created successfully!')
      router.push('/dashboard/tenants')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create tenant')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/tenants"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Tenants
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Add New Tenant
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure a new GoHighLevel sub-account connection
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose a Template
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tenantTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateChange(template.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-2">{template.icon}</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {template.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tenant ID
              </label>
              <input
                {...register('tenantId', { 
                  required: 'Tenant ID is required',
                  pattern: {
                    value: /^[a-z0-9-]+$/,
                    message: 'Only lowercase letters, numbers, and hyphens allowed'
                  }
                })}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-900"
                placeholder="my-tenant-id"
              />
              {errors.tenantId && (
                <p className="mt-1 text-xs text-red-600">{errors.tenantId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Display Name
              </label>
              <input
                {...register('name', { required: 'Display name is required' })}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-900"
                placeholder="My Tenant Name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                GHL API Key
              </label>
              <input
                {...register('apiKey', { required: 'API key is required' })}
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-900"
                placeholder="ghl_xxx..."
              />
              {errors.apiKey && (
                <p className="mt-1 text-xs text-red-600">{errors.apiKey.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location ID
              </label>
              <input
                {...register('locationId', { required: 'Location ID is required' })}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-900"
                placeholder="loc_xxx..."
              />
              {errors.locationId && (
                <p className="mt-1 text-xs text-red-600">{errors.locationId.message}</p>
              )}
            </div>
          </div>

          {selectedTemplate !== 'custom' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex">
                <Zap className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Template Applied
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                    <p>This template will configure:</p>
                    <ul className="list-disc list-inside mt-1">
                      {tenantTemplates
                        .find(t => t.id === selectedTemplate)
                        ?.config.features &&
                        Object.entries(
                          tenantTemplates.find(t => t.id === selectedTemplate)!.config.features
                        )
                          .filter(([_, enabled]) => enabled)
                          .map(([feature]) => (
                            <li key={feature}>{feature}</li>
                          ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/tenants"
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}