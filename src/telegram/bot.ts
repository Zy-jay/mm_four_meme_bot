import TelegramBot from "node-telegram-bot-api";
import { BOT_TOKEN } from "../constants/env";
import User from "../models/User";
import { adminActions, queryRouter } from "./actions";

// const Admins = [436941636];

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
});

// Установка команд
bot?.setMyCommands(
  [
    { command: "/start", description: "Запустить бота" },
    { command: "/help", description: "Показать справку" },
    { command: "/menu", description: "Показать доступные функции" },
  ],
  {}
);
bot.on("message", async (msg, metadata) => {
  // if (!Admins.includes(msg?.from?.id || 0)) return;
  if (msg && /\/start(?:\s+(.+))?/) {
    if (!msg.from) return;
    const refId = msg.text?.split(" ")[1];
    console.log("User started: ", msg, metadata, refId);

    let user = await User.findOne({ userId: msg.from.id });
    if (!user) {
      user = await User.create({
        userId: msg.from?.id,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        username: msg.from.username,
        languageCode: msg.from.language_code,
      }).catch((e) => {
        console.error(e);
        return null;
      });
    }
  }
  // if (Admins.includes(msg?.from?.id || 0)) {
  //   return adminActions(bot, msg);
  // } else {
  return adminActions(bot, msg);
  // }
});

bot?.on("callback_query", async (query) => {
  // if (!query.from || !Admins.includes(query.from.id)) return;
  return queryRouter(bot, query);
});

export default bot;
