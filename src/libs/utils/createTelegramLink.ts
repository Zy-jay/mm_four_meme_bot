// Example usage in your code:
export const createTelegramLink = (text: string, url: string) => {
  // Escape special characters in text
  const escapedText = text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
  // Escape special characters in URL
  const escapedUrl = url.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");

  return `[${escapedText}](${escapedUrl})`;
};

// Usage example:
// const link = createTelegramLink(
//   "View on Binance",
//   "https://www.binance.com/trade/BTC_USDT"
// );
// Result: [View on Binance](https://www\.binance\.com/trade/BTC\_USDT)
