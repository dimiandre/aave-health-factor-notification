import TelegramBot from "node-telegram-bot-api";
import chalk from "chalk";
import { formatUSD } from "./utils";
import { getUserPosition } from "./aave";

// Initialize Telegram bot if credentials are provided

export function setupBot(): TelegramBot | null {
  let telegramBot: TelegramBot | null = null;
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: true,
    });
  }

  return telegramBot;
}

export async function sendTelegramAlert(
  telegramBot: TelegramBot,
  currentAccount: string,
  healthFactor: number,
  totalCollateral: string,
  totalBorrowed: string,
  threshold: number | undefined
) {
  if (!telegramBot || !process.env.TELEGRAM_CHAT_ID) return;

  try {
    let message: string;

    if (threshold !== undefined && healthFactor > threshold) {
      return;
    }

    message =
      `⚠️ <b>Health Factor Alert</b> ⚠️\n\n` +
      `<b>Address:</b> ${currentAccount}\n` +
      `<b>Health Factor:</b> ${healthFactor.toFixed(3)}\n` +
      `<b>Total Collateral:</b> ${formatUSD(totalCollateral)}\n` +
      `<b>Total Borrowed:</b> ${formatUSD(totalBorrowed)}\n\n`;

    if (threshold !== undefined) {
      message += `Your health factor is <b>${healthFactor.toFixed(
        3
      )}</b>! Below ${threshold}. Consider adding more collateral to improve your position's safety.`;
    }

    await telegramBot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
      parse_mode: "HTML",
    });
  } catch (error) {
    console.error(chalk.yellow("Failed to send Telegram notification:"), error);
  }
}

export async function listenMessages(
  telegramBot: TelegramBot,
  currentAccount: string
) {
  telegramBot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Only respond to messages from authorized chat ID
    if (chatId.toString() !== process.env.TELEGRAM_CHAT_ID) {
      return;
    }
    if (text == "status") {
      // Get user position
      const { healthFactor, userSummary } = await getUserPosition(
        currentAccount
      );

      await sendTelegramAlert(
        telegramBot,
        currentAccount,
        healthFactor,
        userSummary.totalCollateralUSD,
        userSummary.totalBorrowsUSD,
        undefined
      );
    }
  });
}
