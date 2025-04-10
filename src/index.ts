import { getUserPosition, logUserPosition } from "./aave";
import dotenv from "dotenv";
import { ethers } from "ethers";
import chalk from "chalk";
import { clearConsole, getHealthFactorThreshold } from "./utils";
import { listenMessages, sendTelegramAlert, setupBot } from "./telegram";
import TelegramBot from "node-telegram-bot-api";

// Load environment variables
dotenv.config();

function getAccountAddress(): string {
  // Check command line arguments first
  const args = process.argv.slice(2);
  const addressArg = args.find((arg) => arg.startsWith("--address="));
  if (addressArg) {
    const address = addressArg.split("=")[1];
    if (ethers.utils.isAddress(address)) {
      return address;
    }
    throw new Error(
      "Invalid Ethereum address provided as command line argument"
    );
  }

  // Then check environment variable
  const envAddress = process.env.ACCOUNT_ADDRESS;
  if (envAddress) {
    if (ethers.utils.isAddress(envAddress)) {
      return envAddress;
    }
    throw new Error("Invalid Ethereum address in environment variable");
  }

  throw new Error(
    "No account address provided. Please provide it either:\n" +
      "1. As a command line argument: --address=0x...\n" +
      "2. In the .env file: ACCOUNT_ADDRESS=0x..."
  );
}

function getMonitoringInterval(): number {
  const envInterval = process.env.MONITORING_INTERVAL;
  if (envInterval) {
    const interval = parseInt(envInterval, 10);
    if (isNaN(interval) || interval < 1) {
      throw new Error("MONITORING_INTERVAL must be a positive number");
    }
    return interval * 1000; // Convert seconds to milliseconds
  }
  return 20000; // Default to 20 seconds
}

async function checkPosition(currentAccount: string, telegramBot: TelegramBot) {
  const { healthFactor, userSummary } = await getUserPosition(currentAccount);
  const threshold = getHealthFactorThreshold();

  logUserPosition(currentAccount, healthFactor, threshold, userSummary);

  // Send Telegram alert if configured
  await sendTelegramAlert(
    telegramBot,
    currentAccount,
    healthFactor,
    userSummary.totalCollateralUSD,
    userSummary.totalBorrowsUSD,
    threshold
  );
}

async function main() {
  const currentAccount = getAccountAddress();
  const interval = getMonitoringInterval();

  const telegramBot = setupBot();

  if (telegramBot === null) {
    throw new Error("Can't setup telegram bot");
  }

  // Run check at the specified interval
  setInterval(async () => {
    try {
      clearConsole();
      await checkPosition(currentAccount, telegramBot);

      // Set up continuous monitoring
      console.log(
        chalk.gray(
          `Press Ctrl+C to stop monitoring (updating every ${
            interval / 1000
          }s)\n`
        )
      );
    } catch (error) {
      console.error(chalk.red("\n❌ Error:"), error);
      // Don't exit, just log the error and continue monitoring
    }
  }, interval);

  await listenMessages(telegramBot, currentAccount);
}

main().catch((error) => {
  console.error(chalk.red("\n❌ Error:"), error.message);
  process.exit(1);
});
