use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{transfer_checked, TransferChecked, Token2022},
    token_interface::{Mint, TokenAccount},
};

/// Transfer tokens from guest to platform treasury
/// Uses Token 2022 transfer_checked for enhanced security by validating mint and decimals
pub fn transfer_to_platform_treasury<'info>(
    token_program: &Program<'info, Token2022>,
    guest_token_account: &InterfaceAccount<'info, TokenAccount>,
    platform_treasury: &InterfaceAccount<'info, TokenAccount>,
    guest_authority: &Signer<'info>,
    mint: &InterfaceAccount<'info, Mint>,
    amount: u64,
) -> Result<()> {
    transfer_checked(
        CpiContext::new(
            token_program.to_account_info(),
            TransferChecked {
                from: guest_token_account.to_account_info(),
                to: platform_treasury.to_account_info(),
                authority: guest_authority.to_account_info(),
                mint: mint.to_account_info(),
            },
        ),
        amount,
        9, // Standard token decimals for this project
    )?;

    msg!("Transferred {} tokens to platform treasury", amount);
    Ok(())
}
