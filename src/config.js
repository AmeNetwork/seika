import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  phantomWallet
} from '@rainbow-me/rainbowkit/wallets';
import { http} from "@wagmi/core";
import { seiTestnet,sepolia} from 'wagmi/chains';
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
    orders: "0xc8c25Aab3eeA991E083d2d0240eE4D693c59bDAC",
  }
};
seiTestnet.contracts={
  orders:"0x104e49Da71C3F919105709e1Ad38b6ED33f6fBb7"
}
const config = getDefaultConfig({
  wallets:[
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, phantomWallet],
    }
  ],
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [seiTestnet],
  transports: {
    [seiTestnet.id]: http(""),

  },

});

export default config