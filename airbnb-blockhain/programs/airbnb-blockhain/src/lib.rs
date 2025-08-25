use anchor_lang::prelude::*;
use crate::instructions::*;

pub mod instructions;
pub mod states;

declare_id!("9fD3JVVmbzGC66pTYb5xZCXc24ibEYcM8vMrWoQjMfW5");

#[program]
pub mod airbnb_blockhain {
    use super::*;

    pub fn initialize(
        ctx: Context<InitializeHost>,
        name: String,
        email: String,
        image: String,
        hashed_password: String,
        created_at: u64,
    ) -> Result<()> {
        initialize_host(
            ctx,
            name,
            email,
            image,
            hashed_password,
            created_at,
        )
    }
}
