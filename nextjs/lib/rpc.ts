import { createPublicClient, http } from "viem"
import { monadTestnet } from "@/lib/chain"

/**
 * Read-only Monad Testnet client on the public RPC. Signing and transaction
 * sending always go through Privy; this client exists only so the UI can read
 * on-chain state such as the MON balance without an extra backend round trip.
 */
export const monadTestnetClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
})
