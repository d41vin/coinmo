import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useSendTransaction } from "wagmi";
import { parseEther } from "viem";

interface User {
  id: number;
  username: string;
  name: string;
  wallet_address: `0x${string}`;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const [mode, setMode] = useState<"pay" | "request">("pay");
  const [amount, setAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { address } = useAppKitAccount();
  const { sendTransaction } = useSendTransaction();

  const searchUsers = async (query: string) => {
    try {
      const response = await fetch(`/api/users/search?q=${query}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount) return;

    if (mode === "pay") {
      try {
        await sendTransaction({
          to: selectedUser.wallet_address,
          value: parseEther(amount),
        });
        onClose();
      } catch (error) {
        console.error("Payment failed:", error);
      }
    } else {
      try {
        const response = await fetch("/api/payment-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: selectedUser.wallet_address,
            amount,
            requestor: address,
          }),
        });

        if (!response.ok) throw new Error("Failed to create request");
        onClose();
      } catch (error) {
        console.error("Request failed:", error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "pay" | "request")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pay">Pay</TabsTrigger>
            <TabsTrigger value="request">Request</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isSearchOpen}
                  className="w-full justify-between"
                >
                  {selectedUser
                    ? `${selectedUser.name} (@${selectedUser.username})`
                    : "Select user..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Search users..."
                    value={searchQuery}
                    onValueChange={(value) => {
                      setSearchQuery(value);
                      searchUsers(value);
                    }}
                  />
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => {
                          setSelectedUser(user);
                          setIsSearchOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedUser?.id === user.id
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        {user.name} (@{user.username})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            <Input
              type="number"
              step="0.000001"
              placeholder="Amount in ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <Button type="submit" className="w-full">
              {mode === "pay" ? "Review Payment" : "Send Request"}
            </Button>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
