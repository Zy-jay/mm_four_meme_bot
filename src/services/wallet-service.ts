import { ethers, isAddress, parseEther } from "ethers";
import { SupportedChainId } from "../constants/chains";
import { createNewWallet } from "../libs/createWallet";
import { getEthersProvider } from "../libs/getProvider";
import { getWallet } from "../libs/getWallet";
import PrivateKey from "../models/PrivateKey";
import { stringify } from "csv-stringify/sync";
import {
  FOR_MEME_DEX_ADDRESS,
  MULTICALL_ADDRESS,
} from "../constants/addresses";
import ABI from "../constants/abis/for_meme.json";

class WalletService {
  constructor() {}
  async createWallets(amount: number, userId: number) {
    return await createNewWallet(userId, Math.floor(amount));
  }

  async getUserWallets(userId: number) {
    return (await PrivateKey.find({ userId })).map((wallet) =>
      wallet?.toObject()
    );
  }

  async sortWalletsByNames(
    wallets: {
      address: string;
      walletName: string;
    }[]
  ): Promise<{
    [key: string]: {
      address: string;
      walletName: string;
    }[];
  }> {
    const sortedWallets: {
      [key: string]: {
        address: string;
        walletName: string;
      }[];
    } = {};
    wallets.forEach((wallet) => {
      if (!sortedWallets[wallet.walletName]) {
        sortedWallets[wallet.walletName] = [];
      }
      sortedWallets[wallet.walletName].push(wallet);
    });
    return sortedWallets;
  }

  getUserSortedWallets = async (userId: number) => {
    const wallets = await this.getUserWallets(userId);
    return await this.sortWalletsByNames(wallets as any);
  };
  async getWalletsPack(userId: number, walletsPackId: string) {
    return await PrivateKey.find({ userId, walletName: walletsPackId });
  }

