export type CgtAmount = number;

export interface FileRewardEvent {
  fileId: string;
  buyerPubKey: string;
  sellerPubKey: string;
  priceCgt: CgtAmount;
  sellerRewardCgt: CgtAmount; // 0.8 * price
  protocolFeeCgt: CgtAmount; // 0.2 * price
}

