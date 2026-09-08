// Demiurge Wallet Extension - Background Service Worker
// Handles all wallet operations and dApp communication

import { keyring } from './keyring';
import { rpcHandler } from './rpc-handler';
import type { 
  Message, 
  MessageResponse,
  WalletCreatePayload,
  WalletImportPayload,
  WalletUnlockPayload,
  SignMessagePayload,
  SendTransactionPayload,
  WalletStateResponse,
  SophiaQueryPayload,
  AuthLoginPayload,
  AuthKeypairLoginPayload,
  AuthSessionResponse,
  SaveNotePayload,
  SaveMediaPayload,
} from '../shared/messages';
import { createResponse } from '../shared/messages';
import type { Account, EncryptedKeystore, PendingRequest, SavedNote, SavedMedia, WalletState } from '../shared/types';
import { NETWORKS } from '../shared/types';

// Wallet state
let walletState: WalletState = {
  isLocked: true,
  isInitialized: false,
  accounts: [],
  activeAccount: null,
  network: 'mainnet',
  pendingRequests: [],
  auth: {
    isAuthenticated: false,
    token: null,
    user: null,
  },
};

// Storage keys
const STORAGE_KEYS = {
  KEYSTORES: 'demiurge_keystores',
  ACCOUNTS: 'demiurge_accounts',
  SETTINGS: 'demiurge_settings',
  CONNECTED_SITES: 'demiurge_connected_sites',
  AUTH_TOKEN: 'demiurge_auth_token',
  AUTH_USER: 'demiurge_auth_user',
  NOTES: 'demiurge_notes',
  MEDIA: 'demiurge_media',
  SOPHIA_CONVERSATIONS: 'demiurge_sophia_conversations',
};

// Hub URL resolver
function getHubUrl(): string {
  return walletState.network === 'mainnet'
    ? 'https://demiurge.cloud'
    : 'http://localhost:3000';
}

// Deterministic *display* address derived from a QOR ID (no key material is
// derived here; this address cannot sign anything).
// TODO(phase-3): remove this entirely and rely on the server-linked on_chain
// address + a proper address format (the hub no longer derives addresses).
function deriveAddressFromQorId(qorId: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(`DEMIURGE_QOR_ID:${qorId}`);

  let hash1 = 2166136261;
  let hash2 = 3671253287;

  for (let i = 0; i < data.length; i++) {
    hash1 ^= data[i];
    hash1 = Math.imul(hash1, 16777619);
    hash2 ^= data[data.length - 1 - i];
    hash2 = Math.imul(hash2, 16777619);
  }

  const hex1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = ((hash1 ^ hash2) >>> 0).toString(16).padStart(8, '0');
  const hex4 = ((hash1 + hash2) >>> 0).toString(16).padStart(8, '0');
  const hex5 = ((hash1 * hash2) >>> 0).toString(16).padStart(8, '0');
  const hex6 = (Math.abs(hash1 - hash2) >>> 0).toString(16).padStart(8, '0');

  return `5${hex1}${hex2}${hex3}${hex4}${hex5}${hex6}`.slice(0, 48);
}

// Transfer activity tracking
import { evaluateSendPolicy, getAccountLimits, type AccountActivity } from '../shared/transfer-policy';

const STORAGE_TRANSFER_LOG = 'demiurge_transfer_log';

interface TransferLogEntry {
  to: string;
  amount: string;
  timestamp: number;
}

async function getTransferActivity(address: string): Promise<AccountActivity> {
  const stored = await chrome.storage.local.get([STORAGE_TRANSFER_LOG, STORAGE_KEYS.ACCOUNTS]);
  const log: TransferLogEntry[] = stored[STORAGE_TRANSFER_LOG] || [];
  const accounts: Account[] = stored[STORAGE_KEYS.ACCOUNTS] || [];

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Find account creation date
  const account = accounts.find(a => a.address === address);
  const createdAt = account?.createdAt || now;

  const todayTransfers = log.filter(e => e.timestamp > oneDayAgo);
  const hourTransfers = log.filter(e => e.timestamp > oneHourAgo);
  const weekRecipients = log
    .filter(e => e.timestamp > sevenDaysAgo)
    .map(e => e.to.toLowerCase());

  return {
    createdAt,
    totalTransfersSent: log.length,
    totalTransfersReceived: 0,
    transfersToday: todayTransfers.length,
    transfersThisHour: hourTransfers.length,
    lastTransferAt: log.length > 0 ? log[log.length - 1].timestamp : 0,
    uniqueRecipients: [...new Set(weekRecipients)],
    flagged: false,
  };
}

async function recordTransfer(to: string, amount: string): Promise<void> {
  const stored = await chrome.storage.local.get(STORAGE_TRANSFER_LOG);
  const log: TransferLogEntry[] = stored[STORAGE_TRANSFER_LOG] || [];

  log.push({ to: to.toLowerCase(), amount, timestamp: Date.now() });

  // Keep only last 30 days of entries
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const trimmed = log.filter(e => e.timestamp > cutoff);

  await chrome.storage.local.set({ [STORAGE_TRANSFER_LOG]: trimmed });
}

