// TypeScript types for blockchain data structures

export enum ReservationStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  REFUNDED = "refunded",
  FAILED = "failed",
}

// Solana Wallet Interface
export interface SolanaWallet {
  // Connection methods
  connect: (params?: {
    onlyIfTrusted?: boolean;
  }) => Promise<{ publicKey: { toBytes(): Uint8Array } }>;
  disconnect: () => Promise<void>;

  // Transaction signing methods
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;

  // Message signing
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;

  // Request method for RPC calls
  request: (method: string, params?: any) => Promise<any>;

  // Bridge and messaging
  openBridge: () => void;
  postMessage: (message: any) => void;

  // Properties
  isPhantom: boolean;
  publicKey: { toBytes(): Uint8Array } | null;
}

// Window augmentation for global solana wallet
declare global {
  interface Window {
    solana?: SolanaWallet;
  }
}

export interface PaymentEscrowParams {
  reservationPDA: string;
  amount: number;
  releaseDate: number;
  escrowId: number;
}

export interface ReservationDetails {
  guest: string; // Pubkey as string
  host: string; // Pubkey as string
  listing: string; // Pubkey as string
  startDate: number; // Unix timestamp (u64)
  endDate: number; // Unix timestamp (u64)
  guestCount: number; // u8
  totalNights: number; // u16
  pricePerNight: number; // u64
  totalPrice: number; // u64
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  createdAt?: number; // Unix timestamp (u64) - optional for frontend
  paymentEscrow?: string; // Optional Pubkey as string
  tokenAmount?: number; // u64 - optional for frontend
  platformFee?: number; // u64 - optional for frontend
}

export interface CreateReservationResult {
  success: boolean;
  reservationId: number; // The ID used to generate PDA
  reservationPDA: string; // The generated PDA as string
  details: ReservationDetails;
}

// Additional types for payment escrow
export interface PaymentEscrowData {
  reservation: string; // Pubkey as string
  guest: string; // Pubkey as string
  host: string; // Pubkey as string
  amount: number; // u64
  platformFee: number; // u64
  status: string; // EscrowStatus
  createdAt: number; // u64
  releaseDate: number; // u64
  bump: number; // u8
}

export interface CreatePaymentEscrowResult {
  success: boolean;
  escrowPDA: string; // The generated escrow PDA
  transactionId?: string; // Optional transaction signature
  escrowData: PaymentEscrowData;
}
