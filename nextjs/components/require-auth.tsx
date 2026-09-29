"use client"

import type { ReactNode } from "react"
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

/**
 * Guards authenticated-only content. Privy's prebuilt modal is the only
 * authentication surface, so signed-out visitors get an inline prompt instead
 * of a redirect.
 *
 * Phase 2 will extend this with an onboarding-complete branch: an
 * authenticated user who has not finished setup should be sent to onboarding
 * before their children render.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, authenticated, login } = usePrivy()

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    )
  }

  if (!authenticated) {
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

  return <>{children}</>
}
