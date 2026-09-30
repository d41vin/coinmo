"use node"

import { v } from "convex/values"
import { PrivyClient } from "@privy-io/node"
import { internal } from "./_generated/api"
import { action, env } from "./_generated/server"
import type { Doc } from "./_generated/dataModel"

/**
 * Privy publishes no first-party Convex integration, so the identity bridge is
 * an ordinary public action: the client passes its Privy access token, and we
 * verify that token server-side with the app secret before writing anything.
 * The DID always comes from the verified token, never from a client argument.
 *
 * Phase 1 deliberately stops here. There is no `convex/auth.config.ts` JWT
 * issuer and no extra Next API route: `ctx.auth.getUserIdentity()` stays
 * unused until we decide how per-function identity checks should evolve. The
 * wallet `address` is mirrored from the client's session and ownership proofs
 * (e.g. a signature challenge) come with a later phase.
 */
export const syncUser = action({
  args: {
    accessToken: v.string(),
    profile: v.object({
      address: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args): Promise<Doc<"users">> => {
    const privy = new PrivyClient({
      appId: env.PRIVY_APP_ID,
      appSecret: env.PRIVY_APP_SECRET,
    })

    const claims = await privy
      .utils()
      .auth()
      .verifyAccessToken(args.accessToken)

    return await ctx.runMutation(internal.users.upsert, {
      privyDid: claims.user_id,
      address: args.profile.address,
      email: args.profile.email,
      displayName: args.profile.name,
    })
  },
})
