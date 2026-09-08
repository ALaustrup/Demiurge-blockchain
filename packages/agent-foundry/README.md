# Demiurge Agent Foundry SDK

Create autonomous AI agents as **First-Class Citizens** on the Demiurge Protocol.

**Status:** Mainnet v1 | **Features:** Dual registration patterns (instant keys + pre-registered)

## Features

- **Dual Registration Patterns**: Instant keys OR pre-registered agent accounts
- **Sovereign Identity**: Agents get their own DID (`did:demiurge:agent:...`)
- **Autonomous Signing**: Agents hold their own keys and can sign transactions
- **Persistent Memory**: Vector-State Kernel for long-term agent memory
- **Multi-LLM Support**: OpenAI, Gemini, Anthropic, Cursor, Ollama
- **Tool System**: Built-in tools for blockchain operations
- **Spending Limits**: Configurable per-epoch limits for bounded autonomy

## Installation

```bash
npm install @demiurge/agent-foundry
# or
pnpm add @demiurge/agent-foundry
```

## Agent Registration Patterns

The SDK supports two patterns for agent creation:

### Pattern 1: Instant Keys (Recommended for Quick Deployment)

Generate a new keypair and register the agent in one step:

```typescript
import { createAgent, AgentFoundry } from '@demiurge/agent-foundry';

// Create an agent with instant key generation
const agent = await createAgent({
  name: 'TradingOracle',
  
  // LLM configuration
  llm: AgentFoundry.providers.gemini(process.env.GEMINI_API_KEY!),
  
  // Autonomy level
  autonomy: 'bounded',
  
  // What can this agent do?
  capabilities: ['read', 'analyze', 'trade', 'transfer'],
  
  // Agent's mission
  mission: `
    You are a trading oracle. Your goal is to analyze market conditions
    and execute trades that benefit your controller.
  `,
  
  // Spending limit per 24-hour epoch
  spendingLimit: '1000 CGT',
  
  // Human controller (can override/stop agent)
  controller: 'alice.demiurge',
});

// Agent now has its own DID and keypair
console.log(`Agent DID: ${agent.did.did}`);
console.log(`Agent Address: ${agent.wallet.address}`);

// Save the private key for later use
const privateKey = agent.wallet.exportPrivateKey();
```

### Pattern 2: Pre-Registered Agents (For Planned Deployments)

Use an existing agent account that was registered ahead of time:

```typescript
import { AgentFoundry } from '@demiurge/agent-foundry';

// First, register the agent account (can be done separately)
const registration = await AgentFoundry.registerAgentAccount({
  authUrl: 'https://demiurge.cloud/api/v1',
  name: 'ProductionBot',
  capabilities: ['read', 'analyze', 'execute'],
});

// Save these credentials securely
console.log('Agent Address:', registration.address);
console.log('Private Key:', registration.privateKey);

// Later, create agent from registered account
const agent = await AgentFoundry.fromRegisteredAccount({
  agentAddress: registration.address,
  privateKey: process.env.AGENT_PRIVATE_KEY!,
  
  // LLM and behavior config
  llm: AgentFoundry.providers.gemini(process.env.GEMINI_API_KEY!),
  autonomy: 'bounded',
  spendingLimit: '500 CGT',
  mission: 'Monitor and report on market conditions.',
});

console.log(`Agent DID: ${agent.did.did}`);
```

### When to Use Each Pattern

| Pattern | Use Case | Benefits |
|---------|----------|----------|
| **Instant Keys** | Development, testing, quick deployments | Fast setup, no pre-planning |
| **Pre-Registered** | Production, audited systems, enterprises | Controlled rollout, key management |

## Quick Start

```typescript
import { createAgent, AgentFoundry } from '@demiurge/agent-foundry';

// Create an autonomous trading agent (instant keys pattern)
const agent = await createAgent({
  name: 'TradingOracle',
  llm: AgentFoundry.providers.gemini(process.env.GEMINI_API_KEY!),
  autonomy: 'bounded',
  capabilities: ['read', 'analyze', 'trade', 'transfer'],
  mission: `You are a trading oracle...`,
  spendingLimit: '1000 CGT',
  controller: 'alice.demiurge',
});

// Agent now has its own DID
console.log(`Agent DID: ${agent.did.did}`);

// Run a single inference
const result = await agent.think('What assets should I acquire today?');
console.log(result.output);

// Or run autonomously
await agent.run(30000); // Check every 30 seconds
```

## Autonomy Levels

| Level | Description | Signing | Approval Required |
|-------|-------------|---------|-------------------|
| `supervised` | Human approves all transactions | No | All actions |
| `bounded` | Pre-approved actions + spending limit | Yes | High-value only |
| `autonomous` | Full signing authority | Yes | None |
| `sovereign` | Can spawn sub-agents | Yes | None |

## LLM Providers

### OpenAI

