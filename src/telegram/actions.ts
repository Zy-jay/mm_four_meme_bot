import NodeCache from "node-cache";
import TelegramBot, { Message } from "node-telegram-bot-api";
import {
  ADMIN_ACTIONS,
  CallbackDataKeys,
  CONFIRM_KEYBOARD,
  WELCOME_ADMIN_MESSAGE,
} from "./UI";
import userService from "../services/user-service";
import walletService from "../services/wallet-service";
import { escapeMarkdown } from "../libs/utils/escapeMarkdown";
import { createTelegramLink } from "../libs/utils/createTelegramLink";
import tgLogger from "./TelegramLogger";
import { isAddress } from "ethers";
import { getEthersProvider } from "../libs/getProvider";
import { SupportedChainId } from "../constants/chains";
import { getTokenInfo } from "../libs/getTokenInfo";

const adminStatesCash = new NodeCache({ stdTTL: 60, checkperiod: 60 * 60 }); // 1 minutes cache TTL

const inputRouter = async (
  bot: TelegramBot,
  msg: Message,
  userState: string
) => {
  // usersStatesCash.del(`${msg.chat.id}`);
  const user = await userService.getUser(msg.chat.id);
  if (!user)
    return bot.sendMessage(msg.chat.id, "Please start bot first, /start");
  if (!msg.chat.id) return bot.sendMessage(msg.chat.id, "Invalid chat id");
  try {
    switch (userState) {
      case CallbackDataKeys.CREATE_WALLETS:
        const amount = parseFloat(msg.text ?? "");
        if (!msg.chat.id)
          return bot.sendMessage(msg.chat.id, "Invalid chat id");
        if (!amount) return bot.sendMessage(msg.chat.id, "Invalid amount");
        if (amount < 0)
          return bot.sendMessage(
            msg.chat.id,
            "Minimum amount is 1, Please select amount again."
          );
        if (amount > 1000)
          return bot.sendMessage(
            msg.chat.id,
            "Maximum amount is 1 000, Please contact support"
          );

        await bot.sendMessage(msg.chat.id, "Creating wallets... 🔄");
        adminStatesCash.del(`${msg.chat.id}`);
        const wallets = await walletService.createWallets(
          amount,
          Number(msg.chat.id)
        );
        await bot
          .deleteMessage(msg.chat.id, msg.message_id as number)
          .catch(console.error);
        await bot.sendMessage(
          msg.chat.id,
          escapeMarkdown(
            `Wallets created: ${wallets.length}\n\nWallets Pack id: ${wallets[0].walletName}`
          ),
          {
            parse_mode: "MarkdownV2",
          }
        );
        const csfBoofer = walletService.getCsvFromWallets(wallets);
        // Отправляем файл в Telegram
        return await bot.sendDocument(
          msg.chat.id,
          csfBoofer,
          {},
          {
            filename: `Wallets_${wallets[0].walletName}.csv`,
            contentType: "text/csv",
          }
        );
      case CallbackDataKeys.SEND_ALL_TO_ONE_WALLET:
        const walletTo = msg.text;
        if (!isAddress(walletTo))
          return bot.sendMessage(
            msg.chat.id,
            "Invalid wallet address, try again"
          );
        adminStatesCash.set(
          `${msg.chat.id}`,
          CallbackDataKeys.ENTER_WALLTS_PAC_ID
        );
        adminStatesCash.set(user.userId + ":walletTo", walletTo);
        await bot
          .deleteMessage(msg.chat.id, msg.message_id as number)
          .catch(console.error);
        return bot.sendMessage(
          msg.chat.id,
          escapeMarkdown(
            `Wallet Address: ${walletTo}\n\nEnter Wallets Pack id to send out`
          ),
          {
            parse_mode: "MarkdownV2",
          }
        );
      case CallbackDataKeys.CREATE_SEND_OUT:
        const walletPackId = msg.text;
        if (!msg.chat.id)
          return bot.sendMessage(msg.chat.id, "Invalid chat id");
        if (!walletPackId)
          return bot.sendMessage(msg.chat.id, "Invalid wallet pack id");
        const walletPack = await walletService.getWalletsPack(
          msg.chat.id,
          walletPackId
        );
        if (!walletPack.length)
          return bot.sendMessage(msg.chat.id, "Wallets not found");
        adminStatesCash.set(user.userId + ":walletPackId", walletPackId);
        adminStatesCash.set(
          `${msg.chat.id}`,
          CallbackDataKeys.ENTER_WALLET_FROM_SEND
        );
        await bot
          .deleteMessage(msg.chat.id, msg.message_id as number)
          .catch(console.error);
        return bot.sendMessage(
          msg.chat.id,
          escapeMarkdown(
            `Wallets Pack id: ${walletPackId}\nTotal Wallets: ${walletPack.length}\n\nEnter Wallet Address to send out`
          ),
          {
            parse_mode: "MarkdownV2",
          }
        );
      case CallbackDataKeys.ENTER_WALLET_TO_SEND:
        const walletTo_ = msg.text;
        if (!isAddress(walletTo_))
          return bot.sendMessage(
            msg.chat.id,
            "Invalid wallet address, try again"
          );
        adminStatesCash.set(user.userId + ":walletTo", walletTo_);
        adminStatesCash.set(
          `${msg.chat.id}`,
          CallbackDataKeys.ENTER_WALLTS_PAC_ID
        );
        await bot
          .deleteMessage(msg.chat.id, msg.message_id as number)
          .catch(console.error);
        return bot.sendMessage(
          msg.chat.id,
          escapeMarkdown(
            `Wallet Address: ${walletTo_}\n\nEnter Wallets Pack id to send out`
          ),
          {
            parse_mode: "MarkdownV2",
          }
        );
      case CallbackDataKeys.ENTER_WALLET_FROM_SEND:
        const walletFromAddress_ = msg.text;
        if (!isAddress(walletFromAddress_))
          return bot.sendMessage(
            msg.chat.id,
            "Invalid wallet address, try again"
          );
        const _walletPackId__ = adminStatesCash.get(
          user.userId + ":walletPackId"
        );
        if (!_walletPackId__)
          return bot.sendMessage(msg.chat.id, "Wallet Pack id not found");

        adminStatesCash.set(user.userId + ":walletFrom", walletFromAddress_);
        adminStatesCash.set(
          `${msg.chat.id}`,
          CallbackDataKeys.ENTER_AMOUNT_TO_SEND
        );
        await bot
          .deleteMessage(msg.chat.id, msg.message_id as number)
          .catch(console.error);
        return bot.sendMessage(
          msg.chat.id,
          escapeMarkdown(
            `Wallets Pack id: ${_walletPackId__}\nFrom Wallet: ${walletFromAddress_}\n\nEnter Amount to send`
          ),
          {
            parse_mode: "MarkdownV2",
          }
        );
      case CallbackDataKeys.ENTER_WALLTS_PAC_ID:
        const walletsPackIdFrom = msg.text;
        if (!walletsPackIdFrom)
          return bot.sendMessage(msg.chat.id, "Invalid wallet pack id");
        const walletsPack = await walletService.getWalletsPack(
          msg.chat.id,
          walletsPackIdFrom
        );
        if (!walletsPack.length)
          return bot.sendMessage(msg.chat.id, "Wallets not found");
        adminStatesCash.set(
          `${msg.chat.id}` + ":walletPackId",
          walletsPackIdFrom
        );
        adminStatesCash.set(`${msg.chat.id}`, async () => {
          await bot.sendMessage(msg.chat.id, `Sending out to wallets... 🔄`);
          const targetWallet = adminStatesCash.get(user.userId + ":walletTo");
          if (!targetWallet)
            return bot.sendMessage(msg.chat.id, "Wallet address not found");
          const sendProcess = await walletService.sendAllToWallet(
            msg.chat.id,
            targetWallet as string,
            walletsPackIdFrom
          );
          await bot.sendMessage(msg.chat.id, "Send out to wallets done 🟢");
          await bot.sendMessage(
            msg.chat.id,
            "Tx hashes: \n" +
              sendProcess
                .map((hash, i) =>
                  hash
                    ? i +
                      1 +
                      " " +
                      createTelegramLink(hash, `https://bscscan.com/tx/${hash}`)
                    : "Error: Tx hash not found"
                )
                .join("\n"),
            {
              parse_mode: "MarkdownV2",
            }
          );
        });
        await bot
          .deleteMessage(msg.chat.id, msg.message_id as number)
          .catch(console.error);
        return bot.sendMessage(
          msg.chat.id,
          `Send out to wallets? 🤔\n\nWallets Pack id: ${walletsPackIdFrom}\nFrom Wallet: ${adminStatesCash.get(
            user.userId + ":walletTo"
          )}`,
          CONFIRM_KEYBOARD
        );
      case CallbackDataKeys.ENTER_AMOUNT_TO_SEND:
        const amountToSend = parseFloat(msg.text ?? "");
        if (!msg.chat.id)
          return bot.sendMessage(msg.chat.id, "Invalid chat id");
        if (!amountToSend)
          return bot.sendMessage(msg.chat.id, "Invalid amount");
        if (amountToSend < 0)
          return bot.sendMessage(
            msg.chat.id,
            "Minimum amount is 1, Please select amount again."
          );
        const walletPackIdTo: string | undefined = adminStatesCash.get(
          user.userId + ":walletPackId"
        );
        const walletFromAddress: string | undefined = adminStatesCash.get(
          user.userId + ":walletFrom"
        );
        if (!walletPackIdTo || !walletFromAddress)
          return bot.sendMessage(msg.chat.id, "Wallet Pack id not found");
        adminStatesCash.del(user.userId + ":walletPackId");
        adminStatesCash.del(user.userId + ":walletFrom");
        adminStatesCash.del(`${msg.chat.id}`);

        adminStatesCash.set(`${msg.chat.id}`, async () => {
          await bot.sendMessage(msg.chat.id, `Sending out to wallets... 🔄`);
          const provider = getEthersProvider(SupportedChainId.BSC);
          const balance = await provider.getBalance(walletFromAddress).catch(
            (e) => {
              console.error(e);
              return null;
            } // return null if error
          );
          provider.destroy();
          if (!balance)
            return bot.sendMessage(
              msg.chat.id,
              "Error: Can't get balance of wallet"
            );
          if (Number(balance) / 1e18 < amountToSend) {
            return bot.sendMessage(
              msg.chat.id,
              `Error: Not enough balance in wallet\n\nBalance: ${
                Number(balance) / 1e18
              } BNB\nAmount to send: ${amountToSend} BNB`
            );
          }
          const sendProcess = await walletService.sendOutToWallets(
            msg.chat.id,
            walletFromAddress,
            walletPackIdTo,
            amountToSend
          );
          await bot.sendMessage(msg.chat.id, "Send out to wallets done 🟢");
          await bot.sendMessage(
            msg.chat.id,
            "Tx hashes: \n" +
              sendProcess
                .map((hash, i) =>
                  hash
                    ? i +
                      1 +
                      " " +
                      createTelegramLink(hash, `https://bscscan.com/tx/${hash}`)
                    : "Error: Tx hash not found"
                )
                .join("\n"),
            {
              parse_mode: "MarkdownV2",
            }
          );
          adminStatesCash.del(`${msg.chat.id}`);
        });
        return bot.sendMessage(
          msg.chat.id,
          `Send out to wallets? 🤔\n\nWallets Pack id: ${walletPackIdTo}\nFrom Wallet: ${walletFromAddress}\nAmount: ${amountToSend} BNB`,
          CONFIRM_KEYBOARD
        );
      case CallbackDataKeys.BUY_TOKEN:
      case CallbackDataKeys.SELL_TOKEN:
        const walletPackId_ = msg.text;
        if (!walletPackId_)
          return bot.sendMessage(msg.chat.id, "Invalid wallet pack id");
        const walletPack_ = await walletService.getWalletsPack(
          msg.chat.id,
          walletPackId_
        );
        if (!walletPack_.length)
          return bot.sendMessage(msg.chat.id, "Wallets not found");
        adminStatesCash.set(user.userId + ":walletPackId", walletPackId_);
        adminStatesCash.set(
          `${msg.chat.id}`,
          CallbackDataKeys.ENTER_TOKEN_ADDRESS
        );
        await bot
          .deleteMessage(msg.chat.id, msg.message_id as number)
          .catch(console.error);
        return bot.sendMessage(
          msg.chat.id,
          escapeMarkdown(
            `Wallets Pack id: ${walletPackId_}\nTotal Wallets: ${walletPack_.length}\n\nEnter Token Address to Buy/Sell process. `
          ),
          {
            parse_mode: "MarkdownV2",
          }
        );
      case CallbackDataKeys.ENTER_TOKEN_ADDRESS:
        const tokenAddress = msg.text;
        if (!isAddress(tokenAddress))
          return bot.sendMessage(
            msg.chat.id,
            "Invalid token address, try again"
          );
        const _walletPackId_ = adminStatesCash.get(
          user.userId + ":walletPackId"
        );
        if (!_walletPackId_)
          return bot.sendMessage(msg.chat.id, "Wallet Pack id not found");
        const tradeType = adminStatesCash.get(`${msg.chat.id}:tradeType`);
        console.log("tradeType", tradeType);
        const tokenInfo = await getTokenInfo(
          SupportedChainId.BSC,
          tokenAddress
        );
        if (!tokenInfo) return bot.sendMessage(msg.chat.id, "Token not found");
        adminStatesCash.set(user.userId + ":tokenIfo", tokenInfo);
        if (tradeType === "buy") {
          adminStatesCash.set(
            `${msg.chat.id}`,
            CallbackDataKeys.ENTER_AMOUNT_TO_TRADE
          );
          await bot
            .deleteMessage(msg.chat.id, msg.message_id as number)
            .catch(console.error);
          return bot.sendMessage(
            msg.chat.id,
            escapeMarkdown(
              `Wallets Pack id: ${_walletPackId_}\nToken Address: ${tokenAddress}\nToken Name: ${tokenInfo.name}\nToken Symbol: ${tokenInfo.symbol}\n\nEnter Amount to Buy/Sell`
            ),
            {
              parse_mode: "MarkdownV2",
            }
          );
        } else if (tradeType === "sell") {
          adminStatesCash.del(user.userId + ":walletPackId");
          adminStatesCash.del(user.userId + ":tokenIfo");
          adminStatesCash.set(`${msg.chat.id}`, async () => {
            await bot.sendMessage(msg.chat.id, `Sell process... 🔄`);
            const targetWallets = await walletService.getWalletsPack(
              msg.chat.id,
              _walletPackId_ as string
            );
            if (!targetWallets.length)
              return bot.sendMessage(msg.chat.id, "Wallets not found");
            const txs = await walletService.sellTokenFromWallets(
              targetWallets,
              tokenInfo.address
            );
            await bot.sendMessage(msg.chat.id, "Sell process done 🟢");
            return await bot.sendMessage(
              msg.chat.id,
              "Tx hashes: \n" +
                txs
                  .map((hash, i) =>
                    hash
                      ? i +
                        1 +
                        " " +
                        createTelegramLink(
                          hash,
                          `https://bscscan.com/tx/${hash}`
                        )
                      : "Error: Tx hash not found"
                  )
                  .join("\n"),
              {
                parse_mode: "MarkdownV2",
              }
            );
          });
          return bot.sendMessage(
            msg.chat.id,
            escapeMarkdown(
              `Sell process? 🤔\n\nWallets Pack id: ${_walletPackId_}\nToken Address: ${tokenInfo.address}\nToken Name: ${tokenInfo.name}\nToken Symbol: ${tokenInfo.symbol}`
            ) +
              "\n\n" +
              createTelegramLink(
                tokenInfo.address,
                `https://bscscan.com/token/${tokenInfo.address}`
              ),
            {
              parse_mode: "MarkdownV2",
              ...CONFIRM_KEYBOARD,
            }
          );
        } else {
          return bot.sendMessage(msg.chat.id, "Trade type not found");
        }
      case CallbackDataKeys.ENTER_AMOUNT_TO_TRADE:
        const amountToTrade = parseFloat(msg.text ?? "");
        if (!amountToTrade)
          return bot.sendMessage(msg.chat.id, "Invalid amount");
        if (amountToTrade < 0)
          return bot.sendMessage(
            msg.chat.id,
            "Minimum amount is 1, Please select amount again."
          );
        const tokenInfo_:
          | {
              name: string;
              symbol: string;
              address: string;
              chainId: number;
            }
          | undefined = adminStatesCash.get(user.userId + ":tokenIfo");
        if (!tokenInfo_) return bot.sendMessage(msg.chat.id, "Token not found");
        const walletPackId__ = adminStatesCash.get(
          user.userId + ":walletPackId"
        );
        if (!walletPackId__)
          return bot.sendMessage(msg.chat.id, "Wallet Pack id not found");
        adminStatesCash.del(user.userId + ":walletPackId");
        adminStatesCash.del(user.userId + ":tokenIfo");
        adminStatesCash.set(`${msg.chat.id}`, async () => {
          await bot.sendMessage(msg.chat.id, `Buy process... 🔄`);
          const targetWallets = await walletService.getWalletsPack(
            msg.chat.id,
            walletPackId__ as string
          );
          if (!targetWallets.length)
            return bot.sendMessage(msg.chat.id, "Wallets not found");
          const txs = await walletService.buyTokenFromWallets(
            targetWallets,
            tokenInfo_.address,
            amountToTrade.toString()
          );
          await bot.sendMessage(msg.chat.id, "Buy process done 🟢");
          await bot.sendMessage(
            msg.chat.id,
            "Tx hashes: \n" +
              txs
                .map((hash, i) =>
                  hash
                    ? i +
                      1 +
                      " " +
                      createTelegramLink(hash, `https://bscscan.com/tx/${hash}`)
                    : "Error: Tx hash not found"
                )
                .join("\n"),
            {
              parse_mode: "MarkdownV2",
            }
          );
          // for (const wallet of [targetWallets[0]]) {
          //   const provider = getEthersProvider(SupportedChainId.BSC);
          //   const balance = await provider.getBalance(wallet.address).catch(
          //     (e) => {
          //       console.error(e);
          //       return null;
          //     } // return null if error
          //   );
          //   provider.destroy();
          //   console.log("balance", balance);
          //   if (balance === null)
          //     return bot.sendMessage(
          //       msg.chat.id,
          //       "Error: Can't get balance of wallet"
          //     );
          //   if (balance === 0n)
          //     return bot.sendMessage(
          //       msg.chat.id,
          //       "Wallet balance is 0, can't buy/sell" + " " + wallet.address
          //     );

          //   await walletService.batchBuySell(
          //     wallet.privateKey,
          //     tokenInfo_.address,
          //     amountToTrade.toString()
          //   );
          // }
        });

        return bot.sendMessage(
          msg.chat.id,
          escapeMarkdown(
            `Buy/Sell process? 🤔\n\nWallets Pack id: ${walletPackId__}\nToken Address: ${tokenInfo_.address}\nToken Name: ${tokenInfo_.name}\nToken Symbol: ${tokenInfo_.symbol}\nAmount: ${amountToTrade}`
          ) +
            "\n\n" +
            createTelegramLink(
              tokenInfo_.address,
              `https://bscscan.com/token/${tokenInfo_.address}`
            ),
          {
            parse_mode: "MarkdownV2",
            ...CONFIRM_KEYBOARD,
          }
        );

      default:
        return bot.sendMessage(msg.chat.id, "Unknown state");
    }
  } catch (e: any) {
    console.error(e);

    return bot.sendMessage(
      msg.chat.id,
      escapeMarkdown("Error: " + `${e?.message ?? e}`)
    );
  } finally {
  }
};

