import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('Seeding database...')

  // Clear existing data to avoid conflicts
  await prisma.booking.deleteMany()
  await prisma.computer.deleteMany()
  await prisma.computerLab.deleteMany()
  await prisma.user.deleteMany()

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@school.edu',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create teacher user
  const teacherPassword = await hashPassword('teacher123')
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.edu' },
    update: {},
    create: {
      name: 'John Teacher',
      email: 'teacher@school.edu',
      password: teacherPassword,
      role: 'TEACHER',
    },
  })

  // Create student user
  const studentPassword = await hashPassword('student123')
  const student = await prisma.user.upsert({
    where: { email: 'student@school.edu' },
    update: {},
    create: {
      name: 'Jane Student',
      email: 'student@school.edu',
      password: studentPassword,
      role: 'STUDENT',
    },
  })

  // Create computer labs
  const lab1 = await prisma.computerLab.create({
    data: {
      name: 'Computer Science Lab',
      description: 'Main computer science laboratory with high-performance workstations',
      capacity: 30,
      location: 'Building A, Room 101',
    },
  })

  const lab2 = await prisma.computerLab.create({
    data: {
      name: 'Engineering Lab',
      description: 'Engineering laboratory with CAD workstations',
      capacity: 25,
      location: 'Building B, Room 201',
    },
  })

  const lab3 = await prisma.computerLab.create({
    data: {
      name: 'General Purpose Lab',
      description: 'General purpose computer lab for all students',
      capacity: 40,
      location: 'Building C, Room 301',
    },
  })

  // Create computers for each lab
  const computers = []
  
  // Lab 1 computers
  for (let i = 1; i <= 30; i++) {
    computers.push({
      name: `CS-${i.toString().padStart(2, '0')}`,
      specifications: 'Intel i7, 16GB RAM, RTX 3060, 512GB SSD',
      labId: lab1.id,
    })
  }

  // Lab 2 computers
  for (let i = 1; i <= 25; i++) {
    computers.push({
      name: `ENG-${i.toString().padStart(2, '0')}`,
      specifications: 'Intel i9, 32GB RAM, Quadro RTX 4000, 1TB SSD',
      labId: lab2.id,
    })
  }

  // Lab 3 computers
  for (let i = 1; i <= 40; i++) {
    computers.push({
      name: `GP-${i.toString().padStart(2, '0')}`,
      specifications: 'Intel i5, 8GB RAM, Integrated Graphics, 256GB SSD',
      labId: lab3.id,
    })
  }

  // Insert computers
  const createdComputers = []
  for (const computer of computers) {
    const created = await prisma.computer.create({
      data: computer,
    })
    createdComputers.push(created)
  }

  // Create sample bookings
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(12, 0, 0, 0)

  await prisma.booking.create({
    data: {
      userId: student.id,
      labId: lab1.id,
      computerId: createdComputers[0].id, // First computer in CS lab
      startTime: tomorrow,
      endTime: tomorrowEnd,
      purpose: 'Programming Assignment - Data Structures',
      status: 'APPROVED',
    },
  })

  console.log('Database seeded successfully!')
  console.log('Sample accounts:')
  console.log('Admin: admin@school.edu / admin123')
  console.log('Teacher: teacher@school.edu / teacher123')
  console.log('Student: student@school.edu / student123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
