import { WalletSelector } from "@near-wallet-selector/core";
import { NearSafe } from "near-safe";

export async function initializeAdapter(
  selector: WalletSelector,
): Promise<NearSafe | undefined> {
  try {
    const nearWallet = await selector.wallet();
    const accounts = await nearWallet.getAccounts();  
    const accountId = accounts[0].accountId;
    const mpcContractId = process.env.NEXT_PUBLIC_NEAR_MULTICHAIN_CONTRACT!
    console.log(accountId, mpcContractId)
    const adapter = await NearSafe.create({
      accountId,
      mpcContractId,
      pimlicoKey: process.env.PIMLICO_KEY!
    })
    return adapter;
  } catch (error: unknown) {
    console.info(`can't build adapter ${error}`);
  }
}
