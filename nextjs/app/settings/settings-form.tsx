"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { CheckIcon, CopyIcon, ExternalLinkIcon, LogOutIcon } from "lucide-react"

import { ProfilePhotoField } from "@/components/profile-photo-field"
import { UsernameField } from "@/components/username-field"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { DISPLAY_NAME_MAX_LENGTH, usernameError } from "@/convex/lib/username"
import { MONAD_TESTNET_EXPLORER_URL } from "@/lib/chain"
import { avatarInitials } from "@/lib/profile-photo"
import { cn } from "@/lib/utils"

export function SettingsForm() {
  const { isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.settings, isAuthenticated ? {} : "skip")

  if (user === undefined || user === null) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
        <p className="text-sm text-muted-foreground" role="status">
          Loading settings…
        </p>
      </main>
    )
  }

  // Remounting on account change keeps the form fields seeded from the row.
  return <SettingsContent key={user._id} user={user} />
}

function SettingsContent({ user }: { user: Doc<"users"> }) {
  const router = useRouter()
  const { logout } = usePrivy()
  const saveProfile = useMutation(api.users.updateProfile)
  const storeAvatar = useMutation(api.users.setAvatar)
  const dropAvatar = useMutation(api.users.removeAvatar)

  const [displayName, setDisplayName] = useState(user.displayName ?? "")
  const [username, setUsername] = useState(user.username ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<string>()
  const [error, setError] = useState<string>()

  const usernameProblem = username ? usernameError(username) : null
  const canSaveProfile =
    displayName.trim().length > 0 &&
    !usernameProblem &&
    !isSaving &&
    !isUploadingPhoto

  function say(message?: string) {
    setStatus(message)
    if (message) setError(undefined)
  }

  function fail(reason: unknown, fallback: string) {
    setError(reason instanceof Error ? reason.message : fallback)
  }

  async function submitProfile(event: React.FormEvent) {
    event.preventDefault()
    if (!canSaveProfile) return

    setIsSaving(true)
    setStatus(undefined)
    setError(undefined)

    try {
      await saveProfile({ displayName, username })
      say("Profile saved.")
    } catch (reason) {
      fail(reason, "Could not save your profile. Try again.")
    } finally {
      setIsSaving(false)
    }
  }

  /** The file is already stored by the time this runs, so it only links it. */
  async function applyAvatar(photo: { url: string; key: string }) {
    setError(undefined)
    try {
      await storeAvatar({ avatarUrl: photo.url, avatarKey: photo.key })
      say("Profile photo updated.")
    } catch (reason) {
      fail(reason, "Could not save the new profile photo.")
    }
  }

  async function removePhoto() {
    setIsRemovingPhoto(true)
    setStatus(undefined)
    setError(undefined)

    try {
      await dropAvatar({})
      say("Profile photo removed.")
    } catch (reason) {
      fail(reason, "Could not remove your profile photo.")
    } finally {
      setIsRemovingPhoto(false)
    }
  }

  async function copyAddress() {
    await navigator.clipboard.writeText(user.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function signOut() {
    setIsSigningOut(true)
    await logout()
    router.push("/")
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage how your coinmo account looks and what others can find.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your name and username travel with every payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submitProfile}>
            <ProfilePhotoField
              id="avatar"
              previewUrl={user.avatarUrl}
              initials={avatarInitials(user.displayName)}
              replaceKey={user.avatarKey}
              onUploaded={applyAvatar}
              onUploadingChange={setIsUploadingPhoto}
              disabled={isSaving || isRemovingPhoto}
            />

            {user.avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removePhoto}
                disabled={isUploadingPhoto || isRemovingPhoto}
              >
                {isRemovingPhoto ? "Removing…" : "Remove photo"}
              </Button>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                autoComplete="name"
              />
            </div>

            <UsernameField
              value={username}
              onChange={setUsername}
              problem={usernameProblem}
              disabled={isSaving}
            />

            {status ? (
              <p className="text-sm text-muted-foreground" role="status">
                {status}
              </p>
            ) : null}
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={!canSaveProfile}>
              {isSaving ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
          <CardDescription>
            The Monad Testnet address backed by your sign-in. It is managed by
            Privy, so it is shown here read-only.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Primary address
          </span>
          <div className="flex items-center gap-1.5">
            <code className="min-w-0 flex-1 truncate rounded-2xl bg-input/50 px-2.5 py-1.5 font-mono text-xs">
              {user.address}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyAddress}
              aria-label="Copy address"
            >
              {copied ? (
                <CheckIcon data-slot="icon" />
              ) : (
                <CopyIcon data-slot="icon" />
              )}
            </Button>
            <a
              href={`${MONAD_TESTNET_EXPLORER_URL}/address/${user.address}`}
              target="_blank"
              rel="noreferrer"
              aria-label="View on explorer"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            >
              <ExternalLinkIcon data-slot="icon" />
            </a>
          </div>
          {user.email ? (
            <p className="text-sm text-muted-foreground">
              Verified email: {user.email}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>
            Signing out clears this browser&apos;s Privy session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={signOut}
            disabled={isSigningOut}
            className="gap-1.5"
          >
            <LogOutIcon data-slot="icon" />
            {isSigningOut ? "Signing out…" : "Sign out"}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
