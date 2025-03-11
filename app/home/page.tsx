"use client";

import React, { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { Button } from "@/components/ui/button";
import ActionButtons from "@/components/ActionButtons";
import PayOrRequest from "@/components/PayOrRequest";
import SearchBar from "@/components/SearchBar";

export default function HomePage() {
  const { address, isConnected } = useAppKitAccount();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUserAccess() {
      if (!address || !isConnected) {
        router.push('/');
        return;
      }

      try {
        const response = await fetch(`/api/users?walletAddress=${address}`);
        const data = await response.json();

        if (data.exists === false) {
          router.push('/onboarding');
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking user access:', error);
        router.push('/');
      }
    }

    checkUserAccess();
  }, [address, isConnected, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-screen-sm space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bndanimal text-2xl">Coinmo</h1>
        <SearchBar />
      </div>

      <UserProfile />
      
      <div className="space-y-4">
        <Button variant="secondary">Receive</Button>
        <Button variant="default">Send/Request</Button>
        <Button variant="outline">Split</Button>
      </div>

      <ActionButtons />
      <PayOrRequest />
    </div>
  );
}
