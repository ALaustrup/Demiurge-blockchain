import { useState } from 'react';
import { Button } from '../../shared/Button';
import { abyssIdSDK } from '../../../services/abyssid/sdk';

interface NFTSwapPanelProps {
  onSwapComplete?: (assetId: string) => void;
}

export function NFTSwapPanel({ onSwapComplete }: NFTSwapPanelProps) {
  const [chain, setChain] = useState<'ETH' | 'POLYGON' | 'BSC' | 'SOL' | 'BTC' | 'ARBITRUM' | 'OPTIMISM' | 'AVALANCHE'>('ETH');
  const [standard, setStandard] = useState<'ERC-721' | 'ERC-1155' | 'SPL' | 'ORDINAL' | 'OTHER'>('ERC-721');
  const [contractAddress, setContractAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [walletSignature, setWalletSignature] = useState('');
  const [signedMessage, setSignedMessage] = useState('');
  const [needsSignature, setNeedsSignature] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const requestWalletSignature = async () => {
    if (!tokenId || !ownerAddress) {
      setError('Token ID and Owner Address are required');
      return;
    }

    if ((chain === 'ETH' || chain === 'POLYGON' || chain === 'BSC') && !contractAddress) {
      setError('Contract Address is required for EVM chains');
      return;
    }

    // Prepare message to sign
    const message = chain === 'SOL' 
      ? `Swap NFT ${tokenId} from Solana to DRC-369`
      : `Swap NFT ${tokenId} from ${chain} to DRC-369`;
    
    setSignedMessage(message);
    setNeedsSignature(true);
    
    // Request signature from user's wallet
    try {
      // For EVM chains: Request signature via MetaMask or WalletConnect
      if (chain === 'ETH' || chain === 'POLYGON' || chain === 'BSC') {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const signature = await (window as any).ethereum.request({
            method: 'personal_sign',
            params: [message, ownerAddress],
          });
          setWalletSignature(signature);
          setNeedsSignature(false);
        } else {
          setError('Ethereum wallet not found. Please install MetaMask or connect a wallet.');
          setNeedsSignature(false);
          return;
        }
      }
      
      // For Solana: Request signature via Phantom or Solflare
      if (chain === 'SOL') {
        if (typeof window !== 'undefined' && (window as any).solana) {
          const encodedMessage = new TextEncoder().encode(message);
          const signed = await (window as any).solana.signMessage(encodedMessage, 'utf8');
          setWalletSignature(signed.signature.toString('base64'));
          setNeedsSignature(false);
        } else {
          setError('Solana wallet not found. Please install Phantom or connect a wallet.');
          setNeedsSignature(false);
          return;
        }
      }
    } catch (sigError: any) {
      setError(`Signature failed: ${sigError.message}`);
      setNeedsSignature(false);
    }
  };

  const handleSwap = async () => {
    if (!tokenId || !ownerAddress) {
      setError('Token ID and Owner Address are required');
      return;
    }

    if ((chain === 'ETH' || chain === 'POLYGON' || chain === 'BSC') && !contractAddress) {
      setError('Contract Address is required for EVM chains');
      return;
    }

    if (!walletSignature || !signedMessage) {
      setError('Wallet signature is required. Please sign the message first.');
      return;
    }

    setSwapping(true);
    setError(null);
    setResult(null);

    try {
      const sessionToken = typeof window !== 'undefined' 
        ? localStorage.getItem('abyssos.abyssid.sessionId')
        : null;
      if (!sessionToken) {
        throw new Error('No session token available. Please log in.');
      }

      const response = await fetch(`${import.meta.env.VITE_ABYSSID_API_URL || 'http://localhost:8082'}/api/nft-swap/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          originChain: chain,
          standard,
          contractAddress: contractAddress || undefined,
          tokenId,
          ownerAddress,
          walletSignature,
          signedMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Swap failed');
      }

      const swapResult = await response.json();
      setResult(swapResult);
      onSwapComplete?.(swapResult.id);
    } catch (err: any) {
      console.error('NFT swap error:', err);
      setError(err.message || 'Failed to swap NFT');
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
        <h3 className="text-lg font-bold text-abyss-cyan mb-4">Swap NFT to DRC-369</h3>
        <p className="text-sm text-gray-400 mb-4">
          Swap NFTs from other chains to DRC-369 assets in your Abyss Wallet.
          Ownership will be validated before swapping.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Source Chain</label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value as any)}
              className="w-full px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white text-sm"
            >
              <option value="ETH">Ethereum</option>
              <option value="POLYGON">Polygon</option>
              <option value="BSC">BSC</option>
              <option value="SOL">Solana</option>
              <option value="BTC">Bitcoin (Ordinals)</option>
              <option value="ARBITRUM">Arbitrum</option>
              <option value="OPTIMISM">Optimism</option>
              <option value="AVALANCHE">Avalanche</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">NFT Standard</label>
            <select
              value={standard}
              onChange={(e) => setStandard(e.target.value as any)}
              className="w-full px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white text-sm"
            >
              <option value="ERC-721">ERC-721</option>
              <option value="ERC-1155">ERC-1155</option>
              <option value="SPL">SPL (Solana)</option>
              <option value="ORDINAL">Ordinal (Bitcoin)</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {(chain === 'ETH' || chain === 'POLYGON' || chain === 'BSC' || chain === 'ARBITRUM' || chain === 'OPTIMISM' || chain === 'AVALANCHE') && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Contract Address</label>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white text-sm font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Token ID</label>
            <input
              type="text"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="Token ID"
              className="w-full px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Your Address (on source chain)</label>
            <input
              type="text"
              value={ownerAddress}
              onChange={(e) => setOwnerAddress(e.target.value)}
              placeholder="0x... or Solana address"
              className="w-full px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              The address that owns this NFT on {chain}. Ownership will be validated.
            </p>
          </div>

          {needsSignature && (
            <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-sm">
              <p className="font-medium mb-2">Signature Required</p>
              <p className="text-xs mb-2">Message to sign:</p>
              <code className="block text-xs bg-abyss-dark p-2 rounded mb-2 break-all">{signedMessage}</code>
              <p className="text-xs">Please sign this message in your wallet to prove ownership.</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded text-green-400 text-sm">
              <p className="font-medium mb-2">✓ Swap Successful!</p>
              <p className="text-xs">Asset ID: {result.id}</p>
              {result.txHash && (
                <p className="text-xs">TX: {result.txHash.slice(0, 16)}...</p>
              )}
              {result.onChain && (
                <p className="text-xs">On-chain: ✓</p>
              )}
            </div>
          )}

          {!walletSignature ? (
            <Button
              onClick={requestWalletSignature}
              disabled={!tokenId || !ownerAddress}
              className="w-full"
            >
              Request Wallet Signature
            </Button>
          ) : (
            <Button
              onClick={handleSwap}
              disabled={swapping}
              className="w-full"
            >
              {swapping ? 'Swapping...' : 'Swap to DRC-369'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

