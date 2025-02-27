"use client";

import { useParams } from "next/navigation";

export default function ProfilePage() {
  // Access the dynamic `username` parameter from the URL
  const { username } = useParams();

  return (
    <div>
      <h1>Welcome to {username}'s Profile</h1>
      {/* You can fetch and display user data based on the `username` */}
    </div>
  );
}
