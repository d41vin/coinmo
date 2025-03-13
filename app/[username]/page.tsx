import { getUserByUsername } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProfileCard } from "@/components/ProfileCard";

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const user = await getUserByUsername(params.username);

  if (!user) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-screen-sm p-4">
      <ProfileCard user={user} />
    </div>
  );
}
