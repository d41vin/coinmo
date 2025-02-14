import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserProfile() {
  return (
    <div className="flex items-center space-x-4 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 p-4 shadow-lg">
      <Avatar className="h-20 w-20 border-2 border-white">
        <AvatarImage src=".././public/vercel.svg" alt="user.name" />
        <AvatarFallback>user.name.charAt(0)</AvatarFallback>
      </Avatar>
      <div className="flex-1 text-white">
        <h2 className="text-2xl font-bold">user.name</h2>
        <p className="text-sm opacity-75">user.username</p>
        <p className="text-sm opacity-75">user.walletAddress</p>
      </div>
    </div>
  );
}
