import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, avalancheFuji, polygon, arbitrum, base } from "wagmi/chains";

// Tambahkan kembali sepolia ke daftar chains
export const chains = [sepolia, avalancheFuji, polygon, arbitrum, base];

export const wagmiConfig = getDefaultConfig({
  appName: "TrustFill",
  projectId: "32bde04464e6b2239eb2d2c8e85457f2",
  chains,
  ssr: true,
});
