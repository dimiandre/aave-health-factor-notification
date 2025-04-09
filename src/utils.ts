import chalk from "chalk";

export function formatUSD(value: string): string {
  const num = parseFloat(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatHealthFactor(healthFactor: string): string {
  const num = parseFloat(healthFactor);
  if (num >= 2) return chalk.green(healthFactor);
  if (num >= 1) return chalk.yellow(healthFactor);
  return chalk.red(healthFactor);
}

export function clearConsole() {
  console.clear();
}
