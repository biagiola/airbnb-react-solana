// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { TokenExample2 } from "../target/types/token_example_2";
// import { assert } from "chai";
// import { PublicKey, Keypair, Connection, SIGNATURE_LENGTH_IN_BYTES } from "@solana/web3.js";
// import {
//     TOKEN_2022_PROGRAM_ID,
//     ASSOCIATED_TOKEN_PROGRAM_ID,
//     getAssociatedTokenAddressSync,
//     getAccount,
//     getMint,
//     getTransferFeeConfig,
//     getTransferFeeAmount,
// } from "@solana/spl-token";

// // Configure the client to use the local cluster.
// anchor.setProvider(anchor.AnchorProvider.env());
// const program = anchor.workspace.tokenExample2 as Program<TokenExample2>;
// const provider = anchor.getProvider() as anchor.AnchorProvider;
// const connection = provider.connection as unknown as Connection;

// describe("token-example-2", () => {
//     const creator = Keypair.generate();
//     const mintKeypair = Keypair.generate();
//     const recipient = Keypair.generate();
//     const recipient2 = Keypair.generate();

//     before(async () => {
//         await Promise.all([
//             airdrop(connection, creator.publicKey),
//             airdrop(connection, recipient.publicKey),
//         ]);
//     });

//     it("should initialize a mint with transfer fee extension", async () => {
//         const feeBps = 500;
//         const maxFee = 1000000;

//         const txInitSplToken = await program.methods
//             .initialize(feeBps, new anchor.BN(maxFee))
//             .accounts({
//                 creator: creator.publicKey,
//                 mint: mintKeypair.publicKey,
//             })
//             .signers([creator, mintKeypair])
//             .rpc({ skipPreflight: true }); // ?

//         const mintInfo = await getMintInfo(mintKeypair.publicKey);

//         console.log("tx spl token: ", txInitSplToken);
//         console.log("mintInfo: ", mintInfo);

//         assert.equal(
//             mintInfo.mintAuthority?.toBase58(),
//             creator.publicKey.toBase58(),
//         );
//         assert.equal(mintInfo.decimals, 9);
//         assert.equal(mintInfo.supply, BigInt(0));

//         const transferFeeConfig = getTransferFeeConfig(mintInfo);
//         assert.isNotNull(transferFeeConfig);
//         assert.equal(
//             transferFeeConfig?.newerTransferFee.transferFeeBasisPoints,
//             feeBps
//         );
//         assert.equal(
//             transferFeeConfig?.newerTransferFee.maximumFee,
//             BigInt(maxFee)
//         );
//     });

//     it("should mint tokens to recipient", async () => {
//         const recipientAta = getAta(mintKeypair.publicKey, recipient.publicKey);
//         const mintAmount = BigInt(100000);

//         const tx = await program.methods
//             .mint(new anchor.BN(mintAmount))
//             .accounts({
//                 creator: creator.publicKey,
//                 mint: mintKeypair.publicKey,
//                 recipient: recipient.publicKey
//             })
//             .signers([creator])
//             .rpc();

//         await connection.confirmTransaction(tx, "confirmed");

//         const mintInfo = await getMintInfo(mintKeypair.publicKey);
//         assert.equal(mintInfo.supply, BigInt(mintAmount));

//         const recipientTokenAccount = await getAccountInfo(recipientAta);
//         assert.equal(recipientTokenAccount.amount, BigInt(mintAmount));
//         assert.equal(
//             recipientTokenAccount.owner.toBase58(),
//             recipient.publicKey.toBase58(),
//         );
//     });

//     it("should transfer tokens to recipient2", async () => {
//         const senderAta = getAta(mintKeypair.publicKey, recipient.publicKey);
//         const recipient2Ata = getAta(mintKeypair.publicKey, recipient2.publicKey);
    
//         const mintAmount = BigInt(100000);
//         const transferAmount = BigInt(50000);
//         const tx = await program.methods
//           .transfer(new anchor.BN(transferAmount))
//           .accounts({
//             sender: recipient.publicKey,
//             mint: mintKeypair.publicKey,
//             recipient: recipient2.publicKey,
//           })
//           .signers([recipient])
//           .rpc();
    
//         await connection.confirmTransaction(tx, "confirmed");
    
//         const mintInfo = await getMintInfo(mintKeypair.publicKey);
//         assert.equal(mintInfo.supply, BigInt(mintAmount.toString()));
    
//         const senderTokenAccount = await getAccountInfo(senderAta);
//         const expectedSenderBalance = mintAmount - transferAmount;
//         assert.equal(
//           senderTokenAccount.amount,
//           BigInt(expectedSenderBalance.toString())
//         );
    
//         const recipientTokenAccount = await getAccountInfo(recipient2Ata);
//         const withheldAmount = getTransferFeeAmount(
//           recipientTokenAccount
//         ).withheldAmount;
//         assert.equal(recipientTokenAccount.amount, transferAmount - withheldAmount);
//         assert.equal(
//           withheldAmount,
//           (transferAmount * BigInt(500)) / BigInt(10000)
//         );
    
//         console.log("ACCOUNT STATE AFTER TRANSFER:");
//         await logBalance("Recipient 1", senderAta);
//         await logBalance("Recipient 2", recipient2Ata);
//     });

//     it("should withdraw withheld tokens", async () => {
//         const recipient2Ata = getAta(mintKeypair.publicKey, recipient2.publicKey);
//         const creatorAta = getAta(mintKeypair.publicKey, creator.publicKey);

//         const tx = await program.methods
//             .withdraw()
//             .accounts({
//                 creator: creator.publicKey,
//                 mint: mintKeypair.publicKey,
//                 from: recipient2.publicKey
//             })
//             .signers([creator])
//             .rpc();
//         await connection.confirmTransaction(tx, "confirmed");

//         const recipient2Account = await getAccountInfo(recipient2Ata);
//         const withheldAmount = getTransferFeeAmount(recipient2Account).withheldAmount;
//         assert.equal(withheldAmount, BigInt(0));

//         const creatorAccount = await getAccountInfo(creatorAta);
//         const expectedWithdrawnAmount = (BigInt(50000) * BigInt(500)) / BigInt(10000);
//         assert.equal(creatorAccount.amount, expectedWithdrawnAmount);

//         console.log("ACCOUNT STATE AFTER WITHDRAW:");
//         await logBalance("Creator", creatorAta);
//         await logBalance("Recipient 2", recipient2Ata);
//     });
// });

// export async function airdrop(
//     connection: any,
//     address: any,
//     amount = 500_000_000_000
// ) {
//     await connection.confirmTransaction(
//         await connection.requestAirdrop(address, amount),
//         "confirmed"
//     );
// }

// function getMintInfo(mint: PublicKey) {
//     return getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
// }

// function getAta(mint: PublicKey, owner: PublicKey) {
//     return getAssociatedTokenAddressSync(
//         mint,
//         owner,
//         false,
//         TOKEN_2022_PROGRAM_ID,
//         ASSOCIATED_TOKEN_PROGRAM_ID
//     );
// }

// function getAccountInfo(ata: PublicKey) {
//     return getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
// }

// async function logBalance(name: String, ata: PublicKey) {
//     try {
//         const account = await getAccountInfo(ata);

//         const transferFeeAmount = getTransferFeeAmount(account);
//         console.log(`${name}:`);
//         console.log(`  Balance: ${account.amount}`);
//         console.log(
//           `  Withheld: ${transferFeeAmount?.withheldAmount || BigInt(0)}`
//         );
//     } catch (error) {
//         console.log(`${name}: Account not found (balance: 0)`);
//     }
// }