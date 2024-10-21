"use client";
import { useCallback, useEffect, useState, Suspense } from "react";
import { useMbWallet } from "@mintbase-js/react";
import { Web3WalletTypes } from "@walletconnect/web3wallet";
import { useWalletConnect } from "@/WalletConnectProvider";
import { useRouter, useSearchParams } from "next/navigation";
import {EncodedTxData, NearSafe, } from "near-safe";
import { initializeAdapter } from "@/utils/adapter";

const EthAdapter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionHashes = searchParams?.get('transactionHashes');
  const txDataString = searchParams?.get('txData');
  const [uri, setUri] = useState("");
  const [txData, setTxData] = useState<EncodedTxData>();
  const [request, setRequest] = useState<Web3WalletTypes.SessionRequest>();
  const [adapter, setAdapter] = useState<NearSafe>();
  const { initializeWallet, web3wallet, handleRequest, onSessionProposal, respondRequest } = useWalletConnect();
  const { selector } = useMbWallet();
  const triggerNearTx = useCallback(async (txData: EncodedTxData) => {
    try {
      const wallet = await selector.wallet();
        console.log("Triggering Near Tx on wallet", txData, wallet);
        wallet.signAndSendTransaction({
          ...txData.nearPayload,
          callbackUrl: `http://localhost:3000?txData=${JSON.stringify(txData)}`
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
    if (transactionHashes) {
      return;
    }
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
        setRequest(request)
        console.log("set txData in local storage and state");
      };
      web3wallet.on("session_proposal", handleSessionProposal);
      web3wallet.on("session_request", handleSessionRequest);
      return () => {
        web3wallet.off("session_proposal", handleSessionProposal);
        web3wallet.off("session_request", handleSessionRequest);
      };
    }
  }, [web3wallet, handleRequest, onSessionProposal, triggerNearTx, adapter, transactionHashes]);

  useEffect(() => {
    if (uri) localStorage.setItem("wc-uri", uri);
  }, [uri]);

  useEffect(() => {
    const handleRequestResponse = async () => {
      if (!adapter) { 
        await connectEvm();
      };
      if (transactionHashes && txDataString) {
        const nearTxHash = Array.isArray(transactionHashes) ? transactionHashes[0] : transactionHashes;
        console.log('Near Tx Hash from URL:', nearTxHash);
        const requestString = localStorage.getItem("wc-request");
        if (!requestString) {
          console.error("one of txData or request is not in local storage!", requestString);
          return;
        }
        const tx: EncodedTxData = JSON.parse(txDataString);
        const request = JSON.parse(requestString) as Web3WalletTypes.SessionRequest;
        try {
          await respondRequest(request, tx, nearTxHash, adapter!);
          localStorage.removeItem("wc-request");
          localStorage.removeItem("txData");
          setTxData(undefined)
          console.log()
          router.replace(window.location.pathname);
        } catch (error) {
          console.error("Error responding to request:", error);
        }
      }
    };
    handleRequestResponse();
  }, [transactionHashes, txDataString, respondRequest, router, adapter, connectEvm]);

  const rejectRequest = (request: Web3WalletTypes.SessionRequest): void => {
    if (!web3wallet) {
      console.warn("No web3wallet available: can not respond to session_proposal");
      return;
    }
    localStorage.removeItem("wc-request");
    localStorage.removeItem("txData");
    setRequest(undefined);
    setTxData(undefined);
    web3wallet.respondSessionRequest({
      topic: request.topic,
      response: {
        id: request.id,
        jsonrpc: '2.0',
        error: {
          code: 5000,
          message: 'User rejected.'
        }
      }
    });
  };
  return (
    <div className="mx-6 sm:mx-24 mt-4 mb-4">
      <div className="w-full flex flex-col justify-center items-center">
        <div className="w-full flex flex-col justify-center items-center space-y-8">
          <h1 className="text-[40px]">Connect to Dapp via Wallet Connect Below</h1>
          <div className="flex flex-col justify-center items-center space-y-4">
          </div>
          <div className="flex flex-col justify-center items-center space-y-4">
            <button
              onClick={connectEvm}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300"
            >
              Connect EVM
            </button>
            {adapter && (
              <div className="mt-4 p-4 border rounded bg-gray-900">
                <div>Adapter: {adapter.address}</div>
              </div>
            )}
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
              className='text-gray-800 p-2 rounded border border-gray-300'
            />
            <button type='submit'>Connect</button>
      </form>
      {txData && request && (
              <>
                <div className="bg-gray-100 p-4 rounded shadow-md w-full max-w-xl">
                  <h2 className="text-xl font-semibold mb-5">Transaction Data</h2>
                  <pre className="text-left whitespace-pre-wrap break-all">{JSON.stringify(txData, null, 2)}</pre>
                </div>
                <button
                  onClick={() => triggerNearTx(txData)}
                  className="px-4 py-2 bg-blue-500 text-black rounded hover:bg-blue-700 transition duration-300"
                >
                  Sign on Near
                </button>
                <button
                  onClick={() => rejectRequest(request)}
                  className="px-4 py-2 bg-blue-500 text-black rounded hover:bg-blue-700 transition duration-300"
                >
                  REJECT
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default function EthAdapterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EthAdapter />
    </Suspense>
  );
}