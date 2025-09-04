# Airbnb Clone - Next.js + Solana Blockchain

This is a decentralized Airbnb clone built using **Next.js** for the frontend and **Solana blockchain** for the backend. The project combines modern web development with blockchain technology to create a trustless, decentralized accommodation booking platform.


**Note**: This project is in active development. The blockchain integration is experimental and was deployed for devnet usage. The frontend needs to be run on localhost.

**Current Status**: 
- Host and Guest accounts are created from the test files
- Listings are created by the host through blockchain tests
- Wallet connection is functional
- Reservation creation is working
- Payment escrow functionality is not yet ready

**Setup**: The frontend runs on `localhost:3000` and connects to the Solana devnet program. All blockchain addresses (host, guest, listings, token mint) can be found in [`app/actions/anchor/constants.ts`](./app/actions/anchor/constants.ts) - these are automatically updated when running the blockchain tests.

## 🏗️ Architecture

### Frontend (Next.js App)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand for modals, React hooks for local state
- **Database**: MongoDB with Prisma ORM (legacy)
- **Authentication**: Crypto wallet connection (Phantom)

### Backend (Solana Blockchain)
- **Framework**: Anchor (Solana development framework)
- **Language**: Rust
- **Network**: Solana Devnet
- **Program ID**: `5FeA9qBzmvEDreexhEMmivcz9KccuhCZaqWWVYxtkgm9`
- **Token Standard**: SPL Token-2022

## 🚀 Features

### Frontend Features
- **Accommodation Search**: Search listings with filters for location, dates, guests, and amenities
- **Listing Details**: Comprehensive property information with photos, descriptions, and pricing
- **Booking System**: Date selection and reservation management
- **User Authentication**: Crypto wallet connection (Phantom wallet)
- **Booking Management**: View, manage, and cancel reservations
- **Host Experience**: List properties and manage bookings
- **Payment System**: Blockchain-native payment escrow with SPL tokens

### Blockchain Features
- **Decentralized Listings**: Property listings stored on Solana blockchain
- **Smart Contract Reservations**: Automated reservation creation and management
- **Payment Escrow**: Secure payment handling with automatic fee distribution
- **Token Integration**: SPL Token-2022 for payments and platform fees
- **Program Derived Addresses (PDAs)**: Secure account addressing for all entities
- **Multi-signature Support**: Enhanced security for high-value transactions

## 🏛️ Smart Contract Architecture

### Program Overview
The Solana program (`airbnb_blockhain`) is built using the Anchor framework and implements a complete decentralized accommodation booking system.

**Program ID**: `5FeA9qBzmvEDreexhEMmivcz9KccuhCZaqWWVYxtkgm9`

### Account States & Data Structures

The blockchain program manages several key account types:

#### 1. Host Account
- **Purpose**: Stores host profile information and listing count
- **Key Fields**: Host authority, name, email, image, listing count
- **PDA Seeds**: `[HOST_SEED, host_authority]`

#### 2. Guest Account
- **Purpose**: Stores guest profile information and preferences
- **Key Fields**: Guest authority, name, email, phone, language preference
- **PDA Seeds**: `[GUEST_SEED, guest_authority]`

#### 3. Listing Account
- **Purpose**: Stores property information and availability
- **Key Fields**: Host, title, description, amenities, pricing, location
- **PDA Seeds**: `[LISTING_SEED, host_authority, listing_count]`

#### 4. Reservation Account
- **Purpose**: Manages booking details and payment status
- **Key Fields**: Guest, listing, host, dates, pricing, payment status
- **PDA Seeds**: `[RESERVATION_SEED, reservation_authority, reservation_id]`

#### 5. Payment Escrow Account
- **Purpose**: Handles secure payment processing and fee distribution
- **Key Fields**: Reservation link, amounts, platform fee, release date
- **PDA Seeds**: `[PAYMENT_ESCROW_SEED, reservation, escrow_id]`

### Status Enums

- **ReservationStatus**: Pending, Confirmed, Cancelled, Completed
- **PaymentStatus**: Pending, Paid, Refunded
- **EscrowStatus**: Funded, Released, Refunded, Disputed

## 🔧 Smart Contract Instructions

### Core User Management

#### 1. Initialize Host
- **Purpose**: Create a new host account
- **PDA Seeds**: `[HOST_SEED, host_authority]`
- **Accounts**: Host authority (signer), Host PDA, System Program

#### 2. Initialize Guest
- **Purpose**: Create a new guest account
- **PDA Seeds**: `[GUEST_SEED, guest_authority]`
- **Accounts**: Guest authority (signer), Guest PDA, System Program

