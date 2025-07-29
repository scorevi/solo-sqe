import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { bookingSchema, verifyToken } from '@/lib/auth'
import { emailService } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    let whereCondition = {}
    if (payload.role === 'STUDENT' || payload.role === 'TEACHER') {
      whereCondition = { userId: payload.userId }
    } else if (userId && payload.role === 'ADMIN') {
      whereCondition = { userId }
    }

    const bookings = await prisma.booking.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        lab: {
          select: {
            name: true,
            location: true,
          },
        },
        computer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    })

    return NextResponse.json(bookings)
  } catch (fetchError) {
    console.error('Failed to fetch bookings:', fetchError)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    // Convert string dates to Date objects
    const startTime = new Date(validatedData.startTime)
    const endTime = new Date(validatedData.endTime)

    // Validate booking times
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    if (startTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot book in the past' },
        { status: 400 }
      )
    }

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        labId: validatedData.labId,
        computerId: validatedData.computerId || undefined,
        status: {
          in: ['PENDING', 'APPROVED'],
        },
        OR: [
          {
            startTime: {
              lt: endTime,
            },
            endTime: {
              gt: startTime,
            },
          },
        ],
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Time slot is already booked' },
        { status: 409 }
      )
    }

    const booking = await prisma.booking.create({
      data: {
        ...validatedData,
        startTime,
        endTime,
        userId: payload.userId,
      },
      include: {
        lab: {
          select: {
            name: true,
            location: true,
          },
        },
        computer: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Send booking confirmation email
    try {
      await emailService.sendBookingConfirmation({
        userName: booking.user.name,
        userEmail: booking.user.email,
        labName: booking.lab.name,
        computerName: booking.computer?.name,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        purpose: booking.purpose || undefined,
        status: booking.status,
      })
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError)
      // Don't fail the booking if email fails
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (createError) {
    if (createError instanceof Error) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
