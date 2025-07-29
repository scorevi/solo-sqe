'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Monitor, 
  User, 
  Clock, 
  Calendar, 
  X, 
  Info,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { type ComputerWithBookingStatus } from '@/lib/seat-booking-utils'

interface SeatBooking {
  id: string
  userName: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  purpose?: string
}

interface SeatDetailModalProps {
  computer: ComputerWithBookingStatus
  isOpen: boolean
  onClose: () => void
}

export default function SeatDetailModal({ computer, isOpen, onClose }: SeatDetailModalProps) {
  const [bookings, setBookings] = useState<SeatBooking[]>([])
  const [loading, setLoading] = useState(false)

  const fetchComputerBookings = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/computers/${computer.id}/bookings`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Failed to fetch computer bookings:', error)
    } finally {
      setLoading(false)
    }
  }, [computer.id])

  useEffect(() => {
    if (isOpen && computer) {
      fetchComputerBookings()
    }
  }, [isOpen, computer, fetchComputerBookings])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'IN_PROGRESS':
        return <User className="h-4 w-4 text-blue-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'CANCELLED':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'COMPLETED':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    }
  }

  const getCurrentBookings = () => {
    const now = new Date()
    return bookings.filter(booking => {
      const start = new Date(booking.startTime)
      const end = new Date(booking.endTime)
      return start <= now && end >= now && booking.status === 'APPROVED'
    })
  }

  const getUpcomingBookings = () => {
    const now = new Date()
    return bookings.filter(booking => {
      const start = new Date(booking.startTime)
      return start > now && (booking.status === 'APPROVED' || booking.status === 'PENDING')
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }

  const getPastBookings = () => {
    const now = new Date()
    return bookings.filter(booking => {
      const end = new Date(booking.endTime)
      return end < now
    }).sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
  }

  if (!isOpen) return null

  const currentBookings = getCurrentBookings()
  const upcomingBookings = getUpcomingBookings()
  const pastBookings = getPastBookings()

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Monitor className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{computer.name}</h2>
              <p className="text-sm text-gray-600">Detailed Reservation Schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Computer Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Computer Information</span>
                </div>
                <div className="text-sm text-blue-800">
                  <div><strong>Name:</strong> {computer.name}</div>
                  <div><strong>Status:</strong> {computer.isAvailable ? 'Available' : 'Unavailable'}</div>
                  {computer.specifications && (
                    <div><strong>Specifications:</strong> {computer.specifications}</div>
                  )}
                </div>
              </div>

              {/* Current Bookings */}
              {currentBookings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 text-green-600 mr-2" />
                    Currently Active ({currentBookings.length})
                  </h3>
                  <div className="space-y-3">
                    {currentBookings.map((booking) => {
                      const startDate = formatDateTime(booking.startTime)
                      const endDate = formatDateTime(booking.endTime)
                      return (
                        <div key={booking.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {getStatusIcon(booking.status)}
                                <span className="font-medium text-gray-900">{booking.userName}</span>
                                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>From: {startDate.date} at {startDate.time}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Until: {endDate.date} at {endDate.time}</span>
                                </div>
                                {booking.purpose && (
                                  <div className="text-xs text-gray-500 mt-2">
                                    <strong>Purpose:</strong> {booking.purpose}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Upcoming Bookings */}
              {upcomingBookings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    Upcoming Reservations ({upcomingBookings.length})
                  </h3>
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => {
                      const startDate = formatDateTime(booking.startTime)
                      const endDate = formatDateTime(booking.endTime)
                      return (
                        <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {getStatusIcon(booking.status)}
                                <span className="font-medium text-gray-900">{booking.userName}</span>
                                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>From: {startDate.date} at {startDate.time}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Until: {endDate.date} at {endDate.time}</span>
                                </div>
                                {booking.purpose && (
                                  <div className="text-xs text-gray-500 mt-2">
                                    <strong>Purpose:</strong> {booking.purpose}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Past Bookings (last 5) */}
              {pastBookings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-gray-600 mr-2" />
                    Recent History ({Math.min(pastBookings.length, 5)})
                  </h3>
                  <div className="space-y-3">
                    {pastBookings.slice(0, 5).map((booking) => {
                      const startDate = formatDateTime(booking.startTime)
                      const endDate = formatDateTime(booking.endTime)
                      return (
                        <div key={booking.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {getStatusIcon(booking.status)}
                                <span className="font-medium text-gray-700">{booking.userName}</span>
                                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 space-y-1">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>From: {startDate.date} at {startDate.time}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Until: {endDate.date} at {endDate.time}</span>
                                </div>
                                {booking.purpose && (
                                  <div className="text-xs text-gray-400 mt-2">
                                    <strong>Purpose:</strong> {booking.purpose}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* No bookings */}
              {bookings.length === 0 && (
                <div className="text-center py-8">
                  <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reservations</h3>
                  <p className="text-gray-600">This computer has no reservations yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
