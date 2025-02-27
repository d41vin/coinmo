"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { Button } from "@/components/ui/button";
import ActionButtons from "@/components/ActionButtons";
import PayOrRequest from "@/components/PayOrRequest";
import ProfileForm from "@/components/ProfileForm";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-sm space-y-6 p-4">
      {/* nav */}
      <div className="flex items-center justify-between">
        <h1 className="font-bndanimal text-2xl">Coinmo</h1>
        <div className="w relative max-w-[50%] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Find friends or businesses"
            className="rounded-full pl-9"
          />
        </div>
      </div>

      {/* header */}
      <UserProfile />

      {/* buttons */}
      <Button variant="secondary">Receive</Button>
      <Button variant="default">Send/Request</Button>
      <Button variant="outline">Split</Button>

      <ActionButtons />

      <PayOrRequest />

      {/* tabs */}
      <h1>Home page</h1>

      {/* form */}

      <ProfileForm />
    </div>
  );
}
