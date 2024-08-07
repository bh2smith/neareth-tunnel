"use client";
import { Core } from "@walletconnect/core";
import { buildApprovedNamespaces } from "@walletconnect/utils";
import { Web3Wallet, Web3WalletTypes } from "@walletconnect/web3wallet";
import { NearEthTxData, NearEthAdapter, signatureFromTxHash, addSignature, Network } from "near-ca";
import React, { createContext, useContext, useState } from "react";
import { keccak256, parseTransaction, serializeSignature, serializeTransaction } from "viem";


interface WalletContextType {
  web3wallet: InstanceType<typeof Web3Wallet> | null;
  initializeWallet: (uri: string) => void;
  handleRequest: (request: Web3WalletTypes.SessionRequest, adapter: NearEthAdapter) => Promise<NearEthTxData | undefined>;
  respondRequest: (
    request: Web3WalletTypes.SessionRequest,
    txData: NearEthTxData,
    nearTxHash: string,
  ) => Promise<void>;
  onSessionProposal: (request: Web3WalletTypes.SessionProposal, adapter: NearEthAdapter) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletConnect = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletConnectProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [web3wallet, setWeb3Wallet] = useState<InstanceType<
    typeof Web3Wallet
  > | null>(null);

  const initializeWallet = async (uri?: string) => {
    const core = new Core({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    });

    const web3wallet = await Web3Wallet.init({
      core,
      metadata: {
        name: "Bitte Wallet by Mintbase",
        description: "Near Wallet Connect to EVM.",
        url: "wallet.bitte.ai",
        icons: [],
      },
    });
    setWeb3Wallet(web3wallet);
    
    // Attempt to pair using the provided URI
    if (uri) {
      try {
        await web3wallet.pair({ uri });
      } catch (error) {
        console.warn("Pairing may already exist:", error);
      }
    }
  };

  const onSessionProposal = async ({
    id,
    params, 
    // verifyContext,
  }: Web3WalletTypes.SessionProposal, adapter: NearEthAdapter) => {
    if (!web3wallet) {
      console.warn("No web3wallet available: can not respond to session_proposal");
      return;
    }
    const supportedChainIds = [1, 100, 11155111];
    // TODO - This big gross thing could live in near-ca:
    // cf: https://github.com/Mintbase/near-ca/issues/47
    const approvedNamespaces = buildApprovedNamespaces({
      proposal: params,
      supportedNamespaces: {
        eip155: {
          chains: supportedChainIds.map((id) => `eip155:${id}`),
          methods: [
            // "eth_accounts",
            // "eth_requestAccounts",
            "eth_sendRawTransaction",
            "eth_sign",
            "eth_signTransaction",
            "eth_signTypedData",
            "eth_signTypedData_v3",
            "eth_signTypedData_v4",
            "eth_sendTransaction",
            "personal_sign",
            // "wallet_switchEthereumChain",
            // "wallet_addEthereumChain",
            // "wallet_getPermissions",
            // "wallet_requestPermissions",
            // "wallet_registerOnboarding",
            // "wallet_watchAsset",
            // "wallet_scanQRCode",
            // "wallet_sendCalls",
            // "wallet_getCallsStatus",
            // "wallet_showCallsStatus",
            // "wallet_getCapabilities",
          ],
          events: [
            "chainChanged",
            "accountsChanged",
            "message",
            "disconnect",
            "connect",
          ],
          accounts: supportedChainIds.map(
            (id) => `eip155:${id}:${adapter.address}`
          ),
        },
      },
    });
    await web3wallet.approveSession({
      id: id,
      namespaces: approvedNamespaces,
    });
    console.log("Connected!");
    // web3wallet!.on("session_request", handleRequest);
  };

  const handleRequest = async (request: Web3WalletTypes.SessionRequest, adapter: NearEthAdapter): Promise<NearEthTxData | undefined> => {
    // set wc-request to storage (it will be lost after signing)
    localStorage.setItem("wc-request", JSON.stringify(request));
    if (!web3wallet) {
      console.error("handleRequest: web3wallet is undefined", web3wallet);
    }
    console.log("SessionRequest", JSON.stringify(request));
    const txData = await adapter.handleSessionRequest(request);
    
    // Can not stringify `bigint` primitive type.
    if (!(typeof txData.evmMessage === "string")) {
      txData.evmMessage = serializeTransaction(txData.evmMessage);
    }
    return txData;
  };

  const respondRequest = async (
    request: Web3WalletTypes.SessionRequest, 
    txData: NearEthTxData,
    nearTxHash: string,
  ) => {
    const {recoveryData} = txData;
    console.log("Responding to request", request, nearTxHash);
    if (!web3wallet) {
      console.warn("respondRequest: web3wallet undefined", web3wallet);
      await initializeWallet()
      console.warn("respondRequest: Should now be defined!", web3wallet);
    }
    
    const signature = await signatureFromTxHash(
      "https://rpc.testnet.near.org",
      nearTxHash
    );
    console.log("retrieved signature from Near MPC Contract", signature);
    let result = serializeSignature(signature);
    // Update near-ca after: https://github.com/Mintbase/near-ca/pull/89
    if (request.params.request.method === "eth_sendTransaction") {
      const serializedTransaction = addSignature({
        transaction: recoveryData.data as `0x${string}`,
        signature,
      });
      // Returns relayed transaction hash (without waiting for confirmation).
      const tx = parseTransaction(serializedTransaction);
      const network = Network.fromChainId(tx.chainId!);
      network.client.sendRawTransaction({
        serializedTransaction,
      });
      result = keccak256(serializedTransaction);
    }
    await web3wallet!.respondSessionRequest({
      topic: request.topic,
      response: {
        id: request.id,
        jsonrpc: "2.0",
        result,
      },
    });
    console.log("Responded to request!");
  };

  return (
    <WalletContext.Provider
      value={{
        web3wallet,
        initializeWallet,
        handleRequest,
        respondRequest,
        onSessionProposal,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
