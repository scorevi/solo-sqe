import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'
import { emailService } from '@/lib/email'

const prisma = new PrismaClient()

export async function PATCH(
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
    
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { status } = await request.json()

    // Validate status
    if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
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

    // Send status update email
    try {
      await emailService.sendBookingStatusUpdate({
        userName: updatedBooking.user.name,
        userEmail: updatedBooking.user.email,
        labName: updatedBooking.lab.name,
        computerName: updatedBooking.computer?.name,
        startTime: updatedBooking.startTime.toISOString(),
        endTime: updatedBooking.endTime.toISOString(),
        purpose: updatedBooking.purpose || undefined,
        status: updatedBooking.status,
      })
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError)
      // Don't fail the update if email fails
    }

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
