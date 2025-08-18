import axios from "axios";
import { useState, useEffect } from "react";
import "./cctp.css";
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
  getChains,
  getAccount,
  switchChain,
  getWalletClient,
  getChainId,
  connect,
} from "@wagmi/core";
import { Pagination, ConfigProvider, Input, InputNumber, Modal } from "antd";
import { formatUnits,parseUnits } from "viem";
import config from "../../config";
import cctpConfig from "./cctpConfig.json";
function CCTP() {
  const [balance, setBalance] = useState([0, 0]);
  const [transferValue, setTransferValue] = useState("");

  useEffect(() => {
    async function fetchData() {
      await get_usdc_balance();
    }
    fetchData();
  }, []);

  const transfer = async () => {
    //switch to sepolia
    const chains = getChains(config);
    await switchChain(config, { chainId: chains[1].id });

    const account = getAccount(config);
    const DESTINATION_ADDRESS = account.address;
    const AMOUNT = parseUnits(transferValue.toString(), 6) ;
    const maxFee = 500n; //
    const DESTINATION_ADDRESS_BYTES32 = `0x000000000000000000000000${DESTINATION_ADDRESS.slice(
      2
    )}`;
    const DESTINATION_CALLER_BYTES32 =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    const allowance = await readContract(config, {
      address: cctpConfig.sepolia.USDC,
      abi: [
        {
          type: "function",
          name: "allowance",
          stateMutability: "view",
          inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
          ],
          outputs: [{ name: "", type: "uint256" }],
        },
      ],
      functionName: "allowance",
      args: [account.address, cctpConfig.sepolia.TOKEN_MESSENGER],
    });
    if (parseInt(allowance) < AMOUNT) {
      const txhash = await writeContract(config, {
        address: cctpConfig.sepolia.USDC,
        abi: [
          {
            type: "function",
            name: "approve",
            stateMutability: "nonpayable",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          },
        ],
        functionName: "approve",
        args: [cctpConfig.sepolia.TOKEN_MESSENGER, AMOUNT],
      });
      const receipt = await waitForTransactionReceipt(config, {
        hash: txhash,
      });
      console.log(receipt);
      if (receipt.status === "success") {
        console.log("Transaction successful!");
      } else {
        console.log("Transaction failed.");
      }
    }

    const txhash = await writeContract(config, {
      address: cctpConfig.sepolia.TOKEN_MESSENGER,
      abi: [
        {
          type: "function",
          name: "depositForBurn",
          stateMutability: "nonpayable",
          inputs: [
            { name: "amount", type: "uint256" },
            { name: "destinationDomain", type: "uint32" },
            { name: "mintRecipient", type: "bytes32" },
            { name: "burnToken", type: "address" },
            { name: "destinationCaller", type: "bytes32" },
            { name: "maxFee", type: "uint256" },
            { name: "minFinalityThreshold", type: "uint32" },
          ],
          outputs: [],
        },
      ],
      functionName: "depositForBurn",
      args: [
        AMOUNT,
        cctpConfig.seiTestnet.DOMAIN,
        DESTINATION_ADDRESS_BYTES32,
        cctpConfig.sepolia.USDC,
        DESTINATION_CALLER_BYTES32,
        maxFee,
        0, // minFinalityThreshold (1000 or less for Fast Transfer)
      ],
    });


    const receipt = await waitForTransactionReceipt(config, {
      hash: txhash,
    });

    if (receipt.status === "success") {
      console.log("depositForBurn successful!");
    } else {
      console.log("depositForBurn failed.");
    }

    const attestation_result = await query(txhash);

    await switchChain(config, { chainId: chains[2].id });

    while (true) {
      try {
        const walletClient = await getWalletClient(config);
        if (walletClient.chain.id === chains[2].id) {
          break;
        }
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    await mint(attestation_result);

    await get_usdc_balance();
  };
  const query = async (transactionHash) => {
    const url = `https://iris-api-sandbox.circle.com/v2/messages/${cctpConfig.sepolia.DOMAIN}?transactionHash=${transactionHash}`;
    while (true) {
      try {
        const response = await axios.get(url);
        if (response.status === 404) {
          console.log("Waiting for attestation...");
        }
        if (response.data?.messages?.[0]?.status === "complete") {
          console.log("Attestation retrieved successfully!");
          return response.data.messages[0];
        }
        console.log("Waiting for attestation...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.error("Error fetching attestation:", error.message);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  };

  const mint = async (_attestation) => {
    const txhash = await writeContract(config, {
      address: cctpConfig.seiTestnet.MESSAGE_TRANSMITTER,
      abi: [
        {
          type: "function",
          name: "receiveMessage",
          stateMutability: "nonpayable",
          inputs: [
            { name: "message", type: "bytes" },
            { name: "attestation", type: "bytes" },
          ],
          outputs: [],
        },
      ],
      functionName: "receiveMessage",
      args: [_attestation.message, _attestation.attestation],
    });
    console.log(txhash);
    const receipt = await waitForTransactionReceipt(config, {
      hash: txhash,
    });
    console.log(receipt);
    if (receipt.status === "success") {
      console.log("Transaction successful!");
    } else {
      console.log("Transaction failed.");
    }
  };

  const get_usdc_balance = async () => {
    const account = getAccount(config);
    const chains = getChains(config);

    const sepolia_usdc_balance = await readContract(config, {
      address: cctpConfig.sepolia.USDC,
      abi: [
        {
          type: "function",
          name: "balanceOf",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ],
      functionName: "balanceOf",
      args: [account.address],
      chainId: chains[1].id,
    });

    const sei_usdc_balance = await readContract(config, {
      address: cctpConfig.seiTestnet.USDC,
      abi: [
        {
          type: "function",
          name: "balanceOf",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ],
      functionName: "balanceOf",
      args: [account.address],
      chainId: chains[2].id,
    });

    setBalance([
      formatUnits(sepolia_usdc_balance, 6),
      formatUnits(sei_usdc_balance, 6),
    ]);
  };
  return (
    <div>
      <div className="cctp_usdc_info">
        <div className="cctp_sepolia_usdc">
          Sepolia USDC Balance:{balance[0]} usdc
        </div>
        <div className="cctp_sei_usdc">Sei USDC Balance:{balance[1]} usdc</div>
        <ConfigProvider
          theme={{
            token: {
              colorBgContainer: "#202225",
              activeShadow: "#000",
            },
          }}
        >
          <InputNumber
            placeholder="transfer USDC from Sepolia to Sei testnet"
            controls={false}
            className="transfer_input_bg"
            type="number"
            suffix="USDC"
            value={transferValue}
            onChange={(e) => setTransferValue(e)}
          />
        </ConfigProvider>
      </div>

      <button onClick={transfer}>Transfer</button>
    </div>
  );
}
export default CCTP;
