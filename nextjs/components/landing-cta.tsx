"use client"

import Link from "next/link"
import { usePrivy } from "@privy-io/react-auth"

import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/use-current-user"

/**
 * The single hero action, kept as a small client island so the landing copy
 * above it stays a server component.
 *
 * Three states: unknown (placeholder), signed out (open Privy's modal) and
 * signed in. A signed-in account that hasn't finished setup gets sent to
 * onboarding instead of home, so the hero never promises a screen the routing
 * gate would bounce it from.
 */
export function LandingCta() {
  const { ready, authenticated, login } = usePrivy()
  const { user } = useCurrentUser()

  if (!ready) {
    return <Skeleton className="h-9 w-32" />
  }

  if (authenticated && user && !user.onboardingComplete) {
    return (
      <Link href="/onboarding" className={buttonVariants({ size: "lg" })}>
        Resume setup
      </Link>
    )
  }

  if (authenticated) {
    return (
      <Link href="/home" className={buttonVariants({ size: "lg" })}>
        Open coinmo
      </Link>
    )
  }

  return (
    <Button size="lg" onClick={() => login()}>
      Sign in
    </Button>
  )
}
