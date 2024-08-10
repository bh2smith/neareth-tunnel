"use client";
import { Core } from "@walletconnect/core";
import { buildApprovedNamespaces } from "@walletconnect/utils";
import { Web3Wallet, Web3WalletTypes } from "@walletconnect/web3wallet";
import { NearEthTxData, NearEthAdapter, signatureFromTxHash, getNetworkId, configFromNetworkId } from "near-ca";
import React, { createContext, useCallback, useContext, useState } from "react";
import { Hex, serializeTransaction } from "viem";
import { supportedNamespaces } from "./utils/constants";


interface WalletContextType {
  web3wallet: InstanceType<typeof Web3Wallet> | null;
  initializeWallet: (uri: string) => void;
  handleRequest: (request: Web3WalletTypes.SessionRequest, adapter: NearEthAdapter) => Promise<NearEthTxData | undefined>;
  respondRequest: (
    request: Web3WalletTypes.SessionRequest,
    nearTxHash: string,
    adapter: NearEthAdapter,
    recovery?: Hex,
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

  const onSessionProposal = useCallback(async ({
    id,
    params, 
    // verifyContext,
  }: Web3WalletTypes.SessionProposal, adapter: NearEthAdapter) => {
    if (!web3wallet) {
      console.warn("No web3wallet available: can not respond to session_proposal");
      return;
    }
    
    await web3wallet.approveSession({
      id: id,
      namespaces: buildApprovedNamespaces({
        proposal: params,
        supportedNamespaces: supportedNamespaces(adapter.address)
      }),
    });
    console.log(`Connected to ${params.proposer.metadata.name}`);
  }, [web3wallet]);

  const handleRequest = useCallback(async (request: Web3WalletTypes.SessionRequest, adapter: NearEthAdapter): Promise<NearEthTxData | undefined> => {
    const txData = await adapter.beta.handleSessionRequest(request);
    if (!(typeof txData.evmMessage === "string")) {
      // Can not stringify `bigint` primitive type.
      txData.evmMessage = serializeTransaction(txData.evmMessage);
    }
    return txData;
  }, []);

  const respondRequest = useCallback(async (
    request: Web3WalletTypes.SessionRequest,
    nearTxHash: string,
    adapter: NearEthAdapter,
    recovery?: Hex
  ) => {
    console.log("Responding to request with txHash", request, nearTxHash);
    if (!web3wallet) {
      return;
    }
    const nearConfig = configFromNetworkId(getNetworkId(adapter.nearAccountId()));
    const signature = await signatureFromTxHash(
      nearConfig.nodeUrl,      
      nearTxHash
    );
    const result = await adapter.beta.respondSessionRequest(signature, recovery);
    console.log("retrieved signature from Near MPC Contract, responding with", result);
    await web3wallet.respondSessionRequest({
      topic: request.topic,
      response: {
        id: request.id,
        jsonrpc: "2.0",
        result,
      },
    });
  }, [web3wallet]);

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
