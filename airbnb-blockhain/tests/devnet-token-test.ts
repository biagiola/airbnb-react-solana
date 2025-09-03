// import * as anchor from "@coral-xyz/anchor";
// import { Program, BN } from "@coral-xyz/anchor";
// import { AirbnbBlockhain } from "../target/types/airbnb_blockhain";
// import { PublicKey, Keypair } from '@solana/web3.js';
// import {
//   TOKEN_2022_PROGRAM_ID,
//   ASSOCIATED_TOKEN_PROGRAM_ID,
//   getAssociatedTokenAddressSync,
//   getMint
// } from "@solana/spl-token";

// describe("🌐 Devnet Token Tests", () => {
//   // Configure the client for Devnet
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);

//   const program = anchor.workspace.airbnbBlockhain as Program<AirbnbBlockhain>;
  
//   // Use your existing wallet as platform authority (no airdrop needed!)
//   const platformAuthority = provider.wallet as anchor.Wallet;
  
//   // Generate a new mint keypair for this test
//   const mint = Keypair.generate();
//   let platformTreasuryATA: PublicKey;

//   function getPlatformTreasuryAddress() {
//     return getAssociatedTokenAddressSync(
//       mint.publicKey,
//       platformAuthority.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID,
//       ASSOCIATED_TOKEN_PROGRAM_ID
//     );
//   }

//   async function checkWalletBalance() {
//     const balance = await provider.connection.getBalance(platformAuthority.publicKey);
//     console.log(`💰 Wallet SOL Balance: ${(balance / 1e9).toFixed(4)} SOL`);
    
//     if (balance < 0.01 * 1e9) { // Less than 0.01 SOL
//       throw new Error("❌ Insufficient SOL balance. Please add SOL to your Devnet wallet at https://faucet.solana.com");
//     }
//     return balance;
//   }

//   it("💵 Should check wallet balance", async () => {
//     await checkWalletBalance();
//     console.log("✅ Wallet has sufficient SOL for testing");
//   });

//   it("🏭 Should setup token infrastructure on Devnet", async () => {
//     console.log("\n🚀 Setting up Token2022 infrastructure on Devnet...");
//     console.log(`🔑 Platform Authority: ${platformAuthority.publicKey.toString()}`);
//     console.log(`🪙 New Mint Address: ${mint.publicKey.toString()}`);
    
//     // Initialize the token mint with transfer fee (no airdrop needed)
//     console.log("⚡ Creating Token2022 mint with 5% transfer fee...");
    
//     await program.methods.initializeToken(
//       500, // 5% fee (500 basis points)
//       new BN(1000000) // max fee
//     )
//     .accounts({
//       creator: platformAuthority.publicKey,
//       mint: mint.publicKey,
//     })
//     .signers([mint])
//     .rpc({ commitment: "confirmed" });

//     console.log("✅ Token mint created successfully!");

//     // Get platform treasury ATA
//     platformTreasuryATA = getPlatformTreasuryAddress();
//     console.log(`🏦 Platform Treasury ATA: ${platformTreasuryATA.toString()}`);
    
//     // Mint minimal tokens to platform treasury for testing (just 100 tokens)
//     console.log("⚡ Minting 100 tokens to platform treasury...");
    
//     await program.methods.mintToken(new BN(10000000000000))
//     .accounts({
//       creator: platformAuthority.publicKey,
//       mint: mint.publicKey,
//       recipientAta: platformTreasuryATA,
//       recipient: platformAuthority.publicKey,
//       tokenProgram: TOKEN_2022_PROGRAM_ID,
//       systemProgram: anchor.web3.SystemProgram.programId,
//       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//     })
//     .signers([])
//     .rpc({ commitment: "confirmed" });
    
//     console.log("✅ Tokens minted successfully!");
//     console.log("\n📊 DEVNET TOKEN INFRASTRUCTURE READY!");
//     console.log("=" + "=".repeat(50));
//     console.log(`🪙 Mint Address: ${mint.publicKey.toString()}`);
//     console.log(`🏦 Treasury ATA: ${platformTreasuryATA.toString()}`);
//     console.log(`🔑 Authority: ${platformAuthority.publicKey.toString()}`);
//     console.log("=" + "=".repeat(50));
//   });

//   it("🔍 Should display mint info and Explorer links", async () => {
//     console.log("\n🔍 Fetching Token2022 information...");
    
//     const mintInfo = await getMint(provider.connection, mint.publicKey, "confirmed", TOKEN_2022_PROGRAM_ID);
    
//     console.log("\n📋 TOKEN DETAILS:");
//     console.log("=" + "=".repeat(40));
//     console.log(`Decimals: ${mintInfo.decimals}`);
//     console.log(`Supply: ${mintInfo.supply.toString()}`);
//     console.log(`Mint Authority: ${mintInfo.mintAuthority?.toString() || 'None'}`);
//     console.log(`Freeze Authority: ${mintInfo.freezeAuthority?.toString() || 'None'}`);
//     console.log(`Is Initialized: ${mintInfo.isInitialized}`);
//     console.log("=" + "=".repeat(40));

//     console.log("\n🌍 SOLANA EXPLORER LINKS:");
//     console.log("=" + "=".repeat(50));
//     console.log(`🪙 Mint: https://explorer.solana.com/address/${mint.publicKey.toString()}?cluster=devnet`);
//     console.log(`🏦 Treasury: https://explorer.solana.com/address/${platformTreasuryATA.toString()}?cluster=devnet`);
//     console.log(`🔑 Authority: https://explorer.solana.com/address/${platformAuthority.publicKey.toString()}?cluster=devnet`);
//     console.log("=" + "=".repeat(50));

//     console.log("\n🎉 SUCCESS! Your Token2022 is live on Devnet!");
//     console.log("💡 Copy the links above to explore your token on Solana Explorer");
//   });

//   it("📱 Should prepare for Phantom Wallet integration", async () => {
//     console.log("\n📱 PHANTOM WALLET INTEGRATION INFO:");
//     console.log("=" + "=".repeat(50));
//     console.log("✅ Your token is now ready for Phantom Wallet!");
//     console.log("");
//     console.log("🔧 To add your token to Phantom:");
//     console.log("1. Open Phantom Wallet");
//     console.log("2. Switch to Devnet network");
//     console.log("3. Go to 'Manage Token List'");
//     console.log("4. Add custom token with address:");
//     console.log(`   ${mint.publicKey.toString()}`);
//     console.log("");
//     console.log("💰 Token Features:");
//     console.log("- ✅ Token2022 standard");
//     console.log("- ✅ 5% transfer fee built-in");
//     console.log("- ✅ 9 decimals");
//     console.log("- ✅ Ready for payment escrow");
//     console.log("=" + "=".repeat(50));
//   });
// });