"use client";

import { useEffect } from 'react';
import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from 'next/navigation';

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAppKitAccount();
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      if (!address || !isConnected) return;

      const response = await fetch(`/api/users?walletAddress=${address}`);
      const data = await response.json();

      if (!data.exists) {
        router.push('/onboarding'); // Create this page to show the ProfileForm
      }
    }

    checkProfile();
  }, [address, isConnected, router]);

  return <>{children}</>;
}