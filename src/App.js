import "./App.css";
import "@sei-js/sei-global-wallet/eip6963";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import logo from "./images/logo.png";
import { Pagination, ConfigProvider, Input, InputNumber, Modal } from "antd";
import { BrowserRouter as Router, Routes, Route ,Link} from "react-router-dom";

import routes from "./router";
function Orders() {
  return (
    <div className="app">
      <Router>
        <div className="app_main">
          <div className="app_header">
            <div className="logo">
              <img src={logo} alt="logo" width={80} className="logo_img" />
            </div>
            <div className="app_nav">
              <Link to="/">
                <div>Tasks</div>
              </Link>
              <Link to="/launchpad">
                <div>Launchpad</div>
              </Link>
            </div>
            <ConnectButton
              chainStatus="name"
              showBalance={{
                smallScreen: false,
                largeScreen: false,
              }}
              label="Connect Wallet"
            />
          </div>
          <Routes>
            {routes.map((item, index) => (
              <Route key={index} path={item.path} element={item.element} />
            ))}
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default Orders;
