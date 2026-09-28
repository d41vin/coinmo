import { useCallback, useEffect, useState } from "react"
import { formatEther, type Address } from "viem"
import { monadTestnetClient } from "@/lib/rpc"

/** Reads the native MON balance of a Monad Testnet address straight from the RPC. */
export function useMonBalance(address?: Address) {
  const [balance, setBalance] = useState<bigint | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!address) {
      return
    }

    let cancelled = false

    // State only changes once the RPC answers, never synchronously here.
    monadTestnetClient.getBalance({ address }).then(
      (value) => {
        if (cancelled) return
        setBalance(value)
        setError(null)
      },
      (caught: unknown) => {
        if (cancelled) return
        setBalance(null)
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not read the MON balance from Monad Testnet."
        )
      }
    )

    return () => {
      cancelled = true
    }
  }, [address, attempt])

  const refresh = useCallback(() => {
    setBalance(null)
    setError(null)
    setAttempt((current) => current + 1)
  }, [])

  // A read is in flight while we still have neither a balance nor an error.
  const isLoading = address !== undefined && balance === null && error === null

  return {
    balance,
    formatted: balance === null ? null : formatEther(balance),
    error,
    isLoading,
    refresh,
  }
}
