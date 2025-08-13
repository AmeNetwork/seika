import "./App.css";

import { useEffect, useState } from "react";

import { ConnectButton } from "@rainbow-me/rainbowkit";

import Orders from "./component/Orders";



function App() {
  return (
    <div className="App">
      <Orders></Orders>
      <ConnectButton
        chainStatus="name"
        showBalance={{
          smallScreen: false,
          largeScreen: false,
        }}
        label="Connect Wallet"
      />
    </div>
  );
}

export default App;
