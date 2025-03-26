import TelegramBot from "node-telegram-bot-api";

export const WELCOME_ADMIN_MESSAGE = `
Добро пожаловать в админ-панель! Выберите действие: 👇`;


export enum CallbackDataKeys {
  YES = "yes",
  NO = "no",
  CREATE_WALLETS = "create_wallets",
  CREATE_SEND_OUT = "create_send_out",
  BUY_TOKEN = "buy_token",
  SELL_TOKEN = "sell_token",
  MY_WALLETS = "my_wallets",
  ENTER_AMOUNT_TO_SEND = "enter_amount_to_send",
  ENTER_WALLET_FROM_SEND = "enter_wallet_from_send",
  ENTER_WALLET_TO_SEND = "enter_wallet_to_send",
  ENTER_TOKEN_ADDRESS = "enter_token_address",
  ENTER_AMOUNT_TO_TRADE = "enter_amount_to_trade",
  SEND_ALL_TO_ONE_WALLET = "send_all_to_one_wallet",
  ENTER_WALLTS_PAC_ID = "enter_wallets_pac_id",
}

export const TEXTS: { [key: string]: string } = {
  [CallbackDataKeys.CREATE_WALLETS]: "Create Wallets 💼",
  [CallbackDataKeys.CREATE_SEND_OUT]: "Send Out to Wallets 📤",
  [CallbackDataKeys.BUY_TOKEN]: "Buy Token 📈",
  [CallbackDataKeys.SELL_TOKEN]: "Sell Token 📈",
};


export const CREATE_WALLETS: TelegramBot.InlineKeyboardButton = {
  text: "Создать Кошельки 💼",
  callback_data: CallbackDataKeys.CREATE_WALLETS,
};
export const CREATE_SEND_OUT: TelegramBot.InlineKeyboardButton = {
  text: "Разослать по кошелькам",
  callback_data: CallbackDataKeys.CREATE_SEND_OUT,
};
export const MY_WALLETS: TelegramBot.InlineKeyboardButton = {
  text: "Мои Кошельки 💼",
  callback_data: CallbackDataKeys.MY_WALLETS,
};

export const BUY_TOKEN: TelegramBot.InlineKeyboardButton = {
  text: "Купить Токен 📈",
  callback_data: CallbackDataKeys.BUY_TOKEN,
};

export const SELL_TOKEN: TelegramBot.InlineKeyboardButton = {
  text: "Продать Токен 📈",
  callback_data: CallbackDataKeys.SELL_TOKEN,
};
export const SEND_ALL_TO_ONE_WALLET: TelegramBot.InlineKeyboardButton = {
  text: "Отправить все на один кошелек 📤",
  callback_data: CallbackDataKeys.SEND_ALL_TO_ONE_WALLET,
};


export const CONFIRM_KEYBOARD: TelegramBot.SendMessageOptions = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "Yes ✅",
          callback_data: CallbackDataKeys.YES,
        },
        {
          text: "No ❌",
          callback_data: CallbackDataKeys.NO,
        },
      ],
    ],
    one_time_keyboard: true,
  },
};
export const ADMIN_ACTIONS: TelegramBot.SendMessageOptions = {
  reply_markup: {
    inline_keyboard: [
      [MY_WALLETS],
      [CREATE_WALLETS],
      [CREATE_SEND_OUT],
      [SEND_ALL_TO_ONE_WALLET],
      [BUY_TOKEN],
      [SELL_TOKEN],
    ],
    one_time_keyboard: true,
  },
};


export const getKeyboard = (
  callbackKey: CallbackDataKeys[][] | Array<number | string>[],
  type: "inline_keyboard" | "keyboard" = "inline_keyboard",
  one_time_keyboard: boolean = true,
  selective: boolean = true
) => {
  return {
    [type]: callbackKey.map((key) => {
      return [
        {
          text: TEXTS[(key[1] ?? key[0]) as string] ?? `${key[1] ?? key[0]}`,
          callback_data: key[0],
        },
      ];
    }),

    one_time_keyboard,
    selective,
    resize_keyboard: true, // Сделает кнопки компактными
  };
};
