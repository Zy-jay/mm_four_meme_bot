import { ethers } from "ethers";
import { getEthersProvider } from "./getProvider";

export const getTokenInfo = async (chainId: number, address: string) => {
  const provider = getEthersProvider(chainId);
  if (!provider) throw new Error("No provider found");
  const contract = new ethers.Contract(
    address,
    [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ],
    provider
  );

  const name = await contract.name();
  const symbol = await contract.symbol();
  const decimals = await contract.decimals();
  return { name, symbol, decimals, address, chainId };
};