### Listing Management

#### 3. Initialize Listing
- **Purpose**: Create a new property listing
- **PDA Seeds**: `[LISTING_SEED, host_authority]`
- **Accounts**: Host authority (signer), Listing PDA, System Program

### Reservation System

#### 4. Initialize Reservation
- **Purpose**: Create a new reservation
- **PDA Seeds**: `[RESERVATION_SEED, reservation_authority, reservation_id]`
- **Accounts**: Reservation authority (signer), Reservation PDA, System Program

### Payment & Escrow System

#### 5. Initialize Payment Escrow
- **Purpose**: Create payment escrow and transfer tokens
- **PDA Seeds**: `[PAYMENT_ESCROW_SEED, reservation, escrow_id]`
- **Accounts**: Guest authority, Reservation, Payment Escrow PDA, Mint, Guest Token Account, Platform Treasury, Token Program, Associated Token Program, System Program
- **Fee**: Automatic 5% platform fee calculation
- **Token Transfer**: Immediate transfer to platform treasury

#### 6. Release Payment Escrow
- **Purpose**: Release payment to host after stay completion
- **Accounts**: Platform authority, Payment Escrow, Mint, Platform Treasury, Host Token Account, Token Program, Associated Token Program, System Program

### Token Management

#### 7. Initialize Token
- **Purpose**: Initialize SPL Token-2022 mint with transfer fees
- **Accounts**: Creator, Mint, System Program, Token Program

#### 8. Mint Token
- **Purpose**: Mint tokens to recipient
- **Accounts**: Creator, Mint, Recipient, Recipient ATA, Token Program, System Program, Associated Token Program

#### 9. Withdraw Token
- **Purpose**: Withdraw tokens from account
- **Accounts**: Authority, Mint, From ATA, To ATA, Token Program, Associated Token Program, System Program

## 🔐 Security Features

### Program Derived Addresses (PDAs)
All accounts use PDAs for secure addressing:
- **Host**: `[HOST_SEED, host_authority]`
- **Guest**: `[GUEST_SEED, guest_authority]`
- **Listing**: `[LISTING_SEED, host_authority]`
- **Reservation**: `[RESERVATION_SEED, reservation_authority, reservation_id]`
- **Payment Escrow**: `[PAYMENT_ESCROW_SEED, reservation, escrow_id]`

### Access Control
- **Host-only operations**: Listing creation and management
- **Guest-only operations**: Reservation creation and payment
- **Platform authority**: Payment escrow release
- **Token authority**: Mint and transfer operations

### Fee Structure
- **Platform Fee**: Fixed 5% (500 basis points)
- **Maximum Fee**: Configurable cap on transfer fees
- **Automatic Distribution**: Fees transferred to platform treasury

## 🧪 Testing & Development

### Test Suite Structure
The project includes comprehensive tests covering:
- **Token Infrastructure Setup**: Mint creation and platform treasury
- **User Account Creation**: Host and guest initialization
- **Listing Management**: Property listing creation and updates
- **Reservation System**: Booking creation and status management
- **Payment Escrow**: Payment flow and fee distribution
- **Token Operations**: Minting, transferring, and withdrawing

### Test Commands
```bash
# Run all tests
anchor test

# Run specific test file
anchor test tests/airbnb-blockhain.ts

# Run with verbose output
anchor test --verbose
```

### Development Workflow
1. **Local Development**: Use localhost cluster for testing
2. **Devnet Deployment**: Deploy to Solana devnet for integration testing
3. **Mainnet Deployment**: Production deployment with security audits

## 📊 Token Economics

### SPL Token-2022 Features
- **Transfer Fees**: 5% automatic fee on all transfers
- **Platform Treasury**: Centralized fee collection
- **Escrow System**: Secure payment handling
- **Automatic Distribution**: Fee distribution to platform

### Fee Distribution
```
Guest Payment (100 tokens)
├── Platform Fee (5 tokens) → Platform Treasury
└── Host Payment (95 tokens) → Host Account (after stay)
```

## 🛠️ Technology Stack

### Frontend
```
Next.js 14
TypeScript
Tailwind CSS
Zustand
@solana/web3.js
@coral-xyz/anchor
@solana/spl-token
```

### Backend
```
Anchor Framework
Rust
Solana Program Library (SPL)
Token-2022
```

## 🔧 Frontend-Blockchain Integration

### Constants Management (`app/actions/anchor/constants.ts`)

The frontend integrates with the blockchain through a centralized constants file that contains all the necessary public keys and configuration values. These constants are **automatically generated** from running the blockchain tests on devnet.

