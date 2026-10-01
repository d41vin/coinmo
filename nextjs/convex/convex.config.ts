import { defineApp } from "convex/server"
import { v } from "convex/values"
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js"

/**
 * Privy credentials live in the Convex deployment environment, not in the
 * client bundle: set them with
 *   npx convex env set PRIVY_APP_ID <id>
 *   npx convex env set PRIVY_APP_SECRET <secret>
 *
 * The rate-limiter component is mounted once and shared by every guarded
 * action; `convex/friends.ts` creates its instance from `components.rateLimiter`.
 */
const app = defineApp({
  env: {
    PRIVY_APP_ID: v.string(),
    PRIVY_APP_SECRET: v.string(),
  },
})

app.use(rateLimiter)

export default app
