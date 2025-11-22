/**
 * Transaction history and tracking utilities.
 */

export type TransactionRecord = {
  id: string; // unique ID (hash or timestamp-based)
  from: string;
  to: string;
  amount: string; // in smallest units
  amountCgt: number; // human-readable
  fee: number;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  txHash?: string;
  error?: string;
};

const TX_HISTORY_KEY = "demiurge_tx_history";

/**
 * Save a transaction to local history.
 */
export function saveTransaction(tx: TransactionRecord): void {
  const history = getTransactionHistory();
  history.unshift(tx); // Add to beginning
  // Keep only last 100 transactions
  const limited = history.slice(0, 100);
  localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(limited));
}

/**
 * Get transaction history from local storage.
 */
export function getTransactionHistory(): TransactionRecord[] {
  try {
    const stored = localStorage.getItem(TX_HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as TransactionRecord[];
  } catch {
    return [];
  }
}

/**
 * Get transactions for a specific address (sent or received).
 */
export function getTransactionsForAddress(
  address: string
): TransactionRecord[] {
  const history = getTransactionHistory();
  return history.filter(
    (tx) => tx.from.toLowerCase() === address.toLowerCase() || tx.to.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Update transaction status.
 */
export function updateTransactionStatus(
  id: string,
  status: TransactionRecord["status"],
  txHash?: string,
  error?: string
): void {
  const history = getTransactionHistory();
  const index = history.findIndex((tx) => tx.id === id);
  if (index >= 0) {
    history[index].status = status;
    if (txHash) history[index].txHash = txHash;
    if (error) history[index].error = error;
    localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(history));
  }
}

/**
 * Generate a unique transaction ID.
 */
export function generateTxId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

