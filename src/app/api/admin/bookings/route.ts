import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
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

    const bookings = await prisma.booking.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to recent bookings
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Admin bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
