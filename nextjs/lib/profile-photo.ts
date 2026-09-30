/**
 * Profile photo limits, shared by the browser check, the UploadThing route and
 * the copy next to the file input. Keep them in sync with the route config: the
 * byte ceiling and the `maxFileSize` string describe the same number.
 */

export const PROFILE_PHOTO_MAX_BYTES = 4 * 1024 * 1024
export const PROFILE_PHOTO_MAX_LABEL = "4 MB"
export const PROFILE_PHOTO_UPLOADTHING_MAX_SIZE = "4MB"

/** Animated variants are rejected separately by content sniffing. */
export const PROFILE_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export const PROFILE_PHOTO_ACCEPT = PROFILE_PHOTO_MIME_TYPES.join(",")

export function profilePhotoTypeError() {
  return "Choose a JPEG, PNG, or non-animated WebP profile photo."
}

export function profilePhotoSizeError() {
  return `This profile photo is larger than ${PROFILE_PHOTO_MAX_LABEL}. Choose a smaller image and try again.`
}

/**
 * Turns an UploadThing failure into something a person can act on. The SDK
 * surfaces route rejections as plain errors, so the message is matched rather
 * than typed.
 */
export function profilePhotoError(reason: unknown) {
  const message = reason instanceof Error ? reason.message : ""

  if (/(size|too large|exceeds|limit)/i.test(message)) {
    return profilePhotoSizeError()
  }
  if (/(type|format|jpeg|png|webp|animated)/i.test(message)) {
    return profilePhotoTypeError()
  }

  return "Profile photo upload failed. Check your connection and try again."
}

export function rejectedProfilePhoto(file: File): string | null {
  if (
    !PROFILE_PHOTO_MIME_TYPES.includes(
      file.type as (typeof PROFILE_PHOTO_MIME_TYPES)[number]
    )
  ) {
    return profilePhotoTypeError()
  }
  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return profilePhotoSizeError()
  }
  return null
}

/** Letters for the avatar ring until there is a picture to show. */
export function avatarInitials(displayName: string | undefined): string {
  return (
    displayName
      ?.trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  )
}
