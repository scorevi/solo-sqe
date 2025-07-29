import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, BookingStatus } from '@prisma/client'
import { 
  calculateLabOccupancy,
  type LabOccupancy 
} from '@/lib/seat-booking-utils'

const prisma = new PrismaClient()

interface BookingWithUser {
  id: string
  userId: string
  computerId: string | null
  startTime: Date
  endTime: Date
  status: BookingStatus
  user: {
    name: string
  }
}

interface LabWithRelations {
  id: string
  name: string
  computers: Array<{
    id: string
    name: string
    specifications: string | null
    isWorking: boolean
    labId: string
    createdAt: Date
    updatedAt: Date
  }>
  bookings: BookingWithUser[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const labId = searchParams.get('labId')

    if (labId) {
      // Get specific lab occupancy
      const lab = await prisma.computerLab.findUnique({
        where: { id: labId },
        include: {
          computers: true,
          bookings: {
            where: {
              status: {
                in: ['APPROVED', 'IN_PROGRESS', 'PENDING'] as BookingStatus[]
              }
            },
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }) as LabWithRelations | null

      if (!lab) {
        return NextResponse.json(
          { error: 'Lab not found' },
          { status: 404 }
        )
      }

      const bookingsWithUserName = lab.bookings.map((booking: BookingWithUser) => ({
        id: booking.id,
        userId: booking.userId,
        userName: booking.user.name,
        computerId: booking.computerId,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status
      }))

      const occupancy = calculateLabOccupancy(
        lab.id,
        lab.name,
        lab.computers,
        bookingsWithUserName
      )

      // Debug logging
      console.log(`Lab ${lab.name}: Found ${bookingsWithUserName.length} active bookings`)
      console.log('Reserved computers:', occupancy.computers.filter(c => c.occupancyStatus === 'RESERVED').length)

      return NextResponse.json(occupancy)
    } else {
      // Get all labs occupancy
      const labs = await prisma.computerLab.findMany({
        where: { isActive: true },
        include: {
          computers: true,
          bookings: {
            where: {
              status: {
                in: ['APPROVED', 'IN_PROGRESS', 'PENDING'] as BookingStatus[]
              }
            },
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }) as LabWithRelations[]

      const allOccupancies: LabOccupancy[] = labs.map((lab: LabWithRelations) => {
        const bookingsWithUserName = lab.bookings.map((booking: BookingWithUser) => ({
          id: booking.id,
          userId: booking.userId,
          userName: booking.user.name,
          computerId: booking.computerId,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          status: booking.status
        }))

        return calculateLabOccupancy(
          lab.id,
          lab.name,
          lab.computers,
          bookingsWithUserName
        )
      })

      return NextResponse.json(allOccupancies)
    }
  } catch (error) {
    console.error('Error fetching seat occupancy:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seat occupancy data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
