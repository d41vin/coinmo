"use client"

import { use, useState } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
} from "lucide-react"
import { useQuery } from "convex/react"

import { RequireAuth } from "@/components/require-auth"
import { ProfileActions } from "@/components/profile-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/convex/_generated/api"
import { MONAD_TESTNET_EXPLORER_URL } from "@/lib/chain"
import { cn } from "@/lib/utils"
import { avatarInitials } from "@/lib/profile-photo"

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/**
 * Public card for one handle. The friendship controls below the identity block
 * are driven entirely by `friends.relationshipForProfile`, so what you can do
 * with someone always reflects the real state between your accounts.
 */
function ProfileContent({ username }: { username: string }) {
  const profile = useQuery(api.users.publicProfile, { username })
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!profile) return
    await navigator.clipboard.writeText(profile.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // `undefined` is the read in flight, `null` is the function's answer that
  // there is no such public profile; only the second one is a dead end.
  if (profile === undefined) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
        <p className="text-sm text-muted-foreground" role="status">
          Loading profile…
        </p>
      </main>
    )
  }

  if (profile === null) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
        <Link
          href="/home"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "self-start text-muted-foreground"
          )}
        >
          <ArrowLeftIcon data-slot="icon" />
          Back
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              This profile isn&apos;t available
            </CardTitle>
            <CardDescription>
              @{username} doesn&apos;t match a coinmo profile. It may have been
              changed, or the account never finished setting up.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <Link
        href="/home"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "self-start text-muted-foreground"
        )}
      >
        <ArrowLeftIcon data-slot="icon" />
        Back
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-5 pt-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-20">
              <AvatarImage alt="" src={profile.avatarUrl} />
              <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                {avatarInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight">
                  {profile.displayName}
                </h1>
                <Badge variant="secondary">coinmo profile</Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                @{profile.username}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Primary address
            </span>
            <div className="flex items-center gap-1.5">
              <code className="min-w-0 flex-1 truncate rounded-2xl bg-input/50 px-2.5 py-1.5 font-mono text-xs">
                {truncateAddress(profile.address)}
              </code>
              <Button
                aria-label="Copy address"
                onClick={handleCopy}
                size="icon"
                variant="ghost"
              >
                {copied ? (
                  <CheckIcon data-slot="icon" />
                ) : (
                  <CopyIcon data-slot="icon" />
                )}
              </Button>
              <a
                aria-label="View on explorer"
                href={`${MONAD_TESTNET_EXPLORER_URL}/address/${profile.address}`}
                rel="noreferrer"
                target="_blank"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" })
                )}
              >
                <ExternalLinkIcon data-slot="icon" />
              </a>
            </div>
          </div>

          <div className="border-t pt-5">
            <ProfileActions
              isOwner={profile.isOwner}
              username={profile.username}
            />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default function PublicProfilePage(
  props: PageProps<"/profile/[username]">
) {
  // Next 16 hands page params to client components as a Promise; `use` unwraps
  // it inside the render, and the subtree suspends for a frame on a hard load.
  const { username } = use(props.params)
  const handle = username.trim().toLowerCase().replace(/^@+/, "")

  return (
    <RequireAuth>
      <ProfileContent key={handle} username={handle} />
    </RequireAuth>
  )
}
