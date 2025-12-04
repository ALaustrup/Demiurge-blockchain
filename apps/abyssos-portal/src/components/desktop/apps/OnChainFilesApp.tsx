import { useState, useEffect } from 'react';
import { useAbyssID } from '../../../hooks/useAbyssID';
import { Button } from '../../shared/Button';
import type { FileRewardEvent } from '../../../services/cgt/types';
import { canMintAsNft, generateNftIdForFile } from '../../../services/nft/types';

interface PublishedFile {
  fileId: string;
  title: string;
  description: string;
  priceCgt: number;
  ownerPubKey: string;
  timestamp: number;
}

const STORAGE_KEY_PUBLISHED = 'abyssos_published_files';
const STORAGE_KEY_PURCHASES = 'abyssos_purchases';
const STORAGE_KEY_CGT_EVENTS = 'abyssos_cgt_events';

function getAllPublishedFiles(): PublishedFile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PUBLISHED);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getPurchases(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PURCHASES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function savePurchase(fileId: string) {
  const purchases = getPurchases();
  if (!purchases.includes(fileId)) {
    purchases.push(fileId);
    localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(purchases));
  }
}

function saveCgtEvent(event: FileRewardEvent) {
  try {
    const events = getCgtEvents();
    events.push(event);
    localStorage.setItem(STORAGE_KEY_CGT_EVENTS, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save CGT event:', error);
  }
}

function getCgtEvents(): FileRewardEvent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CGT_EVENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function getEarnedCgt(publicKey: string): number {
  const events = getCgtEvents();
  return events
    .filter((e) => e.sellerPubKey === publicKey)
    .reduce((sum, e) => sum + e.sellerRewardCgt, 0);
}

export function OnChainFilesApp() {
  const { session } = useAbyssID();
  const [files, setFiles] = useState<PublishedFile[]>([]);
  const [purchases, setPurchases] = useState<string[]>(getPurchases());
  const [earnedCgt, setEarnedCgt] = useState(0);

  useEffect(() => {
    // Load all published files
    setFiles(getAllPublishedFiles());
    setPurchases(getPurchases());

    // Calculate earned CGT
    if (session) {
      setEarnedCgt(getEarnedCgt(session.publicKey));
    }
  }, [session]);

  const handleBuy = (file: PublishedFile) => {
    if (!session) {
      return;
    }

    // Calculate reward split (80% seller, 20% protocol)
    const sellerRewardCgt = file.priceCgt * 0.8;
    const protocolFeeCgt = file.priceCgt * 0.2;

    // Create reward event
    const event: FileRewardEvent = {
      fileId: file.fileId,
      buyerPubKey: session.publicKey,
      sellerPubKey: file.ownerPubKey,
      priceCgt: file.priceCgt,
      sellerRewardCgt,
      protocolFeeCgt,
    };

    // Save event and purchase
    saveCgtEvent(event);
    savePurchase(file.fileId);

    // Update UI
    setPurchases(getPurchases());
    if (session.publicKey === file.ownerPubKey) {
      setEarnedCgt(getEarnedCgt(session.publicKey));
    }

    // TODO: Send FilePurchase transaction to Demiurge chain via RPC
    console.log('FilePurchase event:', event);
  };

  const isOwned = (file: PublishedFile) => session && file.ownerPubKey === session.publicKey;
  const isPurchased = (fileId: string) => purchases.includes(fileId);

  return (
    <div className="space-y-6 h-full overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-abyss-cyan mb-2">OnChain Files</h2>
        <p className="text-gray-300 text-sm">Browse and purchase files on the Demiurge Network</p>
      </div>

      {session && earnedCgt > 0 && (
        <div className="bg-abyss-navy/50 border border-abyss-cyan/20 rounded-lg p-4">
          <div className="text-sm text-gray-300 mb-1">Lifetime CGT earned from your files (simulated)</div>
          <div className="text-2xl font-bold text-abyss-cyan">{earnedCgt.toFixed(4)} CGT</div>
          <div className="text-xs text-gray-500 mt-1">Devnet Only · Simulated</div>
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>No files published yet.</p>
          <p className="text-sm mt-2">Use AbyssTorrent to publish your first file.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div
              key={file.fileId}
              className="bg-abyss-navy/50 border border-abyss-cyan/20 rounded-lg p-4 hover:border-abyss-cyan/50 transition-colors"
            >
              <div className="mb-2">
                <h3 className="font-medium text-abyss-cyan truncate">{file.title}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {file.description || 'No description'}
                </p>
              </div>

              <div className="text-xs text-gray-500 mb-3">
                <div>Owner: {file.ownerPubKey.slice(0, 8)}...</div>
                <div>Price: {file.priceCgt} CGT</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {isOwned(file) ? (
                    <span className="text-xs text-abyss-cyan">You own this</span>
                  ) : isPurchased(file.fileId) ? (
                    <span className="text-xs text-green-400">Purchased</span>
                  ) : (
                    <Button
                      onClick={() => handleBuy(file)}
                      disabled={!session || file.priceCgt <= 0}
                      variant="secondary"
                      className="px-3 py-1 text-xs"
                    >
                      {file.priceCgt > 0 ? `Buy ${file.priceCgt} CGT` : 'Download'}
                    </Button>
                  )}
                </div>
                
                {isOwned(file) && canMintAsNft(file as any) && (
                  <div className="pt-2 border-t border-abyss-cyan/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">NFT Status:</span>
                      <span className="text-xs text-abyss-purple">Not minted</span>
                    </div>
                    <Button
                      onClick={() => {
                        // TODO: Implement NFT minting flow
                        console.log('Mint as DemiNFT:', generateNftIdForFile(file.fileId, file.ownerPubKey));
                        alert('NFT minting coming soon!');
                      }}
                      variant="ghost"
                      className="w-full mt-2 px-2 py-1 text-xs text-abyss-purple border border-abyss-purple/30 hover:bg-abyss-purple/10"
                    >
                      Mint as DemiNFT (Coming Soon)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

