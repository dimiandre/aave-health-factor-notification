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

export function getHealthFactorThreshold(): number {
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
