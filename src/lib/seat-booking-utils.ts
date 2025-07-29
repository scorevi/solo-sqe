/**
 * Advanced seat-based booking utilities for computer lab reservation system
 */

import { BookingStatus } from './booking-utils'

export interface Computer {
  id: string
  name: string
  specifications?: string | null
  isWorking: boolean
  labId: string
}

export interface ComputerWithBookingStatus extends Computer {
  currentBooking?: {
    id: string
    userId: string
    userName: string
    startTime: string
    endTime: string
    status: BookingStatus
  } | null
  isAvailable: boolean
  occupancyStatus: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'
}

export interface LabOccupancy {
  labId: string
  labName: string
  totalSeats: number
  availableSeats: number
  occupiedSeats: number
  maintenanceSeats: number
  reservedSeats: number
  occupancyRate: number
  computers: ComputerWithBookingStatus[]
}

/**
 * Calculate the occupancy status of a computer based on current time and bookings
 */
export function calculateComputerOccupancy(
  computer: Computer,
  bookings: Array<{
    id: string
    userId: string
    userName: string
    computerId: string | null
    startTime: string
    endTime: string
    status: BookingStatus
  }>
): ComputerWithBookingStatus {
  const now = new Date()
  
  // If computer is not working, it's in maintenance
  if (!computer.isWorking) {
    return {
      ...computer,
      currentBooking: null,
      isAvailable: false,
      occupancyStatus: 'MAINTENANCE'
    }
  }

  // Find current active booking for this computer
  const currentBooking = bookings.find(booking => {
    if (booking.computerId !== computer.id) return false
    if (booking.status !== 'APPROVED' && booking.status !== 'IN_PROGRESS') return false
    
    const startTime = new Date(booking.startTime)
    const endTime = new Date(booking.endTime)
    
    return now >= startTime && now < endTime
  })

  if (currentBooking) {
    return {
      ...computer,
      currentBooking: {
        id: currentBooking.id,
        userId: currentBooking.userId,
        userName: currentBooking.userName,
        startTime: currentBooking.startTime,
        endTime: currentBooking.endTime,
        status: currentBooking.status
      },
      isAvailable: false,
      occupancyStatus: 'OCCUPIED'
    }
  }

  // Check for upcoming reservations (within next 4 hours for better visibility)
  const upcomingBooking = bookings.find(booking => {
    if (booking.computerId !== computer.id) return false
    // Include both APPROVED and PENDING bookings as reserved
    if (booking.status !== 'APPROVED' && booking.status !== 'PENDING') return false
    
    const startTime = new Date(booking.startTime)
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000) // Extended to 4 hours
    
    return startTime > now && startTime <= fourHoursFromNow
  })

  if (upcomingBooking) {
    return {
      ...computer,
      currentBooking: {
        id: upcomingBooking.id,
        userId: upcomingBooking.userId,
        userName: upcomingBooking.userName,
        startTime: upcomingBooking.startTime,
        endTime: upcomingBooking.endTime,
        status: upcomingBooking.status
      },
      isAvailable: false,
      occupancyStatus: 'RESERVED'
    }
  }

  // Computer is available
  return {
    ...computer,
    currentBooking: null,
    isAvailable: true,
    occupancyStatus: 'AVAILABLE'
  }
}

/**
 * Calculate lab occupancy statistics
 */
export function calculateLabOccupancy(
  labId: string,
  labName: string,
  computers: Computer[],
  bookings: Array<{
    id: string
    userId: string
    userName: string
    computerId: string | null
    startTime: string
    endTime: string
    status: BookingStatus
  }>
): LabOccupancy {
  const computersWithStatus = computers.map(computer => 
    calculateComputerOccupancy(computer, bookings)
  )

  const totalSeats = computers.length
  const availableSeats = computersWithStatus.filter(c => c.occupancyStatus === 'AVAILABLE').length
  const occupiedSeats = computersWithStatus.filter(c => c.occupancyStatus === 'OCCUPIED').length
  const maintenanceSeats = computersWithStatus.filter(c => c.occupancyStatus === 'MAINTENANCE').length
  const reservedSeats = computersWithStatus.filter(c => c.occupancyStatus === 'RESERVED').length
  
  const occupancyRate = totalSeats > 0 ? ((occupiedSeats + reservedSeats) / totalSeats) * 100 : 0

  return {
    labId,
    labName,
    totalSeats,
    availableSeats,
    occupiedSeats,
    maintenanceSeats,
    reservedSeats,
    occupancyRate: Math.round(occupancyRate * 100) / 100,
    computers: computersWithStatus
  }
}

/**
 * Find available computers in a lab for a specific time slot
 */
export function findAvailableComputers(
  computers: Computer[],
  bookings: Array<{
    computerId: string | null
    startTime: string
    endTime: string
    status: BookingStatus
  }>,
  requestedStartTime: Date,
  requestedEndTime: Date
): Computer[] {
  return computers.filter(computer => {
    // Skip computers that are not working
    if (!computer.isWorking) return false

    // Check if computer has conflicting bookings
    const hasConflict = bookings.some(booking => {
      if (booking.computerId !== computer.id) return false
      if (booking.status !== 'APPROVED' && booking.status !== 'IN_PROGRESS' && booking.status !== 'PENDING') return false

      const bookingStart = new Date(booking.startTime)
      const bookingEnd = new Date(booking.endTime)

      // Check for time overlap
      return (
        (requestedStartTime >= bookingStart && requestedStartTime < bookingEnd) ||
        (requestedEndTime > bookingStart && requestedEndTime <= bookingEnd) ||
        (requestedStartTime <= bookingStart && requestedEndTime >= bookingEnd)
      )
    })

    return !hasConflict
  })
}

/**
 * Get occupancy status display information
 */
export function getOccupancyStatusDisplay(status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED') {
  switch (status) {
    case 'AVAILABLE':
      return {
        label: 'Available',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: '🟢'
      }
    case 'OCCUPIED':
      return {
        label: 'Occupied',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: '🔴'
      }
    case 'MAINTENANCE':
      return {
        label: 'Maintenance',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200',
        icon: '🔧'
      }
    case 'RESERVED':
      return {
        label: 'Reserved',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
        icon: '🟡'
      }
    default:
      return {
        label: 'Unknown',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200',
        icon: '❓'
      }
  }
}

/**
 * Get occupancy rate display color based on percentage
 */
export function getOccupancyRateColor(occupancyRate: number): string {
  if (occupancyRate >= 90) return 'text-red-600'
  if (occupancyRate >= 75) return 'text-orange-600'
  if (occupancyRate >= 50) return 'text-yellow-600'
  return 'text-green-600'
}

/**
 * Generate seat map layout for visual representation
 */
export function generateSeatMap(computers: ComputerWithBookingStatus[], maxColumns: number = 6): ComputerWithBookingStatus[][] {
  const seatMap: ComputerWithBookingStatus[][] = []
  
  for (let i = 0; i < computers.length; i += maxColumns) {
    seatMap.push(computers.slice(i, i + maxColumns))
  }
  
  return seatMap
}
