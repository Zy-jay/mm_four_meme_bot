import { ethers } from "ethers";
import { randomChoice } from "./utils/randomChoice";
import { ALL_RPC_URLS } from "../constants/chains";

export const getEthersProvider = (chainId: number) => {
  const url = randomChoice(ALL_RPC_URLS[chainId] ?? []);
  if (!url) throw new Error("No RPC URL found");
  const provider = new ethers.JsonRpcProvider(url);

  provider.on("error", (error) => {
    console.error("Provider error", error);
    provider.destroy();
  });
  return provider;
};

