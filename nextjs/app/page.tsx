import { LandingCta } from "@/components/landing-cta"

/** Signed-out landing page. No redirect: the CTA handles auth state. */
export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          Stablecoin payments on Monad
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance">
          Move money with coinmo.
        </h1>
        <p className="leading-relaxed text-pretty text-muted-foreground">
          Send, request, and split USDC on Monad Testnet — no wallet jargon
          required.
        </p>
      </div>

      <LandingCta />
    </main>
  )
}
