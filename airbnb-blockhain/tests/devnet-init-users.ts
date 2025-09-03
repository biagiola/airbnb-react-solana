import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { AirbnbBlockhain } from "../target/types/airbnb_blockhain";
import { PublicKey, Keypair } from '@solana/web3.js';
import { assert } from "chai";
import * as fs from 'fs';
import * as path from 'path';
import * as bs58 from 'bs58';

const HOST_SEED = "HOST_SEED";
const GUEST_SEED = "GUEST_SEED";
const LISTING_SEED = "LISTING_SEED";
const RESERVATION_SEED = "RESERVATION_SEED";
const PAYMENT_ESCROW_SEED = "PAYMENT_ESCROW_SEED";
const PLATFORM_TREASURY_SEED = "PLATFORM_TREASURY_SEED";

// 🔧 DEVNET CONSTANTS - From your successful token deployment
const PLATFORM_AUTHORITY = "8wJTyfoBZCJhkKsAMwnpHfoR9B8YCFb8ShZYGWaKUiEd";
const MINT_ADDRESS = "C3TMMfUdiLtzPCEAXxpVF9Yo1g5oLgcuwEjeHWzCQVbG";
const PLATFORM_TREASURY_ATA = "2dsUgCKvJM12fRXKK4ZpTdyyF3AatznAbuf33urv1nd5";

