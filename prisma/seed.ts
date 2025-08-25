import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Check if users already exist
  const existingUsers = await prisma.user.findMany()
  if (existingUsers.length > 0) {
    console.log('⚠️ Data already exists, skipping seed')
    return
  }

  // Create sample users
  const hashedPassword1 = await bcrypt.hash('password123', 12)
  const hashedPassword2 = await bcrypt.hash('password456', 12)

  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      hashedPassword: hashedPassword1,
      image: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_crop,g_face,r_max/w_200/v1564394775/sample.jpg',
      favoriteIds: []
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      hashedPassword: hashedPassword2,
      image: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_crop,g_face,r_max/w_200/v1564394775/sample.jpg',
      favoriteIds: []
    },
  })

  console.log('✅ Created sample users')

  // Sample listings data
  const sampleListings = [
    {
      title: 'Beautiful Beachfront Villa',
      description: 'A stunning oceanfront villa with panoramic views of the Pacific Ocean. Perfect for a romantic getaway or family vacation.',
      imageSrc: 'https://a0.muscache.com/im/pictures/prohost-api/Hosting-1194641374145248817/original/39aa64fa-38c1-4204-b6b2-8e639e43fd87.jpeg?im_w=720',
      category: 'Beach',
      roomCount: 4,
      bathroomCount: 3,
      guestCount: 8,
      locationValue: 'US',
      price: 299,
      userId: user1.id
    },
    {
      title: 'Cozy Mountain Cabin',
      description: 'Escape to this charming log cabin nestled in the mountains. Features a fireplace, hot tub, and hiking trails nearby.',
      imageSrc: 'https://a0.muscache.com/im/pictures/prohost-api/Hosting-1061539479175162764/original/4cfd7596-7ee4-4f87-81aa-4de1d9643601.jpeg',
      category: 'Cabins',
      roomCount: 2,
      bathroomCount: 1,
      guestCount: 4,
      locationValue: 'CA',
      price: 150,
      userId: user1.id
    },
    {
      title: 'Modern City Apartment',
      description: 'Stylish downtown apartment with city skyline views. Walking distance to restaurants, shops, and entertainment.',
      imageSrc: 'https://a0.muscache.com/im/pictures/miso/Hosting-1195553193230877014/original/00dd2263-c1b6-4f77-9431-aa32a215c367.jpeg',
      category: 'Modern',
      roomCount: 2,
      bathroomCount: 2,
      guestCount: 4,
      locationValue: 'GB',
      price: 200,
      userId: user2.id
    },
    {
      title: 'Rustic Countryside House',
      description: 'Experience rural tranquility in this beautifully restored farmhouse. Surrounded by rolling hills and vineyards.',
      imageSrc: 'https://a0.muscache.com/im/pictures/miso/Hosting-11647783/original/e1fbc6be-2711-40de-b29c-b839bc424593.jpeg',
      category: 'Countryside',
      roomCount: 3,
      bathroomCount: 2,
      guestCount: 6,
      locationValue: 'FR',
      price: 180,
      userId: user2.id
    },
    {
      title: 'Luxury Desert Resort',
      description: 'Indulge in luxury at this exclusive desert resort. Features a private pool, spa services, and breathtaking sunset views.',
      imageSrc: 'https://a0.muscache.com/im/pictures/miso/Hosting-652362144050470328/original/9e9f5cbe-c49d-48f6-a285-63f997739b31.jpeg',
      category: 'Luxury',
      roomCount: 5,
      bathroomCount: 4,
      guestCount: 10,
      locationValue: 'AE',
      price: 450,
      userId: user1.id
    },
    {
      title: 'Tropical Island Bungalow',
      description: 'Wake up to crystal clear waters and white sandy beaches. This overwater bungalow offers the ultimate tropical experience.',
      imageSrc: 'https://a0.muscache.com/im/pictures/miso/Hosting-50879395/original/2d12a9cf-ba41-4010-9f2f-68e46417dbb6.jpeg',
      category: 'Islands',
      roomCount: 1,
      bathroomCount: 1,
      guestCount: 2,
      locationValue: 'MV',
      price: 350,
      userId: user2.id
    }
  ]

  // Create listings
  for (const listing of sampleListings) {
    await prisma.listing.create({
      data: listing
    })
  }

  console.log('✅ Created sample listings')

  // Create sample reservations
  const listings = await prisma.listing.findMany()
  
  if (listings.length > 0) {
    await prisma.reservation.create({
      data: {
        userId: user2.id,
        listingId: listings[0].id,
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-20'),
        totalPrice: 1495 // 5 nights * 299
      }
    })

    await prisma.reservation.create({
      data: {
        userId: user1.id,
        listingId: listings[2].id,
        startDate: new Date('2024-04-10'),
        endDate: new Date('2024-04-15'),
        totalPrice: 1000 // 5 nights * 200
      }
    })

    console.log('✅ Created sample reservations')
  }

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
