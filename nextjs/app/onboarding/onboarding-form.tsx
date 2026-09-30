"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"

import { ProfilePhotoField } from "@/components/profile-photo-field"
import { UsernameField } from "@/components/username-field"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentUser } from "@/hooks/use-current-user"
import { api } from "@/convex/_generated/api"
import {
  DISPLAY_NAME_MAX_LENGTH,
  suggestUsername,
  usernameError,
} from "@/convex/lib/username"
import { avatarInitials } from "@/lib/profile-photo"
import type { UploadedProfilePhoto } from "@/lib/profile-photo-upload"

/**
 * First-run setup. Requires a live session and an existing account row, which
 * `RequireSession` on the page guarantees. Onboarding is the one screen that
 * uses `RequireSession` instead of `RequireAuth`, so the two gates can never
 * redirect to each other.
 */
export function OnboardingForm() {
  const router = useRouter()
  const { user } = useCurrentUser()
  const complete = useMutation(api.users.completeOnboarding)
  const saveAvatar = useMutation(api.users.setAvatar)

  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [usernameEdited, setUsernameEdited] = useState(false)
  const [photo, setPhoto] = useState<UploadedProfilePhoto | undefined>()
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (user?.onboardingComplete) {
      router.replace("/home")
    }
  }, [router, user])

  const usernameProblem = username ? usernameError(username) : null
  const canSubmit =
    displayName.trim().length > 0 &&
    !usernameProblem &&
    !isSaving &&
    !isUploading

  function changeDisplayName(value: string) {
    setDisplayName(value)
    // Keep suggesting until the person types a handle of their own.
    if (!usernameEdited) {
      setUsername(suggestUsername(value))
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    setIsSaving(true)
    setError(undefined)

    try {
      await complete({ displayName, username })
      if (photo) {
        await saveAvatar({ avatarUrl: photo.url, avatarKey: photo.key })
      }
      router.replace("/home")
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save your profile. Try again."
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (user?.onboardingComplete) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <p className="text-center font-heading text-2xl font-semibold tracking-tight">
          coinmo
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Set up your profile</CardTitle>
            <CardDescription>
              Your display name and username are what people see when money
              moves through coinmo. Pick them now; both can change later in
              settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={submit}>
              <ProfilePhotoField
                previewUrl={photo?.url ?? user?.avatarUrl}
                initials={avatarInitials(displayName || user?.displayName)}
                onUploaded={setPhoto}
                onUploadingChange={setIsUploading}
                disabled={isSaving}
              />

              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(event) => changeDisplayName(event.target.value)}
                  required
                  maxLength={DISPLAY_NAME_MAX_LENGTH}
                  autoComplete="name"
                />
              </div>

              <UsernameField
                value={username}
                onChange={(value) => {
                  setUsernameEdited(true)
                  setUsername(value)
                }}
                problem={usernameProblem}
                disabled={isSaving}
              />

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <Button className="w-full" type="submit" disabled={!canSubmit}>
                {isSaving
                  ? "Saving…"
                  : isUploading
                    ? "Upload in progress…"
                    : "Complete setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
