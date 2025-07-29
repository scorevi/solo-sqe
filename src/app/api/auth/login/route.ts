import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { loginSchema, comparePassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await comparePassword(
      validatedData.password,
      user.password
    )

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    }

    return NextResponse.json({
      user: userResponse,
      token,
      message: 'Login successful',
    })
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
