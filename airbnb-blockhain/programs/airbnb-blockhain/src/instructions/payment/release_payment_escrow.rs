use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{transfer_checked, TransferChecked, Token2022},
    token_interface::{Mint, TokenAccount},
};

use crate::states::*;

#[inline(never)]
pub fn _release_payment_escrow(
    ctx: Context<ReleasePaymentEscrow>,
) -> Result<()> {
    let release_payment_escrow = &mut ctx.accounts.release_payment_escrow;
    
    // Verify release conditions
    require!(
        release_payment_escrow.status == EscrowStatus::Funded,
        ReleasePaymentEscrowError::EscrowNotFunded
    );
    
    // Check if release date has passed (optional - could be manual release too)
    let current_time = Clock::get()?.unix_timestamp as u64;
    require!(
        current_time >= release_payment_escrow.release_date,
        ReleasePaymentEscrowError::ReleaseNotYetAllowed
    );
    
    let host_net_amount = release_payment_escrow.amount - release_payment_escrow.platform_fee;
    
    // Account for Token2022 transfer fee (5% = 500 basis points)
    // To ensure host receives the intended amount, we need to gross up the transfer
    // If transfer fee is 5%, and we want host to receive X, we need to send X / (1 - 0.05) = X / 0.95
    let transfer_amount = (host_net_amount * 10000) / 9500; // Gross up by ~5.26% to offset 5% fee
    
    // Transfer host payment from platform treasury to host
    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.platform_treasury.to_account_info(),
                to: ctx.accounts.host_token_account.to_account_info(),
                authority: ctx.accounts.platform_authority.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
            },
        ),
        transfer_amount,
        9, // Token decimals
    )?;
    
    // Update escrow status
    release_payment_escrow.status = EscrowStatus::Released;
    
    msg!("Payment escrow released:");
    msg!("Host net amount (after platform fee): {}", host_net_amount);
    msg!("Transfer amount (grossed up for fees): {}", transfer_amount);
    msg!("Platform fee retained: {}", release_payment_escrow.platform_fee);
    msg!("Host: {}", release_payment_escrow.host);
    
    Ok(())
}

#[derive(Accounts)]
pub struct ReleasePaymentEscrow<'info> {
    /// Platform authority (can release payments)
    #[account(mut)]
    pub platform_authority: Signer<'info>,
    
    /// The escrow account to release
    #[account(
        mut,
        constraint = release_payment_escrow.status == EscrowStatus::Funded @ ReleasePaymentEscrowError::EscrowNotFunded
    )]
    pub release_payment_escrow: Account<'info, PaymentEscrow>,
    
    /// The payment token mint
    pub mint: InterfaceAccount<'info, Mint>,
    
    /// Platform treasury account (source of payment)
    #[account(
        mut,
        constraint = platform_treasury.mint == mint.key() @ ReleasePaymentEscrowError::InvalidTreasuryMint
    )]
    pub platform_treasury: InterfaceAccount<'info, TokenAccount>,
    
    /// Host's token account (destination of payment)
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = release_payment_escrow.host,
        associated_token::token_program = token_program
    )]
    pub host_token_account: InterfaceAccount<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ReleasePaymentEscrowError {
    #[msg("Escrow is not in funded status")]
    EscrowNotFunded,
    #[msg("Release date has not been reached yet")]
    ReleaseNotYetAllowed,
    #[msg("Platform treasury mint does not match payment mint")]
    InvalidTreasuryMint,
}