  sendBatchBNB = async (
    senderPrivateKey: string,
    recipients: { address: string; amount: string | number }[]
  ) => {
    const provider = getEthersProvider(SupportedChainId.BSC);
    const wallet = getWallet(senderPrivateKey, provider);

    const txs = await Promise.all(
      recipients.map(async ({ address, amount }, index) => {
        const tx = await wallet.populateTransaction({
          to: address,
          value: parseEther(amount.toString()),
          gasLimit: 21_000, // Минимальный gas limit для перевода BNB
        });

        tx.nonce = (await wallet.getNonce()) + index;
        return tx;
      })
    );

    // Подписываем все транзакции
    const signedTxs = await Promise.all(
      txs.map((tx) => wallet.sendTransaction(tx))
    );

    // Ждем пока все транзакции будут включены в блок
    const tsResses = await Promise.all(signedTxs.map((tx) => tx.wait()));

    return tsResses.map((tx) => tx?.hash);
  };
  sendBnb = async (
    senderPrivateKey: string,
    recipient: string,
    gasPrice: bigint
  ) => {
    const provider = getEthersProvider(SupportedChainId.BSC);
    const wallet = getWallet(senderPrivateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    if (!balance) return undefined;
    const tx = {
      to: recipient,
      value: 0n,
      gasLimit: 21_000n,
      gasPrice,
    };
    const gas = await wallet.estimateGas(tx);
    if (!gas) return undefined;
    tx.gasLimit = gas;
    tx.value = balance - gas * gasPrice;
    const txRes = await wallet.sendTransaction({
      ...tx,
    });
    return txRes;
  };

  async sendOutToWallets(
    userId: number,
    fromWallet: string,
    walletsPackId: string,
    amount: number
  ) {
    const wallets = await PrivateKey.find({
      userId,
      walletName: walletsPackId,
    });
    if (!wallets.length) {
      throw new Error("No wallets found");
    }
    let wallet: any = wallets.find((w) => w.address === fromWallet);
    if (!wallet) {
      wallet = await PrivateKey.findOne({ userId, address: fromWallet });
    }
    if (!wallet) {
      throw new Error("No wallet found");
    }
    const privateKey = wallet.privateKey;
    if (!privateKey) {
      throw new Error("No private key found");
    }
    const walletsToSend = wallets.filter((w) => w.address !== fromWallet);
    const walletTo = walletsToSend[0];
    if (!walletTo) {
      throw new Error("No wallet to send found");
    }
    const walletToPrivateKey = walletTo.privateKey;
    if (!walletToPrivateKey) {
      throw new Error("No wallet to send private key found");
    }
    return await this.sendBatchBNB(
      privateKey,
      walletsToSend.map((w) => ({
        address: w.address,
        amount: amount.toString(),
      }))
    );
  }
  async sendAllToWallet(
    userId: number,
    toWallet: string,
    walletsPackId: string,
    amount?: number
  ) {
    if (!isAddress(toWallet)) throw new Error("Invalid address");
    const wallets = await PrivateKey.find({
      userId,
      walletName: walletsPackId,
    });
    if (!wallets.length) {
      throw new Error("No wallets found");
    }

    const walletsFromSend = wallets.filter((w) => w.address !== toWallet);
    const walletFrom = walletsFromSend[0];
    if (!walletFrom) {
      throw new Error("No wallet to send found");
    }
    const walletToPrivateKey = walletFrom.privateKey;
    if (!walletToPrivateKey) {
      throw new Error("No wallet to send private key found");
    }
    const provider = getEthersProvider(SupportedChainId.BSC);
    const { gasPrice } = await provider.getFeeData();
    if (!gasPrice) throw new Error("No gas price found");
    const txHashes = await Promise.all(
      walletsFromSend.map(async (wallet) => {
        return await this.sendBnb(wallet.privateKey, toWallet, gasPrice);
      })
    );
    return txHashes.map((tx) => tx?.hash ?? (tx as any)?.transactionHash);
  }
  decodeResponse(hexData: string) {
    // Убираем префикс "0x"
    const data = hexData.startsWith("0x") ? hexData.slice(2) : hexData;

    // Определим структуры данных
    const decodedData: any = {};

    // Декодируем адрес токена (20 байт)
    const tokenAddress = ethers.getAddress("0x" + data.slice(24, 64)); // Адрес токена
    decodedData.tokenAddress = tokenAddress;
    console.log(`🔹 Адрес токена: ${tokenAddress} `);
    // Декодируем первое значение, вероятно, это пустое значение или какой-то заполнитель
    decodedData.emptyValue = ethers
      .toBigInt("0x" + data.slice(64, 128))
      .toString();
    console.log(`🔹 Пустое значение: ${decodedData.emptyValue} `);
    // Декодируем uint256 (это может быть большое число, например количество)
    const uint256Value = ethers
      .toBigInt("0x" + data.slice(128, 192))
      .toString();
    decodedData.uint256Value = uint256Value;
    console.log(`🔹 uint256Value: ${uint256Value} `);
    // Декодируем другие данные (каждое из которых может быть uint256 или адрес)
    const additionalValues = [];
    let offset = 192;
    while (offset + 64 <= data.length) {
      const value = ethers
        .toBigInt("0x" + data.slice(offset, offset + 64))
        .toString();
      additionalValues.push(value);
      offset += 64;
    }
    decodedData.additionalValues = additionalValues;
    console.log(`🔹 Дополнительные значения: ${additionalValues} `);
    console.log(
      `🔹 Декодированные данные: ${
        Number(
          decodedData.additionalValues[decodedData.additionalValues.length - 1]
        ) /
        10 ** 18
      } `
    );
    return decodedData;
  }
  batchBuySell = async (
    walletPrivateKey: string,
    tokenAddress: string,
    funds: string // BNB для покупки
  ) => {
    const provider = getEthersProvider(SupportedChainId.BSC);
    const wallet = getWallet(walletPrivateKey, provider);
    const contract = new ethers.Contract(FOR_MEME_DEX_ADDRESS, ABI, wallet);
    // Построение данных запроса
    const functionSignature = "0x4e684626b";
    // Формируем calldata
    const encodedData =
      functionSignature + tokenAddress.slice(2).padStart(64, "0"); // Вызов функции через eth_call
    const response = await provider.call({
      to: MULTICALL_ADDRESS,
      // from: wallet.address,
      data: `0x82ad56cb0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000005c952063c7fc8610ffdb798152d69f0b9550762b000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000024e684626b000000000000000000000000${tokenAddress.slice(
        2
      )}00000000000000000000000000000000000000000000000000000000`,
    });
    // Декодируем как массив uint256
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
      [
        "address",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
      ],
      "0x" + response.slice(194) // Отсекаем первые 194 символа (0x + offset данные)
    );
    const reserveBNB = BigInt(decoded[6]); // Резерв BNB (с учетом десятичных знаков)
    const reserveToken = BigInt(decoded[7]); // Резерв токена (с учетом десятичных знаков)
    // Цена токена в BNB (с учетом точности)
    const priceInBNB = Number(reserveToken) / Number(reserveBNB);
    console.log(`🔹 Резервы: ${decoded}`, decoded[7], decoded[6]);
    console.log(`🔹 Цена: ${priceInBNB / 10 ** 8}`);
    // console.log(`🔹 Резервы: ${this.decodeResponse(response)} `);
    // 🔹 Транзакция на покупку
    // const buyTx = await contract.buyTokenAMAP.populateTransaction(
    //   tokenAddress,
    //   ethers.parseEther(funds),
    //   0n,
    //   { value: ethers.parseEther(funds) }
    // );
    // const tokenContract = new ethers.Contract(
    //   tokenAddress,
    //   ["function approve(address spender, uint256 amount) returns (bool)"],
    //   wallet
    // );
    // const approveTx = await tokenContract.approve.populateTransaction(
    //   FOR_MEME_DEX_ADDRESS,
    //   ethers.MaxUint256
    // );
    // // 🔹 Транзакция на продажу
    // const sellTx = await contract.sellToken.populateTransaction(
    //   tokenAddress,
    //   ethers.parseEther(sellAmount),
    //   0n
    // );

    // // Получаем nonce
    // const nonce = await provider.getTransactionCount(wallet.address);

    // // Устанавливаем nonce и подписываем транзакции
    // buyTx.nonce = nonce;
    // approveTx.nonce = nonce + 1;
    // sellTx.nonce = nonce + 2;

    // // const signedBuyTx = await wallet.signTransaction(buyTx);
    // // const signedSellTx = await wallet.signTransaction(sellTx);

    // // Отправляем в сеть
    // const buyTxRes = await wallet.sendTransaction(buyTx);
    // const approveTxRes = await wallet.sendTransaction(approveTx);
    // const sellTxRes = await wallet.sendTransaction(sellTx);

    // console.log(`✅ Покупка отправлена: ${buyTxRes.hash}`);
    // console.log(`✅ Аппрув отправлен: ${approveTxRes.hash}`);
    // console.log(`✅ Продажа отправлена: ${sellTxRes.hash}`);

    // return [buyTxRes, sellTxRes];
  };

