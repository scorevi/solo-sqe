import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { bookingSchema, verifyToken } from '@/lib/auth'
import { emailService } from '@/lib/email'
import { BookingStatus } from '@prisma/client'

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
    
    // Students can only view their own bookings
    if (payload.role === 'STUDENT') {
      whereCondition = { userId: payload.userId }
    } 
    // Teachers can view their own bookings (if they had any, but they can't create them)
    else if (payload.role === 'TEACHER') {
      whereCondition = { userId: payload.userId }
    }
    // Admins can view all bookings or specific user's bookings
    else if (payload.role === 'ADMIN') {
      if (userId) {
        whereCondition = { userId }
      }
      // If no userId specified, admin sees all bookings
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

    // Only students can create bookings
    if (payload.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Only students can make lab reservations' },
        { status: 403 }
      )
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

    // Validate booking duration (max 1 week)
    const maxDuration = 7 * 24 * 60 * 60 * 1000 // 1 week in milliseconds
    if (endTime.getTime() - startTime.getTime() > maxDuration) {
      return NextResponse.json(
        { error: 'Booking duration cannot exceed 1 week' },
        { status: 400 }
      )
    }

    // For students, check active booking limit (max 2 active reservations)
    if (payload.role === 'STUDENT') {
      const activeBookingsCount = await prisma.booking.count({
        where: {
          userId: payload.userId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.APPROVED],
          },
          endTime: {
            gt: new Date(), // Only count future/active bookings
          },
        },
      })

      if (activeBookingsCount >= 2) {
        return NextResponse.json(
          { error: 'Students can only have up to 2 active reservations at a time' },
          { status: 400 }
        )
      }
    }

    // Check for conflicting bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        labId: validatedData.labId,
        computerId: validatedData.computerId || null,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.APPROVED],
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

    // Verify that the lab exists
    const lab = await prisma.computerLab.findUnique({
      where: { id: validatedData.labId }
    })

    if (!lab) {
      return NextResponse.json(
        { error: `Lab with ID '${validatedData.labId}' not found` },
        { status: 400 }
      )
    }

    // Verify that the computer exists if specified
    if (validatedData.computerId) {
      const computer = await prisma.computer.findUnique({
        where: { id: validatedData.computerId }
      })

      if (!computer) {
        return NextResponse.json(
          { error: `Computer with ID '${validatedData.computerId}' not found` },
          { status: 400 }
        )
      }

      if (computer.labId !== validatedData.labId) {
        return NextResponse.json(
          { error: 'Computer does not belong to the specified lab' },
          { status: 400 }
        )
      }
    }

    const booking = await prisma.booking.create({
      data: {
        labId: validatedData.labId,
        computerId: validatedData.computerId || null,
        startTime,
        endTime,
        purpose: validatedData.purpose || null,
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
    console.error('Booking creation error:', createError)
    
    if (createError instanceof Error) {
      // Check for specific Prisma errors
      if (createError.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid lab or computer ID provided' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
