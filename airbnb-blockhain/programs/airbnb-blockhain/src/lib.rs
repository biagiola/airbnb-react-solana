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

    pub fn initialize_guest(
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
        _initialize_guest(
            ctx,
            name,
            email,
            image_url,
            hashed_password,
            created_at,
            phone_number,
            date_of_birth,
            preferred_language,
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
        location_value: String,
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
            location_value,
            total_bookings,
            is_active,
            price,
        )
    }

    pub fn initialize_reservation(
        ctx: Context<InitializeReservation>,
        reservation_id: u64,
        listing: Pubkey,
        host: Pubkey,
        start_date: u64,
        end_date: u64,
        guest_count: u8,
        total_nights: u16,
        price_per_night: u64,
        total_price: u64,
        status: states::ReservationStatus,
        created_at: u64,
        payment_status: states::PaymentStatus,
    ) -> Result<()> {
        _initialize_reservation(
            ctx,
            reservation_id,
            listing,
            host,
            start_date,
            end_date,
            guest_count,
            total_nights,
            price_per_night,
            total_price,
            status,
            created_at,
            payment_status,
        )
    }

    pub fn initialize_payment_escrow(
        ctx: Context<InitializePaymentEscrow>,
        escrow_id: u64,
        amount: u64,
        release_date: u64,
    ) -> Result<()> {
        _initialize_payment_escrow(ctx, escrow_id, amount, release_date)
    }

    pub fn release_payment_escrow(
        ctx: Context<ReleasePaymentEscrow>,
    ) -> Result<()> {
        _release_payment_escrow(ctx)
    }

    pub fn initialize_token(ctx: Context<InitializeTokenContext>, fee_bps: u16, max_fee: u64) -> Result<()> {
        _initialize_token(ctx, fee_bps, max_fee)
    }
    pub fn mint_token(ctx: Context<MintTokenContext>, amount: u64) -> Result<()> {
        _mint_token(ctx, amount)
    }
    pub fn withdraw_token(ctx: Context<WithdrawTokenContext>) -> Result<()> {
        _withdraw_token(ctx)
    }

}
