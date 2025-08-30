use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::Token2022,
    token_interface::{Mint, TokenAccount},
};

use crate::instructions::token::transfer_to_platform_treasury;
use crate::states::*;

#[inline(never)]
pub fn _initialize_payment_escrow(
    ctx: Context<InitializePaymentEscrow>,
    _escrow_id: u64, // Used in PDA generation via #[instruction]
    amount: u64,
    release_date: u64,
) -> Result<()> {
    // TODO: add explicit balance checks
    let payment_escrow = &mut ctx.accounts.payment_escrow;
    let reservation = &ctx.accounts.reservation;

    // Fixed 5% platform fee (500 basis points)
    let platform_fee = (amount * 500) / 10000; // 5% fee

    // Initialize escrow account
    payment_escrow.reservation = reservation.key();
    payment_escrow.guest = ctx.accounts.guest_authority.key();
    payment_escrow.host = reservation.host;
    payment_escrow.amount = amount;
    payment_escrow.platform_fee = platform_fee;
    payment_escrow.status = EscrowStatus::Funded;
    payment_escrow.created_at = Clock::get()?.unix_timestamp as u64;
    payment_escrow.release_date = release_date;
    payment_escrow.bump = ctx.bumps.payment_escrow;

    // Transfer tokens from guest to platform treasury (immediate fee separation)
    transfer_to_platform_treasury(
        &ctx.accounts.token_program,
        &ctx.accounts.guest_token_account,
        &ctx.accounts.platform_treasury,
        &ctx.accounts.guest_authority,
        &ctx.accounts.mint,
        amount,
    )?;

    msg!("Payment escrow initialized:");
    msg!("Amount: {}", amount);
    msg!("Platform fee: {} (5%)", platform_fee);
    msg!("Host amount: {}", amount - platform_fee);
    msg!("Release date: {}", release_date);
    msg!("Tokens transferred to platform treasury");

    Ok(())
}

#[derive(Accounts)]
#[instruction(escrow_id: u64)] // Unique ID for this escrow
pub struct InitializePaymentEscrow<'info> {
    #[account(mut)]
    pub guest_authority: Signer<'info>,
    
    /// The reservation this escrow is for
    #[account(
        constraint = reservation.guest == guest_authority.key() @ InitializePaymentEscrowError::UnauthorizedGuest
    )]
    pub reservation: Account<'info, Reservation>,
    
    /// The escrow account to be created
    #[account(
        init,
        payer = guest_authority,
        space = 8 + PaymentEscrow::INIT_SPACE,
        seeds = [
            PAYMENT_ESCROW_SEED.as_bytes(),
            reservation.key().as_ref(),
            &escrow_id.to_le_bytes(),
        ],
        bump,
    )]
    pub payment_escrow: Account<'info, PaymentEscrow>,
    
    /// The payment token mint
    /// TODO: add the correct constraint
    // #[account(
    //     constraint = mint.key() == platform_treasury.mint @ InitializePaymentEscrowError::InvalidMint
    // )]
    pub mint: InterfaceAccount<'info, Mint>,
    
    /// Guest's token account (source of payment)
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = guest_authority,
        associated_token::token_program = token_program
    )]
    pub guest_token_account: InterfaceAccount<'info, TokenAccount>,
    
    /// Platform treasury account (receives all payments)
    #[account(
        mut,
        constraint = platform_treasury.mint == mint.key() @ InitializePaymentEscrowError::InvalidTreasuryMint
    )]
    pub platform_treasury: InterfaceAccount<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum InitializePaymentEscrowError {
    #[msg("Only the guest can create escrow for their reservation")]
    UnauthorizedGuest,
    #[msg("Invalid mint provided")]
    InvalidMint,
    #[msg("Platform treasury mint does not match payment mint")]
    InvalidTreasuryMint,
}