describe("👥 Devnet User Initialization", () => {
	// Configure the client for Devnet
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.airbnbBlockhain as Program<AirbnbBlockhain>;

	// Use your existing wallet (no airdrop needed!)
	const platformAuthority = provider.wallet as anchor.Wallet;

	// Generate new keypairs for host and guest
	const host = anchor.web3.Keypair.generate();
	const guest = anchor.web3.Keypair.generate();

	// Convert string addresses to PublicKey objects
	const mintPubkey = new PublicKey(MINT_ADDRESS);
	const platformTreasuryATA = new PublicKey(PLATFORM_TREASURY_ATA);

	let host_pkey: PublicKey;
	let guest_pkey: PublicKey;

	async function checkWalletBalance() {
		const balance = await provider.connection.getBalance(platformAuthority.publicKey);
		console.log(`💰 Platform Wallet SOL Balance: ${(balance / 1e9).toFixed(4)} SOL`);

		if (balance < 0.05 * 1e9) { // Less than 0.05 SOL
			throw new Error("❌ Insufficient SOL balance. Please add SOL to your Devnet wallet at https://faucet.solana.com");
		}
		return balance;
	}

	async function fundAccount(pubkey: PublicKey, description: string) {
		console.log(`💸 Funding ${description}: ${pubkey.toString()}`);

		// Transfer SOL from platform authority to the account
		const transferIx = anchor.web3.SystemProgram.transfer({
			fromPubkey: platformAuthority.publicKey,
			toPubkey: pubkey,
			lamports: 1.00 * anchor.web3.LAMPORTS_PER_SOL // 1.00 SOL
		});

		const tx = new anchor.web3.Transaction().add(transferIx);
		await provider.sendAndConfirm(tx);

		const balance = await provider.connection.getBalance(pubkey);
		console.log(`✅ ${description} funded with ${(balance / 1e9).toFixed(4)} SOL`);
	}

	it("💵 Should check platform wallet balance", async () => {
		await checkWalletBalance();
		console.log("✅ Platform wallet has sufficient SOL for user creation");
	});

	it("🏠 Should initialize a host with valid fields", async () => {
		console.log("\n🚀 Creating Host account on Devnet...");

		// Fund the host account
		await fundAccount(host.publicKey, "Host");

		// Get host PDA
		[host_pkey] = getHostAddress(host.publicKey, program.programId);
		console.log(`🔑 Host Authority: ${host.publicKey.toString()}`);
		console.log(`🏠 Host PDA: ${host_pkey.toString()}`);
		
		// 🔐 HOST SECRET KEY FOR PHANTOM WALLET IMPORT
		console.log("\n🔐 HOST WALLET IMPORT INFO:");
		console.log("=" + "=".repeat(50));
		console.log("📱 To import this Host wallet into Phantom:");
		console.log("1. Open Phantom → Add/Connect Wallet → Import Private Key");
		console.log("2. Use this Base58 private key:");
		console.log(`🔑 Host Private Key: ${bs58.encode(host.secretKey)}`);
		console.log("3. Or use this byte array format:");
		console.log(`🔢 Host Secret (bytes): [${Array.from(host.secretKey).join(',')}]`);
		console.log("=" + "=".repeat(50));

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

		// Fetch and verify the created host
		const hostAccount = await program.account.host.fetch(host_pkey);
		assert.strictEqual(hostAccount.listingCount.toNumber(), 0, "Host should start with 0 listings");

		console.log("✅ Host initialized successfully!");
		console.log(`📊 Host PDA: ${host_pkey.toString()}`);
		console.log(`🔍 View on Explorer: https://explorer.solana.com/address/${host_pkey.toString()}?cluster=devnet`);
	});

	it("🏘️ Should initialize 6 listings for frontend testing", async () => {
		console.log("\n🏗️ Creating 6 listings on Devnet...");

		// Get the guest PDA for constants update (we'll create guest next)
		[guest_pkey] = getGuestAddress(guest.publicKey, program.programId);

		// Fetch current host listing count
		const hostAccount = await program.account.host.fetch(host_pkey);
		let currentListingCount = hostAccount.listingCount.toNumber();
		console.log(`📊 Current host listing count: ${currentListingCount}`);

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

		// Display all listing PDAs
		console.log("\n🏠 All Listing PDAs:");
		listingPDAs.forEach((pda, index) => {
			console.log(`Listing ${index + 1}: ${pda.toBase58()}`);
		});

		// Verify final host listing count
		const finalHostAccount = await program.account.host.fetch(host_pkey);
		console.log(`\n📊 Host final listing count: ${finalHostAccount.listingCount.toNumber()}`);

		console.log("\n🎉 All 6 listings created successfully on Devnet!");
	});

	it("👤 Should initialize a guest", async () => {
		console.log("\n🚀 Creating Guest account on Devnet...");

		// Fund the guest account
		await fundAccount(guest.publicKey, "Guest");

		console.log(`🔑 Guest Authority: ${guest.publicKey.toString()}`);
		console.log(`👤 Guest PDA: ${guest_pkey.toString()}`);
		
		// 🔐 GUEST SECRET KEY FOR PHANTOM WALLET IMPORT
		console.log("\n🔐 GUEST WALLET IMPORT INFO:");
		console.log("=" + "=".repeat(50));
		console.log("📱 To import this Guest wallet into Phantom:");
		console.log("1. Open Phantom → Add/Connect Wallet → Import Private Key");
		console.log("2. Use this Base58 private key:");
		console.log(`🔑 Guest Private Key: ${bs58.encode(guest.secretKey)}`);
		console.log("3. Or use this byte array format:");
		console.log(`🔢 Guest Secret (bytes): [${Array.from(guest.secretKey).join(',')}]`);
		console.log("=" + "=".repeat(50));

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

		console.log("✅ Guest initialized successfully!");

		// Fetch and verify the created guest
		const guestAccount = await program.account.guest.fetch(guest_pkey);

		// TEST: Verify guest was created correctly
		assert.strictEqual(guestAccount.name, "David Biagiola", "Guest name should match");
		assert.strictEqual(guestAccount.email, "davidbiagiola5@gmail.com", "Guest email should match");
		assert.strictEqual(guestAccount.guestAuthor.toString(), guest.publicKey.toString(), "Guest authority should match");

		console.log(`📊 Guest PDA: ${guest_pkey.toString()}`);
		console.log(`🔍 View on Explorer: https://explorer.solana.com/address/${guest_pkey.toString()}?cluster=devnet`);
	});

	it("📱 Should update frontend constants and display summary", async () => {
		console.log("\n📝 Updating frontend constants...");

		// Get all listing PDAs again
		const listingPDAs: PublicKey[] = [];
		for (let i = 0; i < 6; i++) {
			const [listing_pkey] = getListingAddress(host.publicKey, i, program.programId);
			listingPDAs.push(listing_pkey);
		}

		// Update frontend constants
		const listingPDAStrings = listingPDAs.map(pda => pda.toBase58());
		updateFrontendConstants(
			guest_pkey.toBase58(),
			MINT_ADDRESS,
			host_pkey.toBase58(),
			listingPDAStrings
		);

		console.log("\n🎉 DEVNET USER INFRASTRUCTURE COMPLETE!");
		console.log("=" + "=".repeat(60));
		console.log("📊 SUMMARY:");
		console.log(`🔑 Platform Authority: ${PLATFORM_AUTHORITY}`);
		console.log(`🪙 Mint Address: ${MINT_ADDRESS}`);
		console.log(`🏦 Treasury ATA: ${PLATFORM_TREASURY_ATA}`);
		console.log(`🏠 Host PDA: ${host_pkey.toString()}`);
		console.log(`👤 Guest PDA: ${guest_pkey.toString()}`);
		console.log(`📋 Listings Created: 6`);
		console.log("=" + "=".repeat(60));

		console.log("\n🌍 EXPLORER LINKS:");
		console.log(`🪙 Token: https://explorer.solana.com/address/${MINT_ADDRESS}?cluster=devnet`);
		console.log(`🏦 Treasury: https://explorer.solana.com/address/${PLATFORM_TREASURY_ATA}?cluster=devnet`);
		console.log(`🏠 Host: https://explorer.solana.com/address/${host_pkey.toString()}?cluster=devnet`);
		console.log(`👤 Guest: https://explorer.solana.com/address/${guest_pkey.toString()}?cluster=devnet`);

		console.log("\n🔐 PHANTOM WALLET IMPORT SUMMARY:");
		console.log("=" + "=".repeat(60));
		console.log("📱 Import these wallets into Phantom (Devnet network):");
		console.log("");
		console.log("🏠 HOST WALLET:");
		console.log(`   Public Key: ${host.publicKey.toString()}`);
		console.log(`   Private Key: ${bs58.encode(host.secretKey)}`);
		console.log("");
		console.log("👤 GUEST WALLET:");
		console.log(`   Public Key: ${guest.publicKey.toString()}`);
		console.log(`   Private Key: ${bs58.encode(guest.secretKey)}`);
		console.log("");
		console.log("🪙 TOKEN TO ADD:");
		console.log(`   Mint Address: ${MINT_ADDRESS}`);
		console.log(`   Standard: Token2022`);
		console.log(`   Decimals: 9`);
		console.log(`   Transfer Fee: 5%`);
		console.log("=" + "=".repeat(60));
		
		console.log("\n✅ Your Airbnb dApp is now fully ready for Phantom Wallet integration!");
		console.log("🚀 Frontend constants have been updated with all PDAs");
		console.log("💡 Save the private keys above to import wallets into Phantom!");
	});
});

