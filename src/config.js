import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  phantomWallet
} from '@rainbow-me/rainbowkit/wallets';
import { http} from "@wagmi/core";
const localhost = {
  id: 31337,
  name: "Localhost",
  iconUrl: "",
  iconBackground: "#fff",
  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
  blockExplorers: {
    default: { name: "LocalScan", url: "http://127.0.0.1:8545" },
  },
  contracts: {
    orders: "0x5B3120d0dA5FDcBA7aef87A9c3c64829C1c0D76B",
  }
};
const config = getDefaultConfig({
  wallets:[
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, phantomWallet],
    }
  ],
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [localhost],
  transports: {
    [localhost.id]: http(""),

  },
});

export default config