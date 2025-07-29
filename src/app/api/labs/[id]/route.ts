import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const lab = await prisma.computerLab.findUnique({
      where: { id },
      include: {
        computers: true,
        bookings: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
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
        },
        _count: {
          select: {
            computers: true,
          },
        },
      },
    })

    if (!lab) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 })
    }

    return NextResponse.json(lab)
  } catch (fetchError) {
    console.error('Failed to fetch lab:', fetchError)
    return NextResponse.json(
      { error: 'Failed to fetch lab' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // If name is being changed, check for duplicates
    if (body.name) {
      const existingLab = await prisma.computerLab.findFirst({
        where: { 
          name: body.name,
          id: { not: id } // Exclude current lab from check
        }
      })

      if (existingLab) {
        return NextResponse.json({ error: 'A lab with this name already exists' }, { status: 400 })
      }
    }

    const lab = await prisma.computerLab.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(lab)
  } catch (updateError) {
    console.error('Failed to update lab:', updateError)
    return NextResponse.json(
      { error: 'Failed to update lab' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.computerLab.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Lab deactivated successfully' })
  } catch (deleteError) {
    console.error('Failed to delete lab:', deleteError)
    return NextResponse.json(
      { error: 'Failed to delete lab' },
      { status: 500 }
    )
  }
}
