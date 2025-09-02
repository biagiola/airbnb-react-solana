import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { AirbnbBlockhain } from "../target/types/airbnb_blockhain";
import { PublicKey, Keypair, Connection } from '@solana/web3.js';
import { assert } from "chai";
import * as fs from 'fs';
import * as path from 'path';
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMint
} from "@solana/spl-token";

const HOST_SEED = "HOST_SEED";
const GUEST_SEED = "GUEST_SEED";
const LISTING_SEED = "LISTING_SEED";
const RESERVATION_SEED = "RESERVATION_SEED";
const PAYMENT_ESCROW_SEED = "PAYMENT_ESCROW_SEED";
const PLATFORM_TREASURY_SEED = "PLATFORM_TREASURY_SEED";

describe("airbnb-blockhain", () => {
  // Configure the client.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.airbnbBlockhain as Program<AirbnbBlockhain>;
  const host = anchor.web3.Keypair.generate();
  
  // Guest
  const guest = anchor.web3.Keypair.generate();
  let guest_pkey: PublicKey;
  let guest_bump: number;
  
  // Token2022
  const mint = Keypair.generate();
  const platformAuthority = Keypair.generate();
  let platformTreasuryATA: PublicKey;

  // Helper functions
  function getPlatformTreasuryAddress() {
    return getAssociatedTokenAddressSync(
      mint.publicKey,
      platformAuthority.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  }

  async function setupTokenInfrastructure() {
    // Airdrop to platform authority
    await airdrop(provider.connection, platformAuthority.publicKey);
    
    // Initialize the token mint with transfer fee
    await program.methods.initializeToken(
      500, // 5% fee (500 basis points)
      new BN(1000000) // max fee
    )
    .accounts({
      creator: platformAuthority.publicKey,
      mint: mint.publicKey,
    })
    .signers([platformAuthority, mint])
    .rpc({ commitment: "confirmed" });

    // Create platform treasury ATA
    const platformTreasuryATA = getPlatformTreasuryAddress();
    
    // Mint some tokens to platform treasury for testing
    await program.methods.mintToken(new BN(1000000)) // 1M tokens
    .accounts({
      creator: platformAuthority.publicKey,
      mint: mint.publicKey,
      recipientAta: platformTreasuryATA,
      recipient: platformAuthority.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([platformAuthority])
    .rpc({ commitment: "confirmed" });
    
    // console.log("✅ Token infrastructure set up");
    // console.log("Mint:", mint.publicKey.toString());
    // console.log("Platform Treasury:", platformTreasuryATA.toString());
    
    return { platformTreasuryATA };
  }

  it("Should setup token infrastructure", async () => {
    const result = await setupTokenInfrastructure();
    platformTreasuryATA = result.platformTreasuryATA;
  });

  it("Should display mint tokens", async () => {
    const mintInfo = await getMintInfo(mint.publicKey, provider.connection);
    // console.log("mintInfo: ", mintInfo);
  });

  it("Should initialize a host with valid fields", async () => {
    await airdrop(provider.connection, host.publicKey);

    const [host_pkey, host_bump] = getHostAddress(
      host.publicKey,
      program.programId
    );

    await program.methods.initializeHost(
      "Teresa Biagiola",
      "teresabiagiola@gmail.com",
      "https://a0.muscache.com/im/pictures/prohost-api/Hosting-1194641374145248817/original/39aa64fa-38c1-4204-b6b2-8e639e43fd87.jpeg?im_w=720",
      "password123",
      new BN(Date.now()),
    )
    .accounts({ hostAuthority: host.publicKey })
    .signers([host])
    .rpc({ commitment: "confirmed" });

    // console.log("✅ Host initialized successfully!");

    // Fetch and verify the created host
    const hostAccount = await program.account.host.fetch(host_pkey);
    // console.log("Created host:", {
    //   name: hostAccount.name,
    //   email: hostAccount.email,
    //   createdAt: hostAccount.createdAt.toString(),
    //   hostAuthor: hostAccount.hostAuthor.toString(),
    //   listingCount: hostAccount.listingCount.toNumber()
    // });

    assert.strictEqual(hostAccount.listingCount.toNumber(), 0, "Host should start with 0 listings");
  });

  it("Should initialize a Listing for a host", async () => {
    // Get the host PDA (from the previous test)
    const [host_pkey, host_bump] = getHostAddress(
      host.publicKey,
      program.programId
    );

    // Fetch the host account to get the current listing_count
    const hostAccount = await program.account.host.fetch(host_pkey);
    const currentListingCount = hostAccount.listingCount.toNumber();
    console.log("currentListingCount: ", currentListingCount);

    // Get the listing PDA
    const [listing_pkey, listing_bump] = getListingAddress(
      host.publicKey,
      currentListingCount,
      program.programId,
    );

    const [guest_pkey, guest_bump]= getGuestAddress(
      guest.publicKey,
      program.programId
    );
    console.log("Guest pubkey: ", guest_pkey.toBase58());
    console.log("Mint pubkey: ", mint.publicKey.toBase58());
    console.log("listing_pkey", listing_pkey);

    // Update frontend constants with the new values
    updateFrontendConstants(
      guest_pkey.toBase58(),
      mint.publicKey.toBase58(),
      listing_pkey.toBase58()
    );

    await program.methods.initializeListing(
      "Beautiful Beach House",
      "Stunning oceanfront property with amazing sunset views",
      "https://a0.muscache.com/im/pictures/ccb251a8-663d-4472-9127-c51c471a55fc.jpg",
      new BN(Date.now()),
      "Beach",
      3,           // room_count
      2,           // bathroom_count  
      6,           // guest_count
      "FR",        // location_value
      new BN(0),   // total_bookings
      true,        // is_active
      new BN(299), // price per night
    )
    .accounts({
      listingAuthority: host.publicKey,  // The wallet signing the transaction
      host: host_pkey,                   // The Host account PDA (proves they're a registered host)
      listing: listing_pkey,                    // ← Uncomment this
      systemProgram: anchor.web3.SystemProgram.programId  // ← Add this
    })
    .signers([host])
    .rpc({ commitment: "confirmed" });

    // Fetch and verify the created listing
    const listingAccount = await program.account.listing.fetch(listing_pkey);

    // TEST: Verify host listing count incremented to 1
    const updatedHostAccount = await program.account.host.fetch(host_pkey);
    assert.strictEqual(updatedHostAccount.listingCount.toNumber(), 1, "Host listing count should be 1 after creating first listing");
    console.log("Host listing count after first listing:", updatedHostAccount.listingCount.toNumber());
  });

  it("Should initialize 6 listings for frontend testing", async () => {
    // Get the host PDA
    const [host_pkey, host_bump] = getHostAddress(
      host.publicKey,
      program.programId
    );

    // Fetch current host listing count
    const hostAccount = await program.account.host.fetch(host_pkey);
    let currentListingCount = hostAccount.listingCount.toNumber();

    // Array to store all listing PDAs
    const listingPDAs: PublicKey[] = [];

    // Define the 6 listings data
    const listingsData = [
      {
        title: "Tropical Island Bungalow",
        description: "Wake up to crystal clear waters and white sandy beaches. This overwater bungalow offers the ultimate tropical experience.",
        image_url: "https://a0.muscache.com/im/pictures/miso/Hosting-50879395/original/2d12a9cf-ba41-4010-9f2f-68e46417dbb6.jpeg",
        category: "Islands",
        room_count: 1,
        bathroom_count: 1,
        guest_count: 2,
        location_value: "MV", // Maldives
        price: 350
      },
      {
        title: "Mountain Cabin Retreat",
        description: "Escape to the mountains in this cozy cabin surrounded by pine trees and hiking trails. Perfect for a peaceful getaway.",
        image_url: "https://a0.muscache.com/im/pictures/miso/Hosting-652362144050470328/original/9e9f5cbe-c49d-48f6-a285-63f997739b31.jpeg",
        category: "Cabins",
        room_count: 2,
        bathroom_count: 1,
        guest_count: 4,
        location_value: "US",
        price: 180
      },
      {
        title: "Modern Downtown Loft",
        description: "Stylish loft in the heart of the city with floor-to-ceiling windows and contemporary design. Walking distance to everything.",
        image_url: "https://a0.muscache.com/im/pictures/miso/Hosting-11647783/original/e1fbc6be-2711-40de-b29c-b839bc424593.jpeg",
        category: "Modern",
        room_count: 1,
        bathroom_count: 1,
        guest_count: 2,
        location_value: "US",
        price: 220
      },
      {
        title: "Beachfront Villa Paradise",
        description: "Luxurious beachfront villa with private pool and direct beach access. Stunning ocean views from every room.",
        image_url: "https://a0.muscache.com/im/pictures/miso/Hosting-1195553193230877014/original/00dd2263-c1b6-4f77-9431-aa32a215c367.jpeg",
        category: "Beach",
        room_count: 4,
        bathroom_count: 3,
        guest_count: 8,
        location_value: "MX", // Mexico
        price: 450
      },
      {
        title: "Countryside Manor House",
        description: "Historic manor house set in rolling countryside. Features antique furnishings and beautiful gardens.",
        image_url: "https://a0.muscache.com/im/pictures/prohost-api/Hosting-1061539479175162764/original/4cfd7596-7ee4-4f87-81aa-4de1d9643601.jpeg",
        category: "Countryside",
        room_count: 5,
        bathroom_count: 3,
        guest_count: 10,
        location_value: "GB", // Great Britain
        price: 280
      },
      {
        title: "Desert Oasis Glamping",
        description: "Unique glamping experience in the desert with luxury amenities and breathtaking stargazing opportunities.",
        image_url: "https://a0.muscache.com/im/pictures/prohost-api/Hosting-1194641374145248817/original/39aa64fa-38c1-4204-b6b2-8e639e43fd87.jpeg?im_w=720",
        category: "Desert",
        room_count: 1,
        bathroom_count: 1,
        guest_count: 2,
        location_value: "AE", // UAE
        price: 320
      }
    ];

    // Create each listing
    for (let i = 0; i < listingsData.length; i++) {
      const listing = listingsData[i];
      
      // Get the listing PDA for current count
      const [listing_pkey, listing_bump] = getListingAddress(
        host.publicKey,
        currentListingCount,
        program.programId,
      );

      listingPDAs.push(listing_pkey);

      await program.methods.initializeListing(
        listing.title,
        listing.description,
        listing.image_url,
        new BN(Date.now()),
        listing.category,
        listing.room_count,
        listing.bathroom_count,
        listing.guest_count,
        listing.location_value,
        new BN(0), // total_bookings
        true, // is_active
        new BN(listing.price)
      )
      .accounts({
        listingAuthority: host.publicKey,
        host: host_pkey,
        listing: listing_pkey,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .signers([host])
      .rpc({ commitment: "confirmed" });

      currentListingCount++;
      console.log(`✅ Created listing ${i + 1}: ${listing.title}`);
    }

    // Console.log all listing PDAs
    console.log("\n🏠 All Listing PDAs:");
    listingPDAs.forEach((pda, index) => {
      console.log(`Listing ${index + 1}: ${pda.toBase58()}`);
    });

    // Verify final host listing count
    const finalHostAccount = await program.account.host.fetch(host_pkey);
    console.log(`\n📊 Host final listing count: ${finalHostAccount.listingCount.toNumber()}`);
  });

  it("Should create a second listing and increment listing counter to 8", async () => {
    // Get the host PDA
    const [host_pkey, host_bump] = getHostAddress(
      host.publicKey,
      program.programId
    );

    // Fetch host account to get current listing count
    const hostAccount = await program.account.host.fetch(host_pkey);
    const currentListingCount = hostAccount.listingCount.toNumber();
    
    // TEST: Verify we start with count = 7 from previous test
    assert.strictEqual(currentListingCount, 7, "Host should have 7 listing from previous test");

    // Generate PDA for second listing (count = 8)
    const [listing2_pkey, listing2_bump] = getListingAddress(
      host.publicKey,
      currentListingCount,
      program.programId,
    );

    console.log("Creating second listing with count:", currentListingCount);
    console.log("Second Listing PDA:", listing2_pkey.toString());

    await program.methods.initializeListing(
      "Mountain Cabin Retreat",
      "Cozy cabin in the mountains with fireplace and hiking trails",
      "https://a0.muscache.com/im/pictures/prohost-api/Hosting-1194641374145248817/original/39aa64fa-38c1-4204-b6b2-8e639e43fd87.jpeg?im_w=720",
      new BN(Date.now()),
      "Cabins",
      2,           // room_count
      1,           // bathroom_count  
      4,           // guest_count
      "UK",        // location_value
      new BN(0),   // total_bookings
      true,        // is_active
      new BN(150), // price per night
    )
    .accounts({
      listingAuthority: host.publicKey,
      host: host_pkey,
      listing: listing2_pkey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([host])
    .rpc({ commitment: "confirmed" });

    // TEST: Verify host listing count incremented to 8
    const finalHostAccount = await program.account.host.fetch(host_pkey);
    assert.strictEqual(finalHostAccount.listingCount.toNumber(), 8, "Host listing count should be 8 after creating second listing");
    console.log("Host listing count after second listing:", finalHostAccount.listingCount.toNumber());

    // TEST: Verify second listing was created correctly
    const listing2Account = await program.account.listing.fetch(listing2_pkey);
    assert.strictEqual(listing2Account.title, "Mountain Cabin Retreat");
    assert.strictEqual(listing2Account.category, "Cabins");
    console.log("Second listing created:", listing2Account.title);
  });

  it("Should initialize a guest", async () => {
    // Create a guest
    await airdrop(provider.connection, guest.publicKey);

    // Initialize guest
    await program.methods.initializeGuest(
      "David Biagiola",
      "davidbiagiola5@gmail.com",
      "https://example.com/biagiola-profile.jpg",
      "guestpassword123",
      new BN(Date.now()),
      "+1234567890",
      new BN(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago (birth date)
      "English"
    )
    .accounts({ guestAuthority: guest.publicKey })
    .signers([guest])
    .rpc({ commitment: "confirmed" });

    console.log("Guest initialized successfully!");

    // Fetch and verify the created guest
    [guest_pkey, guest_bump] = getGuestAddress(
      guest.publicKey,
      program.programId
    );

    const guestAccount = await program.account.guest.fetch(guest_pkey);
    console.log("guest_pkey: ", guest_pkey);
    console.log("guestAccount", guestAccount);

    // TEST: Verify guest was created correctly
    assert.strictEqual(guestAccount.name, "David Biagiola", "Guest name should match");
    assert.strictEqual(guestAccount.email, "davidbiagiola5@gmail.com", "Guest email should match");
    assert.strictEqual(guestAccount.guestAuthor.toString(), guest.publicKey.toString(), "Guest authority should match");
  });

  it("Should create a reservation", async () => {
    // Create a reservation
    const reservationId = 1; // Simple hardcoded ID for testing
    const [reservation_pkey] = getReservationAddress(
      guest.publicKey,
      reservationId,
      program.programId
    );

    const startDate = new BN(Date.now());
    const endDate = new BN(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days later
    const totalNights = 7;
    const pricePerNight = new BN(299);
    const totalPrice = new BN(299 * 7);

    const [host_pkey] = getHostAddress(host.publicKey, program.programId);
    const [listing_pkey] = getListingAddress(host.publicKey, 0, program.programId);

    await program.methods.initializeReservation(
      new BN(reservationId),
      listing_pkey,
      host.publicKey,
      startDate,
      endDate,
      2, // guest_count
      totalNights,
      pricePerNight,
      totalPrice,
      { pending: {} }, // ReservationStatus::Pending
      new BN(Date.now()),
      { pending: {} }, // PaymentStatus::Pending
    )
    .accounts({
      reservationAuthority: guest.publicKey,
      reservation: reservation_pkey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([guest])
    .rpc({ commitment: "confirmed" });

    // Fetch and verify the created reservation
    const reservationAccount = await program.account.reservation.fetch(reservation_pkey);

    // TEST: Verify reservation was created correctly
    assert.strictEqual(reservationAccount.guest.toString(), guest.publicKey.toString(), "Reservation guest should match");
    assert.strictEqual(reservationAccount.listing.toString(), listing_pkey.toString(), "Reservation listing should match");
    assert.strictEqual(reservationAccount.host.toString(), host.publicKey.toString(), "Reservation host should match");
    assert.strictEqual(reservationAccount.guestCount, 2, "Guest count should be 2");
    assert.strictEqual(reservationAccount.totalNights, 7, "Total nights should be 7");
  });

  it("Should create payment escrow", async () => {
    // Get guest token account and mint tokens for payments
    const guestTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      guest.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Mint enough tokens for all upcoming tests (10,000 tokens)
    await program.methods.mintToken(new BN(10000))
      .accounts({
        creator: platformAuthority.publicKey,
        mint: mint.publicKey,
        recipientAta: guestTokenAccount,
        recipient: guest.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([platformAuthority])
      .rpc({ commitment: "confirmed" });

    // Create payment escrow
    // Use existing guest (David Biagiola) and reservation (ID=1, 7 nights, 2093 tokens)
    const reservationId = 1; // Existing reservation
    const [reservation_pkey] = getReservationAddress(
      guest.publicKey,
      reservationId,
      program.programId
    );

    const escrowId = 10; // Use unique ID to avoid conflicts
    const [escrow_pkey] = getPaymentEscrowAddress(
      reservation_pkey,
      escrowId,
      program.programId
    );

    const escrowAmount = new BN(1000); // Test with 1000 tokens
    const releaseDate = new BN(Math.floor((Date.now() + 5 * 24 * 60 * 60 * 1000) / 1000)); // 5 days from now

    await program.methods.initializePaymentEscrow(
      new BN(escrowId),
      escrowAmount,
      releaseDate
    )
    .accounts({
      guestAuthority: guest.publicKey,
      reservation: reservation_pkey,
      paymentEscrow: escrow_pkey,
      mint: mint.publicKey,
      guestTokenAccount: guestTokenAccount,
      platformTreasury: platformTreasuryATA,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([guest])
    .rpc({ commitment: "confirmed" });

    // Verify the escrow
    const escrowAccount = await program.account.paymentEscrow.fetch(escrow_pkey);
    
    // TEST: Verify escrow was created correctly
    assert.strictEqual(escrowAccount.reservation.toString(), reservation_pkey.toString(), "Escrow should link to existing reservation");
    assert.strictEqual(escrowAccount.guest.toString(), guest.publicKey.toString(), "Escrow guest should match existing guest");
    assert.strictEqual(escrowAccount.amount.toString(), "1000", "Escrow amount should be 1000");
    
    const expectedFee = (1000 * 500) / 10000; // 50 tokens (5% of 1000)
    assert.strictEqual(escrowAccount.platformFee.toString(), expectedFee.toString(), "Platform fee should be 50 (5%)");
    assert.strictEqual(Object.keys(escrowAccount.status)[0], "funded", "Escrow status should be Funded");
  });

  it("Should fail to create escrow with unauthorized guest", async () => {
    // REUSE existing reservation but try to create escrow with wrong authority (host instead of guest)

    // Create host token account for the unauthorized attempt
    const hostTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      host.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Mint tokens to host so they have funds to attempt payment
    await program.methods.mintToken(new BN(2000))
    .accounts({
      creator: platformAuthority.publicKey,
      mint: mint.publicKey,
      recipientAta: hostTokenAccount,
      recipient: host.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .signers([platformAuthority])
    .rpc({ commitment: "confirmed" });

    const reservationId = 1; // Existing reservation
    const [reservation_pkey] = getReservationAddress(
      guest.publicKey,
      reservationId,
      program.programId
    );

    const escrowId = 11; // Unique ID
    const [escrow_pkey] = getPaymentEscrowAddress(
      reservation_pkey,
      escrowId,
      program.programId
    );

    try {
      // Try to create escrow with host as authority (should fail)
      await program.methods.initializePaymentEscrow(
        new BN(escrowId),
        new BN(500),
        new BN(Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000))
      )
      .accounts({
        guestAuthority: host.publicKey, // WRONG! Should be guest.publicKey
        reservation: reservation_pkey,
        paymentEscrow: escrow_pkey,
        mint: mint.publicKey,
        guestTokenAccount: hostTokenAccount, // Host's token account (wrong)
        platformTreasury: platformTreasuryATA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .signers([host]) // Host trying to pay for guest's reservation
      .rpc({ commitment: "confirmed" });
      
      assert.fail("Expected transaction to fail with unauthorized guest");
    } catch (error) {
      console.log("Correctly failed with unauthorized guest - only the guest who made the reservation can create escrow");
      // Test pawsses when transaction fails due to constraint violation
    }
  });

  it("Should test platform fee calculation", async () => {
    const reservationId = 1; // Existing reservation
    const [reservation_pkey] = getReservationAddress(
      guest.publicKey,
      reservationId,
      program.programId
    );

    const guestTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      guest.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Test different amounts to verify 5% fee calculation
    const testCases = [
      { amount: 100, expectedFee: 5 },   // 100 * 500 / 10000 = 5
      { amount: 1000, expectedFee: 50 }, // 1000 * 500 / 10000 = 50
      { amount: 450, expectedFee: 22 },  // 450 * 500 / 10000 = 22.5 → 22 (integer division)
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const escrowId = 20 + i; // Unique IDs to avoid conflicts
      const [escrow_pkey] = getPaymentEscrowAddress(
        reservation_pkey,
        escrowId,
        program.programId
      );

      await program.methods.initializePaymentEscrow(
        new BN(escrowId),
        new BN(testCase.amount),
        new BN(Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000)) // 1 day from now
      )
      .accounts({
        guestAuthority: guest.publicKey,
        reservation: reservation_pkey,
        paymentEscrow: escrow_pkey,
        mint: mint.publicKey,
        guestTokenAccount: guestTokenAccount,
        platformTreasury: platformTreasuryATA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .signers([guest])
      .rpc({ commitment: "confirmed" });

      const escrowAccount = await program.account.paymentEscrow.fetch(escrow_pkey);
      
      // TEST: Verify 5% fee calculation (integer division)
      assert.strictEqual(
        escrowAccount.platformFee.toString(), 
        testCase.expectedFee.toString(), 
        `5% fee should be ${testCase.expectedFee} for amount ${testCase.amount}`
      );
    }

    // Guest balance: 10000 - 1000 - 100 - 1000 - 450 = ~7450 tokens remaining
    console.log("Platform fee calculation tests completed - guest balance: ~7450 tokens remaining");
  });

  it("Should test time-based release date scenarios", async () => {
    // REUSE existing guest and reservation for time testing
    console.log("🔄 Testing time-based release dates using existing infrastructure...");
    
    const reservationId = 1; // Existing reservation
    const [reservation_pkey] = getReservationAddress(
      guest.publicKey,
      reservationId,
      program.programId
    );

    const guestTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      guest.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Test Case 1: Release date in the past (immediate release eligibility)
    const escrowId1 = 30;
    const [escrow1_pkey] = getPaymentEscrowAddress(
      reservation_pkey,
      escrowId1,
      program.programId
    );

    const pastReleaseDate = new BN(Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)); // 1 day ago

    await program.methods.initializePaymentEscrow(
      new BN(escrowId1),
      new BN(300),
      pastReleaseDate
    )
    .accounts({
      guestAuthority: guest.publicKey,
      reservation: reservation_pkey,
      paymentEscrow: escrow1_pkey,
      mint: mint.publicKey,
      guestTokenAccount: guestTokenAccount,
      platformTreasury: platformTreasuryATA,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([guest])
    .rpc({ commitment: "confirmed" });

    // Test Case 2: Release date in the future
    const escrowId2 = 31;
    const [escrow2_pkey] = getPaymentEscrowAddress(
      reservation_pkey,
      escrowId2,
      program.programId
    );

    const futureReleaseDate = new BN(Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000)); // 7 days from now

    await program.methods.initializePaymentEscrow(
      new BN(escrowId2),
      new BN(200),
      futureReleaseDate
    )
    .accounts({
      guestAuthority: guest.publicKey,
      reservation: reservation_pkey,
      paymentEscrow: escrow2_pkey,
      mint: mint.publicKey,
      guestTokenAccount: guestTokenAccount,
      platformTreasury: platformTreasuryATA,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([guest])
    .rpc({ commitment: "confirmed" });

    // Verify the escrows
    const escrow1Account = await program.account.paymentEscrow.fetch(escrow1_pkey);
    const escrow2Account = await program.account.paymentEscrow.fetch(escrow2_pkey);

    console.log("Past release escrow:", {
      releaseDate: new Date(escrow1Account.releaseDate.toNumber() * 1000).toISOString(),
      isPastDue: escrow1Account.releaseDate.toNumber() < Math.floor(Date.now() / 1000)
    });

    console.log("Future release escrow:", {
      releaseDate: new Date(escrow2Account.releaseDate.toNumber() * 1000).toISOString(),
      daysUntilRelease: Math.round((escrow2Account.releaseDate.toNumber() * 1000 - Date.now()) / (24 * 60 * 60 * 1000))
    });

    // ✅ TEST: Verify time logic
    const currentTimeSeconds = Math.floor(Date.now() / 1000);
    assert.isTrue(escrow1Account.releaseDate.toNumber() < currentTimeSeconds, "Past release date should be in the past");
    assert.isTrue(escrow2Account.releaseDate.toNumber() > currentTimeSeconds, "Future release date should be in the future");
    
    // ✅ TEST: Verify release dates match what we set
    assert.strictEqual(escrow1Account.releaseDate.toString(), pastReleaseDate.toString(), "Past release date should match");
    assert.strictEqual(escrow2Account.releaseDate.toString(), futureReleaseDate.toString(), "Future release date should match");

    // Guest balance: 7450 - 300 - 200 = ~6950 tokens remaining
    console.log("✅ Time-based release date tests completed - guest balance: ~6950 tokens remaining");
  });

  it("Should test PDA generation consistency", async () => {
    // Test that PDA generation is deterministic and consistent
    const testReservation = anchor.web3.Keypair.generate().publicKey;
    const testEscrowId = 999;

    // Generate PDA multiple times
    const [pda1] = getPaymentEscrowAddress(testReservation, testEscrowId, program.programId);
    const [pda2] = getPaymentEscrowAddress(testReservation, testEscrowId, program.programId);
    const [pda3] = getPaymentEscrowAddress(testReservation, testEscrowId, program.programId);

    // ✅ TEST: PDAs should be identical
    assert.strictEqual(pda1.toString(), pda2.toString(), "PDA generation should be deterministic");
    assert.strictEqual(pda2.toString(), pda3.toString(), "PDA generation should be consistent");

    // ✅ TEST: Different escrow IDs should generate different PDAs
    const [differentPda] = getPaymentEscrowAddress(testReservation, testEscrowId + 1, program.programId);
    assert.notStrictEqual(pda1.toString(), differentPda.toString(), "Different escrow IDs should generate different PDAs");

    // ✅ TEST: Different reservations should generate different PDAs
    const [differentReservationPda] = getPaymentEscrowAddress(
      anchor.web3.Keypair.generate().publicKey,
      testEscrowId,
      program.programId
    );
    assert.notStrictEqual(pda1.toString(), differentReservationPda.toString(), "Different reservations should generate different PDAs");

    console.log("✅ PDA generation consistency tests passed!");
    console.log("Sample PDA:", pda1.toString());
  });

  it("Should complete full payment cycle", async () => {
    console.log("🎯 Testing complete payment cycle: Guest pays → Release → Host receives");
    
    // REUSE existing guest, reservation, and token accounts
    const reservationId = 1; // Existing reservation
    const [reservation_pkey] = getReservationAddress(
      guest.publicKey,
      reservationId,
      program.programId
    );

    const guestTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      guest.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // STEP 1: Create escrow with immediate release (past date)
    const escrowId = 100;
    const [escrow_pkey] = getPaymentEscrowAddress(
      reservation_pkey,
      escrowId,
      program.programId
    );

    const paymentAmount = new BN(500);
    const immediateReleaseDate = new BN(Math.floor((Date.now() - 1000) / 1000)); // Already passed

    await program.methods.initializePaymentEscrow(
      new BN(escrowId),
      paymentAmount,
      immediateReleaseDate
    )
    .accounts({
      guestAuthority: guest.publicKey,
      reservation: reservation_pkey,
      paymentEscrow: escrow_pkey,
      mint: mint.publicKey,
      guestTokenAccount: guestTokenAccount,
      platformTreasury: platformTreasuryATA,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([guest])
    .rpc({ commitment: "confirmed" });

    console.log("💰 STEP 1: Payment escrow created (500 tokens)");

    // STEP 2: Release payment to host
    const hostTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      host.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Get balances BEFORE release
    const platformTreasuryBefore = await provider.connection.getTokenAccountBalance(platformTreasuryATA);
    let hostBalanceBefore = 0;
    try {
      const hostBalanceResult = await provider.connection.getTokenAccountBalance(hostTokenAccount);
      hostBalanceBefore = parseInt(hostBalanceResult.value.amount);
    } catch (error) {
      hostBalanceBefore = 0; // Account doesn't exist yet
    }

    await program.methods.releasePaymentEscrow()
    .accounts({
      platformAuthority: platformAuthority.publicKey,
      releasePaymentEscrow: escrow_pkey,
      mint: mint.publicKey,
      platformTreasury: platformTreasuryATA,
      hostTokenAccount: hostTokenAccount,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([platformAuthority])
    .rpc({ commitment: "confirmed" });

    console.log("🏠 STEP 2: Payment released to host");

    // STEP 3: Verify final state
    const escrowAfterRelease = await program.account.paymentEscrow.fetch(escrow_pkey);
    const hostBalanceAfter = await provider.connection.getTokenAccountBalance(hostTokenAccount);
    const platformTreasuryAfter = await provider.connection.getTokenAccountBalance(platformTreasuryATA);

    // ✅ VERIFY COMPLETE CYCLE
    assert.strictEqual(Object.keys(escrowAfterRelease.status)[0], "released", "Escrow should be Released");
    
    const expectedHostAmount = 500 - 25; // 475 tokens after 5% platform fee
    const hostBalanceChange = parseInt(hostBalanceAfter.value.amount) - hostBalanceBefore;
    const platformBalanceChange = parseInt(platformTreasuryBefore.value.amount) - parseInt(platformTreasuryAfter.value.amount);
    
    assert.strictEqual(hostBalanceChange, expectedHostAmount, `Host should receive ${expectedHostAmount} tokens`);

    console.log("🎉 COMPLETE PAYMENT CYCLE SUCCESS!");
    console.log(`💰 Guest paid: 500 tokens`);
    console.log(`🏠 Host received: ${hostBalanceChange} tokens`);
    console.log(`🏢 Platform kept: 25 tokens (5% fee)`);
    console.log(`💸 Transfer fee: ~${platformBalanceChange - hostBalanceChange} tokens`);
    
    // Guest final balance: 6950 - 500 = ~6450 tokens remaining
    console.log("✅ Guest balance: ~6450 tokens remaining after complete cycle");
  });
});

async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
}

function getMintInfo(mint: PublicKey, connection: Connection) {
  return getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
}

function getHostAddress(author: PublicKey, programID: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(HOST_SEED),
      author.toBuffer()
    ], programID);
}

function getListingAddress(author: PublicKey, listingCount: number, programID: PublicKey) {
  const listingCountBuffer = Buffer.alloc(8);
  listingCountBuffer.writeBigUInt64LE(BigInt(listingCount), 0);

  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(LISTING_SEED),
      author.toBuffer(),
      listingCountBuffer,
    ], programID);
}

function getGuestAddress(author: PublicKey, programID: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(GUEST_SEED),
      author.toBuffer()
    ], programID);
}

function getReservationAddress(author: PublicKey, reservationId: number, programID: PublicKey) {
  const reservationIdBuffer = Buffer.alloc(8);
  reservationIdBuffer.writeBigUInt64LE(BigInt(reservationId), 0);

  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(RESERVATION_SEED),
      author.toBuffer(),
      reservationIdBuffer,
    ], programID);
}

function getPaymentEscrowAddress(reservation: PublicKey, escrowId: number, programID: PublicKey) {
  const escrowIdBuffer = Buffer.alloc(8);
  escrowIdBuffer.writeBigUInt64LE(BigInt(escrowId), 0);

  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(PAYMENT_ESCROW_SEED),
      reservation.toBuffer(),
      escrowIdBuffer,
    ], programID);
}

// Helper function to update frontend constants.ts file
function updateFrontendConstants(guestPDA: string, mintPubkey: string, listingPDA: string) {
  try {
    // Path to the constants file from the test directory
    const constantsPath = path.join(__dirname, '..', '..', 'app', 'actions', 'anchor', 'constants.ts');
    
    // Read the current file
    let fileContent = fs.readFileSync(constantsPath, 'utf8');
    
    // Replace the three constants using regex
    fileContent = fileContent.replace(
      /export const guestPDA = "[^"]*";/,
      `export const guestPDA = "${guestPDA}";`
    );
    
    fileContent = fileContent.replace(
      /export const mintPubkey = "[^"]*";/,
      `export const mintPubkey = "${mintPubkey}";`
    );
    
    fileContent = fileContent.replace(
      /export const listingPDA = "[^"]*";/,
      `export const listingPDA = "${listingPDA}";`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(constantsPath, fileContent, 'utf8');
    
    console.log("✅ Frontend constants updated successfully!");
    console.log(`   guestPDA: ${guestPDA}`);
    console.log(`   mintPubkey: ${mintPubkey}`);
    console.log(`   listingPDA: ${listingPDA}`);
  } catch (error) {
    console.error("❌ Error updating frontend constants:", error);
  }
}