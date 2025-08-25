use anchor_lang::prelude::*;
use crate::instructions::*;

pub mod instructions;
pub mod states;

declare_id!("9fD3JVVmbzGC66pTYb5xZCXc24ibEYcM8vMrWoQjMfW5");

#[program]
pub mod airbnb_blockhain {
    use super::*;

    pub fn initialize_host(
        ctx: Context<InitializeHost>,
        name: String,
        email: String,
        image: String,
        hashed_password: String,
        created_at: u64,
    ) -> Result<()> {
        _initialize_host(
            ctx,
            name,
            email,
            image,
            hashed_password,
            created_at,
        )
    }

    pub fn initialize_listing(
        ctx: Context<InitializeListing>,
        title: String,
        description: String,
        image_url: String,
        created_at: u64,
        category: String,
        room_count: u8,
        bathroom_count: u8,
        guest_count: u8,
        country_code: String,
        total_bookings: u64,
        is_active: bool,
        price: u64,
    ) -> Result<()> {
        _initialize_listing(
            ctx,
            title,
            description,
            image_url,
            created_at,
            category,
            room_count,
            bathroom_count,
            guest_count,
            country_code,
            total_bookings,
            is_active,
            price,
        )
    }
}
