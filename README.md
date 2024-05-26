
# Near<>ETH Tunnel

This project is the first end-to-end functional front-end implementation of a Near wallet that can interact with any EVM dApp using Chain Signature (via Wallet Connect). Having this tunnel allows Near Wallets to seamlessly connect to and interact with any EVM dApp and sign transaction payloads from their Near Wallet (supports eth_sign, personal_sign, eth_signTypedData_v* and eth_sendTransaction).

Run 
```sh
cp .env.example .env
# Need to add NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID env var.
yarn dev 
```

Submitted to Infrastructure / User Experience category at ETH Berlin 2024: 

https://projects.ethberlin.org/submissions/320
