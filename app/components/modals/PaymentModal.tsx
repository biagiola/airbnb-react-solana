"use client";

import usePaymentModal from "@/app/hooks/usePaymentModal";
import Button from "../Button";
import Modal from "./Modal";
import { useState } from "react";
import { toast } from "react-hot-toast";

import Heading from "../Heading";
import { BiMoney } from "react-icons/bi";
import { MdDateRange } from "react-icons/md";
import { BsPeople } from "react-icons/bs";
import { CreateReservationResult } from "@/app/types/blockchain";

interface PaymentModalProps {
  totalPrice: number;
  startDate: Date;
  endDate: Date;
  guestCount: number;
  listingTitle: string;
  pricePerNight: number;
  totalNights: number;
  onPayment: () => Promise<void>; // Final payment processing
  reservationData: CreateReservationResult | null;
  reservationLoading: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  totalPrice,
  startDate,
  endDate,
  guestCount,
  listingTitle,
  pricePerNight,
  totalNights,
  onPayment,
  reservationData,
  reservationLoading,
}) => {
  const paymentModal = usePaymentModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const submitHandler = async () => {
    if (!reservationData) {
      setError("Reservation not ready. Please try again.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      console.log("💳 Processing payment for reservation:", reservationData.reservationPDA);
      await onPayment();
      toast.success("Payment successful! Reservation confirmed.");
      paymentModal.onClose();
      
      // 🔥 REMOVED: Reset logic moved to parent ListingClient
    } catch (err: any) {
      console.error("Payment failed:", err);
      setError(err.message || "Payment failed. Please try again.");
      toast.error("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const paymentBody = (
    <div className="p-5">
      <Heading title="Complete Payment" />
      
      {/* Listing Details */}
      <div className="border-b pb-5 mb-5">
        <h3 className="font-semibold text-lg mb-3">{listingTitle}</h3>
        
        <div className="space-y-3">
          {/* Dates */}
          <div className="flex items-center gap-3">
            <MdDateRange size={20} className="text-gray-500" />
            <div>
              <div className="text-sm text-gray-600">Check-in - Check-out</div>
              <div className="font-medium">
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Guests */}
          <div className="flex items-center gap-3">
            <BsPeople size={20} className="text-gray-500" />
            <div>
              <div className="text-sm text-gray-600">Guests</div>
              <div className="font-medium">{guestCount} guest{guestCount > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border-b pb-5 mb-5">
        <h4 className="font-semibold mb-3">Price Details</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>${pricePerNight} x {totalNights} night{totalNights > 1 ? 's' : ''}</span>
            <span>${totalPrice}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform fee (5%)</span>
            <span>${Math.round(totalPrice * 0.05)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${totalPrice + Math.round(totalPrice * 0.05)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-5">
        <h4 className="font-semibold mb-3">Payment Method</h4>
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
          <BiMoney size={24} className="text-green-600" />
          <div>
            <div className="font-medium">Blockchain Payment</div>
            <div className="text-sm text-gray-600">Pay with your connected wallet</div>
          </div>
        </div>
      </div>

      {/* Reservation Status */}
      {reservationLoading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-sm text-blue-600">Creating reservation on blockchain...</p>
        </div>
      )}

      {reservationData && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <p className="text-sm text-green-600">
            ✅ Reservation created! ID: {reservationData.reservationId}
          </p>
          <p className="text-xs text-green-500 mt-1">
            PDA: {reservationData.reservationPDA.slice(0, 8)}...{reservationData.reservationPDA.slice(-8)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Status: {reservationData.details.status} • Payment: {reservationData.details.paymentStatus}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Payment Description */}
      <div className="text-sm text-gray-600 mb-4">
        By confirming this payment, you agree to create a reservation and pay via blockchain escrow. 
        The payment will be held securely until check-in.
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={paymentModal.isOpen}
      label="Payment"
      body={paymentBody}
      buttonLabel={reservationLoading ? "Creating Reservation..." : `Confirm Payment ($${totalPrice + Math.round(totalPrice * 0.05)})`}
      onSubmit={submitHandler}
      close={paymentModal.onClose}
      buttonLoading={loading || reservationLoading}
    />
  );
};

export default PaymentModal;
