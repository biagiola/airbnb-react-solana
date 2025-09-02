import { Connection, PublicKey } from "@solana/web3.js";
import {
	getAllListingPDAs,
	parseListingAccount,
	guestPDA,
} from "@/app/actions/anchor/constants";

export interface Iparams {
  userId: string;
  guestCount: number;
  roomCount: number;
  bathroomCount: number;
  startDate: string;
  endDate: string;
  country: string;
  city: string;
  category: string;
}

export default async function getListings_(searchParams: any) {
	console.log("searchParams: ", searchParams);
	try {
		const connection = new Connection("http://127.0.0.1:8899", "confirmed"); 
		
		// Get all listing PDAs from constants
		const allListingPDAs = getAllListingPDAs();
		
		if (allListingPDAs.length === 0) {
			console.log("No listing PDAs found in constants");
			return [];
		}

		// Fetch all listings in parallel
		const listingPromises = allListingPDAs.map(async (pdaAddress, index) => {
			try {
				console.log(`Fetching listing ${index + 1}: ${pdaAddress}`);
				const listingPk = new PublicKey(pdaAddress);
				const listingAccount = await connection.getAccountInfo(listingPk, "confirmed");
				
				if (listingAccount) {
					// Parse the complete listing data
					const listingData = parseListingAccount(listingAccount.data);
					
					// Data manipulation - transform to desired format
					const transformedData = {
						id: listingPk,
						title: listingData.title,
						description: listingData.description,
						imageSrc: listingData.image_url,
						createdAt: new Date(listingData.created_at).toISOString(),
						category: listingData.category,
						roomCount: listingData.room_count,
						bathroomCount: listingData.bathroom_count,
						guestCount: listingData.guest_count,
						locationValue: listingData.location_value,
						userId: guestPDA,
						price: listingData.price
					};
					
					console.log(`✅ Successfully parsed listing ${index + 1}: ${transformedData.title}`);
					return transformedData;
				} else {
					console.log(`❌ Listing account not found for PDA: ${pdaAddress}`);
					return null;
				}
			} catch (error) {
				console.log(`❌ Error fetching listing ${index + 1} (${pdaAddress}):`, error);
				return null;
			}
		});

		// Wait for all listings to be fetched and filter out nulls
		const allListings = await Promise.all(listingPromises);
		const validListings = allListings.filter(listing => listing !== null);
		
		console.log(`✅ Successfully fetched ${validListings.length} out of ${allListingPDAs.length} listings`);
		
		return validListings;
	} catch (error) {
		console.log("listing error: ", error);
		return [];
	}
}
