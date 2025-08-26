use anchor_lang::prelude::*;

use crate::states::*;

#[inline(never)]
pub fn _initialize_guest(
    ctx: Context<InitializeGuest>,
    name: String,
    email: String,
    image_url: String,
    hashed_password: String,
    created_at: u64,
    phone_number: String,
    date_of_birth: u64,
    preferred_language: String,
) -> Result<()> {
    let guest = &mut ctx.accounts.guest;

    guest.guest_author = ctx.accounts.guest_authority.key();
    guest.name = name;
    guest.email = email;
    guest.image_url = image_url;
    guest.hashed_password = hashed_password;
    guest.created_at = created_at;
    guest.phone_number = phone_number;
    guest.date_of_birth = date_of_birth;
    guest.preferred_language = preferred_language;
    guest.bump = ctx.bumps.guest;

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeGuest<'info> {
    #[account(mut)]
    pub guest_authority: Signer<'info>,
    #[account(
        init,
        payer = guest_authority,
        space = 8 + Guest::INIT_SPACE,
        seeds = [GUEST_SEED.as_bytes(), guest_authority.key().as_ref()],
        bump,
    )]
    pub guest: Account<'info, Guest>,
    pub system_program: Program<'info, System>,
}