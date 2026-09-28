"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  LogOutIcon,
  RefreshCwIcon,
  WalletIcon,
} from "lucide-react"
import type { Address } from "viem"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useMonBalance } from "@/hooks/use-mon-balance"
import { MONAD_TESTNET_EXPLORER_URL } from "@/lib/chain"
import { cn } from "@/lib/utils"

const monFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 4,
})

export default function HomePage() {
  const router = useRouter()
  const { ready, authenticated, user, logout } = usePrivy()
  const [copied, setCopied] = useState(false)

  const walletAddress = user?.wallet?.address as Address | undefined
  const { balance, formatted, error, isLoading, refresh } =
    useMonBalance(walletAddress)

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/sign-in")
    }
  }, [ready, authenticated, router])

  if (!ready || !authenticated || !user || !walletAddress) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Spinner className="size-5 text-muted-foreground" />
      </main>
    )
  }

  const handleSignOut = async () => {
    await logout()
    router.replace("/sign-in")
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.email ? (
                user.email.address.charAt(0).toUpperCase()
              ) : (
                <WalletIcon className="size-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user.email?.address ?? "Wallet account"}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {user.id}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOutIcon data-slot="icon" />
          Sign out
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Primary wallet</CardTitle>
          <CardDescription>
            Your Monad Testnet address and native MON balance.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Address
            </span>
            <div className="flex items-center gap-1.5">
              <code className="min-w-0 flex-1 truncate rounded-2xl bg-input/50 px-2.5 py-1.5 font-mono text-xs">
                {walletAddress}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                aria-label="Copy address"
              >
                {copied ? <CheckIcon data-slot="icon" /> : <CopyIcon data-slot="icon" />}
              </Button>
              <a
                href={`${MONAD_TESTNET_EXPLORER_URL}/address/${walletAddress}`}
                target="_blank"
                rel="noreferrer"
                aria-label="View on explorer"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
              >
                <ExternalLinkIcon data-slot="icon" />
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-3.5 py-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-medium text-muted-foreground">
                MON balance
              </span>
              <span className="truncate font-mono text-lg font-medium">
                {isLoading && balance === null ? (
                  <Spinner className="size-4" />
                ) : formatted === null ? (
                  "--"
                ) : (
                  `${monFormatter.format(Number(formatted))} MON`
                )}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={refresh} disabled={isLoading}>
              {isLoading ? <Spinner /> : <RefreshCwIcon data-slot="icon" />}
              Refresh
            </Button>
          </div>

          {error !== null && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
