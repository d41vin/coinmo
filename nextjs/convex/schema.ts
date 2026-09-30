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
})
