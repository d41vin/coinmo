"use client";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <div>My Post: {slug} hi yooooooooooooooooooooooo</div>;
}
