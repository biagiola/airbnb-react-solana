import { PublicKey } from "@solana/web3.js";

export const guestPDA = "2hjLVM3n2TNfyEtnDQk2CWFzcgMAhL1jNygndDhidY3p";
export const mintPubkey = "AYMgLNy7BJGgyN414ZoFW3tMDzvYnxVHrAKA5fBZd8Q8";
export const listingPDA = "77KpNqzWCMMxAQCEjwDfNYg2y7ix79sGpwr1of5rxFNg";
export const listingPDA_1 = "77KpNqzWCMMxAQCEjwDfNYg2y7ix79sGpwr1of5rxFNg";
export const listingPDA_2 = "2UxjAYuMh1sJbGaV8VVNac63NyzY7ZDWBNBjCKVVC4v7";
export const listingPDA_3 = "AbvfAgSSZTmfgR49g2Xq1frTVEk1vhNDnGkgmtL4e54D";
export const listingPDA_4 = "5mE2sDbuXeGUMC3uYAZqvAK9KiTs39E8TNdVS2uWtPjD";
export const listingPDA_5 = "AHfYTbuuVuaZ2reWmGZ8T4W3ocMQsWDXcfLoBwr3KhfN";
export const listingPDA_6 = "9Dp3y7TdVMQH5yse8GwZ6ZxTagMWXT5LVLFuS2wsMqCr";

export const RPC = "http://127.0.0.1:8899" // TODO: use env

// Helper function to get all listing PDAs dynamically
export const getAllListingPDAs = (): string[] => {
  const listingPDAs: string[] = [];
  
  // Get all exported listing PDAs dynamically
  const constantsModule = require('./constants');
  Object.keys(constantsModule).forEach(key => {
    if (key.startsWith('listingPDA_')) {
      const value = constantsModule[key];
      if (value && value !== "") {
        listingPDAs.push(value);
      }
    }
  });
  
  return listingPDAs;
};

// Helper functions to parse account data from Solana
export const parseString = (data: Buffer, offset: number): { value: string, nextOffset: number } => {
  const length = data.readUInt32LE(offset);
  const value = data.slice(offset + 4, offset + 4 + length).toString('utf8');
  return { value, nextOffset: offset + 4 + length };
};

export const parseGuestAccount = (accountData: Buffer) => {
  // Skip first 8 bytes (discriminator)
  const data = accountData.slice(8);
  let offset = 0;

  // Parse guest_author (32 bytes)
  const guest_author = new PublicKey(data.slice(offset, offset + 32)).toString();
  offset += 32;

  // Parse name (4 bytes length + string data)
  const nameResult = parseString(data, offset);
  const name = nameResult.value;
  offset = nameResult.nextOffset;

  // Parse email (4 bytes length + string data)
  const emailResult = parseString(data, offset);
  const email = emailResult.value;
  offset = emailResult.nextOffset;

  // Parse image_url (4 bytes length + string data)
  const imageResult = parseString(data, offset);
  const image_url = imageResult.value;
  offset = imageResult.nextOffset;

  // Parse hashed_password (4 bytes length + string data)
  const passwordResult = parseString(data, offset);
  const hashed_password = passwordResult.value;
  offset = passwordResult.nextOffset;

  // Parse created_at (8 bytes)
  const created_at = data.readBigUInt64LE(offset);
  offset += 8;

  // Parse phone_number (4 bytes length + string data)
  const phoneResult = parseString(data, offset);
  const phone_number = phoneResult.value;
  offset = phoneResult.nextOffset;

  // Parse date_of_birth (8 bytes)
  const date_of_birth = data.readBigUInt64LE(offset);
  offset += 8;

  // Parse preferred_language (4 bytes length + string data)
  const languageResult = parseString(data, offset);
  const preferred_language = languageResult.value;
  offset = languageResult.nextOffset;

  // Parse bump (1 byte)
  const bump = data.readUInt8(offset);

  return {
    guest_author,
    name,
    email,
    image_url,
    hashed_password,
    created_at: Number(created_at),
    phone_number,
    date_of_birth: Number(date_of_birth),
    preferred_language,
    bump
  };
};

export const parseListingAccount = (accountData: Buffer) => {
	// Skip first 8 bytes (discriminator)
	const data = accountData.slice(8);
	let offset = 0;

	// Parse host (32 bytes)
	const host = new PublicKey(data.slice(offset, offset + 32)).toString();
	offset += 32;

	// Parse title (4 bytes length + string data)
	const titleResult = parseString(data, offset);
	const title = titleResult.value;
	offset = titleResult.nextOffset;

	// Parse description (4 bytes length + string data)
	const descriptionResult = parseString(data, offset);
	const description = descriptionResult.value;
	offset = descriptionResult.nextOffset;

	// Parse image_url (4 bytes length + string data)
	const imageResult = parseString(data, offset);
	const image_url = imageResult.value;
	offset = imageResult.nextOffset;

	// Parse created_at (8 bytes)
	const created_at = data.readBigUInt64LE(offset);
	offset += 8;

	// Parse category (4 bytes length + string data)
	const categoryResult = parseString(data, offset);
	const category = categoryResult.value;
	offset = categoryResult.nextOffset;

	// Parse room_count (1 byte)
	const room_count = data.readUInt8(offset);
	offset += 1;

	// Parse bathroom_count (1 byte)
	const bathroom_count = data.readUInt8(offset);
	offset += 1;

	// Parse guest_count (1 byte)
	const guest_count = data.readUInt8(offset);
	offset += 1;

	// Parse location_value (4 bytes length + string data)
	const locationResult = parseString(data, offset);
	const location_value = locationResult.value;
	offset = locationResult.nextOffset;

	// Parse total_bookings (8 bytes)
	const total_bookings = data.readBigUInt64LE(offset);
	offset += 8;

	// Parse is_active (1 byte)
	const is_active = data.readUInt8(offset) === 1;
	offset += 1;

	// Parse price (8 bytes)
	const price = data.readBigUInt64LE(offset);

	return {
		host,
		title,
		description,
		image_url,
		created_at: Number(created_at),
		category,
		room_count,
		bathroom_count,
		guest_count,
		location_value,
		total_bookings: Number(total_bookings),
		is_active,
		price: Number(price)
	};
};