import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { labSchema, verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    const labs = await prisma.computerLab.findMany({
      where: { isActive: true },
      include: {
        computers: {
          where: { isWorking: true },
        },
        _count: {
          select: {
            computers: true,
            bookings: {
              where: {
                status: 'APPROVED',
                startTime: {
                  gte: new Date(),
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(labs)
  } catch (fetchError) {
    console.error('Failed to fetch labs:', fetchError)
    return NextResponse.json(
      { error: 'Failed to fetch labs' },
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
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = labSchema.parse(body)

    const lab = await prisma.computerLab.create({
      data: validatedData,
    })

    return NextResponse.json(lab, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
