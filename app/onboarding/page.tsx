"use client";

import ProfileForm from "@/components/ProfileForm";
import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPage() {
  const { address, isConnected } = useAppKitAccount();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect to home if not connected
    if (!address || !isConnected) {
      router.push('/');
      return;
    }

    // Check if user is already registered
    async function checkRegistration() {
      try {
        const response = await fetch(`/api/users?walletAddress=${address}`);
        const data = await response.json();

        if (data.exists === true) {
          router.push('/home');
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking registration:', error);
        router.push('/');
      }
    }

    checkRegistration();
  }, [address, isConnected, router]);

  if (!address || !isConnected) {
    return null;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>
      <ProfileForm />
    </div>
  );
}
