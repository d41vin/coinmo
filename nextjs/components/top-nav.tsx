"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePrivy } from "@privy-io/react-auth"
import { useTheme } from "next-themes"
import {
  CopyIcon,
  ExternalLinkIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
} from "lucide-react"
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

/**
 * One-tap light/dark switch for the header. The three-way Light/Dark/System
 * control lives on the settings page; this is the quick toggle only.
 */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // The resolved theme is unknown until after hydration, so a neutral icon is
  // rendered first to keep the server and client markup identical.
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"
  const ariaLabel = mounted
    ? isDark
      ? "Switch to light theme"
      : "Switch to dark theme"
    : "Toggle theme"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </Button>
  )
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

          <DropdownMenuItem render={<Link href="/profile" />}>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

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
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-base font-semibold tracking-tight"
        >
          coinmo
        </Link>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />

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
      </div>
    </header>
  )
}
