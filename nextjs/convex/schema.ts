import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  /**
   * Mirror of a Privy user plus the coinmo profile built on top of it. Privy
   * stays the source of truth for authentication; this table is what the rest
   * of the app references, and `privyDid` is only ever written from
   * `ctx.auth.getUserIdentity()`.
   *
   * Convex has no database-level unique constraint, so `privyDid`, `address`
   * and `username` are kept unique by the mutations in `convex/users.ts`,
   * which read through these indexes with `.unique()` and refuse to write a
   * duplicate claim. Addresses are stored lowercased so case differences can't
   * create twins, and usernames are stored lowercased for the same reason.
   *
   * `avatarKey` is the UploadThing file key behind `avatarUrl`; keeping it lets
   * a replaced photo be deleted instead of orphaned.
   */
  users: defineTable({
    privyDid: v.string(),
    displayName: v.optional(v.string()),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarKey: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.string(),
    onboardingComplete: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_privy_did", ["privyDid"])
    .index("by_address", ["address"])
    .index("by_username", ["username"])
    .searchIndex("search_username", {
      searchField: "username",
      filterFields: ["onboardingComplete"],
    })
    .searchIndex("search_display_name", {
      searchField: "displayName",
      filterFields: ["onboardingComplete"],
    }),

  /**
   * A pending friend request, one row from sender to recipient. Both ordered
   * indexes exist so the relationship lookup and the two request lists stay
   * index-first: `(senderId, recipientId)` finds a request you sent and backs
   * the outgoing list, `(recipientId, senderId)` finds one awaiting you and
   * backs the incoming list. Accepting or declining deletes the row, so a
   * handled request never lingers.
   */
  friendRequests: defineTable({
    senderId: v.id("users"),
    recipientId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_sender_id_and_recipient_id", ["senderId", "recipientId"])
    .index("by_recipient_id_and_sender_id", ["recipientId", "senderId"]),

  /**
   * An accepted friendship, stored as two mirrored rows (A to B and B to A)
   * so each person's friends list is a single `(userId, createdAt)` scan in
   * newest-first order. `(userId, friendId)` is the uniqueness probe that
   * guards against a duplicate edge on one side.
   */
  friendships: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user_id_and_friend_id", ["userId", "friendId"])
    .index("by_user_id_and_created_at", ["userId", "createdAt"]),

  /**
   * A one-way block. Only `(blockerId, blockedId)` is indexed because the
   * blocker's own list is the only read that needs it; the reverse direction
   * is probed pointwise by id pair when gating a request or friendship.
   */
  userBlocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    createdAt: v.number(),
  }).index("by_blocker_id_and_blocked_id", ["blockerId", "blockedId"]),
})
