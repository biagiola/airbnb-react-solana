"use client";

import { toast } from "react-hot-toast";
import { differenceInCalendarDays, eachDayOfInterval } from "date-fns";
import { SafeListing, SafeResevations, SafeUser } from "@/app/types";
import ClientOnly from "@/app/components/ClientOnly";
import ListingBody from "@/app/components/listing/ListingBody";
import ListingHeader from "@/app/components/listing/ListingHeader";
import useGetCountries from "@/app/hooks/useGetCountries";
import usePaymentModal from "@/app/hooks/usePaymentModal";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { categories } from "@/app/components/navbar/categories/CategoriesContainer";
import PaymentModal from "@/app/components/modals/PaymentModal";
import createReservation from "@/app/actions/anchor/createReservation";

const initialRange = {
  startDate: new Date(),
  endDate: new Date(),
  key: "selection",
};

interface ListingClientProps {
  currentUser?: SafeUser | null;
  listing: SafeListing & {
    user: SafeUser;
  };
  reservations?: SafeResevations[];
}

const ListingClient: FC<ListingClientProps> = ({
  currentUser,
  listing,
  reservations = [],
}) => {
  const { getCountry } = useGetCountries();
  const paymentModal = usePaymentModal();
  const location = getCountry(listing.locationValue);
  const category = useMemo(() => {
    return categories.find((item) => item.label === listing.category);
  }, [listing.category]);

  const [localReservations, setLocalReservations] = useState(reservations);
  const [loading, setLoading] = useState(false);

  const disabledDates = useMemo(() => {
    let dates: Date[] = [];
    localReservations.forEach((reservation: any) => {
      const range = eachDayOfInterval({
        start: new Date(reservation.startDate),
        end: new Date(reservation.endDate),
      });
      dates = [...dates, ...range];
    });
    return dates;
  }, [localReservations]);

  const [totalPrice, setTotalPrice] = useState(listing.price);
  const [dateRange, setDateRange] = useState(initialRange);

  // Check if wallet is connected (you might want to get this from a different source)
  const isWalletConnected = () => {
    return window.solana?.isConnected || false;
  };

  const onReservation = useCallback(() => {
    // Check if wallet is connected - if not, prompt user to connect
    if (!isWalletConnected()) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Open the payment modal instead of making API call
    paymentModal.onOpen();
  }, [paymentModal]);

  // Blockchain reservation creation handler
  const handleBlockchainPayment = useCallback(async () => {
    try {
      const result = await createReservation({
        listingId: listing.id,
        userId: "wallet-user", // We'll use wallet address
        authorId: "blockchain-auth"
      });

      console.log("Blockchain reservation created:", result);
      return result; // Return the reservation data to PaymentModal
    } catch (error) {
      console.error("Blockchain reservation failed:", error);
      throw error;
    }
  }, [listing.id]);

  // Final payment handler (escrow payment)
  const handleFinalPayment = useCallback(async (): Promise<void> => {
    try {
      console.log("💳 Processing final payment escrow...");
      // TODO: Implement payment escrow logic here
      // This will call initialize_payment_escrow on the blockchain
      
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("✅ Payment escrow completed");
    } catch (error) {
      console.error("Final payment failed:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      const totalDays = differenceInCalendarDays(
        dateRange.endDate,
        dateRange.startDate
      );
      if (totalDays && listing.price) {
        setTotalPrice(totalDays * listing.price);
      } else {
        setTotalPrice(listing.price);
      }
    }
  }, [dateRange, listing.price]);

  return (
    <ClientOnly>
      <ListingHeader listing={listing} location={location} />
      <div className="phone:px-10 py-10 max-w-6xl mx-auto">
        <ListingBody
          totalPrice={totalPrice}
          onDateChange={(value) => setDateRange(value)}
          dateRange={dateRange}
          onSubmit={onReservation}
          currentUser={currentUser}
          user={listing.user}
          listing={listing}
          category={category}
          disabledDates={disabledDates}
          loading={loading}
        />
      </div>
      
      <PaymentModal
        totalPrice={totalPrice}
        startDate={dateRange.startDate || new Date()}
        endDate={dateRange.endDate || new Date()}
        guestCount={listing.guestCount}
        listingTitle={listing.title}
        pricePerNight={listing.price}
        totalNights={differenceInCalendarDays(dateRange.endDate || new Date(), dateRange.startDate || new Date()) || 1}
        onCreateReservation={handleBlockchainPayment}
        onPayment={handleFinalPayment}
      />
    </ClientOnly>
  );
};

export default ListingClient;
