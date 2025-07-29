'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { LogOut, User, Calendar, Settings, Home, Plus } from 'lucide-react'

export const Navigation = () => {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!user) {
    return null
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Home className="h-6 w-6" />
              <span className="font-bold text-xl">Lab Booking</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            {user.role === 'STUDENT' && (
              <Link
                href="/book"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Book Lab</span>
              </Link>
            )}

            {user.role === 'STUDENT' && (
              <Link
                href="/bookings"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                <span>My Bookings</span>
              </Link>
            )}

            {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
              <Link
                href="/admin"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>{user.role === 'ADMIN' ? 'Admin' : 'Manage'}</span>
              </Link>
            )}

            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user.name}</span>
              <span className="text-xs bg-blue-800 px-2 py-1 rounded">
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
