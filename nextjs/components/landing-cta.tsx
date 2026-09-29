"use client"

import Link from "next/link"
import { usePrivy } from "@privy-io/react-auth"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The single hero action, kept as a small client island so the landing copy
 * above it stays a server component.
 *
 * States today: unknown (placeholder), signed out (open Privy's modal) and
 * signed in (go to /home). Phase 2 adds one more branch in the middle:
 * authenticated but not onboarded yet, labeled "Resume setup".
 */
export function LandingCta() {
  const { ready, authenticated, login } = usePrivy()

  if (!ready) {
    return <Skeleton className="h-9 w-32" />
  }

  if (authenticated) {
    return (
      <Button size="lg" render={<Link href="/home" />}>
        Open coinmo
      </Button>
    )
  }

  return (
    <Button size="lg" onClick={() => login()}>
      Sign in
    </Button>
  )
}
