use anchor_lang::prelude::*;

use crate::states::*;

#[inline(never)]
pub fn _initialize_listing(
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
    let listing = &mut ctx.accounts.listing;

    listing.host = ctx.accounts.host.key();
    listing.title = title;
    listing.description = description;
    listing.image_url = image_url;
    listing.created_at = created_at;
    listing.category = category;
    listing.room_count = room_count;
    listing.bathroom_count = bathroom_count;
    listing.guest_count = guest_count;
    listing.country_code = country_code;
    listing.total_bookings = total_bookings;
    listing.is_active = is_active;
    listing.price = price;
    
    // Increment the counter to have unique PDA for listings for a host made
    ctx.accounts.host.listing_count += 1;
    let clg_counter = &ctx.accounts.host.listing_count;
    msg!("title: {}", listing.title);
    msg!("counter: {}", clg_counter);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeListing<'info> {
    #[account(mut)]
    listing_authority: Signer<'info>,

    #[account(
        mut,
        constraint = host.host_author == listing_authority.key()
    )]
    pub host: Account<'info, Host>,

    #[account(
        init,
        payer = listing_authority,
        space = 8 + Listing::INIT_SPACE,
        seeds = [
            LISTING_SEED.as_bytes(),
            listing_authority.key().as_ref(),
            &host.listing_count.to_le_bytes(),
        ],
        bump,
    )]
    pub listing: Account<'info, Listing>,

    pub system_program: Program<'info, System>,
}