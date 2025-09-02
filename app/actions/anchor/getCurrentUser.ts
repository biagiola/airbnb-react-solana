// TODO: take a look about sessions
import { Connection, PublicKey } from "@solana/web3.js";
import { guestPDA, RPC, parseGuestAccount } from "./constants";

export default async function getCurrentUser() {
  const connection = new Connection(RPC, "confirmed"); 

  // guest info
  try {
    console.log("Guest pubkey: ", guestPDA);
    const guestPk = new PublicKey(guestPDA);
    
    const guestAccount = await connection.getAccountInfo(guestPk, "confirmed");
    
    if (guestAccount) {
      console.log("guestAccount", guestAccount);

      // Parse the complete guest data
      const guestData = parseGuestAccount(guestAccount.data);
      
      console.log("Parsed Guest Data:", guestData);
      console.log("Guest Name:", guestData.name);
      console.log("Guest Email:", guestData.email);
    } else {
      console.log("Guest account not found");
    }
  } catch (error) {
    console.log("guest info: ", error);
  }
}