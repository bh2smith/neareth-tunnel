"use client";
import { useCallback, useEffect, useState } from "react";
import { useMbWallet } from "@mintbase-js/react";
import { Web3WalletTypes } from "@walletconnect/web3wallet";
import { NearEthTxData, useWalletConnect } from "@/WalletConnectProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { NearEthAdapter } from "near-ca";
import { initializeAdapter } from "@/utils/adapter";

export const EthAdapter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionHashes = searchParams?.get('transactionHashes');
  const [uri, setUri] = useState("");
  const [txData, setTxData] = useState<NearEthTxData>();
  const [adapter, setAdapter] = useState<NearEthAdapter>();
  const { initializeWallet, web3wallet, handleRequest, onSessionProposal, respondRequest } = useWalletConnect();
  const { selector } = useMbWallet();

  const triggerNearTx = useCallback(async (txData: NearEthTxData) => {
    try {
      const wallet = await selector.wallet();
        console.log("Triggering Near Tx on wallet", txData, wallet);
        wallet.signAndSendTransaction({
          ...txData.nearPayload
        });
    } catch (err: unknown) {
      console.error("Cannot connect to EVM without Near wallet connection!", (err as Error).message);
    }
  }, [selector]);

  const connectEvm = useCallback(async () => {
    if (!selector) {
      return;
    }
    if (!adapter) {
      const adapter = await initializeAdapter(selector);
      setAdapter(adapter)
    }
  }, [adapter, selector]);
  
  useEffect(() => {
    if (web3wallet && adapter) {
      const handleSessionProposal = async (request: Web3WalletTypes.SessionProposal) => {
        console.log("Received session_proposal");
        onSessionProposal(request, adapter!);
      };
      const handleSessionRequest = async (request: Web3WalletTypes.SessionRequest) => {
        console.log("Received session_request", request);
        const txData = await handleRequest(request, adapter);
        localStorage.setItem("txData", JSON.stringify(txData));
        setTxData(txData)
        if (!txData) {
          return;
        }
      };
      web3wallet.on("session_proposal", handleSessionProposal);
      web3wallet.on("session_request", handleSessionRequest);
      return () => {
        web3wallet.off("session_proposal", handleSessionProposal);
        web3wallet.off("session_request", handleSessionRequest);
      };
    }
  }, [web3wallet, handleRequest, onSessionProposal, triggerNearTx, adapter]);

  useEffect(() => {
    if (uri) localStorage.setItem("wc-uri", uri);
  }, [uri]);

  useEffect(() => {
    const handleRequestResponse = async () => {
      if (!adapter) await connectEvm();
      if (transactionHashes) {
        const nearTxHash = Array.isArray(transactionHashes) ? transactionHashes[0] : transactionHashes;
        console.log('Near Tx Hash from URL:', nearTxHash);
        let txDataString = localStorage.getItem("txData");
        const requestString = localStorage.getItem("wc-request");
        if (!txDataString || !requestString) {
          console.error("One of TxData or request not in local storage!");
          return;
        }
        const txData = JSON.parse(txDataString) as NearEthTxData;
        const request = JSON.parse(requestString) as Web3WalletTypes.SessionRequest;
        try {
          await respondRequest(request, txData, nearTxHash, adapter!);
          router.replace(window.location.pathname);
        } catch (error) {
          console.error("Error responding to request:", error);
        }
      }
    };
    handleRequestResponse();
  }, [transactionHashes, respondRequest, router, adapter, connectEvm]);

  return (
    <div className="mx-6 sm:mx-24 mt-4 mb-4">
      <div className="w-full flex flex-col justify-center items-center">
        <div className="w-full flex flex-col justify-center items-center space-y-8">
          <h1 className="text-[40px]">Connect to Dapp via Wallet Connect Below</h1>
          <div className="flex flex-col justify-center items-center space-y-4">
          </div>
          <div className='flex flex-col items-center'>
            <form
              className='flex flex-col items-center'
              onSubmit={(e) => {
                e.preventDefault(); // Prevent the default form submit behavior
                initializeWallet(uri); // Use the URI from state when the form is submitted
              }}
            >
            <input
              type='text'
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder='Enter WalletConnect URI'
              required // Makes sure the input is not empty
            />
            <button type='submit'>Connect</button>
      </form>
      {txData && (
              <>
                <div className="bg-gray-100 p-4 rounded shadow-md w-full max-w-xl">
                  <h2 className="text-xl font-semibold mb-2">Transaction Data</h2>
                  <pre className="text-left whitespace-pre-wrap break-all">{JSON.stringify(txData, null, 2)}</pre>
                </div>
                <button
                  onClick={() => triggerNearTx(txData)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
                >
                  Sign on Near
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
