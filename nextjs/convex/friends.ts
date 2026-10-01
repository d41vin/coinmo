import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"
import { isValidUsername, normalizeUsername } from "./lib/username"

/**
 * Friendship on coinmo is a small state machine over three tables. A request
 * runs one way until it is accepted, at which point two mirrored friendship
 * rows are written so either person lists the other with a single index scan.
 * A block sits above the machine: it tears down any request or friendship in
 * both directions and gates every future one.
 *
 * The caller is always resolved from `ctx.auth.getUserIdentity()`, never from
 * an argument, and profile rows are keyed by the Privy DID (`privyDid`). The
 * `username` argument names the *other* person and is looked up through the
 * `by_username` index. Nothing here writes notifications; that is a later
 * phase.
 */

/** How many entries each list read may return before it is truncated. */
const MAX_LIST_ITEMS = 100

type FriendshipStatus =
  | "not-connected"
  | "outgoing-request"
  | "incoming-request"
  | "friends"
  | "blocked-by-viewer"
  | "viewer-blocked"

const statusValidator = v.union(
  v.literal("not-connected"),
  v.literal("outgoing-request"),
  v.literal("incoming-request"),
  v.literal("friends"),
  v.literal("blocked-by-viewer"),
  v.literal("viewer-blocked")
)

const friendProfileValidator = v.object({
  displayName: v.string(),
  username: v.string(),
  avatarUrl: v.optional(v.string()),
})

type FriendProfile = {
  displayName: string
  username: string
  avatarUrl?: string
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
 * A user row is only a usable identity once onboarding has claimed a display
 * name and handle. Reads that must degrade gracefully (the relationship lookup,
 * the friends list) resolve to `null` for anything short of that; mutations call
 * `requireOnboardedUser` and turn the same gap into an error.
 */
async function onboardedUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) return null
  const user = await userByDid(ctx, identity.subject)
  if (
    user === null ||
    !user.onboardingComplete ||
    !user.displayName ||
    !user.username
  ) {
    return null
  }
  return user
}

async function requireOnboardedUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const user = await onboardedUser(ctx)
  if (user === null) {
    throw new Error("Finish setting up your profile to manage friends")
  }
  return user
}

/**
 * The public profile behind a handle, or a throw when the handle names nobody
 * reachable. Half-created rows and unknown handles read the same way, so a
 * mutation never learns whether a handle simply does not exist.
 */