```typescript
import { createAgent, AgentFoundry } from '@demiurge/agent-foundry';

const agent = await createAgent({
  llm: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo',
    temperature: 0.7,
  },
  // ... rest of config
});
```

### Google Gemini

```typescript
const agent = await createAgent({
  llm: {
    provider: 'gemini',
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-pro',
  },
  // ...
});
```

### Local Ollama

```typescript
const agent = await createAgent({
  llm: {
    provider: 'ollama',
    model: 'llama3',
    baseUrl: 'http://localhost:11434',
  },
  // ...
});
```

## Memory System

Agents have persistent memory stored on-chain:

```typescript
// Store a memory
await agent.remember(
  'User prefers conservative trading strategies',
  'semantic', // Type: episodic, semantic, procedural
  80 // Importance: 0-100
);

// Search memories
const memories = await agent.recall('trading preferences');
```

### Memory Types

- **Episodic**: Specific events/experiences
- **Semantic**: General knowledge/facts
- **Procedural**: Skills/patterns/strategies
- **Working**: Short-term context (auto-cleared)

## Built-in Tools

Agents come with standard tools for blockchain operations:

| Tool | Description |
|------|-------------|
| `get_assets` | Get DRC-369 assets owned by an address |
| `transfer_cgt` | Transfer CGT tokens (within limits) |
| `add_asset_xp` | Add XP to a DRC-369 asset |
| `remember` | Store information in long-term memory |
| `recall` | Search memory for relevant information |
| `get_chain_status` | Get current block number and TPS |
| `resolve_identity` | Resolve QOR ID handle to address |

### Custom Tools

```typescript
agent.addTool({
  name: 'check_price',
  description: 'Check the current price of an asset',
  parameters: {
    symbol: {
      type: 'string',
      description: 'Asset symbol (e.g., "CGT")',
    },
  },
  required: ['symbol'],
  execute: async (params) => {
    const price = await fetchPrice(params.symbol as string);
    return { price };
  },
});
```

## Events

Listen to agent lifecycle events:

```typescript
agent.on('started', ({ agentDid }) => {
  console.log(`Agent started: ${agentDid}`);
});

agent.on('inferenceComplete', ({ requestId, result }) => {
  console.log(`Inference ${requestId}: ${result.output}`);
});

agent.on('toolCall', ({ name, arguments: args }) => {
  console.log(`Calling tool: ${name}`, args);
});

agent.on('transactionSubmitted', ({ txHash, actionType }) => {
  console.log(`Transaction: ${actionType} -> ${txHash}`);
});

agent.on('error', ({ code, message }) => {
  console.error(`Error [${code}]: ${message}`);
});
```

## Context Injection

When interacting with DRC-369 assets, their metadata is automatically injected into the agent's context:

```typescript
// Agent automatically knows about assets it interacts with
const result = await agent.think(
  'The sword I found has physics properties. Should I sell it?'
);

// The agent sees:
// - Asset name, level, XP, rarity
// - Physics: mass, friction, durability
// - Custom attributes
```

## Security

### Spending Limits

```typescript
// Check remaining budget
const remaining = await agent.getRemainingBudget();
console.log(`Remaining: ${remaining} CGT`);
```

### Kill Switch

Controllers can stop agents at any time:

```typescript
await agent.stop('Security concern');
```

### Bounded Capabilities

Only allow specific actions:

```typescript
const agent = await createAgent({
  capabilities: ['read', 'analyze'], // No transfer/trade
  autonomy: 'supervised', // Requires approval for all actions
  // ...
});
```

## API Reference

### `createAgent(config: AgentConfig): Promise<EtherealAgent>`

Create and start an agent.

### `EtherealAgent`

| Method | Description |
|--------|-------------|
| `start()` | Register agent and start operation |
| `stop(reason?)` | Stop the agent |
| `think(prompt)` | Run single inference |
| `run(intervalMs?)` | Start autonomous loop |
| `remember(content, type?, importance?)` | Store memory |
| `recall(query, limit?)` | Search memories |
| `addTool(tool)` | Add custom tool |
| `removeTool(name)` | Remove tool |
| `getRemainingBudget()` | Get remaining spending budget |

### Properties

| Property | Description |
|----------|-------------|
| `did` | Agent's DID |
| `metadata` | Agent metadata |
| `state` | Current state (idle, thinking, executing, etc.) |

## Related Packages

- [@demiurge/sdk](https://www.npmjs.com/package/@demiurge/sdk) - Core Protocol SDK
- [@demiurge/qor-sdk](https://www.npmjs.com/package/@demiurge/qor-sdk) - Identity SDK
- [@demiurge/drc369-sdk](https://www.npmjs.com/package/@demiurge/drc369-sdk) - NFT SDK

## License

MIT - Demiurge Protocol

## Links

- [Agentic Layer Documentation](https://demiurge.cloud/docs/agents)
- [Documentation](https://demiurge.cloud/docs)
- [GitHub](https://github.com/ALaustrup/Demiurge-Blockchain)
- [Website](https://demiurge.cloud)
