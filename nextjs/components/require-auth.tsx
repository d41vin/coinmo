"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentUser } from "@/hooks/use-current-user"

/**
 * Privy's prebuilt modal is the only authentication surface, so signed-out
 * visitors get an inline prompt instead of a redirect.
 */
function SignInPrompt() {
  const { login } = usePrivy()

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">You need to sign in</CardTitle>
          <CardDescription>
            Sign in to open your coinmo account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={() => login()}>
            Sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function Waiting({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3"
      role="status"
    >
      <Spinner className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

/**
 * Gates on a usable session: signed in with Privy, confirmed by Convex, and
 * with the mirrored profile row present. Nothing above this point can assume an
 * account exists.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const { authenticated } = usePrivy()
  const { isResolvingSession, isResolvingProfile } = useCurrentUser()

  if (!authenticated) return <SignInPrompt />

  if (isResolvingSession) return <Waiting />

  // The row is created by the session mirror in `components/providers.tsx`, so
  // this is a short wait rather than a dead end.
  if (isResolvingProfile) {
    return <Waiting label="Finishing your account setup…" />
  }

  return <>{children}</>
}

/**
 * `RequireSession` plus the Phase A onboarding branch: an authenticated account
 * that has not claimed a name and username is sent to `/onboarding` before its
 * children render. `/onboarding` uses `RequireSession` only, so the two gates
 * cannot bounce between each other.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user } = useCurrentUser()

  useEffect(() => {
    if (user && !user.onboardingComplete) {
      router.replace("/onboarding")
    }
  }, [router, user])

  return (
    <RequireSession>
      {user?.onboardingComplete ? children : <Waiting label="Setting up…" />}
    </RequireSession>
  )
}
