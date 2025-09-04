import { Connection, PublicKey } from "@solana/web3.js";
import {
  hostPDA,
  guestPDA,
  listingPDA_1,
  parseListingAccount,
  RPC
} from "@/app/actions/anchor/constants";
import { 
  CreateReservationResult, 
  ReservationStatus, 
  PaymentStatus 
} from "@/app/types/blockchain";

interface reservationParams {
  listingId?: string
  userId?: string
  authorId?: string
}

export default async function createReservation(params: reservationParams): Promise<CreateReservationResult> {
  try {
    const { listingId, userId, authorId } = params;

    // Generate random reservation ID
    const reservation_id = 1;

    // Use constants from blockchain
    const guestPubkey = new PublicKey(guestPDA);
    const hostPubkey = new PublicKey(hostPDA);
    const listingPubkey = new PublicKey(listingPDA_1);

    // Create reservation PDA using the same seeds as Rust
    const RESERVATION_SEED = "RESERVATION_SEED";

    // Convert reservation_id to little-endian u64 bytes (8 bytes)
    const reservationIdBuffer = Buffer.alloc(8);
    reservationIdBuffer.writeUInt32LE(reservation_id, 0);
    reservationIdBuffer.writeUInt32LE(0, 4); // High 32 bits (since reservation_id fits in u32)

    const [reservationPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(RESERVATION_SEED),
        guestPubkey.toBuffer(),
        reservationIdBuffer
      ],
      new PublicKey("5FeA9qBzmvEDreexhEMmivcz9KccuhCZaqWWVYxtkgm9") // actual program ID
    );

    console.log("🏨 Creating reservation with:");
    console.log(`   Reservation ID: ${reservation_id}`);
    console.log(`   Guest: ${guestPubkey.toString()}`);
    console.log(`   Host: ${hostPubkey.toString()}`);
    console.log(`   Listing: ${listingPubkey.toString()}`);
    console.log(`   Reservation PDA: ${reservationPDA.toString()}`);

    // Mock reservation data
    const now = Math.floor(Date.now() / 1000);
    const startDate = now + (24 * 60 * 60); // Tomorrow
    const endDate = startDate + (3 * 24 * 60 * 60); // 3 nights
    const guestCount = 2;
    const totalNights = 3;
    const pricePerNight = 150; // $150/night
    const totalPrice = pricePerNight * totalNights;

    console.log("📅 Reservation details:");
    console.log(`   Check-in: ${new Date(startDate * 1000).toLocaleDateString()}`);
    console.log(`   Check-out: ${new Date(endDate * 1000).toLocaleDateString()}`);
    console.log(`   Guests: ${guestCount}`);
    console.log(`   Nights: ${totalNights}`);
    console.log(`   Rate: $${pricePerNight}/night`);
    console.log(`   Total: $${totalPrice}`);

    // TODO: Implement actual blockchain transaction
    // For now, return the calculated data with proper typing
    
    const result: CreateReservationResult = {
      success: true,
      reservationId: reservation_id,
      reservationPDA: reservationPDA.toString(),
      details: {
        guest: guestPubkey.toString(),
        host: hostPubkey.toString(),
        listing: listingPubkey.toString(),
        startDate,
        endDate,
        guestCount,
        totalNights,
        pricePerNight,
        totalPrice,
        status: ReservationStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: now
      }
    };

    return result;

  } catch (error: any) {
    console.error("❌ Error creating reservation:", error);
    throw new Error(`Failed to create reservation: ${error.message}`);
  }
}
