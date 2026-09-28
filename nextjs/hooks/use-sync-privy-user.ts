import { useEffect, useRef } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useAction } from "convex/react"
import { api } from "@/convex/_generated/api"

/**
 * Keeps the Convex `users` table in step with the Privy session: runs once
 * right after login and once on app load when a session was already restored.
 *
 * The access token is what Convex trusts; the profile fields below are only a
 * convenience mirror of the same session.
 */
export function useSyncPrivyUser() {
  const { ready, authenticated, user, getAccessToken } = usePrivy()
  const syncUser = useAction(api.auth.syncUser)
  const syncedDids = useRef(new Set<string>())

  const did = user?.id
  const address = user?.wallet?.address ?? user?.smartWallet?.address
  const email = user?.email?.address

  useEffect(() => {
    // A wallet address is required for the row, so email users wait until Privy
    // finishes creating (or linking) their embedded wallet.
    if (!ready || !authenticated || !did || !address) {
      return
    }
    if (syncedDids.current.has(did)) {
      return
    }
    syncedDids.current.add(did)

    void (async () => {
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          throw new Error("No Privy access token available")
        }
        await syncUser({
          accessToken,
          profile: { address, ...(email ? { email } : {}) },
        })
      } catch (error) {
        // Don't retry inside this mount; the next login or reload picks it up.
        console.error("Could not sync Privy user to Convex", error)
      }
    })()
  }, [ready, authenticated, did, address, email, getAccessToken, syncUser])
}
