"use client"

import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import {
  CheckIcon,
  Clock3Icon,
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShieldBanIcon,
  UserCheckIcon,
  UserPlusIcon,
  UserXIcon,
} from "lucide-react"

import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * The friendship controls on a public profile. The whole surface is driven by
 * one server-resolved relationship, so the buttons always match what
 * `friends.relationshipForProfile` reports rather than any client guess. This
 * page sits behind `RequireAuth`, so the viewer is signed in with a finished
 * profile by the time these render.
 */

type Action =
  "send" | "accept" | "decline" | "cancel" | "remove" | "block" | "unblock"

const actionLabels: Record<Action, string> = {
  send: "Friend request sent.",
  accept: "You are now friends.",
  decline: "Friend request declined.",
  cancel: "Friend request cancelled.",
  remove: "Friend removed.",
  block: "This person is now blocked.",
  unblock: "This person has been unblocked.",
}

export function ProfileActions({
  isOwner,
  username,
}: {
  isOwner: boolean
  username: string
}) {
  const relationship = useQuery(api.friends.relationshipForProfile, {
    username,
  })
  const send = useMutation(api.friends.sendRequest)
  const accept = useMutation(api.friends.acceptRequest)
  const decline = useMutation(api.friends.declineRequest)
  const cancel = useMutation(api.friends.cancelRequest)
  const remove = useMutation(api.friends.removeFriend)
  const block = useMutation(api.friends.blockUser)
  const unblock = useMutation(api.friends.unblockUser)

  const [busyAction, setBusyAction] = useState<Action>()
  const [confirmation, setConfirmation] = useState<"remove" | "block">()
  const [notice, setNotice] = useState<string>()
  const [error, setError] = useState<string>()
  const [copied, setCopied] = useState(false)

  async function runAction(action: Action) {
    setBusyAction(action)
    setError(undefined)
    setNotice(undefined)
    const mutation = { send, accept, decline, cancel, remove, block, unblock }[
      action
    ]
    try {
      await mutation({ username })
      setNotice(actionLabels[action])
      setConfirmation(undefined)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update this friendship. Please try again."
      )
    } finally {
      setBusyAction(undefined)
    }
  }

  async function copyProfileLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2_000)
    } catch {
      setCopied(false)
    }
  }

  const isConfirming = Boolean(confirmation && busyAction === confirmation)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {isOwner ? (
          <Button render={<Link href="/settings" />}>
            <PencilIcon data-slot="icon" />
            Edit profile
          </Button>
        ) : relationship === undefined ? (
          <Button disabled type="button">
            <Clock3Icon data-slot="icon" />
            Loading connection…
          </Button>
        ) : relationship === "not-connected" ? (
          <>
            <Button
              disabled={busyAction !== undefined}
              onClick={() => void runAction("send")}
              type="button"
            >
              <UserPlusIcon data-slot="icon" />
              Add friend
            </Button>
            <ConnectionMenu
              disabled={busyAction !== undefined}
              onBlock={() => setConfirmation("block")}
            />
          </>
        ) : relationship === "outgoing-request" ? (
          <>
            <Button
              disabled={busyAction !== undefined}
              onClick={() => void runAction("cancel")}
              type="button"
              variant="outline"
            >
              <Clock3Icon data-slot="icon" />
              {busyAction === "cancel" ? "Cancelling…" : "Request sent"}
            </Button>
            <ConnectionMenu
              disabled={busyAction !== undefined}
              onBlock={() => setConfirmation("block")}
            />
          </>
        ) : relationship === "incoming-request" ? (
          <>
            <Button
              disabled={busyAction !== undefined}
              onClick={() => void runAction("accept")}
              type="button"
            >
              <UserCheckIcon data-slot="icon" />
              {busyAction === "accept" ? "Accepting…" : "Accept"}
            </Button>
            <Button
              disabled={busyAction !== undefined}
              onClick={() => void runAction("decline")}
              type="button"
              variant="outline"
            >
              <UserXIcon data-slot="icon" />
              Decline
            </Button>
            <ConnectionMenu
              disabled={busyAction !== undefined}
              onBlock={() => setConfirmation("block")}
            />
          </>
        ) : relationship === "friends" ? (
          <>
            <Button disabled type="button" variant="secondary">
              <UserCheckIcon data-slot="icon" />
              Friends
            </Button>
            <ConnectionMenu
              disabled={busyAction !== undefined}
              onBlock={() => setConfirmation("block")}
              onRemove={() => setConfirmation("remove")}
            />
          </>
        ) : relationship === "blocked-by-viewer" ? (
          <Button
            disabled={busyAction !== undefined}
            onClick={() => void runAction("unblock")}
            type="button"
            variant="outline"
          >
            <ShieldBanIcon data-slot="icon" />
            {busyAction === "unblock" ? "Unblocking…" : "Unblock"}
          </Button>
        ) : (
          <p className="self-center text-sm text-muted-foreground">
            You cannot connect with this profile.
          </p>
        )}
        <Button
          onClick={() => void copyProfileLink()}
          type="button"
          variant="outline"
        >
          {copied ? (
            <CheckIcon data-slot="icon" />
          ) : (
            <CopyIcon data-slot="icon" />
          )}
          {copied ? "Copied" : "Copy profile link"}
        </Button>
      </div>

      {notice ? (
        <p className="text-xs text-muted-foreground" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !isConfirming) setConfirmation(undefined)
        }}
        open={confirmation !== undefined}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation === "block"
                ? "Block this person?"
                : "Remove this friend?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation === "block"
                ? "Blocking removes any friend request or friendship between you, and they will not be able to send you a new request. You can undo this from their profile at any time."
                : "They will no longer appear in your friends list, and you will drop out of theirs. You can send a new friend request later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isConfirming}
              onClick={() => {
                if (confirmation) void runAction(confirmation)
              }}
              variant="destructive"
            >
              {isConfirming
                ? confirmation === "block"
                  ? "Blocking…"
                  : "Removing…"
                : confirmation === "block"
                  ? "Block"
                  : "Remove friend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ConnectionMenu({
  disabled,
  onBlock,
  onRemove,
}: {
  disabled: boolean
  onBlock: () => void
  onRemove?: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="More friendship options"
        disabled={disabled}
        render={<Button size="icon" type="button" variant="outline" />}
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onRemove ? (
          <>
            <DropdownMenuItem onClick={onRemove}>
              <UserXIcon />
              Remove friend
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onClick={onBlock} variant="destructive">
          <ShieldBanIcon />
          Block
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
