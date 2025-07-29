'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'
import { Calendar, Computer, Users, BookOpen, Clock, MapPin } from 'lucide-react'

interface Lab {
  id: string
  name: string
  description: string | null
  capacity: number
  location: string
  _count: {
    computers: number
    bookings: number
  }
}

export default function Dashboard() {
  const { user, token } = useAuth()
  const [labs, setLabs] = useState<Lab[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const response = await fetch('/api/labs', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setLabs(data)
        }
      } catch (error) {
        console.error('Failed to fetch labs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchLabs()
    }
  }, [token])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.name}!
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your computer lab reservations and bookings
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {user.role === 'STUDENT' && (
              <Link
                href="/book"
                className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow-md transition-colors"
              >
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold">Book a Lab</h3>
                    <p className="text-blue-100">Reserve computer lab time</p>
                  </div>
                </div>
              </Link>
            )}

            {user.role === 'STUDENT' && (
              <Link
                href="/bookings"
                className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow-md transition-colors"
              >
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold">My Bookings</h3>
                    <p className="text-green-100">View your reservations</p>
                  </div>
                </div>
              </Link>
            )}

            {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
              <Link
                href="/admin"
                className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-lg shadow-md transition-colors"
              >
                <div className="flex items-center">
                  <Users className="h-8 w-8 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold">Admin Panel</h3>
                    <p className="text-purple-100">Manage labs and users</p>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Available Labs */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Available Computer Labs
              </h2>
            </div>

            {isLoading ? (
              <div className="p-6">
                <div className="animate-pulse">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {labs.map((lab) => (
                  <div key={lab.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Computer className="h-10 w-10 text-blue-500" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {lab.name}
                          </h3>
                          {lab.description && (
                            <p className="text-gray-600">{lab.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {lab.location}
                            </div>
                            <div className="flex items-center">
                              <Computer className="h-4 w-4 mr-1" />
                              {lab._count.computers} computers
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {lab._count.bookings} active bookings
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/labs/${lab.id}`}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </Link>
                        {user?.role === 'STUDENT' && (
                          <Link
                            href={`/book?labId=${lab.id}`}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                          >
                            Book Now
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {labs.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <Computer className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No computer labs available at the moment.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
