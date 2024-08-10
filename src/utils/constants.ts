const supportedChainIds = [1, 100, 11155111];
const supportedMethods = [
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
];
const supportedEvents = [
  "chainChanged",
  "accountsChanged",
  "message",
  "disconnect",
  "connect",
];

export const supportedNamespaces = (address: string) => { 
  return {
    eip155: {
      chains: supportedChainIds.map((id) => `eip155:${id}`),
      methods: supportedMethods,
      events: supportedEvents,
      accounts: supportedChainIds.map(
        (id) => `eip155:${id}:${address}`
      ),
    }
  };
}
