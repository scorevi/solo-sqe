import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('\n=== DATABASE CHECK ===')
  
  // Check users
  const users = await prisma.user.findMany()
  console.log(`\nUsers (${users.length}):`)
  users.forEach(user => console.log(`  - ${user.id}: ${user.name} (${user.email})`))

  // Check labs
  const labs = await prisma.computerLab.findMany()
  console.log(`\nLabs (${labs.length}):`)
  labs.forEach(lab => console.log(`  - ${lab.id}: ${lab.name} (${lab.location})`))

  // Check computers
  const computers = await prisma.computer.findMany()
  console.log(`\nComputers (${computers.length}):`)
  computers.slice(0, 5).forEach(comp => console.log(`  - ${comp.id}: ${comp.name} (lab: ${comp.labId})`))
  if (computers.length > 5) {
    console.log(`  ... and ${computers.length - 5} more`)
  }

  // Check bookings
  const bookings = await prisma.booking.findMany()
  console.log(`\nBookings (${bookings.length}):`)
  bookings.forEach(booking => console.log(`  - ${booking.id}: User ${booking.userId} -> Lab ${booking.labId} (${booking.startTime})`))

  await prisma.$disconnect()
}

checkDatabase().catch(console.error)
