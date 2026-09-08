# Sophia AI Assistant - Prototype

A command-line prototype of Sophia, the AI assistant for Demiurge Blockchain.

## Features

- 🤖 **AI-Powered Chat**: Ask Sophia anything about Demiurge Blockchain
- 🔐 **QOR ID Authentication**: Login and register through Sophia
- 📊 **Chain Status Monitoring**: Real-time blockchain status checks
- 🐛 **Bug Reporting**: Submit detailed bug reports
- 💬 **Conversational Interface**: Natural language interaction

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Run the prototype:**
   ```bash
   pnpm start
   # or for development with watch mode:
   pnpm dev
   ```

## Usage

### Commands

- `help` - Show available commands
- `status` - Check blockchain status
- `auth login` - Login with QOR ID
- `auth register` - Register new QOR ID
- `bug-report` - Submit a bug report
- `exit` / `quit` - Exit Sophia

### Example Interactions

```
You: What is CGT?
Sophia: CGT (Creator God Token) is the native token of the Demiurge Blockchain...

You: How do I mine CGT?
Sophia: There are several ways to mine CGT...

You: status
Sophia: ✅ Chain Status: ONLINE
        Block Number: 1,234,567
        Latency: 45ms
```

## Environment Variables

- `OPENAI_API_KEY` (required) - Your OpenAI API key
- `QOR_AUTH_URL` - QOR ID authentication service URL
- `RPC_URL` - WebSocket RPC endpoint
- `RPC_HTTP_URL` - HTTP RPC endpoint
- `BUG_REPORT_EMAIL` - Email for bug reports

## Architecture

- `src/index.ts` - Main entry point and CLI interface
- `src/sophia.ts` - Core Sophia AI class with all capabilities
- `src/readline.ts` - CLI input handling utilities

## Development

This is a prototype demonstrating Sophia's capabilities. The full implementation is integrated into the marketing site at `apps/marketing-site`.

## License

Part of the Demiurge Blockchain ecosystem.
