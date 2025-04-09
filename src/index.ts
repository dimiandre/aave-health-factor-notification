import { fetchContractData } from "./fetch";
import { formatUserSummary, formatReserves } from "@aave/math-utils";
import dayjs from "dayjs";
import dotenv from "dotenv";
import { ethers } from "ethers";
import chalk from "chalk";
import { formatUSD, formatHealthFactor, clearConsole } from "./utils";
import { sendTelegramAlert } from "./telegram";

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

function getHealthFactorThreshold(): number {
  const envThreshold = process.env.HEALTH_FACTOR_ALERT_THRESHOLD;
  if (envThreshold) {
    const threshold = parseFloat(envThreshold);
    if (isNaN(threshold) || threshold <= 0) {
      throw new Error(
        "HEALTH_FACTOR_ALERT_THRESHOLD must be a positive number"
      );
    }
    return threshold;
  }
  return 1.4; // Default threshold
}

async function checkPosition(currentAccount: string) {
  const { reserves, userReserves } = await fetchContractData(currentAccount);

  const reservesArray = reserves.reservesData;
  const baseCurrencyData = reserves.baseCurrencyData;
  const userReservesArray = userReserves.userReserves;

  const currentTimestamp = dayjs().unix();

  const formattedReserves = formatReserves({
    reserves: reservesArray,
    currentTimestamp,
    marketReferenceCurrencyDecimals:
      baseCurrencyData.marketReferenceCurrencyDecimals,
    marketReferencePriceInUsd:
      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
  });

  const userSummary = formatUserSummary({
    currentTimestamp,
    marketReferencePriceInUsd:
      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
    marketReferenceCurrencyDecimals:
      baseCurrencyData.marketReferenceCurrencyDecimals,
    userReserves: userReservesArray,
    formattedReserves,
    userEmodeCategoryId: userReserves.userEmodeCategoryId,
  });

  const healthFactor = parseFloat(userSummary.healthFactor);
  const threshold = getHealthFactorThreshold();

  // Print summary in a nice format
  console.log(chalk.blue("\n🔍 Aave Health Monitor"));
  console.log(
    chalk.gray(`Last updated: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}\n`)
  );
  console.log(chalk.gray(`Monitoring address: ${currentAccount}\n`));
  console.log(chalk.bold("📊 Position Summary"));
  console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(
    `${chalk.bold("Total Collateral:")} ${formatUSD(
      userSummary.totalCollateralUSD
    )}`
  );
  console.log(
    `${chalk.bold("Total Borrowed:  ")} ${formatUSD(
      userSummary.totalBorrowsUSD
    )}`
  );
  console.log(
    `${chalk.bold("Liquidation Threshold:")} ${parseFloat(
      userSummary.currentLiquidationThreshold
    ).toFixed(3)}%`
  );
  console.log(
    `${chalk.bold("Health Factor:    ")} ${formatHealthFactor(
      parseFloat(userSummary.healthFactor).toFixed(3)
    )}`
  );
  console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  // Check health factor and send Telegram alerts if configured
  if (healthFactor <= 1.2) {
    console.log(
      chalk.red("⚠️  WARNING: Your position is at risk of liquidation!")
    );
    console.log(
      chalk.yellow(
        "Consider adding more collateral or reducing your borrowed amount.\n"
      )
    );
  } else if (healthFactor < threshold) {
    console.log(
      chalk.yellow(`⚠️  Caution: Your health factor is below ${threshold}`)
    );
    console.log(
      chalk.yellow(
        "Consider adding more collateral to improve your position's safety.\n"
      )
    );
  }

  // Send Telegram alert if configured
  await sendTelegramAlert(
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

  // Initial check
  await checkPosition(currentAccount);

  // Set up continuous monitoring
  console.log(
    chalk.gray(
      `Press Ctrl+C to stop monitoring (updating every ${interval / 1000}s)\n`
    )
  );

  // Run check at the specified interval
  setInterval(async () => {
    try {
      clearConsole();
      await checkPosition(currentAccount);
    } catch (error) {
      console.error(chalk.red("\n❌ Error:"), error);
      // Don't exit, just log the error and continue monitoring
    }
  }, interval);
}

main().catch((error) => {
  console.error(chalk.red("\n❌ Error:"), error.message);
  process.exit(1);
});
