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
    where: { email: 'scorevi-admin@gmail.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'scorevi-admin@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Create teacher users
  const teacherPassword = await hashPassword('teacher123')
  const teacher = await prisma.user.upsert({
    where: { email: 'scorevi-teacher@gmail.com' },
    update: {},
    create: {
      name: 'Prof. John Teacher',
      email: 'scorevi-teacher@gmail.com',
      password: teacherPassword,
      role: 'TEACHER',
    },
  })

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher@school.edu' },
    update: {},
    create: {
      name: 'John Teacher',
      email: 'teacher@school.edu',
      password: teacherPassword,
      role: 'TEACHER',
    },
  })

  // Create student users
  const studentPassword = await hashPassword('student123')
  const student = await prisma.user.upsert({
    where: { email: 'scorevi@gmail.com' },
    update: {},
    create: {
      name: 'Jane Student',
      email: 'scorevi@gmail.com',
      password: studentPassword,
      role: 'STUDENT',
    },
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'student@school.edu' },
    update: {},
    create: {
      name: 'Jane Student',
      email: 'student@school.edu',
      password: studentPassword,
      role: 'STUDENT',
    },
  })

  const student3 = await prisma.user.upsert({
    where: { email: 'john.doe@school.edu' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john.doe@school.edu',
      password: studentPassword,
      role: 'STUDENT',
    },
  })

  const student4 = await prisma.user.upsert({
    where: { email: 'alice.smith@school.edu' },
    update: {},
    create: {
      name: 'Alice Smith',
      email: 'alice.smith@school.edu',
      password: studentPassword,
      role: 'STUDENT',
    },
  })

  // Create computer labs with realistic configurations
  const lab1 = await prisma.computerLab.create({
    data: {
      name: 'Computer Science Programming Lab',
      description: 'Advanced programming lab with high-performance development workstations for software engineering and computer science courses',
      capacity: 30,
      location: 'Building A, Room 101',
    },
  })

  const lab2 = await prisma.computerLab.create({
    data: {
      name: 'Engineering CAD/Design Lab',
      description: 'Professional engineering workstations for CAD, 3D modeling, and simulation work with high-end graphics capabilities',
      capacity: 24,
      location: 'Building B, Room 201',
    },
  })

  const lab3 = await prisma.computerLab.create({
    data: {
      name: 'Digital Media & Graphics Lab',
      description: 'Creative workstations for graphic design, video editing, animation, and multimedia production',
      capacity: 20,
      location: 'Building C, Room 301',
    },
  })

  const lab4 = await prisma.computerLab.create({
    data: {
      name: 'General Computing Lab',
      description: 'Multi-purpose lab for general computing, office applications, web development, and basic programming',
      capacity: 35,
      location: 'Building A, Room 205',
    },
  })

  const lab5 = await prisma.computerLab.create({
    data: {
      name: 'Data Science & Analytics Lab',
      description: 'High-memory workstations optimized for data analysis, machine learning, and statistical computing',
      capacity: 18,
      location: 'Building D, Room 401',
    },
  })

  const lab6 = await prisma.computerLab.create({
    data: {
      name: 'Mobile App Development Lab',
      description: 'Mac-based lab for iOS development and cross-platform mobile app development',
      capacity: 16,
      location: 'Building C, Room 205',
    },
  })

  // Create computers for each lab with realistic specifications
  const computers = []
  
  // Lab 1: Computer Science Programming Lab - Dell OptiPlex 7010 Tower
  for (let i = 1; i <= 30; i++) {
    const isWorking = Math.random() > 0.05 // 95% are working
    computers.push({
      name: `CS-${i.toString().padStart(2, '0')}`,
      specifications: 'Dell OptiPlex 7010 Tower, Intel Core i7-13700 (16-core), 32GB DDR4 RAM, NVIDIA RTX 4060, 1TB NVMe SSD, Windows 11 Pro',
      labId: lab1.id,
      isWorking,
    })
  }

  // Lab 2: Engineering CAD/Design Lab - HP Z4 G5 Workstation
  for (let i = 1; i <= 24; i++) {
    const isWorking = Math.random() > 0.08 // 92% are working (more complex systems)
    computers.push({
      name: `ENG-${i.toString().padStart(2, '0')}`,
      specifications: 'HP Z4 G5 Workstation, Intel Xeon W-2455X (12-core), 64GB DDR5 ECC RAM, NVIDIA RTX A4000, 2TB NVMe SSD + 4TB HDD, Windows 11 Pro for Workstations',
      labId: lab2.id,
      isWorking,
    })
  }

  // Lab 3: Digital Media & Graphics Lab - Lenovo ThinkStation P360 Ultra
  for (let i = 1; i <= 20; i++) {
    const isWorking = Math.random() > 0.05 // 95% are working
    computers.push({
      name: `DM-${i.toString().padStart(2, '0')}`,
      specifications: 'Lenovo ThinkStation P360 Ultra, Intel Core i9-13900K (24-core), 32GB DDR5 RAM, NVIDIA RTX 4070 Ti, 1TB NVMe SSD, 4K IPS Monitor, Windows 11 Pro',
      labId: lab3.id,
      isWorking,
    })
  }

  // Lab 4: General Computing Lab - Dell OptiPlex 3000 SFF
  for (let i = 1; i <= 35; i++) {
    const isWorking = Math.random() > 0.03 // 97% are working (simpler systems)
    computers.push({
      name: `GC-${i.toString().padStart(2, '0')}`,
      specifications: 'Dell OptiPlex 3000 SFF, Intel Core i5-13500 (14-core), 16GB DDR4 RAM, Intel UHD Graphics 770, 512GB NVMe SSD, Windows 11 Pro',
      labId: lab4.id,
      isWorking,
    })
  }

  // Lab 5: Data Science & Analytics Lab - HP Z6 G5 Workstation
  for (let i = 1; i <= 18; i++) {
    const isWorking = Math.random() > 0.06 // 94% are working
    computers.push({
      name: `DS-${i.toString().padStart(2, '0')}`,
      specifications: 'HP Z6 G5 Workstation, Intel Xeon W-3365 (32-core), 128GB DDR4 ECC RAM, NVIDIA RTX A5000, 2TB NVMe SSD + 8TB HDD, Ubuntu 22.04 LTS',
      labId: lab5.id,
      isWorking,
    })
  }

  // Lab 6: Mobile App Development Lab - Apple Mac Studio
  for (let i = 1; i <= 16; i++) {
    const isWorking = Math.random() > 0.02 // 98% are working (Apple reliability)
    computers.push({
      name: `MAC-${i.toString().padStart(2, '0')}`,
      specifications: 'Apple Mac Studio, Apple M2 Ultra (24-core CPU, 76-core GPU), 64GB Unified Memory, 2TB SSD, macOS Sequoia, 27" 5K Display',
      labId: lab6.id,
      isWorking,
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

  // Create sample bookings with realistic purposes
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(12, 0, 0, 0)

  const workingComputers = createdComputers.filter(c => c.isWorking)

  // Sample booking for Computer Science Lab
  await prisma.booking.create({
    data: {
      userId: student.id,
      labId: lab1.id,
      computerId: workingComputers.find(c => c.name.startsWith('CS-'))?.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      purpose: 'Software Engineering Project - Full-Stack Web Development',
      status: 'APPROVED',
    },
  })

  // Sample booking for Data Science Lab
  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
  dayAfterTomorrow.setHours(14, 0, 0, 0)
  
  const dayAfterTomorrowEnd = new Date(dayAfterTomorrow)
  dayAfterTomorrowEnd.setHours(17, 0, 0, 0)

  await prisma.booking.create({
    data: {
      userId: student.id,
      labId: lab5.id,
      computerId: workingComputers.find(c => c.name.startsWith('DS-'))?.id,
      startTime: dayAfterTomorrow,
      endTime: dayAfterTomorrowEnd,
      purpose: 'Machine Learning Research - Deep Learning Model Training',
      status: 'PENDING',
    },
  })

  console.log('Database seeded successfully!')
  console.log('\n🎓 Computer Lab Reservation System - Sample Accounts:')
  console.log('👨‍💼 Admin: scorevi-admin@gmail.com / admin123')
  console.log('👨‍🏫 Teacher: scorevi-teacher@gmail.com / teacher123')
  console.log('🎓 Student: scorevi@gmail.com / student123')
  console.log('\n📊 Database Statistics:')
  console.log(`🏢 Labs created: 6 specialized computer labs`)
  console.log(`💻 Computers created: ${computers.length} total workstations`)
  console.log(`👥 Users created: 7 users (1 admin, 2 teachers, 4 students)`)
  console.log(`📅 Sample bookings: 2 bookings created`)
  console.log('\n🏭 Lab Types:')
  console.log('• Computer Science Programming Lab (30 Dell OptiPlex workstations)')
  console.log('• Engineering CAD/Design Lab (24 HP Z4 workstations)')
  console.log('• Digital Media & Graphics Lab (20 Lenovo ThinkStation workstations)')
  console.log('• General Computing Lab (35 Dell OptiPlex SFF systems)')
  console.log('• Data Science & Analytics Lab (18 HP Z6 high-memory workstations)')
  console.log('• Mobile App Development Lab (16 Apple Mac Studio systems)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
