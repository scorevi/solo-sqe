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

    const [totalUsers, totalLabs, totalBookings, activeBookings] = await Promise.all([
      prisma.user.count(),
      prisma.computerLab.count(),
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: {
            in: ['PENDING', 'APPROVED']
          },
          startTime: {
            gte: new Date()
          }
        }
      })
    ])

    return NextResponse.json({
      totalUsers,
      totalLabs,
      totalBookings,
      activeBookings
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
