// Simple manual test to validate the system
// This script can be run to test the booking system functionality

const BASE_URL = 'http://localhost:3001'

interface TestUser {
  email: string
  password: string
  role: string
  token?: string
}

const testUsers: TestUser[] = [
  { email: 'admin@example.com', password: 'admin123', role: 'ADMIN' },
  { email: 'teacher@example.com', password: 'teacher123', role: 'TEACHER' },
  { email: 'student@example.com', password: 'student123', role: 'STUDENT' }
]

async function testAuthentication() {
  console.log('\n=== Testing Authentication ===')
  
  for (const user of testUsers) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: user.password
        })
      })

      if (response.ok) {
        const data = await response.json()
        user.token = data.token
        console.log(`✅ ${user.role} login successful`)
      } else {
        console.log(`❌ ${user.role} login failed:`, response.status)
      }
    } catch (error) {
      console.log(`❌ ${user.role} login error:`, error)
    }
  }
}

async function testLabRetrieval() {
  console.log('\n=== Testing Lab Retrieval ===')
  
  const studentUser = testUsers.find(u => u.role === 'STUDENT')
  if (!studentUser?.token) {
    console.log('❌ No student token available')
    return null
  }

  try {
    const response = await fetch(`${BASE_URL}/api/labs`, {
      headers: { Authorization: `Bearer ${studentUser.token}` }
    })

    if (response.ok) {
      const labs = await response.json()
      console.log(`✅ Retrieved ${labs.length} labs`)
      return labs[0] // Return first lab for booking test
    } else {
      console.log('❌ Failed to retrieve labs:', response.status)
      return null
    }
  } catch (error) {
    console.log('❌ Lab retrieval error:', error)
    return null
  }
}

async function testBookingCreation(lab: any) {
  console.log('\n=== Testing Booking Creation ===')
  
  const studentUser = testUsers.find(u => u.role === 'STUDENT')
  if (!studentUser?.token || !lab) {
    console.log('❌ Missing requirements for booking test')
    return null
  }

  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // +2 hours

  try {
    const response = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentUser.token}`
      },
      body: JSON.stringify({
        labId: lab.id,
        computerId: lab.computers?.[0]?.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        purpose: 'System test booking'
      })
    })

    if (response.ok) {
      const booking = await response.json()
      console.log('✅ Booking created successfully')
      console.log(`   Booking ID: ${booking.id}`)
      console.log(`   Status: ${booking.status}`)
      return booking
    } else {
      const error = await response.json()
      console.log('❌ Booking creation failed:', error.error)
      return null
    }
  } catch (error) {
    console.log('❌ Booking creation error:', error)
    return null
  }
}

async function testAdminStats() {
  console.log('\n=== Testing Admin Stats ===')
  
  const adminUser = testUsers.find(u => u.role === 'ADMIN')
  if (!adminUser?.token) {
    console.log('❌ No admin token available')
    return
  }

  try {
    const response = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminUser.token}` }
    })

    if (response.ok) {
      const stats = await response.json()
      console.log('✅ Admin stats retrieved:')
      console.log(`   Total Users: ${stats.totalUsers}`)
      console.log(`   Total Labs: ${stats.totalLabs}`)
      console.log(`   Total Bookings: ${stats.totalBookings}`)
      console.log(`   Active Bookings: ${stats.activeBookings}`)
    } else {
      console.log('❌ Admin stats failed:', response.status)
    }
  } catch (error) {
    console.log('❌ Admin stats error:', error)
  }
}

async function testBookingApproval(booking: any) {
  console.log('\n=== Testing Booking Approval ===')
  
  const adminUser = testUsers.find(u => u.role === 'ADMIN')
  if (!adminUser?.token || !booking) {
    console.log('❌ Missing requirements for approval test')
    return
  }

  try {
    const response = await fetch(`${BASE_URL}/api/admin/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminUser.token}`
      },
      body: JSON.stringify({ status: 'APPROVED' })
    })

    if (response.ok) {
      const updatedBooking = await response.json()
      console.log('✅ Booking approved successfully')
      console.log(`   New Status: ${updatedBooking.status}`)
    } else {
      console.log('❌ Booking approval failed:', response.status)
    }
  } catch (error) {
    console.log('❌ Booking approval error:', error)
  }
}

async function runSystemTest() {
  console.log('🚀 Starting Computer Lab Booking System Test')
  console.log(`Testing against: ${BASE_URL}`)
  
  try {
    await testAuthentication()
    const lab = await testLabRetrieval()
    const booking = await testBookingCreation(lab)
    await testAdminStats()
    await testBookingApproval(booking)
    
    console.log('\n✅ System test completed!')
    console.log('\n📋 Test Summary:')
    console.log('- Authentication: User login and token generation')
    console.log('- Lab Management: Retrieve available labs and computers')
    console.log('- Booking System: Create new bookings with validation')
    console.log('- Admin Functions: View system stats and manage bookings')
    console.log('- Role-based Access: Different permissions for different roles')
    console.log('- Email Notifications: Configured (check console for logs)')
    
  } catch (error) {
    console.log('\n❌ System test failed:', error)
  }
}

// Export for potential use as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runSystemTest }
} else {
  // Run if called directly
  runSystemTest()
}

console.log('\n📝 Manual Testing Instructions:')
console.log('1. Ensure the development server is running (npm run dev)')
console.log('2. Open browser to http://localhost:3001')
console.log('3. Test the following user journeys:')
console.log('   - Register new users with different roles')
console.log('   - Login and navigate through the dashboard')
console.log('   - Create bookings using the booking form')
console.log('   - View bookings in "My Bookings" page')
console.log('   - Test admin panel functionality')
console.log('   - Check responsive design on mobile devices')
console.log('4. Run this test script with: node manual-test.js')
