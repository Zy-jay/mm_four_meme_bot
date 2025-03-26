import { escapeMarkdown } from "../libs/utils/escapeMarkdown";
import bot from "./bot";
import { CallbackDataKeys } from "./UI";

const CHAT_ID = ""; // 

export class TelegramLogger {
  chatId: string;
  // apiUrl: string;

  constructor(chatId = CHAT_ID) {
    this.chatId = chatId;
    // this.apiUrl = `https://api.telegram.org/bot${BOT_LOGGER_TOKEN}/sendMessage?chat_id=${chatId}`;
  }

  /**
   * Отправляет сообщение в Telegram канал
   * @param {string} messages - Сообщение для отправки
   */
  async log(...messages: any[]) {
    if (!bot) return;
    try {
      // console.log(this.chatId, messages.join("\n"));
      // const chat = await bot.getChat(this.chatId);
      bot?.sendMessage(this.chatId, messages.join("\n"), {
        // parse_mode: "Markdown",
      });
      // await axios.post(this.apiUrl, {
      //   // chat_id: this.chatId,
      //   text: messages.join("\n"),
      //   parse_mode: "html",
      // });
      //   console.log("Log sent to Telegram");
    } catch (error: any) {
      console.error("Failed to send log to Telegram:", error);
    }
  }
}
const tgLogger = new TelegramLogger();

export default tgLogger;
