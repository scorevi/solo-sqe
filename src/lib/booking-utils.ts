/**
 * Utility functions for booking management and real-time status calculation
 */

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface BookingWithRealTimeStatus {
  id: string
  startTime: string
  endTime: string
  status: BookingStatus
  user: {
    name: string
  }
  lab: {
    name: string
    location: string
  }
  computer: {
    name: string
  } | null
  purpose?: string
}

/**
 * Calculate the real-time status of a booking based on current time
 */
export function calculateRealTimeStatus(booking: {
  status: BookingStatus
  startTime: string | Date
  endTime: string | Date
}): BookingStatus {
  const now = new Date()
  const startTime = new Date(booking.startTime)
  const endTime = new Date(booking.endTime)

  // If booking is not approved yet, return the current status
  if (booking.status === 'PENDING' || booking.status === 'REJECTED' || booking.status === 'CANCELLED') {
    return booking.status
  }

  // For approved bookings, calculate real-time status
  if (booking.status === 'APPROVED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') {
    if (now < startTime) {
      // Booking hasn't started yet
      return 'APPROVED'
    } else if (now >= startTime && now < endTime) {
      // Booking is currently in progress
      return 'IN_PROGRESS'
    } else {
      // Booking has finished
      return 'COMPLETED'
    }
  }

  // Fallback to original status
  return booking.status
}

/**
 * Get status display information including color and icon
 */
export function getStatusDisplay(status: BookingStatus) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Pending Approval',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200'
      }
    case 'APPROVED':
      return {
        label: 'Approved',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200'
      }
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200'
      }
    case 'COMPLETED':
      return {
        label: 'Completed',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200'
      }
    case 'REJECTED':
      return {
        label: 'Rejected',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200'
      }
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200'
      }
    default:
      return {
        label: 'Unknown',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200'
      }
  }
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string | Date): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format time range for display
 */
export function formatTimeRange(startTime: string | Date, endTime: string | Date): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  const startStr = start.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  
  const endStr = end.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  
  return `${startStr} - ${endStr}`
}

/**
 * Check if a booking can be cancelled (only if it hasn't started yet)
 */
export function canCancelBooking(booking: {
  status: BookingStatus
  startTime: string | Date
}): boolean {
  const realTimeStatus = calculateRealTimeStatus({
    status: booking.status,
    startTime: booking.startTime,
    endTime: booking.startTime // We only need startTime for this check
  })
  
  // Can only cancel if it's pending, approved but not started yet
  return (realTimeStatus === 'PENDING' || realTimeStatus === 'APPROVED') && 
         new Date() < new Date(booking.startTime)
}

/**
 * Get time remaining until booking starts or ends
 */
export function getTimeRemaining(targetTime: string | Date): {
  text: string
  isOverdue: boolean
} {
  const now = new Date()
  const target = new Date(targetTime)
  const diff = target.getTime() - now.getTime()
  
  if (diff < 0) {
    return { text: 'Overdue', isOverdue: true }
  }
  
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60
  
  if (days > 0) {
    return { 
      text: `${days} day${days > 1 ? 's' : ''}, ${hours}h ${minutes}m ${seconds}s`, 
      isOverdue: false 
    }
  } else if (hours > 0) {
    return { 
      text: `${hours}h ${minutes}m ${seconds}s`, 
      isOverdue: false 
    }
  } else if (minutes > 0) {
    return { 
      text: `${minutes}m ${seconds}s`, 
      isOverdue: false 
    }
  } else if (seconds > 0) {
    return { 
      text: `${seconds}s`, 
      isOverdue: false 
    }
  } else {
    return { text: 'Starting now', isOverdue: false }
  }
}
