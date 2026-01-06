/**
 * Main SDK class that provides access to all Demiurge APIs
 */

import { DemiurgeClient, DemiurgeClientConfig } from './client';
import { CgtApi } from './cgt';
import { AbyssIdApi } from './abyssid';
import { NftApi } from './nft';
import { MarketplaceApi } from './marketplace';
import { ActivityApi } from './activity';
import { StakingApi } from './staking';

export class DemiurgeSDK {
  public readonly cgt: CgtApi;
  public readonly abyssid: AbyssIdApi;
  public readonly nft: NftApi;
  public readonly marketplace: MarketplaceApi;
  public readonly activity: ActivityApi;
  public readonly staking: StakingApi;

  /** @deprecated Use abyssid instead */
  public readonly urgeid: AbyssIdApi;

  private client: DemiurgeClient;

  constructor(config: DemiurgeClientConfig) {
    this.client = new DemiurgeClient(config);
    this.cgt = new CgtApi(this.client);
    this.abyssid = new AbyssIdApi(this.client);
    this.urgeid = this.abyssid; // Legacy alias
    this.nft = new NftApi(this.client);
    this.marketplace = new MarketplaceApi(this.client);
    this.activity = new ActivityApi(this.client);
    this.staking = new StakingApi(this.client);
  }

  /**
   * Get the underlying RPC client (for advanced usage)
   */
  getClient(): DemiurgeClient {
    return this.client;
  }
}