// Initialize wallet state from storage
async function initializeState(): Promise<void> {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.KEYSTORES,
    STORAGE_KEYS.ACCOUNTS,
    STORAGE_KEYS.SETTINGS,
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.AUTH_USER,
  ]);

  const keystores = stored[STORAGE_KEYS.KEYSTORES] as EncryptedKeystore[] | undefined;
  const accounts = stored[STORAGE_KEYS.ACCOUNTS] as Account[] | undefined;
  const settings = stored[STORAGE_KEYS.SETTINGS] as { network?: string } | undefined;
  const authToken = stored[STORAGE_KEYS.AUTH_TOKEN] as string | undefined;
  const authUser = stored[STORAGE_KEYS.AUTH_USER] as { qorId: string; address?: string; displayName?: string; registeredAt?: number } | undefined;

  walletState.isInitialized = (keystores && keystores.length > 0) || false;
  walletState.accounts = accounts || [];
  walletState.network = settings?.network || 'mainnet';
  walletState.isLocked = true;

  // Restore auth session
  if (authToken && authUser) {
    // Ensure address is present (derive if missing)
    if (!authUser.address && authUser.qorId) {
      authUser.address = deriveAddressFromQorId(authUser.qorId);
    }

    walletState.auth = {
      isAuthenticated: true,
      token: authToken,
      user: authUser,
    };

    // Ensure account and activeAccount are set
    if (authUser.address) {
      const existingAcct = walletState.accounts.find(a => a.address === authUser.address);
      if (!existingAcct) {
        walletState.accounts.push({
          address: authUser.address!,
          publicKey: authUser.address!,
          name: authUser.displayName || 'QOR Account',
          createdAt: authUser.registeredAt || Date.now(),
        });
      } else if (authUser.registeredAt && existingAcct.createdAt > authUser.registeredAt) {
        // Correct createdAt if server registration is older
        existingAcct.createdAt = authUser.registeredAt;
      }
      walletState.activeAccount = authUser.address;
    }
  }

  if (settings?.network) {
    rpcHandler.setNetwork(settings.network);
  }
}

// Save accounts to storage
async function saveAccounts(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.ACCOUNTS]: walletState.accounts,
  });
}

// Save keystores to storage
async function saveKeystores(keystores: EncryptedKeystore[]): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.KEYSTORES]: keystores,
  });
}

// Save settings to storage
async function saveSettings(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: {
      network: walletState.network,
    },
  });
}

// Get stored keystores
async function getKeystores(): Promise<EncryptedKeystore[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.KEYSTORES);
  return stored[STORAGE_KEYS.KEYSTORES] || [];
}


// ============================================================================
// Signing payload encoding (domain-separated, length-prefixed)
// ============================================================================
//
//   tx : "demiurge-tx-v0"  || u32le chainId || u64le nonce
//        || u32le len(from) || from || u32le len(to) || to || u128le value
//   msg: "demiurge-msg-v0" || u32le chainId || u32le len(message) || message
//
// TODO(phase-1): the node must verify exactly this encoding for
// `balances_transfer` (and dApps for message signatures). Until then the node
// will reject signatures produced here.

const TX_SIGNING_TAG = 'demiurge-tx-v0';
const MSG_SIGNING_TAG = 'demiurge-msg-v0';

function u32le(n: number): Uint8Array {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) throw new Error('u32 out of range');
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, n, true);
  return out;
}

function u64le(n: bigint): Uint8Array {
  if (n < 0n || n > 0xffffffffffffffffn) throw new Error('u64 out of range');
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, n, true);
  return out;
}

function u128le(v: bigint): Uint8Array {
  if (v < 0n || v > (1n << 128n) - 1n) throw new Error('u128 out of range');
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    out[i] = Number((v >> BigInt(i * 8)) & 0xffn);
  }
  return out;
}

function lengthPrefixed(bytes: Uint8Array): Uint8Array {
  return concatBytes(u32le(bytes.length), bytes);
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function parseValue(value: string): bigint {
  if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) {
    throw new Error('Invalid transaction value: expected a base-unit integer string');
  }
  return BigInt(value);
}

function currentChainId(): number {
  const net = NETWORKS[walletState.network];
  if (!net) throw new Error(`Unknown network: ${walletState.network}`);
  return net.numericChainId;
}

export function encodeTxSigningPayload(params: {
  chainId: number;
  nonce: bigint;
  from: string;
  to: string;
  value: bigint;
}): Uint8Array {
  const enc = new TextEncoder();
  return concatBytes(
    enc.encode(TX_SIGNING_TAG),
    u32le(params.chainId),
    u64le(params.nonce),
    lengthPrefixed(enc.encode(params.from)),
    lengthPrefixed(enc.encode(params.to)),
    u128le(params.value),
  );
}

export function encodeMsgSigningPayload(params: { chainId: number; message: string }): Uint8Array {
  const enc = new TextEncoder();
  return concatBytes(
    enc.encode(MSG_SIGNING_TAG),
    u32le(params.chainId),
    lengthPrefixed(enc.encode(params.message)),
  );
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function resolveNonce(from: string, provided?: number): Promise<bigint> {
  if (provided !== undefined && provided !== null) {
    if (!Number.isInteger(provided) || provided < 0) throw new Error('Invalid nonce');
    return BigInt(provided);
  }
  const pending = await rpcHandler.getPendingNonce(from);
  return BigInt(Number.isInteger(pending) && pending >= 0 ? pending : 0);
}

// ============================================================================
// dApp approval flow
// ============================================================================
//
// Every dApp-originated connect / sign / send request is queued in
// walletState.pendingRequests, surfaced in the popup (ApproveScreen), and only
// executed once the user approves. Requests are rejected on deny or after
// APPROVAL_TIMEOUT_MS. Per-origin connection permissions are persisted in
// chrome.storage.local under STORAGE_KEYS.CONNECTED_SITES.

const APPROVAL_TIMEOUT_MS = 2 * 60 * 1000;
const USER_REJECTED = 'User rejected the request';

interface PendingResolver {
  resolve: (approved: boolean) => void;
  timer: ReturnType<typeof setTimeout>;
}
const pendingResolvers = new Map<string, PendingResolver>();

function extensionOrigin(): string {
  return chrome.runtime.getURL('').replace(/\/$/, '');
}

/** True when the message came from one of our own extension pages (popup/side panel). */
function isExtensionSender(sender: chrome.runtime.MessageSender): boolean {
  if (sender.id && sender.id !== chrome.runtime.id) return false;
  if (sender.tab) return false; // content scripts always carry a tab
  const ext = extensionOrigin();
  if (sender.origin && sender.origin === ext) return true;
  if (sender.url && sender.url.startsWith(ext + '/')) return true;
  return false;
}

async function getConnectedSites(): Promise<string[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.CONNECTED_SITES);
  const sites = stored[STORAGE_KEYS.CONNECTED_SITES];
  return Array.isArray(sites) ? sites.filter((s): s is string => typeof s === 'string') : [];
}