  async buyTokenFromWallets(
    wallets: {
      address: string;
      privateKey: string;
    }[],
    tokenAddress: string,
    funds: string
  ) {
    const provider = getEthersProvider(SupportedChainId.BSC);
    const { gasPrice } = await provider.getFeeData();
    if (!gasPrice) throw new Error("No gas price found");
    // Создаем и подписываем транзакции
    const signedTxs = await Promise.all(
      wallets.map(async ({ privateKey }) => {
        return await this.getBuyTokenTx(
          privateKey,
          tokenAddress,
          funds,
          gasPrice
        );
      })
    );

    console.log(signedTxs);

    // Отправляем подписанные транзакции
    const txReceipts = await Promise.all(
      signedTxs.map((signedTx) =>
        provider
          .send("eth_sendRawTransaction", [signedTx]) // Передаем массив с одной строкой
          .then((txHash) => txHash)
          .catch((e) => console.error("Ошибка отправки транзакции:", e))
      )
    );

    provider.destroy();
    return txReceipts;
  }

  async sellTokenFromWallets(
    wallets: {
      address: string;
      privateKey: string;
    }[],
    tokenAddress: string
  ) {
    const txHashes: string[] = [];
    const provider_ = getEthersProvider(SupportedChainId.BSC);
    const { gasPrice } = await provider_.getFeeData();
    provider_.destroy();
    if (!gasPrice) throw new Error("No gas price found");
    const signedTxs = await Promise.all(
      wallets.map(async ({ privateKey }) => {
        return await this.getSellTokenTx(
          privateKey,
          tokenAddress,
          gasPrice
        ).catch((e) => {
          console.log(e);
          return undefined;
        });
      })
    );
    await Promise.all(
      signedTxs.map(async (sellTxs) => {
        if (!sellTxs) return;
        const [signedApprTx, signedSellTx] = sellTxs;
        if (!signedSellTx) return;
        const provider = getEthersProvider(SupportedChainId.BSC);
        console.log(signedApprTx?.toString(), signedSellTx.toString());
        try {
          if (signedApprTx) {
            const approveTxHash = await provider.send(
              "eth_sendRawTransaction",
              [signedApprTx]
            );
            console.log("Approve TX Hash:", approveTxHash);
            // txHashes.push(approveTxHash);
          }
          const sellTxHash = await provider.send("eth_sendRawTransaction", [
            signedSellTx,
          ]);
          console.log("Sell TX Hash:", sellTxHash);
          txHashes.push(sellTxHash);
        } catch (error) {
          console.error("Transaction error:", error);
        } finally {
          provider.destroy();
        }
      })
    );
    return txHashes;
  }

