export interface AbyssIDSession {
  username: string;
  publicKey: string;
}

export interface AbyssIDProvider {
  getSession(): Promise<AbyssIDSession | null>;
  login(username?: string): Promise<AbyssIDSession>;
  logout(): Promise<void>;
  signMessage(message: Uint8Array | string): Promise<string>;
}

