"use client"

import { FriendsList } from "@/components/friends-list"
import { RequireAuth } from "@/components/require-auth"

export default function FriendsPage() {
  return (
    <RequireAuth>
      <FriendsList />
    </RequireAuth>
  )
}
