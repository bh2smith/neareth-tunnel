"use client";
import { Core } from "@walletconnect/core";
import Web3Wallet, { Web3WalletTypes } from "@walletconnect/web3wallet";
import { NearEthTxData, NearEthAdapter } from "near-ca";
import React, { createContext, useCallback, useContext, useState } from "react";


interface WalletContextType {
  web3wallet: InstanceType<typeof Web3Wallet> | null;
  initializeWallet: (uri?: string) => Promise<void>;
  handleRequest: (request: Web3WalletTypes.SessionRequest, adapter: NearEthAdapter) => Promise<NearEthTxData | undefined>;
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

  const onSessionProposal = useCallback(async (proposal: Web3WalletTypes.SessionProposal, adapter: NearEthAdapter) => {
    if (!web3wallet) {
      console.warn("No web3wallet available: can not respond to session_proposal");
      return;
    }
    const response = await adapter.beta.approveSession(web3wallet, proposal);
    console.log(`Connected to ${proposal.params.proposer.metadata.name}`);
    console.log(`SessionApproval Response ${response}`);
  }, [web3wallet]);

  const handleRequest = useCallback(async (request: Web3WalletTypes.SessionRequest, adapter: NearEthAdapter): Promise<NearEthTxData | undefined> => {
    return adapter.beta.handleSessionRequest(request);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        web3wallet,
        initializeWallet,
        handleRequest,
        onSessionProposal,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
