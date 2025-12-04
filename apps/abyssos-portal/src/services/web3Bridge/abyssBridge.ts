/**
 * AbyssOS Web3 Bridge
 * 
 * Provides postMessage-based communication between AbyssBrowser
 * and embedded Web3-aware dApps.
 */

export interface AbyssRequest {
  type: 'ABYSS_REQUEST';
  action: 'IDENTITY' | 'SIGN_MESSAGE' | 'CHAIN_STATUS';
  payload?: any;
}

export interface AbyssResponse {
  type: 'ABYSS_RESPONSE';
  action: string;
  payload?: any;
  error?: string;
  devMode?: boolean;
}

export interface AbyssIdentity {
  username: string;
  abyssId: string;
  sessionPublicKey: string;
}

export interface AbyssChainStatus {
  connected: boolean;
  chainId?: string;
  height?: number;
}

/**
 * Listens for ABYSS_REQUEST messages from iframe content
 * and responds with appropriate AbyssOS context.
 */
export class AbyssBridge {
  private session: { username: string; publicKey: string } | null = null;
  private chainStatus: { status: string; info: any } | null = null;
  private signMessageFn: ((message: string) => Promise<string>) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleMessage.bind(this));
    }
  }

  setSession(session: { username: string; publicKey: string } | null) {
    this.session = session;
  }

  setChainStatus(status: { status: string; info: any } | null) {
    this.chainStatus = status;
  }

  setSignMessageFn(fn: (message: string) => Promise<string>) {
    this.signMessageFn = fn;
  }

  private async handleMessage(event: MessageEvent) {
    // Security: Only accept messages from same origin or trusted sources
    // In production, you might want to validate event.origin
    if (event.data?.type !== 'ABYSS_REQUEST') {
      return;
    }

    const request = event.data as AbyssRequest;
    let response: AbyssResponse;

    try {
      switch (request.action) {
        case 'IDENTITY':
          response = await this.handleIdentityRequest();
          break;
        case 'SIGN_MESSAGE':
          response = await this.handleSignMessageRequest(request.payload);
          break;
        case 'CHAIN_STATUS':
          response = await this.handleChainStatusRequest();
          break;
        default:
          response = {
            type: 'ABYSS_RESPONSE',
            action: request.action,
            error: `Unknown action: ${request.action}`,
          };
      }
    } catch (error) {
      response = {
        type: 'ABYSS_RESPONSE',
        action: request.action,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Send response back to iframe
    if (event.source && 'postMessage' in event.source) {
      (event.source as Window).postMessage(response, event.origin);
    }
  }

  private async handleIdentityRequest(): Promise<AbyssResponse> {
    if (!this.session) {
      return {
        type: 'ABYSS_RESPONSE',
        action: 'IDENTITY',
        payload: null,
      };
    }

    return {
      type: 'ABYSS_RESPONSE',
      action: 'IDENTITY',
      payload: {
        username: this.session.username,
        abyssId: this.session.publicKey, // Placeholder for stable ID
        sessionPublicKey: this.session.publicKey,
      } as AbyssIdentity,
    };
  }

  private async handleSignMessageRequest(payload: any): Promise<AbyssResponse> {
    if (!this.session || !this.signMessageFn) {
      return {
        type: 'ABYSS_RESPONSE',
        action: 'SIGN_MESSAGE',
        error: 'Not authenticated',
      };
    }

    const message = payload?.message;
    if (!message || typeof message !== 'string') {
      return {
        type: 'ABYSS_RESPONSE',
        action: 'SIGN_MESSAGE',
        error: 'Invalid message',
      };
    }

    try {
      const signature = await this.signMessageFn(message);
      return {
        type: 'ABYSS_RESPONSE',
        action: 'SIGN_MESSAGE',
        payload: {
          signature,
          algo: 'mock-sha256', // Placeholder
          devMode: true,
        },
      };
    } catch (error) {
      return {
        type: 'ABYSS_RESPONSE',
        action: 'SIGN_MESSAGE',
        error: error instanceof Error ? error.message : 'Signing failed',
      };
    }
  }

  private handleChainStatusRequest(): AbyssResponse {
    return {
      type: 'ABYSS_RESPONSE',
      action: 'CHAIN_STATUS',
      payload: {
        connected: this.chainStatus?.status === 'online',
        height: this.chainStatus?.info?.height,
      } as AbyssChainStatus,
    };
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleMessage.bind(this));
    }
  }
}

// Singleton instance
let bridgeInstance: AbyssBridge | null = null;

export function getAbyssBridge(): AbyssBridge {
  if (!bridgeInstance) {
    bridgeInstance = new AbyssBridge();
  }
  return bridgeInstance;
}

