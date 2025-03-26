import crypto from "crypto";
import CryptoJS from "crypto-js";
import { Wallet } from "ethers";
import { MASTER_PASS } from "../constants/env";
import PrivateKey from "../models/PrivateKey";
import { v4 as uuidv4 } from "uuid";

export async function createNewWallet(
  userId: number,
  amount: number,
  tokenAddress?: string
) {
  const newWallets: {
    address: string;
    walletName: string;
    privateKey: string;
  }[] = [];
  const walletName = uuidv4();
  for (let i = 0; i < amount; i++) {
    const id = crypto.randomBytes(32).toString("hex");
    const privateKey_ = "0x" + id;
    if (!MASTER_PASS) {
      console.log("No MASTER PASS");
      throw new Error("No MASTER PASS");
    }
    console.log("START Save Wallet");

    const privateKey = CryptoJS.AES.encrypt(privateKey_, MASTER_PASS);
    const wallet = new Wallet(privateKey_);
    const pk = await PrivateKey.create({
      privateKey,
      userId,
      address: wallet.address,
      walletName,
    });

    console.log("Address: " + wallet.address);
    if (!pk.privateKey) {
      throw new Error("Faild Save Privet Key to DB");
    }
    newWallets.push({
      address: wallet.address,
      walletName,
      privateKey: privateKey_,
    });
  }
  return newWallets;
}
