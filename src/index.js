import { React} from "react";
import { WagmiProvider, createConfig } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./App";
import config from "./config";
import {
  RainbowKitProvider,
  darkTheme
} from "@rainbow-me/rainbowkit";
import ReactDOM from "react-dom/client";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./router";
import reportWebVitals from "./reportWebVitals";
import * as buffer from "buffer";
window.Buffer = buffer.Buffer;






const queryClient = new QueryClient();
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        modalSize="compact"
        // avatar={CustomAvatar}
        locale="en-US"
        theme={darkTheme({
          accentColor: "#4348C6",
          accentColorForeground: "white",
          borderRadius: "small",
        })}
      >
        <Router>
          <App></App>
        </Router>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>

);

reportWebVitals();
