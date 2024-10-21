import { WalletSelector } from "@near-wallet-selector/core";
import { NearSafe } from "near-safe";

export async function initializeAdapter(
  selector: WalletSelector,
): Promise<NearSafe | undefined> {
  try {
    console.log("initializeAdapter");
    const nearWallet = await selector.wallet();
    const accounts = await nearWallet.getAccounts();
    const accountId = accounts[0].accountId;
    const mpcContractId = process.env.NEXT_PUBLIC_NEAR_MULTICHAIN_CONTRACT!;
    const pimlicoKey = process.env.NEXT_PUBLIC_PIMLICO_KEY!;

    console.log(accountId, mpcContractId);
    return NearSafe.create({
      accountId,
      mpcContractId,
      pimlicoKey,
    });
  } catch (error: unknown) {
    throw new Error(`can't build adapter ${error}`);
  }
}