export const queryRouter = async (
  bot: TelegramBot,
  query: TelegramBot.CallbackQuery | { from: { id: number }; data: string }
) => {
  const userId = query.from.id;
  const action = query.data;

  switch (action) {
  case CallbackDataKeys.NO:
      adminStatesCash.del(`${userId}`);
      return bot.sendMessage(userId, "Dismissed 🚫");
    case CallbackDataKeys.YES:
      const action: (() => any) | undefined = adminStatesCash.get(`${userId}`);
      if (!action) return bot.sendMessage(userId, "Действие не найдено");
      return await action();
    
    case CallbackDataKeys.CREATE_WALLETS:
      try {
        adminStatesCash.set(`${userId}`, CallbackDataKeys.CREATE_WALLETS);
        return bot.sendMessage(userId, "How many wallets to create?");
      } catch (e: any) {
        console.error(e);
        return bot.sendMessage(userId, "Error: " + `${e?.message ?? e}`);
      }
    case CallbackDataKeys.MY_WALLETS:
      try {
        const wallets = await walletService.getUserSortedWallets(userId);
        if (!wallets) return bot.sendMessage(userId, "Wallets not found");
        const walletsText = Object.values(wallets)
          .map((sortedwallet) => {
            return `Wallet Pack id: ${sortedwallet[0].walletName}\nTotal Wallets: ${sortedwallet.length}\n\n`;
          })
          .join("");
        return bot.sendMessage(userId, escapeMarkdown(walletsText), {
          parse_mode: "MarkdownV2",
        });
      } catch (e: any) {
        console.error(e);
        return bot.sendMessage(userId, "Error: " + `${e?.message ?? e}`);
      }
    case CallbackDataKeys.CREATE_SEND_OUT:
      try {
        adminStatesCash.set(`${userId}`, CallbackDataKeys.CREATE_SEND_OUT);
        return bot.sendMessage(userId, "Enter wallet pack id");
      } catch (e: any) {
        console.error(e);
        return bot.sendMessage(userId, "Error: " + `${e?.message ?? e}`);
      }
    case CallbackDataKeys.BUY_TOKEN:
    case CallbackDataKeys.SELL_TOKEN:
      try {
        adminStatesCash.set(
          `${query.from.id}:tradeType`,
          query.data === CallbackDataKeys.BUY_TOKEN ? "buy" : "sell"
        );
        adminStatesCash.set(`${userId}`, CallbackDataKeys.BUY_TOKEN);
        return bot.sendMessage(userId, "Enter wallet pack id");
      } catch (e: any) {
        console.error(e);
        return bot.sendMessage(userId, "Error: " + `${e?.message ?? e}`);
      }
    case CallbackDataKeys.SEND_ALL_TO_ONE_WALLET:
      try {
        adminStatesCash.set(`${userId}`, CallbackDataKeys.ENTER_WALLET_TO_SEND);
        return bot.sendMessage(
          userId,
          "Enter wallet address to send all wallets funds"
        );
      } catch (e: any) {
        console.error(e);
        return bot.sendMessage(userId, "Error: " + `${e?.message ?? e}`);
      }
    default:
      return await bot.sendMessage(userId, "Unknown action");
  }
};

export const adminActions = async (bot: TelegramBot, msg: Message) => {
  const chatId = msg.chat.id;
  const adminState: string | undefined = msg.from?.id
    ? adminStatesCash.get(`${msg.from?.id}`)
    : undefined;
  if (msg.text === "/start" || msg.text === "/menu") {
    adminStatesCash.del(`${chatId}`);
    return bot.sendMessage(chatId, WELCOME_ADMIN_MESSAGE, ADMIN_ACTIONS);
  }
  if (msg.text === "/help") {
    return bot.sendMessage(chatId, WELCOME_ADMIN_MESSAGE, ADMIN_ACTIONS);
  }

  if (adminState) {
    console.log("Admin state: ", adminState);
    return await inputRouter(bot, msg, adminState);
  }
  return bot.sendMessage(chatId, "Unknown command");
};
