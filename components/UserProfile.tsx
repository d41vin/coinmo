"use client";

import React, { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserData {
  name: string;
  username: string;
  wallet_address: string;
}

export default function UserProfile() {
  const { address } = useAppKitAccount();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!address) return;

      try {
        const response = await fetch(`/api/users?walletAddress=${address}`);
        const data = await response.json();
        if (data.exists !== false) {
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    fetchUserData();
  }, [address]);

  if (!userData) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 p-4 shadow-lg">
      <Avatar className="h-20 w-20 border-2 border-white">
        <AvatarImage src="/default-avatar.png" alt={userData.name} />
        <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 text-white">
        <h2 className="text-2xl font-bold">{userData.name}</h2>
        <p className="text-sm opacity-75">@{userData.username}</p>
        <p className="text-sm opacity-75">{userData.wallet_address}</p>
      </div>
    </div>
  );
}
