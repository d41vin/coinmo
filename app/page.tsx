"use client";

import { ConnectButton } from "@/components/ConnectButton";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { address, isConnected } = useAppKitAccount();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{ username: string } | null>(null);
  
  useEffect(() => {
    async function checkRegistration() {
      if (!address || !isConnected) {
        setUserProfile(null);
        return;
      }

      try {
        const response = await fetch(`/api/users?walletAddress=${address}`);
        const data = await response.json();
        
        if (data.exists === false) {
          router.push('/onboarding');
        } else {
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error checking registration:', error);
      }
    }

    checkRegistration();
  }, [address, isConnected]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Image
        src="/next.svg"
        alt="Reown"
        width={150}
        height={150}
        priority
      />
      <h1 className="text-4xl font-bold mb-8">Welcome to Coinmo</h1>
      
      <div className="space-y-4">
        <ConnectButton />
        
        {userProfile && (
          <Button 
            onClick={() => router.push(`/${userProfile.username}`)}
            className="mt-4"
          >
            Go to Profile
          </Button>
        )}
      </div>
    </div>
  );
}
