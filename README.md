# Dimi Aave

A TypeScript project for monitoring Aave protocol health with Telegram notifications.

## Features

- Real-time monitoring of Aave positions
- Configurable monitoring intervals
- Telegram notifications for health factor alerts
- Color-coded console output
- Configurable health factor thresholds
- Continuous monitoring with automatic updates

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

   - Copy `.env.example` to `.env`
   - Set required variables:
     - `ACCOUNT_ADDRESS`: Ethereum address to monitor
     - `RPC_URL`: Ethereum RPC endpoint URL
   - Optional variables:
     - `MONITORING_INTERVAL`: Update interval in seconds (default: 20)
     - `HEALTH_FACTOR_ALERT_THRESHOLD`: Threshold for alerts (default: 1.4)
     - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
     - `TELEGRAM_CHAT_ID`: Your Telegram chat ID

3. Development:

```bash
# Run in development mode with hot reload
npm run dev

# Watch for changes and compile
npm run watch
```

4. Production:

```bash
# Build the project
npm run build

# Run the built project
npm start
```

## Usage

### Environment Variables

Create a `.env` file with the following variables:

```
# Required: Ethereum address to monitor
ACCOUNT_ADDRESS=0x...

# Required: Ethereum RPC endpoint
RPC_URL=https://eth-mainnet.public.blastapi.io

# Optional: Monitoring interval in seconds (default: 20)
MONITORING_INTERVAL=20

# Optional: Health factor threshold for alerts (default: 1.4)
HEALTH_FACTOR_ALERT_THRESHOLD=1.4

# Optional: Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### Command Line Arguments

The account address can also be provided via command line (overrides .env):

```bash
npm run dev -- --address=0x...
# or
node dist/index.js --address=0x...
```

## Setting up Telegram Notifications

### 1. Create a Telegram Bot

1. Open Telegram and search for "@BotFather"
2. Start a chat with BotFather
3. Send the command `/newbot`
4. Follow the prompts to:
   - Choose a name for your bot
   - Choose a username for your bot (must end in 'bot')
5. BotFather will respond with a token that looks like:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
6. Save this token as your `TELEGRAM_BOT_TOKEN`

### 2. Get Your Chat ID

1. Start a chat with your new bot
2. Send any message to the bot
3. Visit this URL in your browser (replace with your bot token):
   ```
   https://api.telegram.org/bot<YourBOTToken>/getUpdates
   ```
4. Look for the "chat" object in the response. It will contain an "id" field
5. Save this number as your `TELEGRAM_CHAT_ID`

### 3. Configure Notifications

1. Add both values to your `.env` file:

   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=987654321
   ```

2. (Optional) Configure the health factor threshold:
   ```
   HEALTH_FACTOR_ALERT_THRESHOLD=1.4
   ```

### Notification Types

The bot will send two types of notifications:

1. Critical Alert (Health Factor ≤ 1.2):

   - Sent when position is at risk of liquidation
   - Includes position details and urgent action items

2. Warning Alert (Health Factor < threshold):
   - Sent when health factor drops below configured threshold
   - Includes position details and recommendations

## Project Structure

- `src/` - TypeScript source files
  - `index.ts` - Main application entry point
  - `fetch.ts` - Aave data fetching logic
- `dist/` - Compiled JavaScript files
- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (create from .env.example)

## License

ISC
