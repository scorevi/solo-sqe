'use client'

import { useState, useEffect } from 'react'
import { 
  Monitor, 
  User, 
  Wrench, 
  Clock,
  MapPin,
  BarChart3
} from 'lucide-react'
import { 
  type LabOccupancy,
  type ComputerWithBookingStatus,
  getOccupancyStatusDisplay,
  getOccupancyRateColor,
  generateSeatMap
} from '@/lib/seat-booking-utils'
import { getTimeRemaining } from '@/lib/booking-utils'

interface SeatMapProps {
  labId: string
  refreshInterval?: number
}

export default function SeatMap({ labId, refreshInterval = 30000 }: SeatMapProps) {
  const [occupancy, setOccupancy] = useState<LabOccupancy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        const response = await fetch(`/api/seat-occupancy?labId=${labId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch occupancy data')
        }
        const data = await response.json()
        setOccupancy(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchOccupancy()
    const interval = setInterval(fetchOccupancy, refreshInterval)

    return () => clearInterval(interval)
  }, [labId, refreshInterval])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading seat map: {error}</p>
      </div>
    )
  }

  if (!occupancy) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">No occupancy data available</p>
      </div>
    )
  }

  const seatMap = generateSeatMap(occupancy.computers, 8) // 8 columns per row

  return (
    <div className="space-y-6">
      {/* Lab Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">{occupancy.labName}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Occupancy Rate: 
              <span className={`ml-1 font-semibold ${getOccupancyRateColor(occupancy.occupancyRate)}`}>
                {occupancy.occupancyRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <Monitor className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-blue-900">{occupancy.totalSeats}</div>
            <div className="text-xs text-blue-600">Total Seats</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-green-600 text-lg font-bold mb-1">🟢</div>
            <div className="text-sm font-medium text-green-900">{occupancy.availableSeats}</div>
            <div className="text-xs text-green-600">Available</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-red-600 text-lg font-bold mb-1">🔴</div>
            <div className="text-sm font-medium text-red-900">{occupancy.occupiedSeats}</div>
            <div className="text-xs text-red-600">Occupied</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-yellow-600 text-lg font-bold mb-1">🟡</div>
            <div className="text-sm font-medium text-yellow-900">{occupancy.reservedSeats}</div>
            <div className="text-xs text-yellow-600">Reserved</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-orange-600 text-lg font-bold mb-1">🔧</div>
            <div className="text-sm font-medium text-orange-900">{occupancy.maintenanceSeats}</div>
            <div className="text-xs text-orange-600">Maintenance</div>
          </div>
        </div>
      </div>

      {/* Seat Map */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Real-time Seat Map
        </h3>
        
        <div className="space-y-3">
          {seatMap.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-wrap gap-2 justify-center">
              {row.map((computer) => (
                <SeatIcon key={computer.id} computer={computer} />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Legend</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            {[
              { status: 'AVAILABLE', label: 'Available', icon: '🟢' },
              { status: 'OCCUPIED', label: 'Occupied', icon: '🔴' },
              { status: 'RESERVED', label: 'Reserved (1hr)', icon: '🟡' },
              { status: 'MAINTENANCE', label: 'Maintenance', icon: '🔧' }
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
  )
}

interface SeatIconProps {
  computer: ComputerWithBookingStatus
}

function SeatIcon({ computer }: SeatIconProps) {
  const statusDisplay = getOccupancyStatusDisplay(computer.occupancyStatus)
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`
          w-12 h-12 rounded-lg border-2 cursor-pointer transition-all duration-200
          ${statusDisplay.bgColor} ${statusDisplay.borderColor}
          hover:scale-110 hover:shadow-md
          flex items-center justify-center
        `}
      >
        {computer.occupancyStatus === 'AVAILABLE' && (
          <Monitor className={`h-6 w-6 ${statusDisplay.color}`} />
        )}
        {computer.occupancyStatus === 'OCCUPIED' && (
          <User className={`h-6 w-6 ${statusDisplay.color}`} />
        )}
        {computer.occupancyStatus === 'RESERVED' && (
          <Clock className={`h-6 w-6 ${statusDisplay.color}`} />
        )}
        {computer.occupancyStatus === 'MAINTENANCE' && (
          <Wrench className={`h-6 w-6 ${statusDisplay.color}`} />
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
            <div className="font-medium">{computer.name}</div>
            <div className="text-gray-300">{statusDisplay.label}</div>
            {computer.currentBooking && (
              <div className="mt-1 pt-1 border-t border-gray-700">
                <div>User: {computer.currentBooking.userName}</div>
                <div>
                  Ends: {getTimeRemaining(computer.currentBooking.endTime).text}
                </div>
              </div>
            )}
            {computer.specifications && (
              <div className="mt-1 text-gray-400 text-xs">
                {computer.specifications.slice(0, 30)}...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
