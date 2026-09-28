"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"

import { Spinner } from "@/components/ui/spinner"

/** Auth gate: send signed-out visitors to /sign-in and everyone else to /home. */
export default function Page() {
  const router = useRouter()
  const { ready, authenticated } = usePrivy()

  useEffect(() => {
    if (!ready) {
      return
    }
    router.replace(authenticated ? "/home" : "/sign-in")
  }, [ready, authenticated, router])

  return (
    <main className="flex min-h-svh items-center justify-center">
      <Spinner className="size-5 text-muted-foreground" />
    </main>
  )
}
