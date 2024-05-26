
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

Link to [Pitch Deck](https://docs.google.com/presentation/d/1dsRlUi8lC62aZKsyKFFZsIdNYKCkXPgy/edit?usp=sharing&ouid=103789527555130141695&rtpof=true&sd=true)

## Successful Transaction Hashes

Cow Swap Trade
https://sepolia.etherscan.io/tx/0xf2b58ebf0490576dbd269cd822e710e9d53d842384fd30c4a99fb0d6424e4b1d

Wrap ETH
https://sepolia.etherscan.io/tx/0xe265f98fcc41336bd6b618b449ce0e5f90643cf5247394bf89f1ba4a3a9d8af8

Approve 
https://sepolia.etherscan.io/tx/0xbe5a1cc674ceede7db5ea0811739cbae22db29fedfea0b843e19eb97027edff4

https://sepolia.etherscan.io/tx/0x0a85c970504ee8edfdf1d432e6237573717f9c29f718868158b7f4f998e307ca
### Security & UX Feature Enhancements

Two important first steps are to:

1. [Use Multisig with Derived Account as Owner](https://github.com/bh2smith/neareth-tunnel/issues/2)
2. [Add Gas Relayer Service](https://github.com/bh2smith/neareth-tunnel/issues/1)

### Disclaimer 

Some of the code presented here was initially developed by our team during a pre-event workshop aimed at engaging developers to build on the Near platform. The objective was to provide the contents of this project as a primitive tooling to facilitate more innovative projects (i.e. practical use cases).

However, the project was not functional before the hackathon, and the majority of the operational code was developed during the hackathon itself. It was intended to advance the project further beyond its current state, a significant amount of time was spent recruiting participants to work with this MVP.

Reference Source Code: https://github.com/Mintbase/near-ca-next-poc
