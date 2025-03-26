import mongoose from "mongoose";
import bot from "./src/telegram/bot";
import { DATA_BASE_URL } from "./src/constants/env";

(async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(DATA_BASE_URL, {
    dbName: "mm_tg_bot",
  });
  await mongoose?.connection?.db?.admin().command({ ping: 1 });
  console.log("Connected to DB successfully!");
  bot.getMe().then((me) => {
    console.log("Bot started as", me.username);
  });
})();
