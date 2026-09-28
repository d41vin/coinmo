import { v } from "convex/values"
import { internalMutation } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import schema from "./schema"

const profileFields = {
  privyDid: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  address: v.string(),
}

function normalizeAddress(address: string): string {
  const normalized = address.trim().toLowerCase()
  if (!/^0x[0-9a-f]{40}$/.test(normalized)) {
    throw new Error(`Not a valid EVM wallet address: ${address}`)
  }
  return normalized
}

/**
 * `address` is unique per account, so a different Privy user already mirroring
 * this wallet is a conflict we refuse to silently overwrite.
 */
async function throwIfAddressClaimed(
  ctx: MutationCtx,
  address: string,
  privyDid: string,
) {
  const owner = await ctx.db
    .query("users")
    .withIndex("by_address", (q) => q.eq("address", address))
    .unique()

  if (owner !== null && owner.privyDid !== privyDid) {
    throw new Error(`Wallet ${address} is already linked to another account`)
  }
}

export const upsert = internalMutation({
  args: profileFields,
  returns: schema.doc("users"),
  handler: async (ctx, args) => {
    const address = normalizeAddress(args.address)
    const now = Date.now()

    // Only carry over fields the client actually knows, so a later sync can't
    // wipe data an earlier one filled in.
    const profile = {
      ...(args.name !== undefined ? { name: args.name } : {}),
      ...(args.email !== undefined ? { email: args.email } : {}),
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique()

    if (existing !== null) {
      if (existing.address !== address) {
        await throwIfAddressClaimed(ctx, address, args.privyDid)
      }

      await ctx.db.patch("users", existing._id, {
        address,
        updatedAt: now,
        ...profile,
      })
    } else {
      await throwIfAddressClaimed(ctx, address, args.privyDid)

      await ctx.db.insert("users", {
        privyDid: args.privyDid,
        address,
        createdAt: now,
        updatedAt: now,
        ...profile,
      })
    }

    const synced = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique()

    if (synced === null) {
      throw new Error(`User ${args.privyDid} disappeared while syncing`)
    }

    return synced
  },
})
