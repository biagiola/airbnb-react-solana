import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { AirbnbBlockhain } from "../target/types/airbnb_blockhain";
import { PublicKey } from '@solana/web3.js';
import { assert } from "chai";

const HOST_SEED = "HOST_SEED";
const LISTING_SEED = "LISTING_SEED";

describe("airbnb-blockhain", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.airbnbBlockhain as Program<AirbnbBlockhain>;
  const host = anchor.web3.Keypair.generate();

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

    console.log("✅ Host initialized successfully!");

    // Fetch and verify the created host
    const hostAccount = await program.account.host.fetch(host_pkey);
    console.log("Created host:", {
      name: hostAccount.name,
      email: hostAccount.email,
      createdAt: hostAccount.createdAt.toString(),
      hostAuthor: hostAccount.hostAuthor.toString(),
      listingCount: hostAccount.listingCount.toNumber()
    });

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

    console.log("Host PDA:", host_pkey.toString());
    console.log("Listing PDA:", listing_pkey.toString());

    await program.methods.initializeListing(
      "Beautiful Beach House",
      "Stunning oceanfront property with amazing sunset views",
      "https://a0.muscache.com/im/pictures/ccb251a8-663d-4472-9127-c51c471a55fc.jpg",
      new BN(Date.now()),
      "Beach",
      3,           // room_count
      2,           // bathroom_count  
      6,           // guest_count
      "US",        // country_code
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

    console.log("✅ Listing initialized successfully!");

    // Fetch and verify the created listing
    const listingAccount = await program.account.listing.fetch(listing_pkey);
    console.log("Created listing:", {
      title: listingAccount.title,
      description: listingAccount.description,
      category: listingAccount.category,
      price: listingAccount.price.toString(),
      host: listingAccount.host.toString(),
      roomCount: listingAccount.roomCount,
      guestCount: listingAccount.guestCount,
      countryCode: listingAccount.countryCode,
      isActive: listingAccount.isActive
    });

    // ✅ TEST: Verify host listing count incremented to 1
    const updatedHostAccount = await program.account.host.fetch(host_pkey);
    console.log("updatedHostAccount: ", updatedHostAccount);
    assert.strictEqual(updatedHostAccount.listingCount.toNumber(), 1, "Host listing count should be 1 after creating first listing");
    console.log("Host listing count after first listing:", updatedHostAccount.listingCount.toNumber());
  });

  it("Should create a second listing and increment counter to 2", async () => {
    // Get the host PDA
    const [host_pkey, host_bump] = getHostAddress(
      host.publicKey,
      program.programId
    );

    // Fetch host account to get current listing count
    const hostAccount = await program.account.host.fetch(host_pkey);
    const currentListingCount = hostAccount.listingCount.toNumber();
    
    // ✅ TEST: Verify we start with count = 1 from previous test
    assert.strictEqual(currentListingCount, 1, "Host should have 1 listing from previous test");

    // Generate PDA for second listing (count = 1)
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
      "CA",        // country_code
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

    console.log("✅ Second listing initialized successfully!");

    // ✅ TEST: Verify host listing count incremented to 2
    const finalHostAccount = await program.account.host.fetch(host_pkey);
    assert.strictEqual(finalHostAccount.listingCount.toNumber(), 2, "Host listing count should be 2 after creating second listing");
    console.log("Host listing count after second listing:", finalHostAccount.listingCount.toNumber());

    // ✅ TEST: Verify second listing was created correctly
    const listing2Account = await program.account.listing.fetch(listing2_pkey);
    assert.strictEqual(listing2Account.title, "Mountain Cabin Retreat");
    assert.strictEqual(listing2Account.category, "Cabins");
    console.log("Second listing created:", listing2Account.title);
  });
});

async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
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