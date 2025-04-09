import { fetchContractData } from "./fetch";
import { formatUserSummary, formatReserves } from "@aave/math-utils";
import dayjs from "dayjs";
import dotenv from "dotenv";
import { ethers } from "ethers";
import chalk from "chalk";

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

function formatUSD(value: string): string {
  const num = parseFloat(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatHealthFactor(healthFactor: string): string {
  const num = parseFloat(healthFactor);
  if (num >= 2) return chalk.green(healthFactor);
  if (num >= 1) return chalk.yellow(healthFactor);
  return chalk.red(healthFactor);
}

async function main() {
  console.log(chalk.blue("\n🔍 Aave Health Monitor\n"));

  const currentAccount = getAccountAddress();
  console.log(chalk.gray(`Monitoring address: ${currentAccount}\n`));

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

  // Print summary in a nice format
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
    ).toFixed(2)}%`
  );
  console.log(
    `${chalk.bold("Health Factor:    ")} ${formatHealthFactor(
      parseFloat(userSummary.healthFactor).toFixed(2)
    )}`
  );
  console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  // Print warning if health factor is low
  const healthFactor = parseFloat(userSummary.healthFactor);
  if (healthFactor <= 1.2) {
    console.log(
      chalk.red("⚠️  WARNING: Your position is at risk of liquidation!")
    );
    console.log(
      chalk.yellow(
        "Consider adding more collateral or reducing your borrowed amount.\n"
      )
    );
  } else if (healthFactor < 1.4) {
    console.log(chalk.yellow("⚠️  Caution: Your health factor is below 1.4"));
    console.log(
      chalk.yellow(
        "Consider adding more collateral to improve your position's safety.\n"
      )
    );
  }
}

main().catch((error) => {
  console.error(chalk.red("\n❌ Error:"), error.message);
  process.exit(1);
});
