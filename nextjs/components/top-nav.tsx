"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePrivy } from "@privy-io/react-auth"
import { CopyIcon, ExternalLinkIcon, LogOutIcon } from "lucide-react"
import type { User } from "@privy-io/react-auth"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { MONAD_TESTNET_EXPLORER_URL } from "@/lib/chain"

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function AccountMenu({ user }: { user: User }) {
  const router = useRouter()
  const { logout } = usePrivy()

  const address = user.wallet?.address
  const email = user.email?.address
  const label = email ?? address ?? "Account"

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 font-mono" />
        }
      >
        <Avatar size="sm" className="size-4">
          <AvatarFallback className="bg-primary text-[0.55rem] text-primary-foreground">
            {label.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {address ? truncateAddress(address) : label}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-foreground">{label}</span>
            {address && (
              <span className="font-mono text-[0.7rem]">
                {truncateAddress(address)}
              </span>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {address && (
          <>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(address)}
            >
              <CopyIcon />
              Copy address
            </DropdownMenuItem>
            <DropdownMenuItem
              render={
                <a
                  href={`${MONAD_TESTNET_EXPLORER_URL}/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <ExternalLinkIcon />
              View on explorer
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Site header, rendered on every page from the root layout. */
export function TopNav() {
  const { ready, authenticated, user, login } = usePrivy()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-base font-semibold tracking-tight"
        >
          coinmo
        </Link>

        {!ready ? (
          <Skeleton className="h-7 w-28 rounded-2xl" />
        ) : authenticated && user ? (
          <AccountMenu user={user} />
        ) : (
          <Button variant="default" size="sm" onClick={() => login()}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  )
}