  async getBuyTokenTx(
    walletPrivateKey: string,
    tokenAddress: string,
    funds: string,
    gasPrice: bigint
  ) {
    const provider = getEthersProvider(SupportedChainId.BSC);
    const wallet = getWallet(walletPrivateKey, provider);
    const contract = new ethers.Contract(FOR_MEME_DEX_ADDRESS, ABI, wallet);
    // 🔹 Транзакция на покупку
    const buyTx = await contract.buyTokenAMAP.populateTransaction(
      tokenAddress,
      ethers.parseEther(funds),
      0n,
      { value: ethers.parseEther(funds) }
    );
    const nonce = await wallet.getNonce();
    console.log("Nonce:", gasPrice, nonce);
    const tx = {
      ...buyTx,
      to: FOR_MEME_DEX_ADDRESS,
      gasPrice,
      gasLimit: 210000,
      nonce,
      from: wallet.address,
      chainId: SupportedChainId.BSC,
      type: 0,
    };
    const signedTx = await wallet.signTransaction(tx);
    provider.destroy();
    return signedTx;
  }

  async getSellTokenTx(
    walletPrivateKey: string,
    tokenAddress: string,
    gasPrice: bigint
  ) {
    const provider = getEthersProvider(SupportedChainId.BSC);
    const wallet = getWallet(walletPrivateKey, provider);
    const contract = new ethers.Contract(FOR_MEME_DEX_ADDRESS, ABI, wallet);
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        "function balanceOf(address) view returns (uint256)",
        "function allowance(address, address) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
      ],
      wallet
    );
    const balance = await tokenContract.balanceOf(wallet.address);
    if (!balance) return undefined;
    const allowance = await tokenContract.allowance(
      wallet.address,
      FOR_MEME_DEX_ADDRESS
    );
    const nonce = await wallet.getNonce();
    let apprTx;
    if (allowance < balance) {
      const approveTx = await tokenContract.approve.populateTransaction(
        FOR_MEME_DEX_ADDRESS,
        ethers.MaxUint256
      );
      apprTx = {
        ...approveTx,
        to: tokenAddress,
        gasPrice,
        gasLimit: 210000,
        nonce: nonce,
        value: 0n,
        from: wallet.address,
        chainId: SupportedChainId.BSC,
        type: 0,
      };
    }

    // 🔹 Транзакция на покупку
    const sellTx = await contract.sellToken.populateTransaction(
      tokenAddress,
      balance
    );
    const tx = {
      ...sellTx,
      to: FOR_MEME_DEX_ADDRESS,
      gasPrice,
      gasLimit: 210000,
      nonce: nonce + (apprTx ? 1 : 0),
      value: 0n,
      from: wallet.address,
      chainId: SupportedChainId.BSC,
      type: 0,
    };

    const signedTx = await wallet.signTransaction(tx);
    const signedApprTx = apprTx
      ? await wallet.signTransaction(apprTx)
      : undefined;
    provider.destroy();
    console.log(signedTx, signedApprTx);
    return [signedApprTx, signedTx];
  }
  getCsvFromWallets(wallets: { address: string; privateKey: string }[]) {
    const headers = ["address", "privateKey"];
    // Генерация CSV в памяти
    const csvData = stringify(wallets, {
      header: true,
      columns: headers,
      delimiter: ";",
    });

    // Создаём буфер из CSV-данных
    const buffer = Buffer.from(csvData, "utf-8");
    console.log(buffer);
    return buffer;
  }
}

export default module.exports = new WalletService();

// 0x0000000000000000000000000000000000000001,64,416,748087004289007311971469228799536920553043733084,0,0,1000000000000000000000000000,800000000000000000000000000,24000000000000000000,1742894559 800000000000000000000000000n 1000000000000000000000000000n
// 0x0000000000000000000000000000000000000001,64,416,927294958276657558208606773843357323726560938214,0,0,1000000000000000000000000000,800000000000000000000000000,24000000000000000000,1742834330 800000000000000000000000000n 1000000000000000000000000000n
