import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"
import schema from "./schema"
import {
  displayNameError,
  isValidUsername,
  normalizeUsername,
  usernameError,
} from "./lib/username"

/**
 * Every function here resolves the caller through `ctx.auth.getUserIdentity()`.
 * Privy's access token reaches Convex from the client auth hook in
 * `components/providers.tsx` and is verified against Privy's signing keys (see
 * `convex/auth.config.ts`), so the account id is never an argument: a client
 * can lie about its wallet address, but it cannot impersonate another DID.
 *
 * The DID is the token's `sub` claim. This deployment has exactly one issuer,
 * so `sub` alone is a stable account key.
 */

function normalizeAddress(address: string): string {
  const normalized = address.trim().toLowerCase()
  if (!/^0x[0-9a-f]{40}$/.test(normalized)) {
    throw new Error(`Not a valid EVM wallet address: ${address}`)
  }
  return normalized
}

async function requireUserIdentity(
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) {
    throw new Error("You need to sign in to do that")
  }
  return identity.subject
}

async function userByDid(
  ctx: QueryCtx | MutationCtx,
  privyDid: string
): Promise<Doc<"users"> | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_privy_did", (q) => q.eq("privyDid", privyDid))
    .unique()
}

/**
 * The row is created by `ensureForIdentity` as soon as a session syncs, so a
 * missing row means the sync has not landed yet. It is a hard error rather than
 * a silent insert because the client owns the wallet address.
 */
async function requireUser(ctx: QueryCtx | MutationCtx, privyDid: string) {
  const user = await userByDid(ctx, privyDid)
  if (user === null) {
    throw new Error("Your coinmo account is still being created. Try again.")
  }
  return user
}

/**
 * `address` is unique per account, so a different Privy user already mirroring
 * this wallet is a conflict we refuse to silently overwrite.
 */
async function throwIfAddressClaimed(
  ctx: QueryCtx | MutationCtx,
  address: string,
  privyDid: string
) {
  const owner = await ctx.db
    .query("users")
    .withIndex("by_address", (q) => q.eq("address", address))
    .unique()

  if (owner !== null && owner.privyDid !== privyDid) {
    throw new Error("That wallet is already linked to another account")
  }
}

function readProfileNames(displayName: string, username: string) {
  const name = displayName.trim()
  const handle = normalizeUsername(username)

  const nameProblem = displayNameError(name)
  if (nameProblem !== null) {
    throw new Error(nameProblem)
  }

  const handleProblem = usernameError(handle)
  if (handleProblem !== null) {
    throw new Error(handleProblem)
  }

  return { displayName: name, username: handle }
}

/**
 * Uniqueness is enforced here rather than by the database, which cannot express
 * it. Mutations run as serializable transactions, so two sessions racing for the
 * same handle cannot both commit: the loser aborts, retries, and then reads the
 * row the winner wrote.
 */
async function assertUsernameIsFree(
  ctx: MutationCtx,
  username: string,
  selfId: Id<"users">
) {
  const taken = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", username))
    .unique()

  if (taken !== null && taken._id !== selfId) {
    throw new Error("That username is already taken")
  }
}

function assertAvatarUrl(avatarUrl: string) {
  let parsed: URL
  try {
    parsed = new URL(avatarUrl)
  } catch {
    throw new Error("That profile photo link is not a valid URL")
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Profile photos must be served over HTTPS")
  }
  return parsed.href
}

export const current = query({
  args: {},
  returns: v.union(schema.doc("users"), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) return null
    return await userByDid(ctx, identity.subject)
  },
})

/**
 * Everything `/settings` needs about the signed-in account. It is a separate
 * read from `current` so the settings surface can grow (payment preferences,
 * notification flags) without changing what the routing gate depends on.
 */
export const settings = query({
  args: {},
  returns: v.union(schema.doc("users"), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) return null
    return await userByDid(ctx, identity.subject)
  },
})

/**
 * Creates or refreshes the mirror row for the calling session. The client
 * supplies the wallet address and email as convenience fields; the DID comes
 * from the verified identity. Profile fields the user owns (display name,
 * username, avatar) are never touched here, so a sync cannot roll back
 * onboarding.
 */
export const ensureForIdentity = mutation({
  args: {
    address: v.string(),
    email: v.optional(v.string()),
  },
  returns: v.object({ onboardingComplete: v.boolean() }),
  handler: async (ctx, args) => {
    const privyDid = await requireUserIdentity(ctx)
    const address = normalizeAddress(args.address)
    const now = Date.now()

    const existing = await userByDid(ctx, privyDid)

    if (existing === null) {
      await throwIfAddressClaimed(ctx, address, privyDid)

      await ctx.db.insert("users", {
        privyDid,
        address,
        email: args.email,
        onboardingComplete: false,
        createdAt: now,
        updatedAt: now,
      })

      return { onboardingComplete: false }
    }

    if (existing.address !== address) {
      await throwIfAddressClaimed(ctx, address, privyDid)
    }

    await ctx.db.patch("users", existing._id, {
      address,
      // Only carry a field the client actually knows, so a later sync can't
      // wipe data an earlier one filled in.
      ...(args.email !== undefined ? { email: args.email } : {}),
      updatedAt: now,
    })

    return { onboardingComplete: existing.onboardingComplete }
  },
})

/**
 * First profile write for a session: it claims the handle and flips the routing
 * gate. Avatar fields are set separately by `setAvatar`, because the photo is
 * uploaded before this mutation runs.
 */
export const completeOnboarding = mutation({
  args: { displayName: v.string(), username: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const privyDid = await requireUserIdentity(ctx)
    const { displayName, username } = readProfileNames(
      args.displayName,
      args.username
    )
    const user = await requireUser(ctx, privyDid)

    await assertUsernameIsFree(ctx, username, user._id)

    await ctx.db.patch("users", user._id, {
      displayName,
      username,
      onboardingComplete: true,
      updatedAt: Date.now(),
    })

    return null
  },
})

