"use client"

import { useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
} from "lucide-react"
import type { Address } from "viem"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RequireAuth } from "@/components/require-auth"
import { Spinner } from "@/components/ui/spinner"
import { useMonBalance } from "@/hooks/use-mon-balance"
import { MONAD_TESTNET_EXPLORER_URL } from "@/lib/chain"
import { cn } from "@/lib/utils"

const monFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 4,
})

export default function HomePage() {
  return (
    <RequireAuth>
      <WalletCard />
    </RequireAuth>
  )
}

/**
 * Account data only. Authentication actions live in the top navigation, and
 * RequireAuth above guarantees an authenticated user is present.
 */
function WalletCard() {
  const { user } = usePrivy()
  const [copied, setCopied] = useState(false)

  const walletAddress = user?.wallet?.address as Address | undefined
  const { balance, formatted, error, isLoading, refresh } =
    useMonBalance(walletAddress)

  // A brand-new email account can be authenticated a moment before its
  // embedded wallet exists, so keep showing the loading state until it lands.
  if (!user || !walletAddress) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    )
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
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
                {copied ? (
                  <CheckIcon data-slot="icon" />
                ) : (
                  <CopyIcon data-slot="icon" />
                )}
              </Button>
              <a
                href={`${MONAD_TESTNET_EXPLORER_URL}/address/${walletAddress}`}
                target="_blank"
                rel="noreferrer"
                aria-label="View on explorer"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" })
                )}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
            >
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
