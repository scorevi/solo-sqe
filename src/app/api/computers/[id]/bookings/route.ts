import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get all bookings for this computer (past, current, and future)
    const bookings = await prisma.booking.findMany({
      where: {
        computerId: id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    })

    // Transform the data to include user name
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      userName: booking.user.name,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      purpose: booking.purpose,
    }))

    return NextResponse.json(transformedBookings)
  } catch (error) {
    console.error('Error fetching computer bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch computer bookings' },
      { status: 500 }
    )
  }
}
