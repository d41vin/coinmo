import { defineChain, type Address } from "viem"

/**
 * The only chain coinmo is built on. Mainnet is intentionally never
 * configured for users: everything in this app runs on Monad Testnet.
 *
 * Chain parameters follow the official Monad network table
 * (docs.monad.xyz -> developer-essentials/testnet).
 */
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    name: "Testnet MON Token",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
      webSocket: ["wss://testnet-rpc.monad.xyz"],
    },
    public: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "MonadVision", url: "https://testnet.monadvision.com" },
    monadscan: { name: "Monadscan", url: "https://testnet.monadscan.com" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 251449,
    },
  },
  testnet: true,
})

export const MONAD_TESTNET_CHAIN_ID = monadTestnet.id

/** Circle testnet USDC deployed on Monad Testnet. */
export const USDC_ADDRESS: Address =
  "0x534b2f3A21130d7a60830c2Df862319e593943A3"

export const USDC_SYMBOL = "USDC"

/** USDC is always 6 decimals, unlike the 18-decimal MON native token. */
export const USDC_DECIMALS = 6

/** Explorer base for the default Monad Testnet block explorer. */
export const MONAD_TESTNET_EXPLORER_URL =
  monadTestnet.blockExplorers.default.url