async function isOriginConnected(origin: string): Promise<boolean> {
  if (!origin) return false;
  return (await getConnectedSites()).includes(origin);
}

async function setOriginConnected(origin: string, connected: boolean): Promise<void> {
  const sites = await getConnectedSites();
  const next = connected
    ? (sites.includes(origin) ? sites : [...sites, origin])
    : sites.filter(s => s !== origin);
  await chrome.storage.local.set({ [STORAGE_KEYS.CONNECTED_SITES]: next });
}

async function updateBadge(): Promise<void> {
  const count = walletState.pendingRequests.length;
  try {
    await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
    if (count > 0) await chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
  } catch {
    // badge API unavailable (e.g. no action) - ignore
  }
}

async function surfaceApprovalUI(request: PendingRequest): Promise<void> {
  // Try to open the popup directly; this only works in some contexts, so fall
  // back to a notification that tells the user to open the wallet.
  try {
    await chrome.action.openPopup();
    return;
  } catch {
    // not allowed here - fall through
  }
  try {
    chrome.notifications?.create(`demiurge-req-${request.id}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Demiurge Wallet: approval required',
      message: `${request.origin} is requesting: ${request.type.replace('_', ' ')}. Open the wallet to review.`,
    });
  } catch {
    // notifications unavailable - badge is still set
  }
}

function requestApproval(type: PendingRequest['type'], origin: string, data: unknown): Promise<boolean> {
  const request: PendingRequest = {
    id: crypto.randomUUID(),
    type,
    origin,
    data,
    createdAt: Date.now(),
  };
  walletState.pendingRequests.push(request);
  void updateBadge();
  void surfaceApprovalUI(request);

  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => finalizeRequest(request.id, false), APPROVAL_TIMEOUT_MS);
    pendingResolvers.set(request.id, { resolve, timer });
  });
}

/** Remove a pending request and settle its promise. Returns false if unknown. */
function finalizeRequest(id: string, approved: boolean): boolean {
  const index = walletState.pendingRequests.findIndex(r => r.id === id);
  if (index !== -1) walletState.pendingRequests.splice(index, 1);
  const resolver = pendingResolvers.get(id);
  if (resolver) {
    clearTimeout(resolver.timer);
    pendingResolvers.delete(id);
    resolver.resolve(approved);
  }
  void updateBadge();
  return index !== -1 || !!resolver;
}

/**
 * Gate a dApp-originated action: the origin must be connected and the user
 * must approve this specific request. Returns an error string, or null if OK.
 */
async function gateDAppAction(
  isDApp: boolean,
  origin: string,
  type: PendingRequest['type'],
  data: unknown,
): Promise<string | null> {
  if (!isDApp) return null; // popup / side panel actions are user-initiated
  if (!origin) return 'No origin specified';
  if (!(await isOriginConnected(origin))) {
    return 'Origin not connected: call demiurge_requestAccounts first';
  }
  const approved = await requestApproval(type, origin, data);
  return approved ? null : USER_REJECTED;
}

// Message handler
async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  const { type, payload } = message;
  // Requests from our own popup/side panel are user-initiated; anything else
  // (content script on behalf of a web page, external sender) is a dApp.
  const isDApp = !isExtensionSender(sender);
  const origin = isDApp ? (message.origin || sender.origin || '') : '';

  try {
    switch (type) {
      // Wallet lifecycle
      case 'WALLET_GET_STATE':
        return createResponse(true, getWalletState());

      case 'WALLET_CREATE':
        return await handleWalletCreate(payload as WalletCreatePayload);

      case 'WALLET_IMPORT':
        return await handleWalletImport(payload as WalletImportPayload);

      case 'WALLET_UNLOCK':
        return await handleWalletUnlock(payload as WalletUnlockPayload);

      case 'WALLET_LOCK':
        return handleWalletLock();

      // Account management
      case 'ACCOUNT_CREATE':
        return await handleAccountCreate(payload as { name: string });

      case 'ACCOUNT_SELECT':
        return handleAccountSelect(payload as { address: string });

      case 'ACCOUNT_GET_ALL':
        return createResponse(true, walletState.accounts);

      // Network
      case 'NETWORK_SWITCH':
        return handleNetworkSwitch(payload as { network: string });

      case 'NETWORK_GET_CURRENT':
        return createResponse(true, { network: walletState.network });

      // Transactions & signing
      case 'GET_BALANCE':
        return await handleGetBalance(payload as { address?: string });

      case 'SIGN_MESSAGE':
        return await handleSignMessage(payload as SignMessagePayload, origin, isDApp);

      case 'SIGN_TRANSACTION':
        return await handleSignTransaction(payload as SendTransactionPayload, origin, isDApp);

      case 'SEND_TRANSACTION':
        return await handleSendTransaction(payload as SendTransactionPayload, origin, isDApp);

      // dApp connection
      case 'DAPP_CONNECT':
        return await handleDAppConnect(origin, isDApp);

      case 'DAPP_DISCONNECT':
        return await handleDAppDisconnect(origin);

      case 'DAPP_GET_ACCOUNTS':
        return await handleDAppGetAccounts(origin, isDApp);

      // Request handling (extension UI only; a dApp must never settle its own request)
      case 'REQUEST_GET_PENDING':
      case 'GET_PENDING_REQUESTS':
        if (isDApp) return createResponse(false, undefined, 'Not allowed');
        return createResponse(true, walletState.pendingRequests);

      case 'REQUEST_APPROVE':
      case 'APPROVE_REQUEST':
        if (isDApp) return createResponse(false, undefined, 'Not allowed');
        return await handleRequestApprove(payload as { requestId: string });

      case 'REQUEST_REJECT':
      case 'REJECT_REQUEST':
        if (isDApp) return createResponse(false, undefined, 'Not allowed');
        return handleRequestReject(payload as { requestId: string; reason?: string });

      // QOR ID Auth
      case 'AUTH_LOGIN':
        return await handleAuthLogin(payload as AuthLoginPayload);

      case 'AUTH_KEYPAIR_LOGIN':
        return await handleAuthKeypairLogin(payload as AuthKeypairLoginPayload);

      case 'AUTH_LOGOUT':
        return await handleAuthLogout();

      case 'DETACH_WALLET':
        return await handleDetachWallet();

      case 'AUTH_GET_SESSION':
        return createResponse(true, getAuthSession());

      // Transfer policy
      case 'CHECK_TRANSFER_POLICY':
        return await handleCheckTransferPolicy(payload as { to: string; amount: string });

      case 'GET_ACCOUNT_LIMITS':
        return await handleGetAccountLimits();

      // Missing handlers
      case 'CLAIM_STARTER_TOKENS':
        return await handleClaimStarterTokens(payload as { address: string });

      case 'EXPORT_PRIVATE_KEY':
        return await handleExportPrivateKey(payload as { password: string });

      // Sophia AI
      case 'SOPHIA_QUERY':
        return await handleSophiaQuery(payload as SophiaQueryPayload);

      // Content capture
      case 'SAVE_NOTE':
        return await handleSaveNote(payload as SaveNotePayload);

      case 'GET_NOTES':
        return await handleGetNotes();

      case 'DELETE_NOTE':
        return await handleDeleteNote(payload as { id: string });

      case 'SAVE_MEDIA':
        return await handleSaveMedia(payload as SaveMediaPayload);

      case 'GET_MEDIA':
        return await handleGetMedia();

      // Phase 4 (Page Analysis) removed - replaced by VYB Chat integration

      // Page context (from content script)
      case 'GET_PAGE_CONTEXT':
        return createResponse(true, { supported: true });

      default:
        return createResponse(false, undefined, `Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error('Message handler error:', error);
    return createResponse(false, undefined, (error as Error).message);
  }
}

// Get wallet state for UI
function getWalletState(): WalletStateResponse {
  return {
    isLocked: walletState.isLocked,
    isInitialized: walletState.isInitialized,
    accounts: walletState.accounts,
    activeAccount: walletState.activeAccount,
    network: walletState.network,
    pendingRequestCount: walletState.pendingRequests.length,
    auth: walletState.auth,
  };
}

// Get auth session
function getAuthSession(): AuthSessionResponse {
  return {
    isAuthenticated: walletState.auth.isAuthenticated,
    token: walletState.auth.token || undefined,
    user: walletState.auth.user || undefined,
  };
}

// Create new wallet
async function handleWalletCreate(payload: WalletCreatePayload): Promise<MessageResponse> {
  const { password, mnemonic: providedMnemonic } = payload;

  const mnemonic = providedMnemonic || keyring.generateMnemonic();
  
  if (!keyring.validateMnemonic(mnemonic)) {
    return createResponse(false, undefined, 'Invalid mnemonic phrase');
  }

  // Derive first keypair
  const keyPair = keyring.deriveKeyPair(mnemonic, 0);
  
  // Encrypt private key
  const keystore = await keyring.encryptPrivateKey(keyPair.privateKey, password);
  
  // Create account
  const account: Account = {
    address: keyPair.address,
    publicKey: keyPair.address,
    name: 'Account 1',
    createdAt: Date.now(),
  };

  // Save to storage
  await saveKeystores([keystore]);
  walletState.accounts = [account];
  walletState.activeAccount = account.address;
  walletState.isInitialized = true;
  await saveAccounts();

  // Unlock immediately
  await keyring.unlock([keystore], password);
  walletState.isLocked = false;

  return createResponse(true, { mnemonic, address: account.address });
}

// Import wallet from mnemonic
async function handleWalletImport(payload: WalletImportPayload): Promise<MessageResponse> {
  const { password, mnemonic } = payload;

  if (!keyring.validateMnemonic(mnemonic)) {
    return createResponse(false, undefined, 'Invalid mnemonic phrase');
  }

  // Derive keypair
  const keyPair = keyring.deriveKeyPair(mnemonic, 0);
  
  // Encrypt private key
  const keystore = await keyring.encryptPrivateKey(keyPair.privateKey, password);
  
  // Create account
  const account: Account = {
    address: keyPair.address,
    publicKey: keyPair.address,
    name: 'Imported Account',
    createdAt: Date.now(),
  };

  // Save to storage
  await saveKeystores([keystore]);
  walletState.accounts = [account];
  walletState.activeAccount = account.address;
  walletState.isInitialized = true;
  await saveAccounts();

  // Unlock immediately
  await keyring.unlock([keystore], password);
  walletState.isLocked = false;

  return createResponse(true, { address: account.address });
}

// Unlock wallet
async function handleWalletUnlock(payload: WalletUnlockPayload): Promise<MessageResponse> {
  const { password } = payload;
  
  const keystores = await getKeystores();
  if (keystores.length === 0) {
    return createResponse(false, undefined, 'Wallet not initialized');
  }

  try {
    await keyring.unlock(keystores, password);
    walletState.isLocked = false;
    
    if (walletState.accounts.length > 0 && !walletState.activeAccount) {
      walletState.activeAccount = walletState.accounts[0].address;
    }

    return createResponse(true, getWalletState());
  } catch (error) {
    return createResponse(false, undefined, 'Invalid password');
  }
}

// Lock wallet
function handleWalletLock(): MessageResponse {
  keyring.lock();
  walletState.isLocked = true;
  // Reject anything still waiting for approval
  for (const r of [...walletState.pendingRequests]) finalizeRequest(r.id, false);
  return createResponse(true);
}

// Create new account
async function handleAccountCreate(_payload: { name: string }): Promise<MessageResponse> {
  if (walletState.isLocked) {
    return createResponse(false, undefined, 'Wallet is locked');
  }

  // For now, we don't support multiple accounts from the same mnemonic in this version
  // This would require storing the mnemonic (encrypted) or deriving from master key
  return createResponse(false, undefined, 'Multi-account not yet supported');
}

// Select active account
function handleAccountSelect(payload: { address: string }): MessageResponse {
  const account = walletState.accounts.find(a => a.address === payload.address);
  if (!account) {
    return createResponse(false, undefined, 'Account not found');
  }

  walletState.activeAccount = account.address;
  return createResponse(true, { address: account.address });
}

// Switch network
function handleNetworkSwitch(payload: { network: string }): MessageResponse {
  try {
    rpcHandler.setNetwork(payload.network);
    walletState.network = payload.network;
    saveSettings();
    return createResponse(true, { network: payload.network });
  } catch (error) {
    return createResponse(false, undefined, (error as Error).message);
  }
}

// Get balance
async function handleGetBalance(payload: { address?: string }): Promise<MessageResponse> {
  const address = payload.address || walletState.activeAccount;
  if (!address) {
    return createResponse(false, undefined, 'No account selected');
  }

  try {
    const balance = await rpcHandler.getBalance(address);
    return createResponse(true, balance);
  } catch (error) {
    return createResponse(false, undefined, (error as Error).message);
  }
}

// Sign message
async function handleSignMessage(payload: SignMessagePayload, origin: string, isDApp: boolean): Promise<MessageResponse> {
  if (walletState.isLocked) {
    return createResponse(false, undefined, 'Wallet is locked');
  }

  const address = payload.account || walletState.activeAccount;
  if (!address) {
    return createResponse(false, undefined, 'No account selected');
  }
  if (typeof payload.message !== 'string') {
    return createResponse(false, undefined, 'Invalid message');
  }

  const gateError = await gateDAppAction(isDApp, origin, 'sign_message', { message: payload.message, account: address });
  if (gateError) return createResponse(false, undefined, gateError);

  const chainId = currentChainId();
  const signingPayload = encodeMsgSigningPayload({ chainId, message: payload.message });
  const signature = await keyring.signMessage(address, signingPayload);

  return createResponse(true, {
    signature: toHex(signature),
    encoding: MSG_SIGNING_TAG,
    chainId,
  });
}

// Sign transaction (without sending)
async function handleSignTransaction(payload: SendTransactionPayload, origin: string, isDApp: boolean): Promise<MessageResponse> {
  if (walletState.isLocked) {
    return createResponse(false, undefined, 'Wallet is locked');
  }

  const { transaction } = payload;
  const from = payload.account || walletState.activeAccount;

  if (!from) {
    return createResponse(false, undefined, 'No account selected');
  }
  if (!transaction || typeof transaction.to !== 'string' || !transaction.to) {
    return createResponse(false, undefined, 'Invalid transaction: missing recipient');
  }

  let value: bigint;
  try {
    value = parseValue(transaction.value);
  } catch (e) {
    return createResponse(false, undefined, (e as Error).message);
  }

  const gateError = await gateDAppAction(isDApp, origin, 'sign_transaction', {
    from, to: transaction.to, value: transaction.value, data: transaction.data,
  });
  if (gateError) return createResponse(false, undefined, gateError);

  const chainId = currentChainId();
  const nonce = await resolveNonce(from, transaction.nonce);
  const signingPayload = encodeTxSigningPayload({ chainId, nonce, from, to: transaction.to, value });
  const signature = await keyring.signMessage(from, signingPayload);

  const txData = JSON.stringify({
    chainId,
    nonce: nonce.toString(),
    from,
    to: transaction.to,
    value: transaction.value,
    data: transaction.data,
  });
  return createResponse(true, {
    tx: toHex(new TextEncoder().encode(txData)),
    signature: toHex(signature),
    signingPayload: toHex(signingPayload),
    encoding: TX_SIGNING_TAG,
    chainId,
    nonce: nonce.toString(),
  });
}

// Send transaction
async function handleSendTransaction(payload: SendTransactionPayload, origin: string, isDApp: boolean): Promise<MessageResponse> {
  // Locked means locked: there is no QOR-auth bypass for signing.
  if (walletState.isLocked) {
    return createResponse(false, undefined, 'Wallet is locked');
  }

  const { transaction } = payload;
  const from = payload.account || walletState.activeAccount;

  if (!from) {
    return createResponse(false, undefined, 'No account selected');
  }
  if (!transaction || typeof transaction.to !== 'string' || !transaction.to) {
    return createResponse(false, undefined, 'Invalid transaction: missing recipient');
  }

  let value: bigint;
  try {
    value = parseValue(transaction.value);
  } catch (e) {
    return createResponse(false, undefined, (e as Error).message);
  }

  // --- Enforce transfer policy (deny if it cannot be evaluated) ---
  try {
    const balanceResult = await rpcHandler.getBalance(from);
    const activity = await getTransferActivity(from);
    const policyResult = evaluateSendPolicy(
      from,
      transaction.to,
      transaction.value,
      balanceResult.balance,
      activity,
    );

    if (!policyResult.allowed) {
      return createResponse(false, undefined, policyResult.reason || 'Transfer blocked by policy.');
    }
  } catch (policyError) {
    console.warn('Transfer policy check failed, denying:', policyError);
    return createResponse(
      false,
      undefined,
      'Transfer policy could not be verified (network unavailable). Please try again later.'
    );
  }

  const gateError = await gateDAppAction(isDApp, origin, 'send_transaction', {
    from, to: transaction.to, value: transaction.value, data: transaction.data,
  });
  if (gateError) return createResponse(false, undefined, gateError);

  // Build domain-separated message for signing
  const chainId = currentChainId();
  const nonce = await resolveNonce(from, transaction.nonce);
  const signingPayload = encodeTxSigningPayload({ chainId, nonce, from, to: transaction.to, value });

  // Sign the transaction
  const signature = await keyring.signMessage(from, signingPayload);
  const signatureHex = toHex(signature);

  // Submit to network
  // TODO(phase-1): submit nonce/chainId alongside so the node can verify the
  // `demiurge-tx-v0` payload; the current `balances_transfer` RPC only carries
  // (from, to, value, signature).
  try {
    const result = await rpcHandler.submitTransaction(
      from,
      transaction.to,
      transaction.value,
      signatureHex
    );

    // Record successful transfer for rate limiting
    await recordTransfer(transaction.to, transaction.value);

    return createResponse(true, result);
  } catch (error) {
    return createResponse(false, undefined, (error as Error).message);
  }
}

// Check transfer policy without sending
async function handleCheckTransferPolicy(payload: { to: string; amount: string }): Promise<MessageResponse> {
  const from = walletState.activeAccount;
  if (!from) {
    return createResponse(false, undefined, 'No account selected');
  }

  try {
    const balanceResult = await rpcHandler.getBalance(from);
    const activity = await getTransferActivity(from);
    const result = evaluateSendPolicy(from, payload.to, payload.amount, balanceResult.balance, activity);
    return createResponse(true, result);
  } catch (error) {
    return createResponse(false, undefined, (error as Error).message);
  }
}

// Get current account limits
async function handleGetAccountLimits(): Promise<MessageResponse> {
  const from = walletState.activeAccount;
  if (!from) {
    return createResponse(true, {
      tier: 'new',
      dailyLimit: 3,
      dailyUsed: 0,
      hourlyLimit: 5,
      hourlyUsed: 0,
      maxSingleCGT: '100',
      canSend: false,
      accountAgeHours: 0,
    });
  }

  try {
    const activity = await getTransferActivity(from);
    const limits = getAccountLimits(activity);
    return createResponse(true, limits);
  } catch (error) {
    return createResponse(false, undefined, (error as Error).message);
  }
}

// dApp connect (demiurge_requestAccounts)
async function handleDAppConnect(origin: string, isDApp: boolean): Promise<MessageResponse> {
  if (!isDApp) {
    // Popup/side panel do not "connect"; they already own the wallet.
    return createResponse(true, { accounts: walletState.isLocked ? [] : walletState.accounts.map(a => a.address) });
  }
  if (!origin) {
    return createResponse(false, undefined, 'No origin specified');
  }
  if (walletState.isLocked) {
    // Ask the user to unlock; nothing is exposed while locked.
    void surfaceApprovalUI({ id: 'unlock', type: 'connect', origin, data: null, createdAt: Date.now() });
    return createResponse(false, undefined, 'Wallet is locked. Unlock the Demiurge Wallet and retry.');
  }

  if (!(await isOriginConnected(origin))) {
    const approved = await requestApproval('connect', origin, null);
    if (!approved) {
      return createResponse(false, undefined, USER_REJECTED);
    }
    await setOriginConnected(origin, true);
  }

  return createResponse(true, {
    accounts: walletState.accounts.map(a => a.address),
  });
}

// dApp disconnect (demiurge_disconnect): revoke the per-origin permission
async function handleDAppDisconnect(origin: string): Promise<MessageResponse> {
  if (origin) {
    await setOriginConnected(origin, false);
  }
  return createResponse(true, { disconnected: true });
}

// Get accounts for dApp (demiurge_accounts): only for connected origins
async function handleDAppGetAccounts(origin: string, isDApp: boolean): Promise<MessageResponse> {
  if (walletState.isLocked) {
    return createResponse(true, { accounts: [] });
  }
  if (isDApp && !(await isOriginConnected(origin))) {
    return createResponse(true, { accounts: [] });
  }

  // Return only public information
  return createResponse(true, {
    accounts: walletState.accounts.map(a => a.address),
  });
}

// Approve pending request (from the popup's ApproveScreen)
async function handleRequestApprove(payload: { requestId: string }): Promise<MessageResponse> {
  if (!finalizeRequest(payload.requestId, true)) {
    return createResponse(false, undefined, 'Request not found');
  }
  return createResponse(true, { approved: true });
}

// Reject pending request
function handleRequestReject(payload: { requestId: string; reason?: string }): MessageResponse {
  if (!finalizeRequest(payload.requestId, false)) {
    return createResponse(false, undefined, 'Request not found');
  }
  return createResponse(true, { rejected: true, reason: payload.reason });
}

// --- QOR ID Auth Handlers ---

async function handleAuthLogin(payload: AuthLoginPayload): Promise<MessageResponse> {
  try {
    const hubUrl = getHubUrl();
    const response = await fetch(`${hubUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: payload.identifier,
        password: payload.password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return createResponse(false, undefined, errorData.message || `Login failed (${response.status})`);
    }

    const data = await response.json();
    const token = data.token || data.access_token;
    const qorId = data.user?.qor_id || data.user?.qorId || payload.identifier;

    // Resolve on-chain address: use API response first, otherwise derive from QOR ID
    const apiAddress = data.user?.address || data.user?.on_chain_address || data.user?.on_chain?.address;
    const derivedAddress = deriveAddressFromQorId(qorId);
    const resolvedAddress = apiAddress || derivedAddress;

    // Fetch full profile from server to get accurate registration timestamp
    let registrationTime: number | null = null;
    let serverDisplayName: string | undefined;
    try {
      const profileResponse = await fetch(`${hubUrl}/api/v1/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        const serverCreatedAt = profile.created_at || profile.createdAt;
        if (serverCreatedAt) {
          registrationTime = new Date(serverCreatedAt).getTime();
        }
        // Also pick up server-side address and display name if available
        if (!apiAddress && profile.on_chain?.address) {
          // Use profile's on-chain address if login didn't provide one
        }
        serverDisplayName = profile.display_name || profile.displayName;
      }
    } catch {
      // Profile fetch failed - not critical, fall back to login response data
    }

    // Fall back to login response if profile fetch didn't yield a timestamp
    if (!registrationTime) {
      const loginCreatedAt = data.user?.created_at || data.user?.createdAt;
      registrationTime = loginCreatedAt ? new Date(loginCreatedAt).getTime() : null;
    }

    const user = {
      qorId,
      address: resolvedAddress,
      displayName: serverDisplayName || data.user?.display_name || data.user?.displayName || payload.identifier.split('#')[0],
      registeredAt: registrationTime || undefined,
    };

    // Persist auth
    walletState.auth = { isAuthenticated: true, token, user };
    await chrome.storage.local.set({
      [STORAGE_KEYS.AUTH_TOKEN]: token,
      [STORAGE_KEYS.AUTH_USER]: user,
    });

    // Ensure account exists for this address
    const existingAccount = walletState.accounts.find(a => a.address === resolvedAddress);
    if (!existingAccount) {
      const account: Account = {
        address: resolvedAddress,
        publicKey: resolvedAddress,
        name: user.displayName || 'QOR Account',
        createdAt: registrationTime || Date.now(),
      };
      walletState.accounts.push(account);
      await saveAccounts();
    } else if (registrationTime && existingAccount.createdAt > registrationTime) {
      // Server says account is older than local record - fix it
      existingAccount.createdAt = registrationTime;
      await saveAccounts();
    }

    // Always set active account to the resolved address
    walletState.activeAccount = resolvedAddress;

    return createResponse(true, { token, user });
  } catch (error) {
    return createResponse(false, undefined, `Login failed: ${(error as Error).message}`);
  }
}