#### Generated Constants
```typescript
// These constants are automatically updated by running anchor tests
export const guestPDA = "583VKRJMoibV11NXxAaMaV6qYgA8hxT44nC2gLjRnLym";
export const mintPubkey = "C3TMMfUdiLtzPCEAXxpVF9Yo1g5oLgcuwEjeHWzCQVbG";
export const hostPDA = "tB3gCNRGrW2vVb7Tf5wPgAwFxuidjUNyEfikZKsSoo4";

// Listing PDAs (generated from test runs)
export const listingPDA_1 = "59fa6qB4kjpM8vkTCZbTj1JHcHgJbD5z27WmehsKtkv9";
export const listingPDA_2 = "Hoo2ESnm1ViQAPMjtLk7ACkoENoUCQQMH9FDo3v9wLPj";
export const listingPDA_3 = "F1gbgjfzzoBDp1TdgpAXGGMDVXuZwZCKXZhijE6h8oCM";
export const listingPDA_4 = "324nPsBSYsRLnYJKtk3QFK29jyvi3VRQxTkaLw9fvQEX";
export const listingPDA_5 = "FfuPQiX9pdRypQKeHGNmMajELcJK1254GfaDyQ5qbvyo";
export const listingPDA_6 = "7fzMi5MWaGkCVRHNMoT2y1KpRWRyQnC2yqUKYEEGuNxV";
```

#### How Constants Are Generated

1. **Test Execution**: When you run `anchor test` in the blockchain directory, the test suite:
   - Creates test accounts (host, guest, listings)
   - Generates PDAs for each account
   - Mints SPL tokens for testing
   - Creates sample listings and reservations

2. **Automatic Update**: The test file includes a helper function `updateFrontendConstants()` that:
   - Captures all generated public keys
   - Updates the frontend `constants.ts` file automatically
   - Ensures frontend and blockchain are always in sync

3. **Test Flow**:
   ```typescript
   // From airbnb-blockhain/tests/airbnb-blockhain.ts
   function updateFrontendConstants(guestPDA: string, mintPubkey: string, hostPDA: string, allListingPDAs: string[] = []) {
     // Automatically updates app/actions/anchor/constants.ts
     // with fresh public keys from test runs
   }
   ```

#### Static Constants
```typescript
// These remain constant across deployments
export const RPC = "https://api.devnet.solana.com/";
export const PROGRAM_ID = "5FeA9qBzmvEDreexhEMmivcz9KccuhCZaqWWVYxtkgm9";
export const HOST_SEED = "HOST_SEED";
export const GUEST_SEED = "GUEST_SEED";
export const LISTING_SEED = "LISTING_SEED";
export const RESERVATION_SEED = "RESERVATION_SEED";
export const PAYMENT_ESCROW_SEED = "PAYMENT_ESCROW_SEED";
```

### Integration Workflow

1. **Development**: Run `anchor test` to generate fresh constants
2. **Frontend**: Import constants from `@/app/actions/anchor/constants`
3. **Blockchain Calls**: Use constants for PDA generation and account lookups
4. **Data Parsing**: Use parsing functions to convert blockchain data to frontend format


## 🚀 Getting Started

### Frontend Setup
```bash
# Install dependencies
yarn install

# Run development server
yarn dev
```

### Blockchain Setup
```bash
# Navigate to blockchain directory
cd airbnb-blockhain

# Install dependencies
yarn install

# Build the program
anchor build

# Deploy to devnet
anchor deploy

# Run tests
anchor test
```

## 🔗 Blockchain Integration

### Wallet Connection
The app integrates with Phantom wallet for user authentication and transaction signing.

### Key Constants
- **Program ID**: `5FeA9qBzmvEDreexhEMmivcz9KccuhCZaqWWVYxtkgm9`
- **RPC Endpoint**: Solana Devnet
- **Token Mint**: SPL Token-2022 for payments
- **Platform Treasury**: Automated fee collection

### Transaction Flow
1. **Wallet Connection**: User connects Phantom wallet
2. **Listing Creation**: Host creates listing on blockchain
3. **Reservation**: Guest creates reservation with PDA
4. **Payment Escrow**: Secure payment with automatic fee distribution
5. **Release**: Payment released to host after stay completion

## 🧪 Testing

### Frontend Tests
```bash
npm run test
```

### Blockchain Tests
```bash
cd airbnb-blockhain
anchor test
```

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Smart Contract**: [Solana Explorer](https://explorer.solana.com/address/5FeA9qBzmvEDreexhEMmivcz9KccuhCZaqWWVYxtkgm9?cluster=devnet)

---