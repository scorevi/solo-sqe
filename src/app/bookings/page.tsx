'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Computer, 
  AlertCircle, 
  CheckCircle, 
  X,
  Plus
} from 'lucide-react'

interface Booking {
  id: string
  startTime: string
  endTime: string
  purpose: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  lab: {
    name: string
    location: string
  }
  computer: {
    name: string
  } | null
}

export default function BookingsPage() {
  const { user, token } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/bookings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setBookings(data)
        } else {
          setError('Failed to load bookings')
        }
      } catch (fetchError) {
        console.error('Failed to fetch bookings:', fetchError)
        setError('Failed to load bookings')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchBookings()
    }
  }, [token])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />
      case 'REJECTED':
        return <X className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <X className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canCancelBooking = (booking: Booking) => {
    const now = new Date()
    const startTime = new Date(booking.startTime)
    const isUpcoming = startTime > now
    const isPendingOrApproved = ['PENDING', 'APPROVED'].includes(booking.status)
    return isUpcoming && isPendingOrApproved
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await response.json()
        setSuccess('Booking cancelled successfully')
        // Refresh bookings
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'CANCELLED' as const }
            : booking
        ))
        setTimeout(() => setSuccess(''), 5000)
      } else {
        let errorMessage = 'Failed to cancel booking'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If we can't parse JSON, it might be an HTML error page
          console.error('Failed to parse error response:', parseError)
          if (response.status === 404) {
            errorMessage = 'Booking not found or already cancelled'
          } else if (response.status === 403) {
            errorMessage = 'Not authorized to cancel this booking'
          } else {
            errorMessage = `Server error (${response.status})`
          }
        }
        setError(errorMessage)
        setTimeout(() => setError(''), 5000)
      }
    } catch (cancelError) {
      console.error('Failed to cancel booking:', cancelError)
      setError('Failed to cancel booking - please check your connection')
      setTimeout(() => setError(''), 5000)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="mt-2 text-gray-600">
                View and manage your computer lab reservations
              </p>
            </div>
            <Link
              href="/book"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            {isLoading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
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
            ) : bookings.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600 mb-6">
                  You haven&apos;t made any lab reservations yet.
                </p>
                <Link
                  href="/book"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Make Your First Booking
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Computer className="h-10 w-10 text-blue-500" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {booking.lab.name}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {booking.lab.location}
                            </div>
                            {booking.computer && (
                              <div className="flex items-center">
                                <Computer className="h-4 w-4 mr-1" />
                                {booking.computer.name}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDateTime(booking.startTime)}
                            </div>
                            <span>to</span>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDateTime(booking.endTime)}
                            </div>
                          </div>
                          {booking.purpose && (
                            <p className="mt-2 text-sm text-gray-600">
                              <strong>Purpose:</strong> {booking.purpose}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span className="ml-1">{booking.status}</span>
                        </span>
                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
