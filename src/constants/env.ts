import "dotenv/config";

export const MASTER_PASS = process.env.MASTER_PASS || "";
export const BOT_TOKEN = process.env.BOT_TOKEN || "";
const MONGO_URL = process.env.MONGO_URL;
export const ENV_MODE = process.env.ENV_MODE || undefined;
export const PORT = Number(process.env.PORT) || 5000;
export const DATA_BASE_URL =
  MONGO_URL ??
  `mongodb://${process.env.DB_USER_NAME}:${process.env.DB_PASS}@metro.proxy.rlwy.net:${process.env.DB_PORT}`;
