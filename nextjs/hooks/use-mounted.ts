"use client"

import { useSyncExternalStore } from "react"

const emptySubscribe = () => () => {}

/**
 * `false` on the server and during hydration, `true` once the tree is live in
 * the browser. Anything that can only be known client-side — the resolved
 * theme, the time of day — renders a neutral fallback until this flips, which
 * keeps the server and client markup identical.
 */
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
