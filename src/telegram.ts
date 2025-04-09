import TelegramBot from "node-telegram-bot-api";
import chalk from "chalk";
import { formatUSD } from "./utils";

// Initialize Telegram bot if credentials are provided
let telegramBot: TelegramBot | null = null;
if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: false,
  });
}

export async function sendTelegramAlert(
  currentAccount: string,
  healthFactor: number,
  totalCollateral: string,
  totalBorrowed: string,
  threshold: number
) {
  if (!telegramBot || !process.env.TELEGRAM_CHAT_ID) return;

  try {
    let message: string;

    if (healthFactor < threshold) {
      message =
        `⚠️ <b>Health Factor Alert</b> ⚠️\n\n` +
        `<b>Address:</b> ${currentAccount}\n` +
        `<b>Health Factor:</b> ${healthFactor.toFixed(3)}\n` +
        `<b>Total Collateral:</b> ${formatUSD(totalCollateral)}\n` +
        `<b>Total Borrowed:</b> ${formatUSD(totalBorrowed)}\n\n` +
        `Your health factor is <b>${healthFactor.toFixed(
          3
        )}</b>! Below ${threshold}. Consider adding more collateral to improve your position's safety.`;
    } else {
      return; // No alert needed
    }

    await telegramBot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error(chalk.yellow("Failed to send Telegram notification:"), error);
  }
}
