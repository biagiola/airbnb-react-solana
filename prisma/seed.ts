import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data
  console.log("🧹 Cleaning existing data...");
  await prisma.reservation.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  console.log("👥 Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 12);

  const user1 = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      hashedPassword,
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
      favoriteIds: [],
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      hashedPassword,
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
      favoriteIds: [],
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: "Mike Johnson",
      email: "mike@example.com",
      hashedPassword,
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      favoriteIds: [],
    },
  });

  const user4 = await prisma.user.create({
    data: {
      name: "Sarah Wilson",
      email: "sarah@example.com",
      hashedPassword,
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      favoriteIds: [],
    },
  });

  // Create sample listings
  console.log("🏠 Creating listings...");
  const listing1 = await prisma.listing.create({
    data: {
      title: "Modern Downtown Apartment",
      description:
        "Beautiful modern apartment in the heart of downtown with stunning city views. Perfect for business travelers and couples looking for a luxurious stay.",
      imageSrc:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
      category: "Modern",
      roomCount: 2,
      bathroomCount: 2,
      guestCount: 4,
      locationValue: "US,NY,New York",
      price: 150,
      userId: user1.id,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: "Cozy Beach House",
      description:
        "Charming beach house just steps away from the ocean. Wake up to the sound of waves and enjoy breathtaking sunsets from your private deck.",
      imageSrc:
        "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800",
      category: "Beach",
      roomCount: 3,
      bathroomCount: 2,
      guestCount: 6,
      locationValue: "US,CA,Malibu",
      price: 250,
      userId: user2.id,
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      title: "Mountain Cabin Retreat",
      description:
        "Escape to this peaceful mountain cabin surrounded by nature. Perfect for hiking enthusiasts and those seeking tranquility away from city life.",
      imageSrc:
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
      category: "Countryside",
      roomCount: 4,
      bathroomCount: 3,
      guestCount: 8,
      locationValue: "US,CO,Aspen",
      price: 200,
      userId: user1.id,
    },
  });

  const listing4 = await prisma.listing.create({
    data: {
      title: "Luxury City Penthouse",
      description:
        "Stunning penthouse with panoramic city views, modern amenities, and rooftop access. Experience luxury living at its finest.",
      imageSrc:
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
      category: "Lux",
      roomCount: 3,
      bathroomCount: 3,
      guestCount: 6,
      locationValue: "US,FL,Miami",
      price: 400,
      userId: user3.id,
    },
  });

  const listing5 = await prisma.listing.create({
    data: {
      title: "Historic Windmill Conversion",
      description:
        "Unique stay in a converted historic windmill. This one-of-a-kind property offers a blend of history and modern comfort.",
      imageSrc:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
      category: "Windmills",
      roomCount: 2,
      bathroomCount: 1,
      guestCount: 4,
      locationValue: "NL,NH,Amsterdam",
      price: 180,
      userId: user4.id,
    },
  });

  const listing6 = await prisma.listing.create({
    data: {
      title: "Desert Oasis Villa",
      description:
        "Luxurious desert villa with private pool and stunning desert landscape views. Perfect for a peaceful getaway under the stars.",
      imageSrc:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      category: "Desert",
      roomCount: 4,
      bathroomCount: 4,
      guestCount: 8,
      locationValue: "US,AZ,Scottsdale",
      price: 300,
      userId: user2.id,
    },
  });

  const listing7 = await prisma.listing.create({
    data: {
      title: "Tropical Island Bungalow",
      description:
        "Private bungalow on a tropical island with direct beach access. Enjoy crystal clear waters and pristine white sand beaches.",
      imageSrc:
        "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=800",
      category: "Islands",
      roomCount: 2,
      bathroomCount: 2,
      guestCount: 4,
      locationValue: "MV,Male,Maldives",
      price: 500,
      userId: user3.id,
    },
  });

  const listing8 = await prisma.listing.create({
    data: {
      title: "Arctic Ice Hotel Room",
      description:
        "Experience the magic of sleeping in an ice hotel. This unique accommodation offers an unforgettable Arctic adventure.",
      imageSrc:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
      category: "Arctic",
      roomCount: 1,
      bathroomCount: 1,
      guestCount: 2,
      locationValue: "SE,BD,Kiruna",
      price: 350,
      userId: user4.id,
    },
  });

  // Create sample reservations
  console.log("📅 Creating reservations...");
  const now = new Date();
  const futureDate1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
  const futureDate2 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
  const futureDate3 = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // 3 weeks from now
  const futureDate4 = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks from now

  await prisma.reservation.create({
    data: {
      userId: user2.id,
      listingId: listing1.id,
      startDate: futureDate1,
      endDate: futureDate2,
      totalPrice: listing1.price * 7, // 7 days
    },
  });

  await prisma.reservation.create({
    data: {
      userId: user3.id,
      listingId: listing2.id,
      startDate: futureDate2,
      endDate: futureDate3,
      totalPrice: listing2.price * 7, // 7 days
    },
  });

  await prisma.reservation.create({
    data: {
      userId: user4.id,
      listingId: listing3.id,
      startDate: futureDate3,
      endDate: futureDate4,
      totalPrice: listing3.price * 7, // 7 days
    },
  });

  await prisma.reservation.create({
    data: {
      userId: user1.id,
      listingId: listing4.id,
      startDate: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000), // 5 weeks from now
      endDate: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000), // 6 weeks from now
      totalPrice: listing4.price * 7, // 7 days
    },
  });

  // Update some users' favorite listings
  console.log("❤️ Adding favorites...");
  await prisma.user.update({
    where: { id: user1.id },
    data: {
      favoriteIds: [listing2.id, listing4.id, listing7.id],
    },
  });

  await prisma.user.update({
    where: { id: user2.id },
    data: {
      favoriteIds: [listing1.id, listing3.id, listing8.id],
    },
  });

  await prisma.user.update({
    where: { id: user3.id },
    data: {
      favoriteIds: [listing5.id, listing6.id],
    },
  });

  console.log("✅ Database seeding completed successfully!");
  console.log(`Created:`);
  console.log(`- 4 users`);
  console.log(`- 8 listings`);
  console.log(`- 4 reservations`);
  console.log(`- Added favorite listings for users`);
}

main()
  .catch(e => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
