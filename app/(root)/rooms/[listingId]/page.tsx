import React from "react"
// import getCurrentListing from "@/app/actions/getCurrentListing"
// import getReservation from "@/app/actions/getReservations"
// import getCurrentUser from "@/app/actions/getCurrentUser"

import getCurrentListing from "@/app/actions/anchor/getCurrentListing"
import createReservation from "@/app/actions/anchor/createReservation"
import getCurrentUser from "@/app/actions/anchor/getCurrentUser"

import ListingClient from "./ListingClient"
import ClientOnly from "@/app/components/ClientOnly"

interface IParams {
  listingId?: string
}

const page = async ({ params } : { params: IParams}) => {
  // const listing = await getCurrentListing(params);
  // const reservations = await getReservation(params);
  // const currentUser = await getCurrentUser();

  const listing = await getCurrentListing(params);
  const reservations = await createReservation(params);
  const currentUser = await getCurrentUser();

  if (listing == null) return null;

  return (
    <ClientOnly>
      <ListingClient
        currentUser={currentUser ?? null}
        listing={listing ?? undefined}
        reservations={Array.isArray(reservations) ? reservations : []}
      />
    </ClientOnly>
  )
}

export default page
