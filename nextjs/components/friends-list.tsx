"use client"

import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import {
  CheckIcon,
  Clock3Icon,
  UserRoundSearchIcon,
  UsersRoundIcon,
  UserXIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { api } from "@/convex/_generated/api"
import { avatarInitials } from "@/lib/profile-photo"

/**
 * The friends hub: requests waiting on you, requests you have sent, and the
 * people already in your circle. One read (`friends.list`) drives all three, and
 * every row links to that person's public profile, where the same relationship
 * controls live.
 */

type FriendProfile = {
  displayName: string
  username: string
  avatarUrl?: string
}

type RequestAction = "accept" | "decline" | "cancel"

const actionNotice: Record<RequestAction, string> = {
  accept: "You are now friends.",
  decline: "Friend request declined.",
  cancel: "Friend request cancelled.",
}

export function FriendsList() {
  const data = useQuery(api.friends.list, {})
  const accept = useMutation(api.friends.acceptRequest)
  const decline = useMutation(api.friends.declineRequest)
  const cancel = useMutation(api.friends.cancelRequest)

  const [busy, setBusy] = useState<string>()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()

  async function updateRequest(action: RequestAction, username: string) {
    setBusy(`${action}:${username}`)
    setError(undefined)
    setNotice(undefined)
    const mutation = { accept, decline, cancel }[action]
    try {
      await mutation({ username })
      setNotice(actionNotice[action])
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update this request. Please try again."
      )
    } finally {
      setBusy(undefined)
    }
  }

  if (data === undefined) {
    return (
      <main className="mx-auto min-h-[calc(100svh-4rem)] w-full max-w-2xl p-4 sm:p-6">
        <p className="text-sm text-muted-foreground" role="status">
          Loading friends…
        </p>
      </main>
    )
  }

  const friendCount = data.friends.length

  return (
    <main className="mx-auto min-h-[calc(100svh-4rem)] w-full max-w-2xl p-4 sm:p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Friends</h1>
          <p className="mt-1 text-muted-foreground">
            Handle your requests and keep up with the people in your coinmo
            circle.
          </p>
        </div>

        {notice ? (
          <p className="text-sm text-muted-foreground" role="status">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>
              Accept people you know, or decline requests you would rather not.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.incoming.length === 0 ? (
              <Empty className="min-h-36">
                <EmptyHeader>
                  <EmptyTitle>No pending requests</EmptyTitle>
                  <EmptyDescription>
                    Friend requests other people send you will show up here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              data.incoming.map((person) => (
                <PersonRow
                  key={person.username}
                  person={person}
                  actions={
                    <>
                      <Button
                        disabled={busy !== undefined}
                        onClick={() =>
                          void updateRequest("accept", person.username)
                        }
                        size="sm"
                        type="button"
                      >
                        <CheckIcon data-slot="icon" />
                        {busy === `accept:${person.username}`
                          ? "Accepting…"
                          : "Accept"}
                      </Button>
                      <Button
                        disabled={busy !== undefined}
                        onClick={() =>
                          void updateRequest("decline", person.username)
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <UserXIcon data-slot="icon" />
                        Decline
                      </Button>
                    </>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>

        {data.outgoing.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sent requests</CardTitle>
              <CardDescription>
                These are still waiting for a response.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.outgoing.map((person) => (
                <PersonRow
                  key={person.username}
                  person={person}
                  actions={
                    <Button
                      disabled={busy !== undefined}
                      onClick={() =>
                        void updateRequest("cancel", person.username)
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Clock3Icon data-slot="icon" />
                      {busy === `cancel:${person.username}`
                        ? "Cancelling…"
                        : "Cancel"}
                    </Button>
                  }
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Your friends</CardTitle>
            <CardDescription>
              {friendCount === 0
                ? "Find people with the search button in the header to start your circle."
                : `${friendCount} ${friendCount === 1 ? "friend" : "friends"} in your circle.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {friendCount === 0 ? (
              <Empty className="min-h-44">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersRoundIcon />
                  </EmptyMedia>
                  <EmptyTitle>No friends yet</EmptyTitle>
                  <EmptyDescription>
                    Search for someone, then send a friend request from their
                    public profile.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              data.friends.map((person) => (
                <PersonRow
                  key={person.username}
                  person={person}
                  actions={
                    <Button
                      render={<Link href={`/profile/${person.username}`} />}
                      size="sm"
                      variant="outline"
                    >
                      <UserRoundSearchIcon data-slot="icon" />
                      View profile
                    </Button>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function PersonRow({
  actions,
  person,
}: {
  actions?: React.ReactNode
  person: FriendProfile
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border p-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        className="flex min-w-0 items-center gap-3 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        href={`/profile/${person.username}`}
      >
        <Avatar>
          {person.avatarUrl ? (
            <AvatarImage alt="" src={person.avatarUrl} />
          ) : null}
          <AvatarFallback className="bg-primary text-primary-foreground">
            {avatarInitials(person.displayName)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate font-medium">
            {person.displayName}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            @{person.username}
          </span>
        </span>
      </Link>
      {actions ? (
        <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
      ) : null}
    </div>
  )
}
