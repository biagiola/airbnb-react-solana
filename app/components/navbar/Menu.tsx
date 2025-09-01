"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

// Type declaration for Solana wallet
declare global {
  interface Window {
    solana?: any;
  }
}

// Helper function to parse strings from account data
const parseString = (data: Buffer, offset: number): string => {
  const length = data.readUInt32LE(offset);
  return data.slice(offset + 4, offset + 4 + length).toString('utf8');
};
import Avatar from "../Avatar";
import MenuItems from "./MenuItems";
import { LuGlobe } from "react-icons/lu";
import { MdMenu } from "react-icons/md";
import useRegisterModal from "@/app/hooks/useRegisterModal";
import useLoginModal from "@/app/hooks/useLoginModal";
import { signOut } from "next-auth/react";
import { SafeUser } from "@/app/types";
import useRentModal from "@/app/hooks/useRentModal";
import { useRouter } from "next/navigation";


interface MenuProps {
  currentUser?: SafeUser | null;
}

const Menu: React.FC<MenuProps> = ({ currentUser }) => {
  const router = useRouter();
  const registerModal = useRegisterModal();
  const loginModal = useLoginModal();
  const rentModal = useRentModal();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const toggleRent = useCallback(() => {
    if (!currentUser) {
      return registerModal.onOpen();
    }

    rentModal.onOpen();
    toggleOpen();
  }, [currentUser, registerModal, rentModal, toggleOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Helper functions to parse Guest account data from Solana
  const parseString = (data: Buffer, offset: number): { value: string, nextOffset: number } => {
    const length = data.readUInt32LE(offset);
    const value = data.slice(offset + 4, offset + 4 + length).toString('utf8');
    return { value, nextOffset: offset + 4 + length };
  };

  const parseGuestAccount = (accountData: Buffer) => {
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
  
  const handleConnect = async () => {
    // const connection = new Connection("https://alien-intensive-yard.solana-devnet.quiknode.pro/08ee72b127a316bc7a005568c31191070e8e8612/", "confirmed");  
    const connection = new Connection("http://127.0.0.1:8899", "confirmed"); 
    const provider = window.solana;
    
    console.log("handleConnect isPhatom", provider.isPhantom);
  
    if (provider && provider.isPhantom) {
      await window.solana.connect();
      const owner: string = await window.solana.publicKey.toString();
      const ownerPk = new PublicKey(owner);

      console.log('handleConnect owner: ', owner);
    } else {
      console.log('provider does not exists');
    }

    // mint info
    try {
      console.log("mint pubkey: ", "DsiktmcwWF2TmZ3qpKRJwkTu9jbMYR4jVUaU6ZTpYrew");
      const mint = await getMint(
        connection,
        // new PublicKey("Fyde2stAzdWQoyTMWnD2iqi4vkKEJ8Z1GcvQ6CaYHRa9"),
        new PublicKey("DsiktmcwWF2TmZ3qpKRJwkTu9jbMYR4jVUaU6ZTpYrew"),
        "confirmed",
        TOKEN_2022_PROGRAM_ID
      );
      console.log(mint);  
    } catch (error) {
      console.log("mint error: ", error);
    }

    // guest info
    try {
      console.log("Guest pubkey: ", "2EW9LW3dZTkpErcubLEQHuK2FqU6wB1Z9TnM3g6hYXeP");
      const guestPubkey = new PublicKey("2EW9LW3dZTkpErcubLEQHuK2FqU6wB1Z9TnM3g6hYXeP");
      
      const guestAccount = await connection.getAccountInfo(guestPubkey, "confirmed");
      
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

    setIsOpen(false);
  }

  return (
    <div
      ref={menuRef}
      className="w-full hidden phone:flex items-center justify-end text-sm gap-2 relative"
    >
      <div
        onClick={rentModal.onOpen}
        className="font-bold whitespace-nowrap text-dark-gray p-3 hover:bg-hover-gray rounded-full cursor-pointer"
      >
        Airbnb your home
      </div>

      <span className="p-3 rounded-full hover:bg-hover-gray">
        <LuGlobe size={16} />
      </span>

      <div
        onClick={toggleOpen}
        className="flex items-center gap-2 px-2 py-1 rounded-full border border-border-gray shadow-sm hover:shadow-md cursor-pointer"
      >
        <MdMenu size={20} />
        <Avatar src={currentUser?.image} />
      </div>

      {isOpen && (
        <div className="absolute right-0 top-14 rounded-md card-shadow bg-white flex flex-col py-2 z-50">
          {currentUser ? (
            <>
              <MenuItems
                onClick={() => {
                  router.push("/listings");
                  setIsOpen(false);
                }}
                label="My properties"
                bold
              />
              <MenuItems
                onClick={() => {
                  router.push("/reservations");
                  setIsOpen(false);
                }}
                label="My Reservations"
                bold
              />
              <MenuItems
                onClick={() => {
                  router.push("/wishlist");
                  setIsOpen(false);
                }}
                label="Wishlist"
                border={true}
                bold
              />
              <MenuItems onClick={toggleRent} label="Airbnb your home" />
              <MenuItems onClick={() => {}} label="Account" border />
              <MenuItems onClick={() => {}} label="Help" />
              <MenuItems onClick={() => signOut()} label="Logout" />
            </>
          ) : (
            <>
              <MenuItems
                onClick={() => {
                  setIsOpen(false);
                  registerModal.onOpen();
                }}
                label="Sign up"
                bold
              />
              <MenuItems
                // onClick={() => {
                //   setIsOpen(false);
                //   loginModal.onOpen();
                // }}
                onClick={handleConnect}
                label="Log in"
                border
                bold
              />
              <MenuItems onClick={toggleRent} label="Airbnb your home" />
              <MenuItems onClick={() => {}} label="Help" />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Menu;