export const updateProfile = mutation({
  args: { displayName: v.string(), username: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const privyDid = await requireUserIdentity(ctx)
    const { displayName, username } = readProfileNames(
      args.displayName,
      args.username
    )
    const user = await requireUser(ctx, privyDid)

    await assertUsernameIsFree(ctx, username, user._id)

    await ctx.db.patch("users", user._id, {
      displayName,
      username,
      updatedAt: Date.now(),
    })

    return null
  },
})

/**
 * Points the profile at an UploadThing file the client already uploaded. This is
 * the security boundary for avatars: only an authenticated identity can persist
 * one, and only onto its own row. The replaced key is returned so the caller can
 * report or clean up the old file.
 */
export const setAvatar = mutation({
  args: { avatarUrl: v.string(), avatarKey: v.string() },
  returns: v.object({ previousAvatarKey: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const privyDid = await requireUserIdentity(ctx)
    const avatarUrl = assertAvatarUrl(args.avatarUrl)
    const user = await requireUser(ctx, privyDid)

    const previousAvatarKey = user.avatarKey

    await ctx.db.patch("users", user._id, {
      avatarUrl,
      avatarKey: args.avatarKey,
      updatedAt: Date.now(),
    })

    return { previousAvatarKey }
  },
})

/**
 * Clears both avatar fields.
 */
export const removeAvatar = mutation({
  args: {},
  returns: v.object({ previousAvatarKey: v.optional(v.string()) }),
  handler: async (ctx) => {
    const privyDid = await requireUserIdentity(ctx)
    const user = await requireUser(ctx, privyDid)
    const previousAvatarKey = user.avatarKey

    // `patch` can only merge fields in, so taking them away means writing the
    // document back without them.
    const withoutAvatar = { ...user }
    delete withoutAvatar.avatarUrl
    delete withoutAvatar.avatarKey
    withoutAvatar.updatedAt = Date.now()

    await ctx.db.replace("users", user._id, withoutAvatar)

    return { previousAvatarKey }
  },
})

/** Fields a search result or public profile may expose: identity only, never
 * the email or the Privy DID behind the row. */
const publicProfileFields = {
  displayName: v.string(),
  username: v.string(),
  avatarUrl: v.optional(v.string()),
}

/**
 * How many people a single search may return. Enough to fill the dialog
 * without inviting a scan of anything near the whole table.
 */
const MAX_SEARCH_RESULTS = 8

/**
 * The public card for one handle, readable by any signed-in account with a
 * finished profile. Returns `null` rather than throwing for anything that does
 * not exist as a public profile: an unknown handle, a malformed one, and a
 * half-created row all render the same not-found state. Only identity fields
 * leave this function, and `isOwner` lets the page label your own card without
 * leaking which row the caller owns to anyone else.
 */
export const publicProfile = query({
  args: { username: v.string() },
  returns: v.nullable(
    v.object({
      ...publicProfileFields,
      address: v.string(),
      isOwner: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const username = normalizeUsername(args.username)
    if (!isValidUsername(username)) return null

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique()
    if (
      user === null ||
      !user.onboardingComplete ||
      !user.displayName ||
      !user.username
    ) {
      return null
    }

    const identity = await ctx.auth.getUserIdentity()
    const viewer =
      identity === null ? null : await userByDid(ctx, identity.subject)

    return {
      displayName: user.displayName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      address: user.address,
      isOwner: viewer?._id === user._id,
    }
  },
})

/**
 * Typeahead behind the header search. Gated on a signed-in identity with a
 * completed profile, because it exists only to route people between each
 * other and an anonymous search endpoint would just be a directory scraper's
 * friend.
 *
 * An exact handle is pinned first even though the text indexes should also
 * find it: full-text matching tokenizes, so "ada" would not reliably return
 * the handle `ada_l` by relevance alone. The two indexes are queried in
 * parallel and merged by `_id`, so one person never appears twice.
 */
export const searchPublicProfiles = query({
  args: { query: v.string() },
  returns: v.array(v.object(publicProfileFields)),
  handler: async (ctx, args) => {
    const privyDid = await requireUserIdentity(ctx)
    const viewer = await userByDid(ctx, privyDid)
    if (!viewer?.onboardingComplete) {
      throw new Error("Finish setting up your profile to search")
    }

    const searchTerm = normalizeUsername(args.query).replace(/^@+/, "")
    if (searchTerm.length < 2 || searchTerm.length > 80) return []

    const [exactUsername, usernameMatches, displayNameMatches] =
      await Promise.all([
        ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", searchTerm))
          .unique(),
        ctx.db
          .query("users")
          .withSearchIndex("search_username", (q) =>
            q.search("username", searchTerm).eq("onboardingComplete", true)
          )
          .take(MAX_SEARCH_RESULTS),
        ctx.db
          .query("users")
          .withSearchIndex("search_display_name", (q) =>
            q.search("displayName", searchTerm).eq("onboardingComplete", true)
          )
          .take(MAX_SEARCH_RESULTS),
      ])

    const results: Array<{
      displayName: string
      username: string
      avatarUrl?: string
    }> = []
    const seen = new Set<Id<"users">>()
    for (const user of [
      exactUsername,
      ...usernameMatches,
      ...displayNameMatches,
    ]) {
      if (
        user === null ||
        seen.has(user._id) ||
        !user.onboardingComplete ||
        !user.displayName ||
        !user.username
      ) {
        continue
      }
      seen.add(user._id)
      results.push({
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
      })
      if (results.length === MAX_SEARCH_RESULTS) break
    }

    return results
  },
})