async function handleAuthKeypairLogin(payload: AuthKeypairLoginPayload): Promise<MessageResponse> {
  try {
    const hubUrl = getHubUrl();
    const response = await fetch(`${hubUrl}/api/v1/auth/keypair-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: payload.address,
        signature: payload.signature,
        challenge: payload.challenge,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return createResponse(false, undefined, errorData.message || `Keypair login failed (${response.status})`);
    }

    const data = await response.json();
    const token = data.token || data.access_token;
    const user = {
      qorId: data.user?.qor_id || data.user?.qorId || payload.address,
      address: payload.address,
      displayName: data.user?.display_name || data.user?.displayName,
    };

    walletState.auth = { isAuthenticated: true, token, user };
    await chrome.storage.local.set({
      [STORAGE_KEYS.AUTH_TOKEN]: token,
      [STORAGE_KEYS.AUTH_USER]: user,
    });

    return createResponse(true, { token, user });
  } catch (error) {
    return createResponse(false, undefined, `Keypair login failed: ${(error as Error).message}`);
  }
}

async function handleAuthLogout(): Promise<MessageResponse> {
  // Clear auth state
  walletState.auth = { isAuthenticated: false, token: null, user: null };
  walletState.activeAccount = null;
  walletState.accounts = [];
  walletState.isInitialized = false;
  walletState.isLocked = true;
  walletState.pendingRequests = [];

  await chrome.storage.local.remove([
    STORAGE_KEYS.AUTH_TOKEN,
    STORAGE_KEYS.AUTH_USER,
    STORAGE_KEYS.ACCOUNTS,
    STORAGE_KEYS.KEYSTORES,
  ]);

  return createResponse(true);
}

async function handleDetachWallet(): Promise<MessageResponse> {
  // Full reset: clear ALL local data and wallet state
  walletState = {
    isLocked: true,
    isInitialized: false,
    accounts: [],
    activeAccount: null,
    network: walletState.network, // Preserve network preference
    pendingRequests: [],
    auth: { isAuthenticated: false, token: null, user: null },
  };

  // Clear all extension storage
  await chrome.storage.local.clear();

  return createResponse(true);
}

// --- Missing Handlers ---

async function handleClaimStarterTokens(payload: { address: string }): Promise<MessageResponse> {
  try {
    const result = await rpcHandler.claimStarter(payload.address);
    return createResponse(true, result);
  } catch (error) {
    return createResponse(false, undefined, `Failed to claim: ${(error as Error).message}`);
  }
}

async function handleExportPrivateKey(payload: { password: string }): Promise<MessageResponse> {
  try {
    const keystores = await getKeystores();
    if (keystores.length === 0) {
      return createResponse(false, undefined, 'No keystores found');
    }

    // Decrypt the active account's keystore
    const activeAddress = walletState.activeAccount;
    const targetKeystore = activeAddress
      ? keystores.find(k => k.address === activeAddress) || keystores[0]
      : keystores[0];

    const privateKey = await keyring.decryptPrivateKey(targetKeystore, payload.password);
    const privateKeyHex = Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join('');

    // Wipe after returning
    setTimeout(() => privateKey.fill(0), 0);

    return createResponse(true, { privateKey: privateKeyHex });
  } catch (error) {
    return createResponse(false, undefined, 'Invalid password');
  }
}

// --- Content Capture Handlers ---

async function handleSaveNote(payload: SaveNotePayload): Promise<MessageResponse> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.NOTES);
  const notes: SavedNote[] = stored[STORAGE_KEYS.NOTES] || [];

  const note: SavedNote = {
    id: crypto.randomUUID(),
    title: payload.title,
    content: payload.content,
    url: payload.url,
    tags: payload.tags || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  notes.unshift(note);
  await chrome.storage.local.set({ [STORAGE_KEYS.NOTES]: notes });
  return createResponse(true, note);
}

async function handleGetNotes(): Promise<MessageResponse> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.NOTES);
  return createResponse(true, stored[STORAGE_KEYS.NOTES] || []);
}

async function handleDeleteNote(payload: { id: string }): Promise<MessageResponse> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.NOTES);
  const notes: SavedNote[] = stored[STORAGE_KEYS.NOTES] || [];
  const filtered = notes.filter(n => n.id !== payload.id);
  await chrome.storage.local.set({ [STORAGE_KEYS.NOTES]: filtered });
  return createResponse(true);
}

async function handleSaveMedia(payload: SaveMediaPayload): Promise<MessageResponse> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.MEDIA);
  const media: SavedMedia[] = stored[STORAGE_KEYS.MEDIA] || [];

  const item: SavedMedia = {
    id: crypto.randomUUID(),
    url: payload.url,
    title: payload.title,
    sourceUrl: payload.sourceUrl,
    type: payload.type,
    createdAt: Date.now(),
  };

  media.unshift(item);
  await chrome.storage.local.set({ [STORAGE_KEYS.MEDIA]: media });
  return createResponse(true, item);
}

async function handleGetMedia(): Promise<MessageResponse> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.MEDIA);
  return createResponse(true, stored[STORAGE_KEYS.MEDIA] || []);
}

// --- Page Analysis ---

// Phase 4 handlers (handleAnalyzePage, handleMintSummaryNFT) removed.
// VYB Chat is now handled directly via the side panel UI calling the hub API.

// --- Sophia AI query handler ---
async function handleSophiaQuery(payload: SophiaQueryPayload): Promise<MessageResponse> {
  try {
    const hubUrl = getHubUrl();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (walletState.auth.token) {
      headers['Authorization'] = `Bearer ${walletState.auth.token}`;
    }

    // Build messages array with conversation history
    const messages = payload.conversationHistory
      ? [...payload.conversationHistory, { role: 'user', content: payload.message }]
      : [{ role: 'user', content: payload.message }];

    const response = await fetch(`${hubUrl}/api/sophia/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        enableTools: true,
        walletContext: {
          activeAccount: walletState.activeAccount,
          network: walletState.network,
          isLocked: walletState.isLocked,
          ...(payload.context || {}),
        },
      }),
    });

    if (!response.ok) {
      return createResponse(false, undefined, `Sophia API returned ${response.status}`);
    }

    const data = await response.json();

    return createResponse(true, {
      text: data.text || 'Sophia did not return a response.',
      toolsUsed: data.toolsUsed || 0,
    });
  } catch (error) {
    return createResponse(false, undefined, `Failed to reach Sophia: ${(error as Error).message}`);
  }
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

