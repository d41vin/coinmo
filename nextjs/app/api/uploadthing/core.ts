import { z } from "zod"
import { UTApi } from "uploadthing/server"
import { createUploadthing, type FileRouter } from "uploadthing/next"

import {
  PROFILE_PHOTO_MIME_TYPES,
  PROFILE_PHOTO_UPLOADTHING_MAX_SIZE,
} from "@/lib/profile-photo"

const f = createUploadthing()
const utapi = new UTApi()
const allowedMimeTypes = new Set<string>(PROFILE_PHOTO_MIME_TYPES)

/**
 * coinmo has no cookie session: authentication lives in the Privy JWT that
 * `components/providers.tsx` puts on every Convex request. This route therefore
 * does not authenticate anyone, and deliberately doesn't try to. It only stores
 * bytes and hands back the reference, which is safe because persisting an avatar
 * requires the identity-guarded `users.setAvatar` mutation. Someone using this
 * route directly can fill quota, but can never put a picture on another account.
 */
const profilePhotoInput = z.object({
  /**
   * Key of the avatar this upload replaces, so the old file can be removed. The
   * caller already knows it: it comes from the row it just read.
   */
  previousAvatarKey: z.string().min(1).max(300).optional(),
})

/**
 * APNG keeps the PNG signature and marks animation with an `acTL` chunk; an
 * animated WebP carries an `ANIM` chunk in its RIFF container. Both are cheap to
 * spot in the bytes and both defeat the point of a profile photo.
 */
function isAnimatedImage(bytes: Uint8Array, type: string) {
  const content = new TextDecoder().decode(bytes)
  return (
    (type === "image/png" && content.includes("acTL")) ||
    (type === "image/webp" && content.includes("ANIM"))
  )
}

async function deleteQuietly(fileKey: string | undefined) {
  if (!fileKey) return
  try {
    await utapi.deleteFiles(fileKey)
  } catch (reason) {
    // Never fail an otherwise successful upload over housekeeping.
    console.error("Could not delete a profile photo file", reason)
  }
}

export const ourFileRouter = {
  profilePhoto: f({
    image: {
      maxFileSize: PROFILE_PHOTO_UPLOADTHING_MAX_SIZE,
      maxFileCount: 1,
    },
  })
    .input(profilePhotoInput)
    .middleware(async ({ input }) => input)
    .onUploadComplete(async ({ file, metadata }) => {
      if (
        !allowedMimeTypes.has(file.type) ||
        file.type === "image/svg+xml" ||
        file.type === "image/gif"
      ) {
        await deleteQuietly(file.key)
        throw new Error(
          "Only JPEG, PNG, and non-animated WebP profile photos are accepted"
        )
      }

      const uploaded = await fetch(file.ufsUrl)
      if (!uploaded.ok) {
        throw new Error("Could not inspect the uploaded profile photo")
      }

      const bytes = new Uint8Array(await uploaded.arrayBuffer())
      if (isAnimatedImage(bytes, file.type)) {
        await deleteQuietly(file.key)
        throw new Error("Animated profile photos are not accepted")
      }

      // The replacement is confirmed good, so retire the file it supersedes.
      if (
        metadata.previousAvatarKey &&
        metadata.previousAvatarKey !== file.key
      ) {
        await deleteQuietly(metadata.previousAvatarKey)
      }

      return { url: file.ufsUrl, key: file.key }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
