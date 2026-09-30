import { usePrivy } from "@privy-io/react-auth"
import { useConvexAuth, useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"

/**
 * The signed-in account as one question, for the routing gate and the profile
 * forms. Convex is queried only once it has accepted the Privy token, which is
 * what lets `users.current` resolve the caller from the verified identity.
 */
export function useCurrentUser() {
  const { ready, authenticated } = usePrivy()
  const { isLoading: isAuthLoading, isAuthenticated: isConvexAuthenticated } =
    useConvexAuth()

  const user = useQuery(api.users.current, isConvexAuthenticated ? {} : "skip")

  return {
    /** `undefined` while the read is in flight, `null` until the row exists. */
    user,
    /** Privy or Convex is still establishing the session. */
    isResolvingSession:
      !ready || !authenticated || isAuthLoading || !isConvexAuthenticated,
    /** The session is real but the mirrored profile has not landed yet. */
    isResolvingProfile: user === undefined || user === null,
  }
}
