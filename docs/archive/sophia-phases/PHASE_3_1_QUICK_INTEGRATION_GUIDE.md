# Phase 3.1 Services - Quick Integration Guide

## Fast Start

### 1. Import Services
```typescript
import { 
  blockchainService, 
  wsService, 
  analyticsService, 
  notificationService,
  useWebSocketSubscription,
  useNotifications
} from '@lib/services';
```

### 2. Use in Components

#### Get Real Balance
```typescript
import { blockchainService } from '@lib/services';

const balance = await blockchainService.getAccountBalance('user@qor');
console.log(balance.available);  // 2347.52
```

#### Real-Time Balance Updates
```typescript
import { useWebSocketSubscription } from '@lib/services';

export function Balance() {
  const { data: balance } = useWebSocketSubscription('balance', {
    qorId: 'user@qor'
  });
  
  return <div>${balance?.total}</div>;
}
```

#### Show Notifications
```typescript
import { useNotifications } from '@lib/services';

export function NotificationCenter() {
  const { notifications, markAsRead } = useNotifications();
  
  return notifications.map(n => (
    <Notification 
      key={n.id}
      notification={n}
      onDismiss={() => markAsRead(n.id)}
    />
  ));
}
```

#### Display Analytics
```typescript
import { analyticsService } from '@lib/services';

const metrics = await analyticsService.calculatePortfolioMetrics('user@qor');
return (
  <div>
    <p>Value: ${metrics.totalValue}</p>
    <p>Sharpe Ratio: {metrics.sharpeRatio}</p>
  </div>
);
```

---

## Service Reference

### Blockchain Service

**Methods**:
- `getValidatorStats()` → ValidatorStats
- `getAccountBalance(qorId)` → AccountBalance
- `getTransactionHistory(qorId, limit?, offset?)` → Transaction[]
- `getNFTCollection(qorId, collection?)` → NFTMetadata[]
- `getGameState(qorId, gameId)` → GameState
- `getStakingRewards(qorId, limit?)` → StakingReward[]
- `getNetworkMetrics()` → NetworkMetrics
- `submitTransaction(signedTx)` → { hash, status }
- `subscribeToUpdates(channel, qorId, callback)` → unsubscribe

**Caching**: 30 seconds  
**Error Handling**: Returns fallback values

---

### WebSocket Service

**Methods**:
- `connect()` → Promise
- `subscribe(channel, context, options)` → listenerId
- `unsubscribe(listenerId)` → void
- `disconnect()` → Promise
- `isConnected()` → boolean

**Channels**:
- `balance` - Balance updates
- `transactions` - New transactions
- `rewards` - Staking rewards
- `gameState` - Game updates
- `priceUpdate` - Price changes
- `blockFinalized` - New blocks

**React Hook**:
```typescript
const { data, error, isLoading, isConnected } = useWebSocketSubscription(
  channel,
  context,
  initialData
);
```

---

### Analytics Service

**Methods**:
- `calculatePortfolioMetrics(qorId)` → PortfolioMetrics
- `getAssetAllocation(qorId)` → AssetAllocation
- `getPerformanceMetrics(qorId)` → PerformanceMetrics
- `getStakingMetrics(qorId)` → StakingMetrics
- `getNFTMetrics(qorId)` → NFTMetrics
- `getChartData(metric, period, qorId)` → ChartDataPoint[]

**Caching**: 5 minutes  
**Metrics**: Sharpe ratio, max drawdown, volatility, diversification

---

### Notification Service

**Methods**:
- `notify(type, title, message, options)` → Notification
- `getNotifications(filter?)` → Notification[]
- `markAsRead(id)` → void
- `deleteNotification(id)` → void
- `subscribe(callback)` → listenerId
- `setPreferences(prefs)` → void

**Convenience Methods**:
- `notifyTransactionConfirmed(txHash, amount, type)`
- `notifyTransactionFailed(reason)`
- `notifyStakingReward(amount, era)`
- `notifyAchievementUnlocked(achievement, description)`
- `notifyPriceAlert(token, price, targetPrice)`

**React Hook**:
```typescript
const { 
  notifications, 
  unreadCount, 
  markAsRead 
} = useNotifications();
```

---

## Common Patterns

