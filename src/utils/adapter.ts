import { WalletSelector } from "@near-wallet-selector/core";
import {
  NearEthAdapter,
  setupAdapter,
} from "near-ca";

export async function initializeAdapter(
  selector: WalletSelector,
): Promise<NearEthAdapter> {
  const nearWallet = await selector.wallet();
  const accounts = await nearWallet.getAccounts();
  console.log(accounts[0].accountId)
  return setupAdapter({
    accountId: accounts[0]!.accountId,
    network: {networkId: "testnet", nodeUrl: "https://rpc.testnet.near.org"},
    mpcContractId: process.env.NEXT_PUBLIC_NEAR_MULTICHAIN_CONTRACT!
  });
}
