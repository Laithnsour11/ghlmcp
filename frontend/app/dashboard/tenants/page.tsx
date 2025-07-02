'use client'

import { useEffect, useState } from 'react'
import { useTenantStore } from '@/lib/store'
import { tenantApi } from '@/lib/api'
import { Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { TenantCard } from '@/components/tenants/tenant-card'
import toast from 'react-hot-toast'

export default function TenantsPage() {
  const { tenants, setTenants, setLoading } = useTenantStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const data = await tenantApi.list()
      setTenants(data)
    } catch (error) {
      toast.error('Failed to fetch tenants')
    } finally {
      setLoading(false)
    }
  }

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.tenantId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.locationId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterActive === null || tenant.isActive === filterActive

    return matchesSearch && matchesFilter
  })

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tenants</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage your GoHighLevel sub-accounts and their configurations
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/tenants/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Tenant
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search tenants..."
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilterActive(null)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filterActive === null
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterActive(true)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filterActive === true
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterActive(false)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filterActive === false
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTenants.map((tenant) => (
          <TenantCard
            key={tenant.tenantId}
            tenant={tenant}
            onUpdate={fetchTenants}
          />
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="mt-6 text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterActive !== null
              ? 'No tenants found matching your criteria'
              : 'No tenants configured yet'}
          </p>
          {!searchTerm && filterActive === null && (
            <Link
              href="/dashboard/tenants/new"
              className="mt-4 inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add your first tenant
            </Link>
          )}
        </div>
      )}
    </div>
  )
}