import { ethers } from "ethers";
import {
  UiPoolDataProvider,
  ChainId,
  ReserveDataHumanized,
} from "@aave/contract-helpers";
import * as markets from "@bgd-labs/aave-address-book";
import dotenv from "dotenv";
import dayjs from "dayjs";
import {
  formatUserSummary,
  formatReserves,
  FormatUserSummaryResponse,
  FormatReserveUSDResponse,
} from "@aave/math-utils";
import chalk from "chalk";
import { formatHealthFactor, formatUSD } from "./utils";

// Load environment variables
dotenv.config();

if (!process.env.RPC_URL) {
  throw new Error("RPC_URL environment variable is required");
}

// Initialize provider with RPC URL from environment
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

// View contract used to fetch all reserves data (including market base currency data), and user reserves
// Using Aave V3 Eth Mainnet address for demo
const poolDataProviderContract = new UiPoolDataProvider({
  uiPoolDataProviderAddress: markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
  provider,
  chainId: ChainId.mainnet,
});

export async function fetchContractData(currentAccount: string) {
  // Object containing array of pool reserves and market base currency data
  // { reservesArray, baseCurrencyData }
  const reserves = await poolDataProviderContract.getReservesHumanized({
    lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  });

  // Object containing array or users aave positions and active eMode category
  // { userReserves, userEmodeCategoryId }
  const userReserves = await poolDataProviderContract.getUserReservesHumanized({
    lendingPoolAddressProvider: markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
    user: currentAccount,
  });

  // console.log({ reserves, userReserves, reserveIncentives, userIncentives });

  return { reserves, userReserves };
}

export async function getUserPosition(currentAccount: string): Promise<{
  healthFactor: number;
  userSummary: FormatUserSummaryResponse<
    ReserveDataHumanized & FormatReserveUSDResponse
  >;
}> {
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

  return { healthFactor, userSummary };
}

export function logUserPosition(
  currentAccount: string,
  healthFactor: number,
  threshold: number,
  userSummary: FormatUserSummaryResponse<
    ReserveDataHumanized & FormatReserveUSDResponse
  >
) {
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
}
