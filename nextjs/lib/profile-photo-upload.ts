import { genUploader } from "uploadthing/client"

import type { OurFileRouter } from "@/app/api/uploadthing/core"

const upload = genUploader<OurFileRouter>({ url: "/api/uploadthing" })

export type UploadedProfilePhoto = { url: string; key: string }

/**
 * Sends one profile photo to the coinmo file route and returns what
 * `users.setAvatar` needs. `previousAvatarKey` is the avatar this picture
 * replaces; the route deletes it once the new file has passed its content
 * checks, so replacing a photo doesn't leave the old one behind.
 */
export async function uploadProfilePhoto(
  file: File,
  previousAvatarKey?: string
): Promise<UploadedProfilePhoto> {
  const [uploaded] = await upload.uploadFiles("profilePhoto", {
    files: [file],
    input: { previousAvatarKey },
  })

  const url = uploaded?.serverData?.url
  const key = uploaded?.serverData?.key

  if (!url || !key) {
    throw new Error("The upload did not return a profile photo")
  }

  return { url, key }
}
