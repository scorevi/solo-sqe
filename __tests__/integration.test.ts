// Integration test to validate the complete booking system
// Run with: npm test -- integration.test.ts

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { generateToken } from '../src/lib/auth'

const prisma = new PrismaClient()

describe('Computer Lab Booking System Integration', () => {
  let adminUser: any
  let studentUser: any
  let teacherUser: any
  let adminToken: string
  let studentToken: string
  let teacherToken: string
  let testLab: any
  let testComputer: any

  beforeAll(async () => {
    // Clean up test data
    await prisma.booking.deleteMany()
    await prisma.computer.deleteMany()
    await prisma.computerLab.deleteMany()
    await prisma.user.deleteMany()

    // Create test users
    const hashedPassword = await hash('testpassword123', 12)

    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    studentUser = await prisma.user.create({
      data: {
        name: 'Student User',
        email: 'student@test.com',
        password: hashedPassword,
        role: 'STUDENT'
      }
    })

    teacherUser = await prisma.user.create({
      data: {
        name: 'Teacher User',
        email: 'teacher@test.com',
        password: hashedPassword,
        role: 'TEACHER'
      }
    })

    // Generate tokens
    adminToken = generateToken({ userId: adminUser.id, email: adminUser.email, role: adminUser.role })
    studentToken = generateToken({ userId: studentUser.id, email: studentUser.email, role: studentUser.role })
    teacherToken = generateToken({ userId: teacherUser.id, email: teacherUser.email, role: teacherUser.role })

    // Create test lab and computer
    testLab = await prisma.computerLab.create({
      data: {
        name: 'Test Computer Lab',
        location: 'Building A, Room 101',
        capacity: 20,
        description: 'Test lab for integration testing'
      }
    })

    testComputer = await prisma.computer.create({
      data: {
        name: 'PC-001',
        specifications: 'Intel i5, 8GB RAM, Windows 11',
        labId: testLab.id
      }
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.booking.deleteMany()
    await prisma.computer.deleteMany()
    await prisma.computerLab.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('Authentication System', () => {
    test('should authenticate users with valid credentials', async () => {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@test.com',
          password: 'testpassword123'
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.token).toBeDefined()
      expect(data.user.email).toBe('student@test.com')
      expect(data.user.role).toBe('STUDENT')
    })

    test('should reject invalid credentials', async () => {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@test.com',
          password: 'wrongpassword'
        })
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Lab Management', () => {
    test('should retrieve available labs', async () => {
      const response = await fetch('http://localhost:3001/api/labs', {
        headers: { Authorization: `Bearer ${studentToken}` }
      })

      expect(response.status).toBe(200)
      const labs = await response.json()
      expect(labs).toHaveLength(1)
      expect(labs[0].name).toBe('Test Computer Lab')
      expect(labs[0].computers).toHaveLength(1)
    })

    test('should get lab details by ID', async () => {
      const response = await fetch(`http://localhost:3001/api/labs/${testLab.id}`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      })

      expect(response.status).toBe(200)
      const lab = await response.json()
      expect(lab.name).toBe('Test Computer Lab')
      expect(lab.computers).toHaveLength(1)
    })
  })

  describe('Booking System', () => {
    test('student should be able to create a booking', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // +2 hours

      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          labId: testLab.id,
          computerId: testComputer.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          purpose: 'Integration testing'
        })
      })

      expect(response.status).toBe(201)
      const booking = await response.json()
      expect(booking.status).toBe('PENDING')
      expect(booking.purpose).toBe('Integration testing')
    })

    test('should prevent double booking', async () => {
      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // +2 hours

      // Try to book the same time slot again
      const response = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          labId: testLab.id,
          computerId: testComputer.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          purpose: 'Conflicting booking'
        })
      })

      expect(response.status).toBe(409)
      const error = await response.json()
      expect(error.error).toBe('Time slot is already booked')
    })

    test('should retrieve user bookings', async () => {
      const response = await fetch('http://localhost:3001/api/bookings', {
        headers: { Authorization: `Bearer ${studentToken}` }
      })

      expect(response.status).toBe(200)
      const bookings = await response.json()
      expect(bookings).toHaveLength(1)
      expect(bookings[0].purpose).toBe('Integration testing')
    })
  })

  describe('Admin Functions', () => {
    test('admin should access admin stats', async () => {
      const response = await fetch('http://localhost:3001/api/admin/stats', {
        headers: { Authorization: `Bearer ${adminToken}` }
      })

      expect(response.status).toBe(200)
      const stats = await response.json()
      expect(stats.totalUsers).toBe(3)
      expect(stats.totalLabs).toBe(1)
      expect(stats.totalBookings).toBe(1)
    })

    test('student should not access admin stats', async () => {
      const response = await fetch('http://localhost:3001/api/admin/stats', {
        headers: { Authorization: `Bearer ${studentToken}` }
      })

      expect(response.status).toBe(403)
    })

    test('admin should approve bookings', async () => {
      // Get the booking ID
      const bookingsResponse = await fetch('http://localhost:3001/api/admin/bookings', {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
      const bookings = await bookingsResponse.json()
      const bookingId = bookings[0].id

      // Approve the booking
      const response = await fetch(`http://localhost:3001/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: 'APPROVED' })
      })

      expect(response.status).toBe(200)
      const updatedBooking = await response.json()
      expect(updatedBooking.status).toBe('APPROVED')
    })
  })

  describe('Role-Based Access Control', () => {
    test('teacher should access admin panel', async () => {
      const response = await fetch('http://localhost:3001/api/admin/stats', {
        headers: { Authorization: `Bearer ${teacherToken}` }
      })

      expect(response.status).toBe(200)
    })

    test('unauthorized user should be rejected', async () => {
      const response = await fetch('http://localhost:3001/api/bookings')
      expect(response.status).toBe(401)
    })
  })
})

// Performance and Load Testing
describe('System Performance', () => {
  test('should handle multiple concurrent bookings', async () => {
    const promises = []
    const baseTime = Date.now() + 48 * 60 * 60 * 1000 // Day after tomorrow

    // Try to create 5 concurrent bookings for different time slots
    for (let i = 0; i < 5; i++) {
      const startTime = new Date(baseTime + i * 3 * 60 * 60 * 1000) // 3-hour intervals
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000) // 2-hour duration

      promises.push(
        fetch('http://localhost:3001/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${studentToken}`
          },
          body: JSON.stringify({
            labId: testLab.id,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            purpose: `Load test booking ${i + 1}`
          })
        })
      )
    }

    const responses = await Promise.all(promises)
    const successfulBookings = responses.filter(r => r.status === 201)

    // All should be successful since they don't conflict
    expect(successfulBookings).toHaveLength(5)
  })
})

console.log('Integration tests ready to run!')
console.log('Make sure the development server is running on http://localhost:3001')
console.log('Run tests with: npm test -- --testPathPattern=integration.test.ts')