// Listen for external messages (from content scripts)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  handleMessage({ ...message, origin: sender.origin }, sender).then(sendResponse);
  return true;
});

// Initialize on load
initializeState().then(() => {
  console.log('Demiurge Wallet: Background service worker initialized');
});

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Demiurge Wallet: Extension installed');
  } else if (details.reason === 'update') {
    console.log('Demiurge Wallet: Extension updated');
  }

  // Register context menus for content capture
  chrome.contextMenus?.create({
    id: 'demiurge-save-text',
    title: 'Save to Demiurge',
    contexts: ['selection'],
  });

  chrome.contextMenus?.create({
    id: 'demiurge-save-link',
    title: 'Save Link to Demiurge',
    contexts: ['link'],
  });

  chrome.contextMenus?.create({
    id: 'demiurge-save-image',
    title: 'Save Image to Demiurge',
    contexts: ['image'],
  });
});

// Handle context menu clicks
chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  const sourceUrl = tab?.url || info.pageUrl || '';
  const pageTitle = tab?.title || '';

  if (info.menuItemId === 'demiurge-save-text' && info.selectionText) {
    await handleSaveNote({
      title: `Note from ${pageTitle}`.slice(0, 100),
      content: info.selectionText,
      url: sourceUrl,
      tags: [],
    });
    console.log('Demiurge: Text saved');
  } else if (info.menuItemId === 'demiurge-save-link' && info.linkUrl) {
    await handleSaveMedia({
      url: info.linkUrl,
      title: info.linkUrl,
      sourceUrl,
      type: 'link',
    });
    console.log('Demiurge: Link saved');
  } else if (info.menuItemId === 'demiurge-save-image' && info.srcUrl) {
    await handleSaveMedia({
      url: info.srcUrl,
      title: pageTitle,
      sourceUrl,
      type: 'image',
    });
    console.log('Demiurge: Image saved');
  }
});
