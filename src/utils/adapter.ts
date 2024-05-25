import { WalletSelector } from "@near-wallet-selector/core";
import {
  MultichainContract,
  NearEthAdapter,
  nearAccountFromWallet,
} from "near-ca";

export async function initializeAdapter(
  selector: WalletSelector,
): Promise<NearEthAdapter> {
  const nearWallet = await selector.wallet();
  const account = await nearAccountFromWallet(nearWallet);
  const adapter = await NearEthAdapter.fromConfig({
    mpcContract: new MultichainContract(
      account,
      process.env.NEXT_PUBLIC_NEAR_MULTICHAIN_CONTRACT!,
    ),
    derivationPath: "ethereum,1",
  });
  return adapter;
}
