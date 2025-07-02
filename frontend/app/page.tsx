'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function HomePage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    // Check if we have a stored token
    const token = localStorage.getItem('auth_token')
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router, isAuthenticated])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Loading...</div>
    </div>
  )
}