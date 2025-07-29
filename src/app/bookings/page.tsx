'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Plus,
  Loader2,
  PlayCircle,
  Square
} from 'lucide-react'
import { 
  calculateRealTimeStatus, 
  getStatusDisplay, 
  formatTimeRange, 
  canCancelBooking,
  getTimeRemaining,
  type BookingStatus 
} from '@/lib/booking-utils'

interface Booking {
  id: string
  startTime: string
  endTime: string
  purpose: string | null
  status: BookingStatus
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
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)

  // Force refresh - updated on 2025-07-29

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

  // Real-time status updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBookings(currentBookings => 
        currentBookings.map(booking => ({
          ...booking,
          // Force re-render to update real-time status
        }))
      )
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: BookingStatus) => {
    const display = getStatusDisplay(status)
    return `${display.bgColor} ${display.color}`
  }

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <PlayCircle className="h-4 w-4" />
      case 'COMPLETED':
        return <Square className="h-4 w-4" />
      case 'REJECTED':
        return <X className="h-4 w-4" />
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
    const isPending = booking.status === 'PENDING'
    return isUpcoming && isPending
  }

  const handleCancelBooking = async (bookingId: string) => {
    console.log('Cancel button clicked for booking ID:', bookingId)
    console.log('Current token:', token ? 'Token exists' : 'No token')
    
    if (!token) {
      setError('Please log in to cancel bookings')
      return
    }
    
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    setCancellingBookingId(bookingId)

    try {
      console.log('Making DELETE request to:', `/api/bookings/${bookingId}`)
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('Cancel success:', result)
        setSuccess('Booking cancelled successfully')
        // Refresh bookings
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'CANCELLED' as const }
            : booking
        ))
        setTimeout(() => setSuccess(''), 5000)
      } else {
        console.log('Cancel failed with status:', response.status)
        let errorMessage = 'Failed to cancel booking'
        try {
          const errorData = await response.json()
          console.log('Error response:', errorData)
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If we can't parse JSON, it might be an HTML error page
          console.error('Failed to parse error response:', parseError)
          if (response.status === 404) {
            errorMessage = 'Booking not found or already cancelled'
          } else if (response.status === 403) {
            errorMessage = 'Not authorized to cancel this booking'
          } else if (response.status === 400) {
            errorMessage = 'This booking cannot be cancelled (it may be approved or in the past)'
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
    } finally {
      setCancellingBookingId(null)
    }
  }

  if (!user) {
    return null
  }

  // Only students can view their bookings
  if (user.role !== 'STUDENT') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Access Restricted</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Only students can view personal bookings.
                </p>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    {user.role === 'TEACHER' && 'As a teacher, you can view and manage all student bookings from the admin dashboard.'}
                    {user.role === 'ADMIN' && 'As an administrator, you can view and manage all bookings from the admin dashboard.'}
                  </p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/admin')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Admin Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
                {bookings.map((booking) => {
                  const realTimeStatus = calculateRealTimeStatus(booking)
                  const statusDisplay = getStatusDisplay(realTimeStatus)
                  const timeRemaining = realTimeStatus === 'APPROVED' 
                    ? getTimeRemaining(booking.startTime)
                    : realTimeStatus === 'IN_PROGRESS'
                    ? getTimeRemaining(booking.endTime)
                    : null
                  
                  return (
                    <div key={booking.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Computer className="h-10 w-10 text-blue-500" />
                          <div className="flex-1">
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
                            <div className="mt-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{formatTimeRange(booking.startTime, booking.endTime)}</span>
                              </div>
                              {timeRemaining && (
                                <div className="flex items-center mt-1">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span className={timeRemaining.isOverdue ? 'text-red-600' : 'text-gray-600'}>
                                    {timeRemaining.text}
                                  </span>
                                </div>
                              )}
                            </div>
                            {booking.purpose && (
                              <p className="mt-2 text-sm text-gray-600">
                                <strong>Purpose:</strong> {booking.purpose}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                            {getStatusIcon(realTimeStatus)}
                            <span className="ml-1">{statusDisplay.label}</span>
                          </span>
                          {canCancelBooking(booking) && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Button clicked!')
                              console.log('User:', user)
                              console.log('Token:', token)
                              handleCancelBooking(booking.id)
                            }}
                            disabled={cancellingBookingId === booking.id}
                            className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                              cancellingBookingId === booking.id
                                ? 'border-red-200 text-red-500 bg-red-25 cursor-not-allowed'
                                : 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400'
                            }`}
                          >
                            {cancellingBookingId === booking.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <X className="h-3 w-3 mr-1" />
                            )}
                            {cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
