/**
 * DRC-369 Studio Application
 * 
 * Creator app for creating and previewing DRC-369 assets
 */

import { useState } from 'react';
import { useQorID } from '../../../hooks/useAbyssID';
import { abyssIdSDK } from '../../../services/qorid/sdk';
import { Button } from '../../shared/Button';

export function DRC369StudioApp() {
  const { session } = useQorID();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    uri: '',
    contentType: 'image' as const,
    royalties: 0,
    metadata: '',
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<{ txHash?: string; blockHeight?: number } | null>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setFormData(prev => ({ ...prev, uri: url }));
    }
  };
  
  const handleMint = async () => {
    if (!session) {
      alert('Please log in to mint DRC-369 assets');
      return;
    }
    
    if (!formData.name || !formData.uri) {
      alert('Name and URI are required');
      return;
    }
    
    setIsMinting(true);
    setMintResult(null);
    
    try {
      const result = await abyssIdSDK.drc369.publishNative({
        uri: formData.uri,
        contentType: formData.contentType,
        owner: session.publicKey,
        name: formData.name,
        description: formData.description,
        attributes: {
          royalties: formData.royalties,
          ...(formData.metadata ? JSON.parse(formData.metadata) : {}),
        },
      });
      
      setMintResult({
        txHash: result.txHash,
        blockHeight: result.blockHeight,
      });
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: '',
          description: '',
          uri: '',
          contentType: 'image',
          royalties: 0,
          metadata: '',
        });
        setPreview(null);
        setMintResult(null);
      }, 3000);
    } catch (error: any) {
      alert(`Mint failed: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-6 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">DRC-369 Studio</h2>
        <p className="text-sm text-genesis-text-tertiary">Create and preview DRC-369 assets</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-genesis-text-tertiary mb-1">Asset Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Awesome NFT"
              className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm focus:outline-none focus:border-genesis-border-default"
            />
          </div>
          
          <div>
            <label className="block text-sm text-genesis-text-tertiary mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your asset..."
              rows={3}
              className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm focus:outline-none focus:border-genesis-border-default"
            />
          </div>
          
          <div>
            <label className="block text-sm text-genesis-text-tertiary mb-1">Content Type</label>
            <select
              value={formData.contentType}
              onChange={(e) => setFormData(prev => ({ ...prev, contentType: e.target.value as any }))}
              className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm focus:outline-none focus:border-genesis-border-default"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="model">3D Model</option>
              <option value="html-app">HTML App</option>
              <option value="binary">Binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-genesis-text-tertiary mb-1">Royalties (%)</label>
            <input
              type="number"
              value={formData.royalties}
              onChange={(e) => setFormData(prev => ({ ...prev, royalties: Math.max(0, Math.min(20, Number(e.target.value))) }))}
              min="0"
              max="20"
              step="0.1"
              className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm focus:outline-none focus:border-genesis-border-default"
            />
            <p className="text-xs text-gray-500 mt-1">0-20% royalty on secondary sales</p>
          </div>
          
          <div>
            <label className="block text-sm text-genesis-text-tertiary mb-1">Upload File</label>
            <input
              type="file"
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*"
              className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm focus:outline-none focus:border-genesis-border-default"
            />
          </div>
          
          <div>
            <label className="block text-sm text-genesis-text-tertiary mb-1">URI (IPFS/HTTP)</label>
            <input
              type="text"
              value={formData.uri}
              onChange={(e) => setFormData(prev => ({ ...prev, uri: e.target.value }))}
              placeholder="ipfs://... or https://..."
              className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm focus:outline-none focus:border-genesis-border-default"
            />
          </div>
          
          <div>
            <label className="block text-sm text-genesis-text-tertiary mb-1">Additional Metadata (JSON)</label>
            <textarea
              value={formData.metadata}
              onChange={(e) => setFormData(prev => ({ ...prev, metadata: e.target.value }))}
              placeholder='{"key": "value"}'
              rows={3}
              className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm font-mono focus:outline-none focus:border-genesis-border-default"
            />
          </div>
          
          <Button
            onClick={handleMint}
            disabled={isMinting || !session}
            className="w-full"
          >
            {isMinting ? 'Minting...' : 'Mint DRC-369 Asset'}
          </Button>
          
          {mintResult && (
            <div className="bg-green-500/20 border border-green-500/30 rounded p-3 text-sm">
              <p className="text-green-400 font-medium">Mint Successful!</p>
              {mintResult.txHash && (
                <p className="text-xs text-genesis-text-tertiary mt-1">
                  TX: <code className="text-genesis-cipher-cyan">{mintResult.txHash.slice(0, 16)}...</code>
                </p>
              )}
              {mintResult.blockHeight && (
                <p className="text-xs text-genesis-text-tertiary">Block: #{mintResult.blockHeight}</p>
              )}
            </div>
          )}
        </div>
        
        {/* Preview */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-2">Preview</h3>
            <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
              {preview ? (
                formData.contentType === 'image' ? (
                  <img src={preview} alt="Preview" className="max-w-full max-h-[400px] rounded" />
                ) : formData.contentType === 'video' ? (
                  <video src={preview} controls className="max-w-full max-h-[400px] rounded" />
                ) : formData.contentType === 'audio' ? (
                  <audio src={preview} controls className="w-full" />
                ) : (
                  <div className="text-center text-genesis-text-tertiary">
                    <p>Preview not available for {formData.contentType}</p>
                    <p className="text-xs mt-2">{formData.uri}</p>
                  </div>
                )
              ) : (
                <div className="text-center text-genesis-text-tertiary">
                  <p>No preview available</p>
                  <p className="text-xs mt-2">Upload a file or enter a URI</p>
                </div>
              )}
            </div>
          </div>
          
          {formData.name && (
            <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
              <h4 className="font-medium text-genesis-cipher-cyan mb-2">{formData.name}</h4>
              {formData.description && (
                <p className="text-sm text-genesis-text-tertiary mb-2">{formData.description}</p>
              )}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Type: {formData.contentType}</div>
                {formData.royalties > 0 && <div>Royalties: {formData.royalties}%</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

