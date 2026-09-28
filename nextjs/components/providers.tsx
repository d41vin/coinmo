"use client"

import type { ReactNode } from "react"
import { useTheme } from "next-themes"
import { PrivyProvider } from "@privy-io/react-auth"
import { ConvexProvider, ConvexReactClient } from "convex/react"
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
  process.env.NEXT_PUBLIC_PRIVY_APP_ID,
)
const convexUrl = requirePublicEnv(
  "NEXT_PUBLIC_CONVEX_URL",
  process.env.NEXT_PUBLIC_CONVEX_URL,
)

const convex = new ConvexReactClient(convexUrl)

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
        // injected/external sign-ins are never given an extra embedded wallet.
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
      <ConvexProvider client={convex}>
        {children}
        <UserIdentitySync />
      </ConvexProvider>
    </PrivyProvider>
  )
}
