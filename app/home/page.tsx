import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import UserProfile from "@/components/UserProfile";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-sm space-y-6 p-4">
      {/* nav */}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users" className="rounded-full pl-9" />
      </div>

      {/* header */}
      <UserProfile />

      {/* tabs */}
      <h1>Home page</h1>
    </div>
  );
}
