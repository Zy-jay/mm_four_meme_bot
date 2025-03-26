import CryptoJS from "crypto-js";
import { Provider, Wallet } from "ethers";
import { MASTER_PASS } from "../constants/env";

export const getWallet = (encryptPrivateKey: string, provider?: Provider) => {
  if (!MASTER_PASS) {
    throw new Error("No Master pass :(");
  }
  // const privateKey = process.env.WALLET_PRIVATE_KEY
  if (!encryptPrivateKey) {
    throw new Error("No private key found in db");
  }
  const privateKey = CryptoJS.AES.decrypt(encryptPrivateKey, MASTER_PASS);
  // const provider = new ethers.JsonRpcProvider(RPC_URLS.BSC_tn)
  return new Wallet(privateKey.toString(CryptoJS.enc.Utf8), provider ?? null);
};
