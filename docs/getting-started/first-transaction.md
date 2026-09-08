# Your First Transaction

Send your first CGT transfer on Demiurge.

---

## Prerequisites

- Access to a Demiurge account with CGT balance
- RPC endpoint: `https://rpc.demiurge.cloud:9944`

---

## Step 1: Create or Load a Wallet

### Using CLI

```bash
# Generate a new wallet
demiurge wallet generate --output my-wallet.json

# Output:
# Address: 0x7a3b...
# Private key saved to my-wallet.json
```

### Using SDK

```typescript
import { Wallet } from '@demiurge/sdk';

// Generate new wallet
const wallet = Wallet.generate();
console.log('Address:', wallet.address);
console.log('Public key:', wallet.publicKey);

// Or load existing wallet
const loadedWallet = Wallet.fromPrivateKey('your-private-key-hex');
```

---

## Step 2: Claim Starter Bonus (New Accounts)

New accounts can claim 100 CGT starter bonus:

### Using RPC

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "balances_claimStarter",
    "params": ["YOUR_ADDRESS_HEX"]
  }'
```

### Using SDK

```typescript
const result = await client.claimStarterBonus(wallet.address);
console.log('Claimed:', result.amount, 'CGT');
```

---

## Step 3: Check Balance

### Using CLI

```bash
demiurge wallet balance 0x0000000000000000000000000000000000000000000000000000000000000001
```

### Using RPC

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "balances_getBalance",
    "params": ["0000000000000000000000000000000000000000000000000000000000000001"]
  }'
```

Response:
```json
{"jsonrpc":"2.0","result":"10000","id":1}
```

Note: Balance is in smallest units (100 units = 1 CGT)

---

## Step 4: Send a Transfer

### Using RPC

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "balances_transfer",
    "params": [
      "SENDER_ADDRESS_HEX",
      "RECIPIENT_ADDRESS_HEX",
      "100",
      "SIGNATURE_HEX"
    ]
  }'
```

Response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "tx_hash": "0x4784c096...",
    "from": "0x0000...0001",
    "to": "0x0000...0099",
    "amount": "100",
    "new_sender_balance": "9900",
    "new_recipient_balance": "100"
  },
  "id": 1
}
```

### Using SDK

```typescript
import { DemiurgeClient, Wallet } from '@demiurge/sdk';

const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud:9944'
});

const wallet = Wallet.fromPrivateKey('your-private-key');

const result = await client.transfer({
  from: wallet.address,
  to: '0x0000...recipient',
  amount: '100', // 1 CGT
  wallet: wallet
});

console.log('Transaction hash:', result.tx_hash);
console.log('New balance:', result.new_sender_balance);
```

---

## Step 5: Verify the Transaction

### Check Updated Balances

```bash
# Check sender balance
curl -X POST https://rpc.demiurge.cloud:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"balances_getBalance","params":["SENDER_ADDRESS"]}'

# Check recipient balance
curl -X POST https://rpc.demiurge.cloud:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"balances_getBalance","params":["RECIPIENT_ADDRESS"]}'
```

---

## Transaction Fees

Demiurge uses an **energy system** instead of gas fees:

- Transactions cost **energy**, not CGT
- Energy regenerates over time (10 per block)
- Maximum energy: 1000 per account
- **Result:** Users never pay transaction fees

---

## Common Errors

### "Insufficient balance"
```json
{"error": {"code": -32010, "message": "Insufficient balance: have 0, need 100"}}
```
**Solution:** Claim starter bonus or receive CGT from another account.

### "Invalid signature"
```json
{"error": {"code": -32010, "message": "Invalid signature format"}}
```
**Solution:** Ensure signature is valid hex string (128 characters).

### "Account not found"
The account doesn't exist yet. Claim starter bonus or receive a transfer first.

---

## Next Steps

- [RPC Reference](../developers/rpc-reference.md) - All available methods
- [DRC-369 Specification](../specifications/drc369.md) - Create NFTs
- [SDK Documentation](../developers/sdk/typescript.md) - Full SDK guide

---

**Congratulations!** You've completed your first Demiurge transaction.
