"use client"

import { useState } from "react"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CalendarClockIcon,
  HandCoinsIcon,
  Link2Icon,
  MoreHorizontalIcon,
  PinIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  Repeat2Icon,
  UsersRoundIcon,
} from "lucide-react"
import type { Address } from "viem"

import { RequireAuth } from "@/components/require-auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useMonBalance } from "@/hooks/use-mon-balance"
import { useMounted } from "@/hooks/use-mounted"

type Action = {
  description: string
  icon: typeof ArrowUpRightIcon
  id: string
  label: string
  title: string
}

const primaryActions: Action[] = [
  {
    id: "send",
    label: "Send",
    title: "Send money",
    description: "Send stablecoins to anyone on coinmo.",
    icon: ArrowUpRightIcon,
  },
  {
    id: "receive",
    label: "Receive",
    title: "Receive money",
    description: "Share the details people need to pay you.",
    icon: ArrowDownLeftIcon,
  },
  {
    id: "request",
    label: "Request",
    title: "Request a payment",
    description: "Ask someone to pay you a specific amount.",
    icon: ReceiptTextIcon,
  },
]

const moreActions: Action[] = [
  {
    id: "split",
    label: "Split",
    title: "Split a payment",
    description: "Set up an expense to share with friends or a group.",
    icon: UsersRoundIcon,
  },
  {
    id: "payment-link",
    label: "Payment link",
    title: "Create a payment link",
    description: "Create a shareable link for a one-time payment.",
    icon: Link2Icon,
  },
  {
    id: "claim-link",
    label: "Claim link",
    title: "Create a claim link",
    description: "Create a link for someone to claim a payment.",
    icon: HandCoinsIcon,
  },
  {
    id: "schedule-payment",
    label: "Schedule payment",
    title: "Schedule a payment",
    description: "Choose a date for a payment to be sent later.",
    icon: CalendarClockIcon,
  },
  {
    id: "recurring-payment",
    label: "Recurring payment",
    title: "Set up a recurring payment",
    description: "Create a payment that repeats on your preferred schedule.",
    icon: Repeat2Icon,
  },
]

const monFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 4,
})

/**
 * The hour is only knowable in the browser, so the server and the first
 * client render share a neutral greeting until the tree has mounted.
 */