// Helper functions (copied from original test file)
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

// Helper function to update frontend constants.ts file
function updateFrontendConstants(guestPDA: string, mintPubkey: string, hostPDA: string, allListingPDAs: string[] = []) {
	try {
		// Path to the constants file from the test directory
		const constantsPath = path.join(__dirname, '..', '..', 'app', 'actions', 'anchor', 'constants.ts');

		// Read the current file
		let fileContent = fs.readFileSync(constantsPath, 'utf8');

		// Replace the main constants using regex
		fileContent = fileContent.replace(
			/export const guestPDA = "[^"]*";/,
			`export const guestPDA = "${guestPDA}";`
		);

		fileContent = fileContent.replace(
			/export const mintPubkey = "[^"]*";/,
			`export const mintPubkey = "${mintPubkey}";`
		);

		fileContent = fileContent.replace(
			/export const hostPDA = "[^"]*";/,
			`export const hostPDA = "${hostPDA}";`
		);

		// Update all listing PDAs if provided
		if (allListingPDAs.length > 0) {
			// First, remove any existing listingPDA_X constants
			fileContent = fileContent.replace(/export const listingPDA_\d+ = "[^"]*";\n/g, '');

			// Find the position after the mintPubkey constant to insert the new ones
			const mintPubkeyIndex = fileContent.indexOf(`export const mintPubkey = "${mintPubkey}";`);
			if (mintPubkeyIndex !== -1) {
				const insertPosition = fileContent.indexOf('\n', mintPubkeyIndex) + 1;

				// Create the listing PDA constants
				let listingPDAConstants = '\n';
				allListingPDAs.forEach((pda, index) => {
					listingPDAConstants += `export const listingPDA_${index + 1} = "${pda}";\n`;
				});

				// Insert the new constants
				fileContent = fileContent.slice(0, insertPosition) + listingPDAConstants + fileContent.slice(insertPosition);
			}
		}

		// Write the updated content back to the file
		fs.writeFileSync(constantsPath, fileContent, 'utf8');

		console.log("✅ Frontend constants updated successfully!");
		console.log(`   guestPDA: ${guestPDA}`);
		console.log(`   mintPubkey: ${mintPubkey}`);
		console.log(`   hostPDA: ${hostPDA}`);
		if (allListingPDAs.length > 0) {
			console.log(`   ${allListingPDAs.length} listing PDAs updated:`);
			allListingPDAs.forEach((pda, index) => {
				console.log(`     listingPDA_${index + 1}: ${pda}`);
			});
		}
	} catch (error) {
		console.error("❌ Error updating frontend constants:", error);
	}
}