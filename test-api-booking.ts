import fetch from 'node-fetch'

async function testBookingAPI() {
  console.log('\n=== TESTING BOOKING API ===')
  
  // First login to get a token
  const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'student@school.edu',
      password: 'student123'
    })
  })

  if (!loginResponse.ok) {
    console.error('Login failed:', await loginResponse.text())
    return
  }

  const loginData = await loginResponse.json() as any
  const token = loginData.token
  console.log('✅ Login successful, got token')

  // Now try to create a booking
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 3) // 3 days from now
  tomorrow.setHours(15, 0, 0, 0) // 3 PM

  const endTime = new Date(tomorrow)
  endTime.setHours(17, 0, 0, 0) // 5 PM

  const bookingData = {
    labId: 'cmdo3yutu0003vroodmgaexhv', // Computer Science Lab
    computerId: 'cmdo3yuua0009vroope5bbzi0', // CS-02 (different computer)
    startTime: tomorrow.toISOString(),
    endTime: endTime.toISOString(),
    purpose: 'API Test booking'
  }

  console.log('Booking data:', bookingData)

  const bookingResponse = await fetch('http://localhost:3001/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(bookingData)
  })

  console.log('Response status:', bookingResponse.status)
  const responseData = await bookingResponse.text()
  console.log('Response data:', responseData)

  if (bookingResponse.ok) {
    console.log('✅ Booking created successfully via API')
  } else {
    console.error('❌ Booking failed via API')
  }
}

testBookingAPI().catch(console.error)
