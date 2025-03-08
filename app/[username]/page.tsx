"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, MoreVertical, ArrowDownLeft } from "lucide-react";
import { parseEther } from "viem";
import { useSendTransaction } from "wagmi";

interface User {
  id: number;
  username: string;
  name: string;
  avatar_url?: string;
  wallet_address: `0x${string}`;  // This ensures wallet_address is always in the correct format
}

type FollowStatus = 'not_following' | 'pending' | 'accepted' | null;

interface Transaction {
  id: number;
  from_address: string;
  to_address: string;
  amount: string;
  timestamp: string;
  type: 'send' | 'receive';
}

export default function ProfilePage() {
  const { username } = useParams();
  const { address, isConnected } = useAppKitAccount();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { sendTransaction } = useSendTransaction();

  const handleFollow = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: address,
          followingId: user.id,
          action: 'follow'
        }),
      });

      if (response.ok) {
        setFollowStatus('pending');
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: address,
          followingId: user.id,
          action: 'unfollow'
        }),
      });

      if (response.ok) {
        setFollowStatus('not_following');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleSendPayment = async () => {
    if (!user?.wallet_address) return;
    
    try {
      const amount = prompt('Enter amount in ETH:');
      if (!amount) return;

      if (!user.wallet_address.startsWith('0x')) {
        throw new Error('Invalid wallet address format');
      }
      
      await sendTransaction({
        to: user.wallet_address as `0x${string}`,
        value: parseEther(amount),
      });
      
      // Refresh transactions after sending
      loadTransactions();
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const handleRequestPayment = async () => {
    if (!user?.wallet_address) return;
    
    try {
      const amount = prompt('Enter amount in ETH:');
      if (!amount) return;

      const response = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: user.wallet_address,
          amount,
          requestor: address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment request');
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  const loadTransactions = async () => {
    if (!user?.wallet_address) return;
    
    try {
      const response = await fetch(`/api/transactions/${user.wallet_address}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/users/${username}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found');
            setUser(null);
            return;
          }
          throw new Error('Failed to fetch user');
        }
        
        const userData = await response.json();
        setUser(userData);

        if (address && isConnected && userData.id) {
          const statusResponse = await fetch(
            `/api/follows/status?follower=${address}&following=${userData.id}`
          );
          if (statusResponse.ok) {
            const { status } = await statusResponse.json();
            setFollowStatus(status);
          }
        }

        // Load transactions
        loadTransactions();
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    if (username) {
      loadProfile();
    }
  }, [username, address, isConnected]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">{error}</h2>
        <Button 
          onClick={() => router.push('/home')} 
          className="mt-4"
        >
          Return Home
        </Button>
      </div>
    );
  }

  if (!user) return null;

  const isOwnProfile = address === user.wallet_address;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user.name} />
            ) : (
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-gray-600">@{user.username}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isConnected ? (
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/')}
                className="w-full"
              >
                Connect Wallet
              </Button>
              <p className="text-sm text-gray-500 text-center">
                Connect to interact
              </p>
            </div>
          ) : !isOwnProfile && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={handleSendPayment}
                title="Send Payment"
              >
                <Send className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleRequestPayment}
                title="Request Payment"
              >
                <ArrowDownLeft className="h-4 w-4" />
              </Button>

              {followStatus === 'not_following' && (
                <Button onClick={handleFollow}>Follow</Button>
              )}
              {followStatus === 'pending' && (
                <Button variant="outline" disabled>Pending</Button>
              )}
              {followStatus === 'accepted' && (
                <Button variant="outline" onClick={handleUnfollow}>Following</Button>
              )}
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Copy Address</DropdownMenuItem>
              {isOwnProfile && (
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600">Block</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
          <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No transactions yet</p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {tx.type === 'send' ? 'Sent' : 'Received'} {tx.amount} ETH
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {tx.type === 'send' ? 'To' : 'From'}:
                    </p>
                    <p className="text-sm font-mono">
                      {tx.type === 'send' ? tx.to_address : tx.from_address}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="following">
          {/* Following list will be implemented later */}
          <p className="text-center text-gray-500 py-8">Coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
