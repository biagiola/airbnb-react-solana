use anchor_lang::prelude::*;

use crate::states::*;

#[inline(never)]
pub fn _initialize_reservation(
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
    status: ReservationStatus,
    created_at: u64,
    payment_status: PaymentStatus,
) -> Result<()> {
    let reservation = &mut ctx.accounts.reservation;

    reservation.guest = ctx.accounts.reservation_authority.key();
    reservation.listing = listing;
    reservation.host = host;
    reservation.start_date = start_date;
    reservation.end_date = end_date;
    reservation.guest_count = guest_count;
    reservation.total_nights = total_nights;
    reservation.price_per_night = price_per_night;
    reservation.total_price = total_price;
    reservation.status = status;
    reservation.created_at = created_at;
    reservation.payment_status = payment_status;
    reservation.bump = ctx.bumps.reservation;

    Ok(())
}

#[derive(Accounts)]
#[instruction(reservation_id: u64)]
pub struct InitializeReservation<'info> {
    #[account(mut)]
    pub reservation_authority: Signer<'info>,
    #[account(
        init,
        payer = reservation_authority,
        space = 8 + Reservation::INIT_SPACE,
        seeds = [
            RESERVATION_SEED.as_bytes(),
            reservation_authority.key().as_ref(),
            &reservation_id.to_le_bytes(),
        ],
        bump,
    )]
    pub reservation: Account<'info, Reservation>,
    pub system_program: Program<'info, System>,
}