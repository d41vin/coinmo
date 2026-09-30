"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckIcon, CopyIcon, ExternalLinkIcon, PencilIcon } from "lucide-react"

import { RequireAuth } from "@/components/require-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCurrentUser } from "@/hooks/use-current-user"
import { MONAD_TESTNET_EXPLORER_URL } from "@/lib/chain"
import { avatarInitials } from "@/lib/profile-photo"
import type { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function ProfileContent({ user }: { user: Doc<"users"> }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(user.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            This is how your coinmo account identifies you.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-16">
              {user.avatarUrl && <AvatarImage alt="" src={user.avatarUrl} />}
              <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                {avatarInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight">
                {user.displayName}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                @{user.username}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Primary address
            </span>
            <div className="flex items-center gap-1.5">
              <code className="min-w-0 flex-1 truncate rounded-2xl bg-input/50 px-2.5 py-1.5 font-mono text-xs">
                {truncateAddress(user.address)}
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
                href={`${MONAD_TESTNET_EXPLORER_URL}/address/${user.address}`}
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

          <Link
            href="/settings"
            className={cn(buttonVariants({ variant: "outline" }), "self-start")}
          >
            <PencilIcon data-slot="icon" />
            Edit profile
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}

/**
 * Own-profile summary. The public `/profile/[username]` page is intentionally
 * not part of this phase, so there is nothing to share yet.
 */
function ProfilePageContent() {
  const { user } = useCurrentUser()

  // `RequireAuth` gates the session and onboarding; this read still resolves
  // one frame on a hard refresh, so hold with a status line, not a spinner.
  if (user === undefined || user === null) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
        <p className="text-sm text-muted-foreground" role="status">
          Loading profile…
        </p>
      </main>
    )
  }
  return <ProfileContent key={user._id} user={user} />
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfilePageContent />
    </RequireAuth>
  )
}
