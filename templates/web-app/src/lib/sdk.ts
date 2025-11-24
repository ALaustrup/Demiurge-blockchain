/**
 * SDK initialization and configuration
 */

import { DemiurgeSDK } from "@demiurge/ts-sdk";

const RPC_URL = process.env.NEXT_PUBLIC_DEMIURGE_RPC_URL || "http://127.0.0.1:8545/rpc";

export const sdk = new DemiurgeSDK({
  rpcUrl: RPC_URL,
  retries: 3,
  retryDelay: 1000,
  timeout: 30000,
});

