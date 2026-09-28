import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  /**
   * Mirror of a Privy user. Privy stays the source of truth for auth; this
   * table only gives the rest of the app something to reference.
   *
   * Convex has no database-level unique constraint, so `privyDid` and
   * `address` are kept unique by `internal.users.upsert`, which reads through
   * these indexes with `.unique()` and refuses to write a duplicate claim.
   * Addresses are stored lowercased so case differences can't create twins.
   */
  users: defineTable({
    privyDid: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_privy_did", ["privyDid"])
    .index("by_address", ["address"]),
})
