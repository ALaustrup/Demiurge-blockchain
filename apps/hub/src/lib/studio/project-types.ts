export interface StudioProjectConfig {
  name: string;
  displayName: string;
  version: string;
  description?: string;
  rpcUrl: string;
  wsUrl: string;
  authUrl: string;
  currency: {
    symbol: string;
    decimals: number;
    sparksPerCgt: number;
  };
  engine: {
    primary: string;
    pluginPath: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface StudioProjectSummary {
  slug: string;
  displayName: string;
  name: string;
  version: string;
  path: string;
  chainDataDir: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface ActiveProjectMeta {
  slug: string;
  name: string;
  displayName: string;
  path: string;
  chainDataDir: string;
  activatedAt: string;
}
