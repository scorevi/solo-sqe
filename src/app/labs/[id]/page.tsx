'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import SeatMap from '@/components/SeatMap'
import SeatSelectionBooking from '@/components/SeatSelectionBooking'
import Link from 'next/link'
import { 
  Computer, 
  MapPin, 
  Users, 
  Clock, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Monitor,
  Calendar
} from 'lucide-react'
import { 
  calculateRealTimeStatus, 
  getStatusDisplay, 
  formatTimeRange,
  type BookingStatus 
} from '@/lib/booking-utils'

interface Computer {
  id: string
  name: string
  specifications: string
  isWorking: boolean
}

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: BookingStatus
  user: {
    name: string
  }
  computer: {
    name: string
  } | null
}

interface Lab {
  id: string
  name: string
  location: string
  capacity: number
  description: string | null
  computers: Computer[]
  bookings: Booking[]
  _count: {
    computers: number
  }
}

interface LabDetailsProps {
  params: Promise<{ id: string }>
}

export default function LabDetailsPage({ params }: LabDetailsProps) {
  const { user, token } = useAuth()
  const searchParams = useSearchParams()
  const [lab, setLab] = useState<Lab | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [labId, setLabId] = useState<string>('')
  const [currentView, setCurrentView] = useState<'overview' | 'seat-map' | 'book-seat'>('overview')

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setLabId(resolvedParams.id)
      
      // Check URL parameter for initial view
      const viewParam = searchParams.get('view')
      if (viewParam === 'book-seat') {
        setCurrentView('book-seat')
      }
    }
    getParams()
  }, [params, searchParams])

  useEffect(() => {
    const fetchLabDetails = async () => {
      if (!labId || !token) return

      try {
        const response = await fetch(`/api/labs/${labId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const labData = await response.json()
          setLab(labData)
        } else {
          setError('Failed to load lab details')
        }
      } catch (fetchError) {
        console.error('Failed to fetch lab details:', fetchError)
        setError('Failed to load lab details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLabDetails()
  }, [labId, token])

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActiveBookings = () => {
    if (!lab) return []
    const now = new Date()
    return lab.bookings.filter(booking => 
      booking.status === 'APPROVED' && 
      new Date(booking.startTime) <= now && 
      new Date(booking.endTime) > now
    )
  }

  const getUpcomingBookings = () => {
    if (!lab) return []
    const now = new Date()
    return lab.bookings
      .filter(booking => 
        ['PENDING', 'APPROVED'].includes(booking.status) && 
        new Date(booking.startTime) > now
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5) // Show next 5 bookings
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !lab) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Lab Not Found</h1>
              <p className="text-gray-600 mb-6">{error || 'The requested lab could not be found.'}</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const activeBookings = getActiveBookings()
  const upcomingBookings = getUpcomingBookings()
  const workingComputers = lab.computers.filter(c => c.isWorking)
  const availableComputers = workingComputers.length - activeBookings.length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{lab.name}</h1>
                {lab.description && (
                  <p className="mt-2 text-gray-600">{lab.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {lab.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Capacity: {lab.capacity}
                  </div>
                  <div className="flex items-center">
                    <Computer className="h-4 w-4 mr-1" />
                    {workingComputers.length} working computers
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setCurrentView('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    currentView === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Computer className="h-4 w-4 inline mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setCurrentView('seat-map')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    currentView === 'seat-map'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Monitor className="h-4 w-4 inline mr-2" />
                  Real-time Seat Map
                </button>
                {user?.role === 'STUDENT' && (
                  <button
                    onClick={() => setCurrentView('book-seat')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      currentView === 'book-seat'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Book a Seat
                  </button>
                )}
              </nav>
            </div>
          </div>

          {/* Content based on current view */}
          {currentView === 'overview' && (
            <>
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                <Computer className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Computers</p>
                  <p className="text-2xl font-bold text-gray-900">{lab.computers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Working</p>
                  <p className="text-2xl font-bold text-gray-900">{workingComputers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Currently In Use</p>
                  <p className="text-2xl font-bold text-gray-900">{activeBookings.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Now</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.max(0, availableComputers)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Computers List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Computers</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lab.computers.map((computer) => (
                    <div
                      key={computer.id}
                      className={`border rounded-lg p-4 ${
                        computer.isWorking
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{computer.name}</h4>
                        {computer.isWorking ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{computer.specifications}</p>
                      <p className={`text-xs mt-1 ${
                        computer.isWorking ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {computer.isWorking ? 'Working' : 'Out of Order'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Current & Upcoming Bookings */}
            <div className="space-y-6">
              {/* Active Bookings */}
              {activeBookings.length > 0 && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Currently Active</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {activeBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{booking.user.name}</p>
                            <p className="text-sm text-gray-600">
                              {booking.computer?.name || 'Any computer'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Until {formatDateTime(booking.endTime)}
                            </p>
                          </div>
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Active</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Bookings */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Upcoming Bookings</h3>
                </div>
                <div className="p-6">
                  {upcomingBookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No upcoming bookings</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingBookings.map((booking) => {
                        const realTimeStatus = calculateRealTimeStatus(booking)
                        const statusDisplay = getStatusDisplay(realTimeStatus)
                        
                        return (
                          <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{booking.user.name}</p>
                              <p className="text-sm text-gray-600">
                                {booking.computer?.name || 'Any computer'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatTimeRange(booking.startTime, booking.endTime)}
                              </p>
                            </div>
                            <div className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                              {getStatusIcon(realTimeStatus)}
                              <span className="ml-1">{statusDisplay.label}</span>
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
          </>
          )}

          {/* Seat Map View */}
          {currentView === 'seat-map' && (
            <SeatMap labId={labId} refreshInterval={5000} />
          )}

          {/* Book Seat View */}
          {currentView === 'book-seat' && user?.role === 'STUDENT' && (
            <SeatSelectionBooking 
              labId={labId} 
              labName={lab.name}
              onBookingComplete={() => {
                setCurrentView('seat-map')
                // Optionally refresh lab data
                window.location.reload()
              }}
              onCancel={() => setCurrentView('overview')}
            />
          )}
        </div>
      </div>
    </div>
  )
}
