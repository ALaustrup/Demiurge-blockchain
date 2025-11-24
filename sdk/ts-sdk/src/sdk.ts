/**
 * Main SDK class that provides access to all Demiurge APIs
 */

import { DemiurgeClient, DemiurgeClientConfig } from './client';
import { CgtApi } from './cgt';
import { UrgeIdApi } from './urgeid';
import { NftApi } from './nft';
import { MarketplaceApi } from './marketplace';

export class DemiurgeSDK {
  public readonly cgt: CgtApi;
  public readonly urgeid: UrgeIdApi;
  public readonly nft: NftApi;
  public readonly marketplace: MarketplaceApi;

  private client: DemiurgeClient;

  constructor(config: DemiurgeClientConfig) {
    this.client = new DemiurgeClient(config);
    this.cgt = new CgtApi(this.client);
    this.urgeid = new UrgeIdApi(this.client);
    this.nft = new NftApi(this.client);
    this.marketplace = new MarketplaceApi(this.client);
  }

  /**
   * Get the underlying RPC client (for advanced usage)
   */
  getClient(): DemiurgeClient {
    return this.client;
  }
}

