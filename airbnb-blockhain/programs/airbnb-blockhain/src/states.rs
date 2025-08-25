use anchor_lang::prelude::*;

pub const HOST_SEED: &str = "HOST_SEED";

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
    pub bump: u8,
}