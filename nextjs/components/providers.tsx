"use client"

import { useCallback, useMemo, type ReactNode } from "react"
import { useTheme } from "next-themes"
import { PrivyProvider, usePrivy } from "@privy-io/react-auth"
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react"
import { useSyncPrivyUser } from "@/hooks/use-sync-privy-user"
import { monadTestnet } from "@/lib/chain"

function requirePublicEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

const privyAppId = requirePublicEnv(
  "NEXT_PUBLIC_PRIVY_APP_ID",
  process.env.NEXT_PUBLIC_PRIVY_APP_ID
)
const convexUrl = requirePublicEnv(
  "NEXT_PUBLIC_CONVEX_URL",
  process.env.NEXT_PUBLIC_CONVEX_URL
)

const convex = new ConvexReactClient(convexUrl)

/**
 * Adapts Privy to the interface Convex expects from a third-party identity
 * provider, so every request carries the Privy access token and
 * `ctx.auth.getUserIdentity()` resolves inside functions. This is the whole
 * bridge: no custom endpoint and no token verification of our own.
 *
 * Privy refreshes an expired access token on its own and exposes no manual
 * refresh, so `fetchAccessToken` takes no arguments and simply hands over
 * whatever `getAccessToken` resolves to (or `null` when signed out).
 */
function usePrivyConvexAuth() {
  const { ready, authenticated, getAccessToken } = usePrivy()

  const fetchAccessToken = useCallback(
    async () => await getAccessToken(),
    [getAccessToken]
  )

  return useMemo(
    () => ({
      isLoading: !ready,
      isAuthenticated: authenticated,
      fetchAccessToken,
    }),
    [ready, authenticated, fetchAccessToken]
  )
}

/** Mirrors the Privy session into Convex; renders nothing. */
function UserIdentitySync() {
  useSyncPrivyUser()
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Email is the only web2 login method; wallets may still connect, and
        // injected/external wallet logins are never given an embedded wallet.
        loginMethods: ["email", "wallet"],
        supportedChains: [monadTestnet],
        defaultChain: monadTestnet,
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        appearance: {
          theme: resolvedTheme === "dark" ? "dark" : "light",
          walletChainType: "ethereum-only",
        },
      }}
    >
      <ConvexProviderWithAuth client={convex} useAuth={usePrivyConvexAuth}>
        {children}
        <UserIdentitySync />
      </ConvexProviderWithAuth>
    </PrivyProvider>
  )
}
