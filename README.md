
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


### Disclaimer 

Some of the code presented here was initially developed by our team during a pre-event workshop aimed at engaging developers to build on the Near platform. The objective was to provide the contents of this project as a primitive tooling to facilitate more innovative projects (i.e. practical use cases).

However, the project was not functional before the hackathon, and the majority of the operational code was developed during the hackathon itself. It was intended to advance the project further beyond its current state, a significant amount of time was spent recruiting participants to work with this MVP.

Reference Source Code: https://github.com/Mintbase/near-ca-next-poc
