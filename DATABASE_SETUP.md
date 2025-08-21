# 🗄️ MongoDB Database Setup Guide

This guide will help you set up a MongoDB database using Docker for your Airbnb clone project.

## 📋 Prerequisites

- Docker and Docker Compose installed on your system
- Node.js and npm installed

## 🚀 Quick Start

### 1. Copy Environment Variables
```bash
# Copy the environment template to create your .env.local file
cp env-template.txt .env.local
```

### 2. Start MongoDB Container
```bash
# Start MongoDB and Mongo Express (optional database UI)
docker-compose up -d

# Check if containers are running
docker ps
```

### 3. Install Dependencies
```bash
# Install the new dependency for seeding
npm install

# Generate Prisma client
npx prisma generate
```

### 4. Setup Database Schema
```bash
# Push the schema to MongoDB
npx prisma db push
```

### 5. Seed Database with Sample Data
```bash
# Add sample listings, users, and reservations
npm run db:seed
```

### 6. Start Your Application
```bash
# Start the Next.js development server
npm run dev
```

## 🔧 Database Configuration

### MongoDB Connection Details:
- **Host**: localhost
- **Port**: 27017
- **Username**: admin
- **Password**: password123
- **Database**: airbnb_clone
- **Connection String**: `mongodb://admin:password123@localhost:27017/airbnb_clone?authSource=admin`

### Mongo Express (Database UI):
- **URL**: http://localhost:8081
- **No authentication required** (disabled for development)

## 📊 Sample Data

The seed script creates:
- **2 Sample Users**: John Doe and Jane Smith
- **6 Sample Listings**: Various property types (Beach villa, Mountain cabin, City apartment, etc.)
- **2 Sample Reservations**: Bookings for different properties

### Sample Listings Include:
1. Beautiful Beachfront Villa ($299/night)
2. Cozy Mountain Cabin ($150/night)
3. Modern City Apartment ($200/night)
4. Rustic Countryside House ($180/night)
5. Luxury Desert Resort ($450/night)
6. Tropical Island Bungalow ($350/night)

## 🛠️ Useful Commands

```bash
# Stop the database
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# View database logs
docker-compose logs mongodb

# Reset database with fresh seed data
npm run db:reset

# Access MongoDB shell
docker exec -it airbnb-mongodb mongosh -u admin -p password123 --authenticationDatabase admin

# View Prisma studio (database GUI)
npx prisma studio
```

## 🔍 Troubleshooting

### Container Issues:
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs

# Restart containers
docker-compose restart
```

### Database Connection Issues:
1. Ensure Docker containers are running: `docker ps`
2. Check if port 27017 is available: `netstat -an | grep 27017`
3. Verify environment variables in `.env.local`
4. Try regenerating Prisma client: `npx prisma generate`

### Seeding Issues:
```bash
# Clear and reseed database
npm run db:reset

# Manual seeding
npx tsx prisma/seed.ts
```

## 🔐 Security Notes

**⚠️ Development Only**: This setup uses simple credentials for development. 
**Never use these credentials in production!**

For production:
- Use strong passwords
- Enable authentication
- Use environment-specific credentials
- Consider MongoDB Atlas for cloud hosting

## 🌐 Accessing Your Data

1. **Frontend**: Visit http://localhost:3000 to see your Airbnb clone with data
2. **Mongo Express**: Visit http://localhost:8081 to manage database via web UI
3. **Prisma Studio**: Run `npx prisma studio` for a modern database GUI

## 🎉 You're Ready!

Your MongoDB database is now running with sample data. Your Airbnb clone should display:
- ✅ Property listings on the homepage
- ✅ User authentication capabilities  
- ✅ Booking functionality
- ✅ Wishlist features
- ✅ All database-dependent features working

Happy coding! 🚀
