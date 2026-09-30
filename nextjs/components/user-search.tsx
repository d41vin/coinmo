"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, UserRoundIcon } from "lucide-react"
import { useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { avatarInitials } from "@/lib/profile-photo"

/** Below this the search is skipped outright, both here and in the function. */
const MIN_QUERY_LENGTH = 2

/** Keys are cheap to react to and expensive to query; settle before fetching. */
const DEBOUNCE_MS = 200

/**
 * Header people-finder. The query is read straight from Convex rather than
 * through an API route: the auth provider in `components/providers.tsx`
 * already attaches the session token to every subscription, and
 * `users.searchPublicProfiles` enforces sign-in and onboarding itself.
 */
export function UserSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS)
    return () => window.clearTimeout(timeout)
  }, [query])

  const searchTerm = debounced.trim().replace(/^@+/, "").toLowerCase()
  // The debounce has not caught up with what is actually typed.
  const isSettling = query.trim() !== debounced
  const results = useQuery(
    api.users.searchPublicProfiles,
    searchTerm.length >= MIN_QUERY_LENGTH ? { query: searchTerm } : "skip"
  )

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setQuery("")
      setDebounced("")
    }
  }

  function selectUser(username: string) {
    handleOpenChange(false)
    router.push(`/profile/${username}`)
  }

  const isTooShort = searchTerm.length < MIN_QUERY_LENGTH
  const isFetching = !isTooShort && (isSettling || results === undefined)
  const hasFailed =
    !!results && !Array.isArray(results) && "errorMessage" in results

  return (
    <>
      <Button
        aria-label="Find people"
        onClick={() => setOpen(true)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <SearchIcon />
      </Button>
      <CommandDialog
        aria-label="Find people"
        className="top-0 h-dvh max-w-none translate-y-0 rounded-none sm:top-1/3 sm:h-auto sm:max-w-md sm:rounded-4xl"
        onOpenChange={handleOpenChange}
        open={open}
        showCloseButton
        title="Find people"
      >
        <Command shouldFilter={false}>
          <CommandInput
            autoFocus
            onValueChange={setQuery}
            placeholder="Search by username or name"
            value={query}
          />
          <CommandList className="max-h-none sm:max-h-72">
            {isTooShort ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Type at least {MIN_QUERY_LENGTH} characters to find people.
              </p>
            ) : hasFailed ? (
              <p
                className="px-4 py-8 text-center text-sm text-muted-foreground"
                role="alert"
              >
                Search is unavailable. Please try again.
              </p>
            ) : isFetching ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Searching people...
              </p>
            ) : results && results.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No people found for &ldquo;{searchTerm}&rdquo;.
              </p>
            ) : (
              <CommandGroup heading="People">
                {results?.map((person) => (
                  <CommandItem
                    key={person.username}
                    onSelect={() => selectUser(person.username)}
                    value={`${person.displayName} ${person.username}`}
                  >
                    <Avatar>
                      <AvatarImage alt="" src={person.avatarUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {avatarInitials(person.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">
                        {person.displayName}
                      </span>
                      <span className="block truncate text-xs font-normal text-muted-foreground">
                        @{person.username}
                      </span>
                    </span>
                    <UserRoundIcon className="text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