### Real-Time Dashboard
```typescript
export function Dashboard() {
  const { data: balance } = useWebSocketSubscription('balance', {
    qorId: user.qorId
  });
  
  const { data: txs } = useWebSocketSubscription('transactions', {
    qorId: user.qorId
  });

  return (
    <div>
      <p>Balance: ${balance?.total}</p>
      <p>Recent TXs: {txs?.length}</p>
    </div>
  );
}
```

### Notification Display
```typescript
export function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();
  
  return (
    <div className="notification-bell">
      {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
      <NotificationList notifications={notifications} />
    </div>
  );
}
```

### Analytics Chart
```typescript
export function PerformanceChart() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    analyticsService
      .getChartData('balance', '30d', user.qorId)
      .then(setData);
  }, [user.qorId]);
  
  return <AreaChart data={data} />;
}
```

---

## Error Handling

### With Try-Catch
```typescript
try {
  const balance = await blockchainService.getAccountBalance(qorId);
} catch (error) {
  notificationService.notify('error', 'Error', error.message);
}
```

### In React Hooks
```typescript
const { data, error, isLoading } = useWebSocketSubscription('balance', {
  qorId
});

if (error) return <ErrorDisplay error={error} />;
if (isLoading) return <LoadingSpinner />;
return <BalanceDisplay balance={data} />;
```

---

## Type Definitions

### Commonly Used Types

```typescript
// Balance
{
  total: number;
  available: number;
  staked: number;
  reserved: number;
}

// Transaction
{
  id: string;
  from: string;
  to: string;
  amount: number;
  type: 'sent' | 'received';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
}

// PortfolioMetrics
{
  totalValue: number;
  dayChange: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  diversificationScore: number;
}

// Notification
{
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
}
```

---

## Testing

### Test Blockchain Queries
```typescript
// In component
const { useEffect, useState } = require('react');
const { blockchainService } = require('@lib/services');

export function TestComponent() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    blockchainService.getValidatorStats().then(setStats);
  }, []);
  
  return <pre>{JSON.stringify(stats, null, 2)}</pre>;
}
```

### Test WebSocket Connection
```typescript
useEffect(() => {
  wsService.connect().then(() => {
    console.log('Connected:', wsService.isConnected());
  });
}, []);
```

### Test Analytics
```typescript
useEffect(() => {
  analyticsService
    .calculatePortfolioMetrics(user.qorId)
    .then(m => console.log('Sharpe:', m.sharpeRatio));
}, []);
```

---

## Performance Tips

### 1. Use Caching
- Blockchain queries: 30s cache (automatic)
- Analytics: 5m cache (automatic)
- Always check cache first before API call

### 2. Minimize WebSocket Subscriptions
```typescript
// Good: One subscription
const { data } = useWebSocketSubscription('balance', { qorId });

// Avoid: Multiple subscriptions to same channel
const b1 = useWebSocketSubscription('balance', { qorId });
const b2 = useWebSocketSubscription('balance', { qorId });
```

### 3. Cleanup Listeners
```typescript
useEffect(() => {
  const listenerId = wsService.subscribe('transactions', { qorId });
  
  return () => wsService.unsubscribe(listenerId); // Cleanup
}, []);
```

### 4. Lazy Load Analytics
```typescript
// Don't calculate on mount if not visible
const [metrics, setMetrics] = useState(null);

const loadMetrics = async () => {
  const m = await analyticsService.calculatePortfolioMetrics(qorId);
  setMetrics(m);
};

// Call only when needed
```

---

## Troubleshooting

### Q: WebSocket keeps reconnecting?
A: Check network. Auto-reconnect is normal. Max 5 attempts.

### Q: Getting stale data?
A: Caching is intentional. Use refresh button or set lower TTL.

### Q: Services slow?
A: Check RPC endpoint. Services fallback gracefully on timeout.

### Q: Memory issues?
A: Clear notifications (auto-expires after 24h). Close unused subscriptions.

---

## Next Steps

1. ✅ Services are ready to use
2. ⏳ Integrate into Phase 2 components
3. ⏳ Build Phase 3.2 features
4. ⏳ Add real data to all dashboards

---

**Status**: Phase 3.1 Services Ready for Integration  
**Docs**: Complete with examples  
**Support**: Available in PHASE_3_1_FOUNDATION_COMPLETE.md

