# Demiurge.guru - Marketing Site

The official marketing and documentation website for Demiurge Blockchain.

## Features

- **Marketing Homepage**: Beautiful, modern design showcasing the blockchain
- **Complete Documentation**: Comprehensive guides and API references
- **Sophia AI Assistant**: AI-powered assistant for blockchain information, QOR ID auth, and troubleshooting
- **Chain News Blog**: Auto-updating blog that tracks blockchain additions
- **Community Forum**: Discussion platform for developers and creators
- **CGT Mining Guide**: Complete information about Creator God Token mining
- **Real-time Chain Status**: Live monitoring of blockchain services
- **Bug Reporting System**: Submit detailed bug reports directly to Alaustrup

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key for Sophia

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## Environment Variables

- `OPENAI_API_KEY`: Required for Sophia AI assistant
- `NEXT_PUBLIC_QOR_AUTH_URL`: QOR ID authentication service URL
- `NEXT_PUBLIC_RPC_URL`: Blockchain RPC endpoint
- `BUG_REPORT_EMAIL`: Email address for bug reports (defaults to alaustrup@demiurge.cloud)

## Deployment to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Deploy
vercel --prod
```

## Sophia AI Capabilities

Sophia can help with:
- Blockchain information and documentation
- QOR ID authentication (login/signup)
- Real-time chain service status
- Development setup assistance
- Troubleshooting chain services
- Bug report submission

## Project Structure

```
src/
  app/              # Next.js app router pages
  components/       # React components
  contexts/         # React contexts (Sophia, Chain Status)
  lib/              # Utility functions
```

## License

Part of the Demiurge Blockchain ecosystem.
