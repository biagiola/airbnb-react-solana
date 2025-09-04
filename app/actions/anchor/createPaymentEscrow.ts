import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_2022_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddressSync 
} from "@solana/spl-token";
import {
	hostPDA,
	guestPDA,
	listingPDA_1,
	parseListingAccount,
	RPC,
	PAYMENT_ESCROW_SEED,
	PROGRAM_ID,
	mintPubkey as mintPubkeyString,
} from "@/app/actions/anchor/constants";
import {
	CreateReservationResult,
	ReservationStatus,
	PaymentStatus,
	CreatePaymentEscrowResult,
	PaymentEscrowParams
} from "@/app/types/blockchain";
import { BN, Program, AnchorProvider, web3, setProvider, getProvider } from "@coral-xyz/anchor";

// Platform treasury address from devnet tests
const PLATFORM_TREASURY_ATA = "2dsUgCKvJM12fRXKK4ZpTdyyF3AatznAbuf33urv1nd5";

// Simple IDL without programId - we'll handle that separately
const AIRBNB_IDL = {
  "version": "0.1.0",
  "name": "airbnb_blockhain",
  "instructions": [
    {
      "name": "initializePaymentEscrow",
      "accounts": [
        { "name": "guestAuthority", "isMut": true, "isSigner": true },
        { "name": "reservation", "isMut": false, "isSigner": false },
        { "name": "paymentEscrow", "isMut": true, "isSigner": false },
        { "name": "mint", "isMut": false, "isSigner": false },
        { "name": "guestTokenAccount", "isMut": true, "isSigner": false },
        { "name": "platformTreasury", "isMut": true, "isSigner": false },
        { "name": "tokenProgram", "isMut": false, "isSigner": false },
        { "name": "associatedTokenProgram", "isMut": false, "isSigner": false },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "escrowId", "type": "u64" },
        { "name": "amount", "type": "u64" },
        { "name": "releaseDate", "type": "u64" }
      ]
    }
  ]
};

export default async function createPaymentEscrow(params: PaymentEscrowParams): Promise<CreatePaymentEscrowResult> {
	try {
		const { reservationPDA, amount, releaseDate, escrowId } = params;

		// Validate input parameters
		if (!reservationPDA) {
			throw new Error("Reservation PDA is required");
		}
		if (amount === undefined || amount === null) {
			throw new Error("Amount is required");
		}
		if (releaseDate === undefined || releaseDate === null) {
			throw new Error("Release date is required");
		}
		if (escrowId === undefined || escrowId === null) {
			throw new Error("Escrow ID is required");
		}

		console.log("🔍 Payment escrow parameters:", {
			reservationPDA,
			amount,
			releaseDate,
			escrowId
		});

		// Check wallet connection
		if (!window.solana?.isPhantom) {
			throw new Error("Wallet not connected");
		}

		const connection = new Connection(RPC, "confirmed");
		const wallet = window.solana;
		const guestAuthority = new PublicKey(wallet.publicKey!.toBytes());

		// Create Anchor provider and program
		const provider = new AnchorProvider(
			connection,
			wallet as any,
			{ commitment: "confirmed" }
		);

		// Try using setProvider approach which is more stable
		setProvider(provider);
		
		// Create IDL with programId as PublicKey object
		const idlWithProgramId = {
			...AIRBNB_IDL,
			programId: new PublicKey(PROGRAM_ID)
		};
		
		console.log("🔍 Using setProvider approach");
		console.log("🔍 PROGRAM_ID constant:", PROGRAM_ID);

		const program = new Program(idlWithProgramId as any);

		// Generate Payment Escrow PDA
		const escrowIdBuffer = Buffer.alloc(8);
		escrowIdBuffer.writeBigUInt64LE(BigInt(escrowId), 0);

		const [paymentEscrowPDA] = PublicKey.findProgramAddressSync(
			[
				Buffer.from(PAYMENT_ESCROW_SEED),
				new PublicKey(reservationPDA).toBuffer(),
				escrowIdBuffer,
			],
			new PublicKey(PROGRAM_ID)
		);

		// Use actual mint and platform treasury from constants
		const mintPubkey = new PublicKey(mintPubkeyString);
		const platformTreasuryPubkey = new PublicKey(PLATFORM_TREASURY_ATA);

		// Get guest token account
		const guestTokenAccount = getAssociatedTokenAddressSync(
			mintPubkey,
			guestAuthority,
			false,
			TOKEN_2022_PROGRAM_ID,
			ASSOCIATED_TOKEN_PROGRAM_ID
		);

		// Use Anchor's method calling (like in your test file)
		// Ensure values are properly converted to BN
		const escrowIdBN = new BN(escrowId.toString());
		const amountBN = new BN(amount.toString());
		const releaseDateBN = new BN(releaseDate.toString());

		console.log("🔢 BN values:", {
			escrowId: escrowIdBN.toString(),
			amount: amountBN.toString(),
			releaseDate: releaseDateBN.toString()
		});

		const txId = await program.methods.initializePaymentEscrow(
			escrowIdBN,
			amountBN,
			releaseDateBN
		)
		.accounts({
			guestAuthority: guestAuthority,
			reservation: new PublicKey(reservationPDA),
			paymentEscrow: paymentEscrowPDA,
			mint: mintPubkey,
			guestTokenAccount: guestTokenAccount,
			platformTreasury: platformTreasuryPubkey,
			tokenProgram: TOKEN_2022_PROGRAM_ID,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
		})
		.rpc({ commitment: "confirmed" });

		// Calculate platform fee (5%)
		const platformFee = Math.floor(amount * 0.05);

		const result: CreatePaymentEscrowResult = {
			success: true,
			escrowPDA: paymentEscrowPDA.toString(),
			transactionId: txId,
			escrowData: {
				reservation: reservationPDA,
				guest: guestAuthority.toString(),
				host: hostPDA, // Use actual host PDA from constants
				amount,
				platformFee,
				status: "Funded",
				createdAt: Math.floor(Date.now() / 1000),
				releaseDate,
				bump: 0, // Will be set by program
			}
		};

		console.log("✅ Payment escrow created:", result);
		return result;

	} catch (error: any) {
		console.error("❌ Payment escrow failed:", error);
		throw new Error(`Payment escrow failed: ${error.message}`);
	}
}

function bnToUint8Array(bn: BN, byteLength: number): Uint8Array {
    return Uint8Array.from(bn.toArrayLike(Uint8Array as any, "le", byteLength));
}