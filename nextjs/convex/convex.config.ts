import { defineApp } from "convex/server"
import { v } from "convex/values"

/**
 * Privy credentials live in the Convex deployment environment, not in the
 * client bundle: set them with
 *   npx convex env set PRIVY_APP_ID <id>
 *   npx convex env set PRIVY_APP_SECRET <secret>
 */
export default defineApp({
  env: {
    PRIVY_APP_ID: v.string(),
    PRIVY_APP_SECRET: v.string(),
  },
})
