'use client'

import { useState } from 'react'
import { Tenant, tenantApi } from '@/lib/api'
import { useTenantStore } from '@/lib/store'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  TestTube, 
  Power,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface TenantCardProps {
  tenant: Tenant
  onUpdate: () => void
}

export function TenantCard({ tenant, onUpdate }: TenantCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [testing, setTesting] = useState(false)
  const updateTenant = useTenantStore((state) => state.updateTenant)
  const removeTenant = useTenantStore((state) => state.removeTenant)

  const handleToggleActive = async () => {
    try {
      const updated = await tenantApi.update(tenant.tenantId, {
        isActive: !tenant.isActive
      })
      updateTenant(tenant.tenantId, updated)
      toast.success(`Tenant ${updated.isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      toast.error('Failed to update tenant status')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${tenant.name}?`)) {
      return
    }

    try {
      await tenantApi.delete(tenant.tenantId)
      removeTenant(tenant.tenantId)
      toast.success('Tenant deleted successfully')
    } catch (error) {
      toast.error('Failed to delete tenant')
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const result = await tenantApi.test(tenant.tenantId)
      if (result.success) {
        toast.success('Connection test successful!')
      } else {
        toast.error(`Connection test failed: ${result.error}`)
      }
    } catch (error) {
      toast.error('Connection test failed')
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = () => {
    if (testing) {
      return <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />
    }
    if (tenant.isActive) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    return <XCircle className="h-5 w-5 text-gray-400" />
  }

  const getFeatureCount = () => {
    if (!tenant.features) return 0
    return Object.values(tenant.features).filter(Boolean).length
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="absolute top-4 right-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical className="h-5 w-5 text-gray-500" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                <Link
                  href={`/dashboard/tenants/${tenant.tenantId}/edit`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit className="mr-3 h-4 w-4" />
                  Edit
                </Link>
                
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <TestTube className="mr-3 h-4 w-4" />
                  Test Connection
                </button>
                
                <button
                  onClick={handleToggleActive}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Power className="mr-3 h-4 w-4" />
                  {tenant.isActive ? 'Deactivate' : 'Activate'}
                </button>
                
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Trash2 className="mr-3 h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-start space-x-4">
        {getStatusIcon()}
        
        <div className="flex-1 min-w-0">
          <Link 
            href={`/dashboard/tenants/${tenant.tenantId}`}
            className="block"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate hover:text-primary-600">
              {tenant.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tenant.tenantId}
            </p>
          </Link>
          
          <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span className="truncate">Location: {tenant.locationId}</span>
          </div>
          
          {tenant.features && (
            <div className="mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getFeatureCount()} features enabled
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}