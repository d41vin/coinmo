"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppKitAccount } from "@reown/appkit/react";
import { Send, ArrowDownLeft, Users } from "lucide-react";
import { parseEther } from "viem";
import { useSendTransaction } from "wagmi";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'pay' | 'request' | 'split';
  onSubmit: (amount: string, to: string) => void;
}

function PaymentDialog({ isOpen, onClose, type, onSubmit }: PaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(amount, recipient);
    onClose();
    setAmount("");
    setRecipient("");
  };

  const titles = {
    pay: "Send Payment",
    request: "Request Payment",
    split: "Split Payment"
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[type]}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Recipient username or address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="number"
              step="0.000001"
              placeholder="Amount in ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            {type === 'pay' ? 'Send' : type === 'request' ? 'Request' : 'Split'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ActionButtons() {
  const { address } = useAppKitAccount();
  const { sendTransaction } = useSendTransaction();
  const [activeDialog, setActiveDialog] = useState<'pay' | 'request' | 'split' | null>(null);

  const handlePay = async (amount: string, to: string) => {
    try {
      await sendTransaction({
        to,
        value: parseEther(amount),
      });
      // TODO: Add transaction to activity feed
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const handleRequest = async (amount: string, from: string) => {
    try {
      // TODO: Implement request logic
      const response = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
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

  const handleSplit = async (amount: string, participants: string) => {
    // TODO: Implement split logic
  };

  const handleSubmit = (amount: string, recipient: string) => {
    switch (activeDialog) {
      case 'pay':
        handlePay(amount, recipient);
        break;
      case 'request':
        handleRequest(amount, recipient);
        break;
      case 'split':
        handleSplit(amount, recipient);
        break;
    }
  };

  return (
    <>
      <div className="space-y-4">
        <Button 
          onClick={() => setActiveDialog('pay')} 
          className="w-full"
          variant="default"
        >
          <Send className="mr-2 h-4 w-4" /> Pay
        </Button>
        
        <Button 
          onClick={() => setActiveDialog('request')} 
          className="w-full"
          variant="outline"
        >
          <ArrowDownLeft className="mr-2 h-4 w-4" /> Request
        </Button>
        
        <Button 
          onClick={() => setActiveDialog('split')} 
          className="w-full"
          variant="outline"
        >
          <Users className="mr-2 h-4 w-4" /> Split
        </Button>
      </div>

      <PaymentDialog
        isOpen={activeDialog !== null}
        onClose={() => setActiveDialog(null)}
        type={activeDialog || 'pay'}
        onSubmit={handleSubmit}
      />
    </>
  );
}
