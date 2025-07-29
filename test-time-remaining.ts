/**
 * Test script to verify time remaining functionality
 */

import { getTimeRemaining, calculateRealTimeStatus } from './src/lib/booking-utils'

// Test cases
const now = new Date()

// Test 1: Booking starting in 2 hours
const futureBooking = {
  status: 'APPROVED' as const,
  startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
  endTime: new Date(now.getTime() + 5 * 60 * 60 * 1000), // 5 hours from now
}

// Test 2: Booking currently in progress (started 30 min ago, ends in 90 min)
const inProgressBooking = {
  status: 'APPROVED' as const,
  startTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
  endTime: new Date(now.getTime() + 90 * 60 * 1000), // 90 minutes from now
}

// Test 3: Completed booking
const completedBooking = {
  status: 'APPROVED' as const,
  startTime: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
  endTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
}

console.log('🧪 Testing Time Remaining Logic\n')

console.log('📅 Current time:', now.toLocaleString())
console.log('\n1. Future Booking (Approved):')
console.log('   Start:', futureBooking.startTime.toLocaleString())
console.log('   End:', futureBooking.endTime.toLocaleString())
console.log('   Real-time Status:', calculateRealTimeStatus(futureBooking))
console.log('   Time Remaining:', getTimeRemaining(futureBooking.startTime))

console.log('\n2. In Progress Booking:')
console.log('   Start:', inProgressBooking.startTime.toLocaleString())
console.log('   End:', inProgressBooking.endTime.toLocaleString())
console.log('   Real-time Status:', calculateRealTimeStatus(inProgressBooking))
console.log('   Time Remaining:', getTimeRemaining(inProgressBooking.endTime))

console.log('\n3. Completed Booking:')
console.log('   Start:', completedBooking.startTime.toLocaleString())
console.log('   End:', completedBooking.endTime.toLocaleString())
console.log('   Real-time Status:', calculateRealTimeStatus(completedBooking))

console.log('\n✅ Time remaining logic test completed!')
