import type { AuthConfig } from "convex/server"

/**
 * Privy is a real Convex identity provider, so `ctx.auth.getUserIdentity()`
 * works inside functions and no Convex function ever verifies a token by hand.
 *
 * What the claims actually look like (Privy issues ES256 JWTs; the installed
 * `@privy-io/node` verifier asserts `issuer: "privy.io"` and
 * `audience: <app id>`, which matches Privy's published token docs):
 *
 * - `iss` is the bare string `privy.io`, not a URL.
 * - `aud` is the Privy app id, so `applicationID` is that app id.
 * - Privy publishes no OIDC discovery document, so the OIDC-style
 *   `{ domain, applicationID }` provider cannot be used: Convex would look for
 *   `https://auth.privy.io/.well-known/openid-configuration`, which 404s.
 *
 * The `customJwt` provider shape takes the issuer and the JWKS URL directly and
 * needs no discovery document. The JWKS endpoint below is public and
 * unauthenticated (it only ever contains signing public keys), which is what lets
 * Convex verify signatures without the app secret. It is the same URL
 * `@privy-io/node` uses internally to resolve a token's `kid`; `auth.privy.io`
 * serves identical keys under `/api/v1/apps/<id>/jwks.json`.
 *
 * The app id is public (it is the same value as `NEXT_PUBLIC_PRIVY_APP_ID`,
 * which ships in the browser bundle), but it is still read from the deployment
 * environment rather than hardcoded, so no environment value lands in git.
 * Convex evaluates this file with the deployment's own environment variables,
 * which is why the variable here is `PRIVY_APP_ID` (set with `convex env set`,
 * declared in `convex.config.ts`) and not the Next.js-prefixed one.
 *
 * Checked against the live dev deployment: a token with this issuer and
 * audience reaches Convex's key resolution step, while a wrong `iss` or a wrong
 * `aud` is refused with "No auth provider found matching the given token",
 * listing this provider. Completing the last step (signature verification) needs
 * a real Privy session.
 */
const privyAppId = process.env.PRIVY_APP_ID

if (!privyAppId) {
  throw new Error(
    "PRIVY_APP_ID must be set in the Convex deployment environment, because " +
      "the Privy issuer metadata in convex/auth.config.ts depends on it."
  )
}

export default {
  providers: [
    {
      type: "customJwt",
      issuer: "privy.io",
      jwks: `https://api.privy.io/v1/apps/${privyAppId}/jwks.json`,
      algorithm: "ES256",
      applicationID: privyAppId,
    },
  ],
} satisfies AuthConfig
