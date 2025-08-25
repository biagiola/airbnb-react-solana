use anchor_lang::prelude::*;

use crate::states::*;

#[inline(never)]
pub fn initialize_host(
    ctx: Context<InitializeHost>,
    name: String,
    email: String,
    image: String,
    hashed_password: String,
    created_at: u64,
) -> Result<()> {
    // Initialize user
    let host = &mut ctx.accounts.host;
    
    host.host_author = ctx.accounts.host_authority.key();
    host.name = name;
    host.email = email;
    host.image = image;
    host.hashed_password = hashed_password;
    host.created_at = created_at;
    host.bump = ctx.bumps.host;

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeHost<'info> {
    #[account(mut)]
    pub host_authority: Signer<'info>,
    #[account(
        init,
        payer = host_authority,
        space = 8 + Host::INIT_SPACE,
        seeds = [HOST_SEED.as_bytes(), host_authority.key().as_ref()],
        bump,
    )]
    pub host: Account<'info, Host>,
    pub system_program: Program<'info, System>
}