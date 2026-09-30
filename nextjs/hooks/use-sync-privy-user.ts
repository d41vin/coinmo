import { useEffect, useRef } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useMutation } from "convex/react"

import { api } from "@/convex/_generated/api"

/**
 * Keeps the Convex `users` table in step with the Privy session: runs once
 * right after login and once on app load when a session was already restored.
 *
 * Identity is no longer part of the payload. `components/providers.tsx` sends
 * the Privy access token on every request, so `ensureForIdentity` reads the
 * account id from `ctx.auth.getUserIdentity()` and these fields are only the
 * convenience mirror of the same session.
 */
export function useSyncPrivyUser() {
  const { ready, authenticated, user } = usePrivy()
  const { isAuthenticated: isConvexAuthenticated } = useConvexAuth()
  const ensureForIdentity = useMutation(api.users.ensureForIdentity)
  const synced = useRef(new Set<string>())

  const did = user?.id
  const address = user?.wallet?.address ?? user?.smartWallet?.address
  const email = user?.email?.address

  useEffect(() => {
    // Wait for Convex to confirm the token: the mutation derives the account
    // from the verified identity, so calling it any earlier just fails. A wallet
    // address is required for the row, so email users wait until Privy finishes
    // creating (or linking) their embedded wallet.
    if (
      !ready ||
      !authenticated ||
      !isConvexAuthenticated ||
      !did ||
      !address
    ) {
      return
    }

    // Keyed on the mirrored fields, not just the DID, so linking a different
    // wallet or adding an email re-syncs instead of being skipped.
    const key = `${did}:${address}:${email ?? ""}`
    if (synced.current.has(key)) {
      return
    }
    synced.current.add(key)

    void (async () => {
      try {
        await ensureForIdentity({
          address,
          ...(email ? { email } : {}),
        })
      } catch (error) {
        // Let a later session change retry instead of staying unmirrored.
        synced.current.delete(key)
        console.error("Could not mirror the Privy session into Convex", error)
      }
    })()
  }, [
    ready,
    authenticated,
    isConvexAuthenticated,
    did,
    address,
    email,
    ensureForIdentity,
  ])
}
