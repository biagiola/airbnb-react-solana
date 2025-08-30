use anchor_lang::prelude::*;

pub const HOST_SEED: &str = "HOST_SEED";
pub const GUEST_SEED: &str = "GUEST_SEED";
pub const LISTING_SEED: &str = "LISTING_SEED";
pub const RESERVATION_SEED: &str = "RESERVATION_SEED";
pub const PAYMENT_ESCROW_SEED: &str = "PAYMENT_ESCROW_SEED";

#[account]
#[derive(InitSpace)]
pub struct Host {
    pub host_author: Pubkey,
    #[max_len(32)]
    pub name: String,
    #[max_len(64)]
    pub email: String,
    #[max_len(500)]
    pub image: String,
    #[max_len(500)]
    pub hashed_password: String,
    pub created_at: u64,
    pub listing_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Guest {
    pub guest_author: Pubkey,
    #[max_len(32)]
    pub name: String,
    #[max_len(64)]
    pub email: String,
    #[max_len(500)]
    pub image_url: String,
    #[max_len(500)]
    pub hashed_password: String,
    pub created_at: u64,
    #[max_len(32)]
    pub phone_number: String,    
    pub date_of_birth: u64,
    #[max_len(32)]
    pub preferred_language: String,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub host: Pubkey,
    #[max_len(64)]
    pub title: String,
    #[max_len(300)]
    pub description: String,
    #[max_len(500)]
    pub image_url: String,
    pub created_at: u64,
    #[max_len(32)]
    pub category: String,
    pub room_count: u8,
    pub bathroom_count: u8,
    pub guest_count: u8,
    #[max_len(10)]
    pub country_code: String,
    pub total_bookings: u64,
    pub is_active: bool,
    pub price: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Reservation {
    pub guest: Pubkey,
    pub listing: Pubkey,
    pub host: Pubkey,
    pub start_date: u64,
    pub end_date: u64,
    pub guest_count: u8,
    pub total_nights: u16,
    pub price_per_night: u64,
    pub total_price: u64,
    pub status: ReservationStatus,
    pub created_at: u64,
    pub payment_status: PaymentStatus,
    // Payment-related fields
    pub payment_escrow: Option<Pubkey>,  // Link to escrow account
    pub token_amount: u64,               // Amount in tokens
    pub platform_fee: u64,               // Fee amount
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq)]
pub enum ReservationStatus {
    Pending,
    Confirmed,
    Cancelled,
    Completed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Paid,
    Refunded,
}

#[account]
#[derive(InitSpace)]
pub struct PaymentEscrow {
    pub reservation: Pubkey,
    pub guest: Pubkey,
    pub host: Pubkey,
    pub amount: u64,
    pub platform_fee: u64,
    pub status: EscrowStatus,
    pub created_at: u64,
    pub release_date: u64,  // When host gets paid
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq)]
pub enum EscrowStatus {
    Funded,        // Guest paid
    Released,      // Host received payment
    Refunded,      // Guest got refund
    Disputed,      // Needs resolution
}