"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"

import { useCurrentUser } from "@/hooks/use-current-user"

/**
 * Sends a signed-in account that has a loaded but unfinished profile straight
 * to onboarding, so the landing no longer waits on a manual "Resume setup"
 * click. It stays out of the way in every other case: signed-out visitors keep
 * the hero, an in-flight profile (`user` still `undefined`/`null`) is not acted
 * on, and a completed account is left alone. The pathname guard keeps it from
 * firing if this island ever renders on the onboarding screen itself.
 */
export function OnboardingRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const { authenticated } = usePrivy()
  const { user } = useCurrentUser()

  useEffect(() => {
    if (
      authenticated &&
      user !== undefined &&
      user !== null &&
      !user.onboardingComplete &&
      pathname !== "/onboarding"
    ) {
      router.replace("/onboarding")
    }
  }, [authenticated, pathname, router, user])

  return null
}
