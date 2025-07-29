import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testBooking() {
  console.log('\n=== TESTING BOOKING CREATION ===')
  
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 2) // Day after tomorrow
  tomorrow.setHours(14, 0, 0, 0) // 2 PM

  const endTime = new Date(tomorrow)
  endTime.setHours(16, 0, 0, 0) // 4 PM

  const testBookingData = {
    userId: 'cmdo3yutp0002vroo0z8u6jox', // Jane Student
    labId: 'cmdo3yutu0003vroodmgaexhv', // Computer Science Lab
    computerId: 'cmdo3yuu60007vroo05hthhp4', // CS-01
    startTime: tomorrow,
    endTime: endTime,
    purpose: 'Test booking',
    status: 'PENDING' as const,
  }

  console.log('Booking data:', testBookingData)

  try {
    const booking = await prisma.booking.create({
      data: testBookingData,
      include: {
        user: { select: { name: true, email: true } },
        lab: { select: { name: true, location: true } },
        computer: { select: { name: true } }
      }
    })

    console.log('✅ Booking created successfully:', booking)
  } catch (error) {
    console.error('❌ Booking creation failed:', error)
  }

  await prisma.$disconnect()
}

testBooking().catch(console.error)