function useGreeting() {
  const mounted = useMounted()

  if (!mounted) return "Welcome back"

  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

function ActionTile({
  action,
  onClick,
}: {
  action: Action
  onClick: () => void
}) {
  const Icon = action.icon
  return (
    <Button
      aria-label={action.title}
      className="h-auto min-h-23 w-full flex-col gap-2 rounded-3xl bg-primary px-2 py-3 text-primary-foreground shadow-sm hover:bg-primary/90"
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="size-6" />
      <span className="max-w-full truncate text-xs font-medium sm:text-sm">
        {action.label}
      </span>
    </Button>
  )
}

function MoreActionsTile({
  onOpenAction,
  onTogglePinned,
  pinnedActionIds,
}: {
  onOpenAction: (action: Action) => void
  onTogglePinned: (action: Action) => void
  pinnedActionIds: Set<string>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open more payment actions"
        className="flex min-h-23 flex-col items-center justify-center gap-2 rounded-3xl bg-primary px-2 py-3 text-primary-foreground shadow-sm transition-colors outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <MoreHorizontalIcon aria-hidden="true" className="size-6" />
        <span className="text-xs font-medium sm:text-sm">More</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>More ways to move money</DropdownMenuLabel>
          {moreActions.map((action) => {
            const Icon = action.icon
            const pinned = pinnedActionIds.has(action.id)
            return (
              <div className="flex items-center gap-1" key={action.id}>
                <DropdownMenuItem
                  className="min-w-0 flex-1"
                  onClick={() => onOpenAction(action)}
                >
                  <Icon />
                  <span className="min-w-0 flex-1 truncate">
                    {action.label}
                  </span>
                </DropdownMenuItem>
                <Button
                  aria-label={
                    pinned ? `Unpin ${action.label}` : `Pin ${action.label}`
                  }
                  aria-pressed={pinned}
                  className="shrink-0"
                  // The menu closes whenever a selection bubbles up to it, so
                  // pinning stops propagation to stay open for more than one.
                  onClick={(event) => {
                    event.stopPropagation()
                    event.preventDefault()
                    onTogglePinned(action)
                  }}
                  size="icon-sm"
                  type="button"
                  variant={pinned ? "secondary" : "ghost"}
                >
                  <PinIcon className={pinned ? "fill-current" : undefined} />
                </Button>
              </div>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Pinned tiles fill rows of up to four. A complete row reuses the primary
 * row's edge-to-edge four-column grid; any partial row is centered, so the
 * fifth pin starts a fresh centered row instead of trailing a gap. Partial
 * tiles keep the primary column width: (100% - 3 * gap) / 4, i.e. 25% minus
 * three quarters of the gap, which is 0.5rem below `sm` and 0.75rem above it.
 */
const partialRowTile = "w-[calc(25%-0.375rem)] sm:w-[calc(25%-0.5625rem)]"

function PinnedActions({
  actions,
  onOpenAction,
}: {
  actions: Action[]
  onOpenAction: (action: Action) => void
}) {
  const rows: Action[][] = []
  for (let i = 0; i < actions.length; i += 4) {
    rows.push(actions.slice(i, i + 4))
  }
  return (
    <div className="space-y-2">
      {rows.map((row, index) =>
        row.length === 4 ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-3" key={`row-${index}`}>
            {row.map((action) => (
              <ActionTile
                action={action}
                key={action.id}
                onClick={() => onOpenAction(action)}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex justify-center gap-2 sm:gap-3"
            key={`row-${index}`}
          >
            {row.map((action) => (
              <div className={partialRowTile} key={action.id}>
                <ActionTile
                  action={action}
                  onClick={() => onOpenAction(action)}
                />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

function BalanceCard({
  displayName,
  walletAddress,
}: {
  displayName: string
  walletAddress?: Address
}) {
  const { formatted, error, isLoading, refresh } = useMonBalance(walletAddress)
  const greeting = useGreeting()
  return (
    <Card className="relative overflow-hidden border-0 bg-secondary text-secondary-foreground shadow-lg ring-1 ring-foreground/5">
      <HandCoinsIcon
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -bottom-12 size-48 rotate-12 opacity-[0.06]"
      />
      <CardContent className="relative p-6 sm:p-7">
        <p className="text-sm text-secondary-foreground/75">
          {greeting},{" "}
          <span className="greeting-name-gradient font-semibold">
            {displayName}
          </span>
        </p>
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium tracking-[0.16em] text-secondary-foreground/60 uppercase">
              Total balance
            </p>
            <Button
              aria-label="Refresh balance"
              className="text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
              disabled={isLoading}
              onClick={refresh}
              size="icon-sm"
              variant="ghost"
            >
              {isLoading ? <Spinner /> : <RefreshCwIcon />}
            </Button>
          </div>
          <p className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatted === null
              ? "— MON"
              : `${monFormatter.format(Number(formatted))} MON`}
          </p>
          <p className="mt-2 text-sm text-secondary-foreground/70">
            {error !== null
              ? "Could not refresh your balance. Try again."
              : walletAddress === undefined
                ? "Setting up your wallet…"
                : "Your native MON balance on Monad Testnet"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivitySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>
          Your payments and requests will show up here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Empty className="min-h-60 border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptTextIcon />
            </EmptyMedia>
            <EmptyTitle>No activity yet</EmptyTitle>
            <EmptyDescription>
              When a payment, request, or link goes through, it lands here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}

function HomeComponent() {
  const { user: profile } = useCurrentUser()
  const [activeAction, setActiveAction] = useState<Action | null>(null)
  // Ephemeral by design: this phase keeps pins in component state only, and
  // saving them to the profile comes in a later phase.
  const [pinnedIds, setPinnedIds] = useState<string[]>([])

  // `RequireAuth` renders its children only once the mirrored profile exists,
  // but this read can still be in flight for a frame, so stay optional.
  const walletAddress = profile?.address as Address | undefined
  const displayName = profile?.displayName ?? "there"
  const pinnedActions = moreActions.filter((action) =>
    pinnedIds.includes(action.id)
  )

  const togglePinned = (action: Action) => {
    setPinnedIds((current) =>
      current.includes(action.id)
        ? current.filter((id) => id !== action.id)
        : [...current, action.id]
    )
  }
  return (
    <main className="mx-auto min-h-[calc(100svh-4rem)] w-full max-w-2xl p-4 pb-10 sm:p-6">
      <div className="space-y-6">
        <BalanceCard displayName={displayName} walletAddress={walletAddress} />

        <section aria-label="Payment actions" className="space-y-3">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {primaryActions.map((action) => (
              <ActionTile
                action={action}
                key={action.id}
                onClick={() => setActiveAction(action)}
              />
            ))}
            <MoreActionsTile
              onOpenAction={setActiveAction}
              onTogglePinned={togglePinned}
              pinnedActionIds={new Set(pinnedIds)}
            />
          </div>

          {pinnedActions.length > 0 && (
            <PinnedActions
              actions={pinnedActions}
              onOpenAction={setActiveAction}
            />
          )}
        </section>

        <ActivitySection />
      </div>

      <Drawer
        onOpenChange={(open) => {
          if (!open) setActiveAction(null)
        }}
        open={activeAction !== null}
        showSwipeHandle
      >
        <DrawerContent className="md:!mx-auto md:[--drawer-content-width:39rem]">
          {activeAction && (
            <>
              <DrawerHeader>
                <DrawerTitle>{activeAction.title}</DrawerTitle>
                <DrawerDescription>
                  {activeAction.description}
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 py-6">
                <div className="rounded-3xl border border-dashed bg-muted/50 p-5 text-sm text-muted-foreground">
                  This is the home action scaffold. The complete{" "}
                  {activeAction.label.toLowerCase()} flow will be added here
                  later without changing how you reach it.
                </div>
              </div>
              <DrawerFooter>
                <Button
                  onClick={() => setActiveAction(null)}
                  type="button"
                  variant="outline"
                >
                  Close
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </main>
  )
}

export default function HomePage() {
  return (
    <RequireAuth>
      <HomeComponent />
    </RequireAuth>
  )
}
