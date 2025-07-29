'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { 
  Monitor, 
  User, 
  Wrench, 
  Clock,
  Calendar,
  MapPin,
  CheckCircle,
  X
} from 'lucide-react'
import { 
  generateSeatMap,
  findAvailableComputers,
  type LabOccupancy,
  type ComputerWithBookingStatus
} from '@/lib/seat-booking-utils'

interface SeatSelectionBookingProps {
  labId: string
  labName: string
  onBookingComplete?: () => void
  onCancel?: () => void
}

export default function SeatSelectionBooking({ 
  labId, 
  labName, 
  onBookingComplete, 
  onCancel 
}: SeatSelectionBookingProps) {
  const { user, token } = useAuth()
  const [occupancy, setOccupancy] = useState<LabOccupancy | null>(null)
  const [selectedComputer, setSelectedComputer] = useState<ComputerWithBookingStatus | null>(null)
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    purpose: ''
  })
  const [availableComputers, setAvailableComputers] = useState<ComputerWithBookingStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clear any existing errors when component mounts
  useEffect(() => {
    setError(null)
  }, [])

  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        const response = await fetch(`/api/seat-occupancy?labId=${labId}`)
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please log in to view seat availability')
          }
          const errorText = await response.text()
          console.error('Seat occupancy API error:', response.status, errorText)
          throw new Error(errorText || 'Failed to fetch occupancy data')
        }
        const data = await response.json()
        setOccupancy(data)
        setError(null)
      } catch (err) {
        console.error('Fetch occupancy error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchOccupancy()
  }, [labId])

  // Update available computers when time slots change
  useEffect(() => {
    if (!occupancy || !formData.startTime || !formData.endTime) {
      setAvailableComputers([])
      return
    }

    const startTime = new Date(formData.startTime)
    const endTime = new Date(formData.endTime)

    if (startTime >= endTime) {
      setAvailableComputers([])
      return
    }

    // Mock bookings data for finding available computers
    const mockBookings = occupancy.computers
      .filter((c: ComputerWithBookingStatus) => c.currentBooking)
      .map((c: ComputerWithBookingStatus) => ({
        computerId: c.id,
        startTime: c.currentBooking!.startTime,
        endTime: c.currentBooking!.endTime,
        status: c.currentBooking!.status
      }))

    const available = findAvailableComputers(
      occupancy.computers,
      mockBookings as Array<{
        computerId: string | null
        startTime: string
        endTime: string
        status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
      }>,
      startTime,
      endTime
    )

    const availableWithStatus = available.map(computer => 
      occupancy.computers.find((c: ComputerWithBookingStatus) => c.id === computer.id)!
    )

    setAvailableComputers(availableWithStatus)
    
    // Clear selection if selected computer is no longer available
    if (selectedComputer && !availableWithStatus.find((c: ComputerWithBookingStatus) => c.id === selectedComputer.id)) {
      setSelectedComputer(null)
    }
  }, [occupancy, formData.startTime, formData.endTime, selectedComputer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedComputer || !user) return

    setSubmitting(true)
    setError(null)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      // Convert datetime-local format to ISO string
      const startTimeISO = new Date(formData.startTime).toISOString()
      const endTimeISO = new Date(formData.endTime).toISOString()

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          labId: labId,
          computerId: selectedComputer.id,
          startTime: startTimeISO,
          endTime: endTimeISO,
          purpose: formData.purpose
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to create a booking')
        }
        const errorData = await response.json()
        console.error('Booking API error:', errorData)
        
        // Handle validation errors
        if (Array.isArray(errorData) && errorData.length > 0) {
          const errorMessages = errorData.map(err => err.message).join(', ')
          throw new Error(`Validation error: ${errorMessages}`)
        }
        
        throw new Error(errorData.error || 'Failed to create booking')
      }

      // Reset form
      setFormData({ startTime: '', endTime: '', purpose: '' })
      setSelectedComputer(null)
      
      if (onBookingComplete) {
        onBookingComplete()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  const isComputerSelectable = (computer: ComputerWithBookingStatus): boolean => {
    return !!(formData.startTime && formData.endTime && 
           availableComputers.find(c => c.id === computer.id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!occupancy) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load lab data</p>
      </div>
    )
  }

  const seatMap = generateSeatMap(occupancy.computers, 8) // 8 columns per row

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Book a Seat - {labName}
            </h2>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Booking Details
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  min={formData.startTime || new Date().toISOString().slice(0, 16)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Describe the purpose of your booking..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Selected Computer Info */}
              {selectedComputer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Selected Computer
                    </span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <div className="font-medium">{selectedComputer.name}</div>
                    {selectedComputer.specifications && (
                      <div className="text-xs mt-1 text-blue-600">
                        {selectedComputer.specifications}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Available Computers Count */}
              {formData.startTime && formData.endTime && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{availableComputers.length}</span> computers 
                  available for the selected time slot
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedComputer || submitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    <span>Book Selected Seat</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Seat Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Your Seat
            </h3>

            {!formData.startTime || !formData.endTime ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Please select start and end times to see available seats</p>
              </div>
            ) : (
              <div className="space-y-3">
                {seatMap.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex flex-wrap gap-2 justify-center">
                    {row.map((computer) => (
                      <SeatSelectionIcon 
                        key={computer.id} 
                        computer={computer}
                        isSelectable={isComputerSelectable(computer)}
                        isSelected={selectedComputer?.id === computer.id}
                        onSelect={() => {
                          if (isComputerSelectable(computer)) {
                            setSelectedComputer(computer)
                          }
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Legend</h4>
              <div className="flex flex-wrap gap-4 text-xs">
                {[
                  { status: 'available', label: 'Available for booking', icon: '🟢' },
                  { status: 'occupied', label: 'Currently occupied', icon: '🔴' },
                  { status: 'selected', label: 'Selected', icon: '✅' },
                  { status: 'reserved', label: 'Reserved', icon: '🟡' },
                  { status: 'maintenance', label: 'Under maintenance', icon: '🔧' }
                ].map(({ status, label, icon }) => (
                  <div key={status} className="flex items-center space-x-1">
                    <span className="text-sm">{icon}</span>
                    <span className="text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SeatSelectionIconProps {
  computer: ComputerWithBookingStatus
  isSelectable: boolean
  isSelected: boolean
  onSelect: () => void
}

function SeatSelectionIcon({ computer, isSelectable, isSelected, onSelect }: SeatSelectionIconProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const getIconStyle = () => {
    if (isSelected) {
      return 'bg-blue-100 border-blue-500 border-2'
    }
    if (isSelectable) {
      return 'bg-green-100 border-green-500 hover:bg-green-200 cursor-pointer'
    }
    if (computer.occupancyStatus === 'MAINTENANCE') {
      return 'bg-orange-100 border-orange-500 cursor-not-allowed'
    }
    if (computer.occupancyStatus === 'RESERVED') {
      return 'bg-yellow-100 border-yellow-500 cursor-not-allowed'
    }
    if (computer.occupancyStatus === 'OCCUPIED') {
      return 'bg-red-100 border-red-500 cursor-not-allowed'
    }
    return 'bg-gray-100 border-gray-500 cursor-not-allowed'
  }

  const getIconColor = () => {
    if (isSelected) return 'text-blue-600'
    if (isSelectable) return 'text-green-600'
    if (computer.occupancyStatus === 'MAINTENANCE') return 'text-orange-600'
    if (computer.occupancyStatus === 'RESERVED') return 'text-yellow-600'
    if (computer.occupancyStatus === 'OCCUPIED') return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`
          w-12 h-12 rounded-lg border transition-all duration-200
          ${getIconStyle()}
          ${isSelectable ? 'hover:scale-110 hover:shadow-md' : ''}
          flex items-center justify-center
        `}
        onClick={onSelect}
      >
        {isSelected ? (
          <CheckCircle className={`h-6 w-6 ${getIconColor()}`} />
        ) : computer.occupancyStatus === 'MAINTENANCE' ? (
          <Wrench className={`h-6 w-6 ${getIconColor()}`} />
        ) : computer.occupancyStatus === 'RESERVED' ? (
          <Clock className={`h-6 w-6 ${getIconColor()}`} />
        ) : computer.occupancyStatus === 'OCCUPIED' ? (
          <User className={`h-6 w-6 ${getIconColor()}`} />
        ) : isSelectable ? (
          <Monitor className={`h-6 w-6 ${getIconColor()}`} />
        ) : (
          <Monitor className={`h-6 w-6 ${getIconColor()}`} />
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
            <div className="font-medium">{computer.name}</div>
            <div className="text-gray-300">
              {isSelected 
                ? 'Selected' 
                : isSelectable 
                ? 'Available for booking' 
                : computer.occupancyStatus === 'MAINTENANCE'
                ? 'Under maintenance'
                : computer.occupancyStatus === 'RESERVED'
                ? 'Reserved'
                : computer.occupancyStatus === 'OCCUPIED'
                ? 'Currently occupied'
                : 'Unavailable'
              }
            </div>
            {computer.specifications && (
              <div className="mt-1 text-gray-400 text-xs">
                {computer.specifications.slice(0, 40)}...
              </div>
            )}
            {!isSelectable && computer.currentBooking && (
              <div className="mt-1 pt-1 border-t border-gray-700">
                <div>In use by: {computer.currentBooking.userName}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