async function publicUserByUsername(
  ctx: QueryCtx | MutationCtx,
  username: string
): Promise<Doc<"users">> {
  const handle = normalizeUsername(username).replace(/^@+/, "")
  if (!isValidUsername(handle)) {
    throw new Error("Profile not found")
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", handle))
    .unique()
  if (
    user === null ||
    !user.onboardingComplete ||
    !user.displayName ||
    !user.username
  ) {
    throw new Error("Profile not found")
  }
  return user
}

async function exactRequest(
  ctx: QueryCtx | MutationCtx,
  senderId: Id<"users">,
  recipientId: Id<"users">
) {
  return await ctx.db
    .query("friendRequests")
    .withIndex("by_sender_id_and_recipient_id", (q) =>
      q.eq("senderId", senderId).eq("recipientId", recipientId)
    )
    .unique()
}

async function exactFriendship(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  friendId: Id<"users">
) {
  return await ctx.db
    .query("friendships")
    .withIndex("by_user_id_and_friend_id", (q) =>
      q.eq("userId", userId).eq("friendId", friendId)
    )
    .unique()
}

async function exactBlock(
  ctx: QueryCtx | MutationCtx,
  blockerId: Id<"users">,
  blockedId: Id<"users">
) {
  return await ctx.db
    .query("userBlocks")
    .withIndex("by_blocker_id_and_blocked_id", (q) =>
      q.eq("blockerId", blockerId).eq("blockedId", blockedId)
    )
    .unique()
}

async function assertNoBlock(
  ctx: MutationCtx,
  viewerId: Id<"users">,
  otherUserId: Id<"users">
) {
  const [viewerBlock, otherBlock] = await Promise.all([
    exactBlock(ctx, viewerId, otherUserId),
    exactBlock(ctx, otherUserId, viewerId),
  ])
  if (viewerBlock !== null || otherBlock !== null) {
    throw new Error("This connection is unavailable")
  }
}

function toFriendProfile(user: Doc<"users"> | null): FriendProfile | null {
  if (
    user === null ||
    !user.onboardingComplete ||
    !user.displayName ||
    !user.username
  ) {
    return null
  }
  return {
    displayName: user.displayName,
    username: user.username,
    avatarUrl: user.avatarUrl,
  }
}

/**
 * Relationship of the viewer to one profile, resolved in a fixed precedence:
 * your own handle and any disconnected state read as "not-connected"; a block
 * outranks everything, in either direction; then friendship, then the direction
 * of any pending request.
 */
async function statusFor(
  ctx: QueryCtx,
  viewerId: Id<"users">,
  profileUserId: Id<"users">
): Promise<FriendshipStatus> {
  if (viewerId === profileUserId) return "not-connected"

  const [viewerBlock, blockedByProfile] = await Promise.all([
    exactBlock(ctx, viewerId, profileUserId),
    exactBlock(ctx, profileUserId, viewerId),
  ])
  if (viewerBlock !== null) return "blocked-by-viewer"
  if (blockedByProfile !== null) return "viewer-blocked"

  if ((await exactFriendship(ctx, viewerId, profileUserId)) !== null) {
    return "friends"
  }
  if ((await exactRequest(ctx, viewerId, profileUserId)) !== null) {
    return "outgoing-request"
  }
  if ((await exactRequest(ctx, profileUserId, viewerId)) !== null) {
    return "incoming-request"
  }
  return "not-connected"
}

export const relationshipForProfile = query({
  args: { username: v.string() },
  returns: statusValidator,
  handler: async (ctx, args): Promise<FriendshipStatus> => {
    const viewer = await onboardedUser(ctx)
    if (viewer === null) return "not-connected"

    const profile = await publicUserByUsername(ctx, args.username).catch(
      () => null
    )
    if (profile === null) return "not-connected"
    return await statusFor(ctx, viewer._id, profile._id)
  },
})

export const sendRequest = mutation({
  args: { username: v.string() },
  returns: v.object({ status: statusValidator }),
  handler: async (ctx, args) => {
    const viewer = await requireOnboardedUser(ctx)
    const recipient = await publicUserByUsername(ctx, args.username)
    if (viewer._id === recipient._id) throw new Error("You cannot add yourself")

    await assertNoBlock(ctx, viewer._id, recipient._id)

    if (await exactFriendship(ctx, viewer._id, recipient._id)) {
      return { status: "friends" as const }
    }
    if (await exactRequest(ctx, viewer._id, recipient._id)) {
      return { status: "outgoing-request" as const }
    }
    if (await exactRequest(ctx, recipient._id, viewer._id)) {
      throw new Error("This person has already sent you a friend request")
    }

    await ctx.db.insert("friendRequests", {
      senderId: viewer._id,
      recipientId: recipient._id,
      createdAt: Date.now(),
    })
    return { status: "outgoing-request" as const }
  },
})

export const acceptRequest = mutation({
  args: { username: v.string() },
  returns: v.object({ status: statusValidator }),
  handler: async (ctx, args) => {
    const viewer = await requireOnboardedUser(ctx)
    const sender = await publicUserByUsername(ctx, args.username)
    if (viewer._id === sender._id) throw new Error("You cannot add yourself")
    await assertNoBlock(ctx, viewer._id, sender._id)

    const request = await exactRequest(ctx, sender._id, viewer._id)
    const [viewerFriendship, senderFriendship] = await Promise.all([
      exactFriendship(ctx, viewer._id, sender._id),
      exactFriendship(ctx, sender._id, viewer._id),
    ])

    if (request !== null) {
      await ctx.db.delete("friendRequests", request._id)
    } else if (viewerFriendship === null && senderFriendship === null) {
      throw new Error("Friend request no longer exists")
    }

    const createdAt = Date.now()
    if (viewerFriendship === null) {
      await ctx.db.insert("friendships", {
        userId: viewer._id,
        friendId: sender._id,
        createdAt,
      })
    }
    if (senderFriendship === null) {
      await ctx.db.insert("friendships", {
        userId: sender._id,
        friendId: viewer._id,
        createdAt,
      })
    }
    return { status: "friends" as const }
  },
})

export const declineRequest = mutation({
  args: { username: v.string() },
  returns: v.object({ status: statusValidator }),
  handler: async (ctx, args) => {
    const viewer = await requireOnboardedUser(ctx)
    const sender = await publicUserByUsername(ctx, args.username)
    const request = await exactRequest(ctx, sender._id, viewer._id)
    if (request !== null) {
      await ctx.db.delete("friendRequests", request._id)
    }
    return { status: "not-connected" as const }
  },
})

export const cancelRequest = mutation({
  args: { username: v.string() },
  returns: v.object({ status: statusValidator }),
  handler: async (ctx, args) => {
    const viewer = await requireOnboardedUser(ctx)
    const recipient = await publicUserByUsername(ctx, args.username)
    const request = await exactRequest(ctx, viewer._id, recipient._id)
    if (request !== null) {
      await ctx.db.delete("friendRequests", request._id)
    }
    return { status: "not-connected" as const }
  },
})

export const removeFriend = mutation({
  args: { username: v.string() },
  returns: v.object({ status: statusValidator }),
  handler: async (ctx, args) => {
    const viewer = await requireOnboardedUser(ctx)
    const friend = await publicUserByUsername(ctx, args.username)
    const [viewerFriendship, reciprocalFriendship] = await Promise.all([
      exactFriendship(ctx, viewer._id, friend._id),
      exactFriendship(ctx, friend._id, viewer._id),
    ])
    if (viewerFriendship !== null) {
      await ctx.db.delete("friendships", viewerFriendship._id)
    }
    if (reciprocalFriendship !== null) {
      await ctx.db.delete("friendships", reciprocalFriendship._id)
    }
    return { status: "not-connected" as const }
  },
})

/**
 * Blocking is destructive on purpose: it drops any request or friendship in
 * both directions so a blocked connection cannot quietly survive as a stale
 * edge, then leaves a single block row that gates every future request.
 */
export const blockUser = mutation({
  args: { username: v.string() },
  returns: v.object({ status: statusValidator }),
  handler: async (ctx, args) => {
    const viewer = await requireOnboardedUser(ctx)
    const blockedUser = await publicUserByUsername(ctx, args.username)
    if (viewer._id === blockedUser._id) {
      throw new Error("You cannot block yourself")
    }

    const [existingBlock, outgoing, incoming, friendship, reciprocal] =
      await Promise.all([
        exactBlock(ctx, viewer._id, blockedUser._id),
        exactRequest(ctx, viewer._id, blockedUser._id),
        exactRequest(ctx, blockedUser._id, viewer._id),
        exactFriendship(ctx, viewer._id, blockedUser._id),
        exactFriendship(ctx, blockedUser._id, viewer._id),
      ])

    if (existingBlock === null) {
      await ctx.db.insert("userBlocks", {
        blockerId: viewer._id,
        blockedId: blockedUser._id,
        createdAt: Date.now(),
      })
    }
    for (const request of [outgoing, incoming]) {
      if (request !== null) {
        await ctx.db.delete("friendRequests", request._id)
      }
    }
    for (const friendshipRow of [friendship, reciprocal]) {
      if (friendshipRow !== null) {
        await ctx.db.delete("friendships", friendshipRow._id)
      }
    }
    return { status: "blocked-by-viewer" as const }
  },
})

export const unblockUser = mutation({
  args: { username: v.string() },
  returns: v.object({ status: statusValidator }),
  handler: async (ctx, args) => {
    const viewer = await requireOnboardedUser(ctx)
    const blockedUser = await publicUserByUsername(ctx, args.username)
    const block = await exactBlock(ctx, viewer._id, blockedUser._id)
    if (block !== null) {
      await ctx.db.delete("userBlocks", block._id)
    }
    const stillBlocked = await exactBlock(ctx, blockedUser._id, viewer._id)
    return {
      status: (stillBlocked !== null
        ? "viewer-blocked"
        : "not-connected") as FriendshipStatus,
    }
  },
})

export const list = query({
  args: {},
  returns: v.object({
    incoming: v.array(friendProfileValidator),
    outgoing: v.array(friendProfileValidator),
    friends: v.array(friendProfileValidator),
  }),
  handler: async (ctx) => {
    const viewer = await onboardedUser(ctx)
    if (viewer === null) {
      return { incoming: [], outgoing: [], friends: [] }
    }

    const [incomingRows, outgoingRows, friendshipRows] = await Promise.all([
      ctx.db
        .query("friendRequests")
        .withIndex("by_recipient_id_and_sender_id", (q) =>
          q.eq("recipientId", viewer._id)
        )
        .order("desc")
        .take(MAX_LIST_ITEMS),
      ctx.db
        .query("friendRequests")
        .withIndex("by_sender_id_and_recipient_id", (q) =>
          q.eq("senderId", viewer._id)
        )
        .order("desc")
        .take(MAX_LIST_ITEMS),
      ctx.db
        .query("friendships")
        .withIndex("by_user_id_and_created_at", (q) =>
          q.eq("userId", viewer._id)
        )
        .order("desc")
        .take(MAX_LIST_ITEMS),
    ])

    const [incomingUsers, outgoingUsers, friendUsers] = await Promise.all([
      Promise.all(incomingRows.map((row) => ctx.db.get(row.senderId))),
      Promise.all(outgoingRows.map((row) => ctx.db.get(row.recipientId))),
      Promise.all(friendshipRows.map((row) => ctx.db.get(row.friendId))),
    ])

    return {
      incoming: incomingUsers
        .map(toFriendProfile)
        .filter((profile): profile is FriendProfile => profile !== null),
      outgoing: outgoingUsers
        .map(toFriendProfile)
        .filter((profile): profile is FriendProfile => profile !== null),
      friends: friendUsers
        .map(toFriendProfile)
        .filter((profile): profile is FriendProfile => profile !== null),
    }
  },
})
