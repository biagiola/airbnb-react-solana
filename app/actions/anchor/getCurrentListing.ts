import { Connection, PublicKey } from "@solana/web3.js";
import { listingPDA_1, parseListingAccount } from "@/app/actions/anchor/constants";

interface IParams {
  listingId?: string
}

export default async function currentListing(params: IParams) {
  try {
    const connection = new Connection("http://127.0.0.1:8899", "confirmed"); 
    const { listingId } = params;

    // For now, use listingPDA_1 as default, but this should use listingId when we implement PDA routing
    const pdaToUse = listingId || listingPDA_1;
    const listingPk = new PublicKey(pdaToUse);
    
    const listingAccount = await connection.getAccountInfo(listingPk, "confirmed");
    if (!listingAccount) return null;

    // Parse the blockchain listing data
    const listingData = parseListingAccount(listingAccount.data);
    console.log("listingAccount: ", listingAccount);
    
    // Return data in the format expected by the frontend
    return {
      id: pdaToUse,
      title: listingData.title,
      description: listingData.description,
      imageSrc: listingData.image_url,
      createdAt: new Date(listingData.created_at).toISOString(),
      category: listingData.category,
      roomCount: listingData.room_count,
      bathroomCount: listingData.bathroom_count,
      guestCount: listingData.guest_count,
      locationValue: listingData.location_value,
      userId: listingData.host,
      price: listingData.price,
      user: {
        id: listingData.host,
        name: "Blockchain Host", // TODO: Get from guest account
        email: null,
        image: null,
        createdAt: new Date(listingData.created_at).toISOString(),
        updatedAt: new Date(listingData.created_at).toISOString(),
        emailVerified: null,
        hashedPassword: null,
        favoriteIds: [],
      },
    };
  } catch (error: any) {
    console.error("Error fetching blockchain listing:", error);
    throw new Error(error);
  }
}
