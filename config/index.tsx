import { cookieStorage, createStorage, http } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  mainnet,
  arbitrum,
  scroll,
  scrollSepolia,
} from "@reown/appkit/networks";

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Update RPC URLs for networks
const networks = [
  {
    ...scrollSepolia,
    rpcUrls: {
      ...scrollSepolia.rpcUrls,
      default: {
        http: ['https://sepolia-rpc.scroll.io'] // Use Scroll's public RPC
      }
    }
  },
  mainnet,
  arbitrum,
  scroll
];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
