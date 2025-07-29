import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params

    // Check if booking exists and belongs to the user (or user is admin)
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            role: true
          }
        }
      }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user owns the booking or is admin/teacher
    if (existingBooking.userId !== decoded.userId && 
        decoded.role !== 'ADMIN' && 
        decoded.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Not authorized to cancel this booking' }, { status: 403 })
    }

    // Check if booking can be cancelled (must be PENDING or APPROVED and in the future)
    const now = new Date()
    const bookingStartTime = new Date(existingBooking.startTime)
    
    if (bookingStartTime <= now) {
      return NextResponse.json({ error: 'Cannot cancel past bookings' }, { status: 400 })
    }

    if (!['PENDING', 'APPROVED'].includes(existingBooking.status)) {
      return NextResponse.json({ error: 'Booking cannot be cancelled' }, { status: 400 })
    }

    // Update booking status to CANCELLED
    const cancelledBooking = await prisma.booking.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        lab: {
          select: {
            name: true
          }
        },
        computer: {
          select: {
            name: true
          }
        }
      }
    })

    // Optional: Send cancellation notification email
    try {
      const { emailService } = await import('@/lib/email')
      await emailService.sendBookingStatusUpdate({
        userName: cancelledBooking.user.name,
        userEmail: cancelledBooking.user.email,
        labName: cancelledBooking.lab.name,
        computerName: cancelledBooking.computer?.name,
        startTime: cancelledBooking.startTime.toISOString(),
        endTime: cancelledBooking.endTime.toISOString(),
        purpose: cancelledBooking.purpose || undefined,
        status: 'CANCELLED',
      })
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError)
      // Don't fail the cancellation if email fails
    }

    return NextResponse.json({ 
      message: 'Booking cancelled successfully',
      booking: cancelledBooking
    })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
