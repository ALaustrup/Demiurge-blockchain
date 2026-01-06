# ArchonAI Service

Intelligent assistant for the Demiurge Blockchain ecosystem.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set environment variables:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. Index documentation:
```bash
pnpm index-docs
```

4. Start service:
```bash
pnpm dev
```

## API

### POST /api/chat

Send a message to ArchonAI.

**Request**:
```json
{
  "message": "How do I mint an NFT?",
  "context": []
}
```

**Response**:
```json
{
  "response": "To mint an NFT...",
  "sources": [
    {
      "path": "docs/api/RPC.md",
      "title": "RPC API"
    }
  ]
}
```

## Integration

- **Portal Web**: `/conspire` page
- **AbyssOS**: `ArchonAIAssistantApp`
- **CLI**: `demiurge ai <query>`
