"use client"

import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PROFILE_PHOTO_ACCEPT,
  PROFILE_PHOTO_MAX_LABEL,
  profilePhotoError,
  rejectedProfilePhoto,
} from "@/lib/profile-photo"
import {
  uploadProfilePhoto,
  type UploadedProfilePhoto,
} from "@/lib/profile-photo-upload"

type ProfilePhotoFieldProps = {
  /** Picture to show in the ring: the saved avatar or a pending upload. */
  previewUrl?: string
  /** Letter stand-in while there is no picture. */
  initials: string
  /** Avatar currently on the account, so a replacement can retire it. */
  replaceKey?: string
  disabled?: boolean
  /** Runs after a successful upload; persisting the result is the parent's job. */
  onUploaded: (photo: UploadedProfilePhoto) => void
  /** Lets the parent block submission while bytes are still moving. */
  onUploadingChange?: (isUploading: boolean) => void
  /** Field id, so the form keeps one source of truth for the label. */
  id?: string
}

/**
 * The choose-and-upload half of a profile photo, shared by onboarding and
 * settings. Both screens differ only in what they do with the result: setup
 * holds it until the profile is saved, settings persists it immediately.
 */
export function ProfilePhotoField({
  previewUrl,
  initials,
  replaceKey,
  disabled,
  onUploaded,
  onUploadingChange,
  id = "profile-photo",
}: ProfilePhotoFieldProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()

  async function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Let the same file be picked again after a rejection.
    event.target.value = ""
    if (!file) return

    setError(undefined)
    setMessage(undefined)

    const rejection = rejectedProfilePhoto(file)
    if (rejection) {
      setError(rejection)
      return
    }

    setIsUploading(true)
    onUploadingChange?.(true)
    try {
      const photo = await uploadProfilePhoto(file, replaceKey)
      onUploaded(photo)
      setMessage("Profile photo uploaded. Choose another image to replace it.")
    } catch (reason) {
      setError(profilePhotoError(reason))
    } finally {
      setIsUploading(false)
      onUploadingChange?.(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg" className="size-16">
        {previewUrl ? <AvatarImage alt="" src={previewUrl} /> : null}
        <AvatarFallback className="bg-primary text-lg text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <Label htmlFor={id}>
          {previewUrl ? "Replace profile photo" : "Profile photo"}{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={id}
          type="file"
          accept={PROFILE_PHOTO_ACCEPT}
          onChange={choosePhoto}
          disabled={disabled || isUploading}
        />
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, or non-animated WebP. Max {PROFILE_PHOTO_MAX_LABEL}.
        </p>
        {isUploading ? (
          <p className="text-xs text-muted-foreground" role="status">
            Uploading profile photo…
          </p>
        ) : message ? (
          <p className="text-xs text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
