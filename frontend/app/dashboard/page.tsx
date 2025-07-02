'use client'

import { useEffect } from 'react'
import { useTenantStore } from '@/lib/store'
import { tenantApi } from '@/lib/api'
import { Users, Activity, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { tenants, setTenants, setLoading } = useTenantStore()

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const data = await tenantApi.list()
      setTenants(data)
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeTenants = tenants.filter(t => t.isActive).length
  const totalTenants = tenants.length

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
      
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Tenants
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {totalTenants}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Tenants
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {activeTenants}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Inactive
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {totalTenants - activeTenants}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    API Status
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    Online
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Tenants
        </h2>
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {tenants.slice(0, 5).map((tenant) => (
              <li key={tenant.tenantId}>
                <Link 
                  href={`/dashboard/tenants/${tenant.tenantId}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-4 sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-2 w-2 rounded-full ${
                          tenant.isActive ? 'bg-green-400' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {tenant.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {tenant.tenantId}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {tenant.locationId}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        {tenants.length > 5 && (
          <div className="mt-4 text-center">
            <Link 
              href="/dashboard/tenants"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              View all tenants →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}