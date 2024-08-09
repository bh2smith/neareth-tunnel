import { WalletSelector } from "@near-wallet-selector/core";
import {
  NearEthAdapter,
  setupAdapter,
} from "near-ca";

export async function initializeAdapter(
  selector: WalletSelector,
): Promise<NearEthAdapter | undefined> {
  try {
    const nearWallet = await selector.wallet();
    const accounts = await nearWallet.getAccounts();  
    const accountId = accounts[0].accountId;
    const mpcContractId = process.env.NEXT_PUBLIC_NEAR_MULTICHAIN_CONTRACT!
    console.log(accountId, mpcContractId)
    const adapter = await setupAdapter({accountId, mpcContractId});
    console.log(`Instantiated adapter: ${adapter.nearAccountId()} <> ${adapter.address}`);
    return adapter;
  } catch (error: unknown) {
    console.info(`can't build adapter ${error}`);
  }
}
