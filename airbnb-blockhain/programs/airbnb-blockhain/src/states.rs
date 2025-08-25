use anchor_lang::prelude::*;

pub const HOST_SEED: &str = "HOST_SEED";
pub const LISTING_SEED: &str = "LISTING_SEED";

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