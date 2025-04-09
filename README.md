# Dimi Aave

A TypeScript project for monitoring Aave protocol health.

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
```

### Command Line Arguments

The account address can also be provided via command line (overrides .env):

```bash
npm run dev -- --address=0x...
# or
node dist/index.js --address=0x...
```

## Project Structure

- `src/` - TypeScript source files
- `dist/` - Compiled JavaScript files
- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (create from .env.example)

## License

ISC
