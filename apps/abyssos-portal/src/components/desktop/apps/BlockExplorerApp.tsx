/**
 * Block Explorer Application
 * 
 * Navigate blocks, transactions, and accounts on the Demiurge chain
 */

import { useState, useEffect } from 'react';
import { useBlockListener } from '../../../context/BlockListenerContext';
import { Button } from '../../shared/Button';

const RPC_URL = import.meta.env.VITE_DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc';

interface Block {
  height: number;
  hash: string;
  timestamp: number;
  txCount: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  blockHeight: number;
  timestamp: number;
}

export function BlockExplorerApp() {
  const { currentBlockHeight } = useBlockListener();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  
  // Load recent blocks
  useEffect(() => {
    loadRecentBlocks();
  }, [currentBlockHeight]);
  
  const loadRecentBlocks = async () => {
    setIsLoading(true);
    try {
      // Fetch last 20 blocks
      const heights = Array.from({ length: 20 }, (_, i) => currentBlockHeight - i).filter(h => h > 0);
      
      const blockPromises = heights.map(async (height) => {
        try {
          const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'cgt_getBlockByHeight',
              params: [height],
              id: Date.now(),
            }),
          });
          
          const json = await response.json();
          if (json.result) {
            return {
              height: json.result.height || height,
              hash: json.result.hash || `0x${height.toString(16)}`,
              timestamp: json.result.timestamp || Date.now(),
              txCount: json.result.transactions?.length || 0,
            };
          }
        } catch (error) {
          console.error(`Failed to load block ${height}:`, error);
        }
        return null;
      });
      
      const loadedBlocks = (await Promise.all(blockPromises)).filter(Boolean) as Block[];
      setBlocks(loadedBlocks);
    } catch (error) {
      console.error('Failed to load blocks:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadBlockTransactions = async (block: Block) => {
    setSelectedBlock(block);
    setIsLoading(true);
    
    try {
      const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'cgt_getTransactionsByBlock',
          params: [block.height],
          id: Date.now(),
        }),
      });
      
      const json = await response.json();
      if (Array.isArray(json.result)) {
        setTransactions(json.result.map((tx: any) => ({
          hash: tx.hash || tx.txHash,
          from: tx.from,
          to: tx.to,
          amount: Number(tx.amount || tx.value || 0) / 1e18,
          blockHeight: block.height,
          timestamp: tx.timestamp || block.timestamp,
        })));
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setSearchResult(null);
    
    try {
      // Try as block height
      const blockHeight = parseInt(searchQuery);
      if (!isNaN(blockHeight)) {
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'cgt_getBlockByHeight',
            params: [blockHeight],
            id: Date.now(),
          }),
        });
        
        const json = await response.json();
        if (json.result) {
          setSearchResult({ type: 'block', data: json.result });
          return;
        }
      }
      
      // Try as transaction hash
      const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'cgt_getTransactionByHash',
          params: [searchQuery],
          id: Date.now(),
        }),
      });
      
      const json = await response.json();
      if (json.result) {
        setSearchResult({ type: 'transaction', data: json.result });
        return;
      }
      
      // Try as address
      const balanceResponse = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'cgt_getBalance',
          params: [searchQuery],
          id: Date.now(),
        }),
      });
      
      const balanceJson = await balanceResponse.json();
      if (balanceJson.result !== undefined) {
        // RPC returns balance in smallest units (10^-8), convert to CGT
        const balanceInSmallestUnits = BigInt(String(balanceJson.result));
        const balanceInCGT = Number(balanceInSmallestUnits) / 100_000_000;
        setSearchResult({
          type: 'address',
          data: {
            address: searchQuery,
            balance: balanceInCGT,
          },
        });
        return;
      }
      
      setSearchResult({ type: 'not_found', data: null });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult({ type: 'error', data: null });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-6 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-abyss-cyan mb-2">Block Explorer</h2>
        <p className="text-sm text-gray-400">Explore the Demiurge blockchain</p>
      </div>
      
      {/* Search */}
      <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by block height, tx hash, or address..."
            className="flex-1 px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white text-sm focus:outline-none focus:border-abyss-cyan"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            Search
          </Button>
        </div>
        
        {searchResult && (
          <div className="mt-4 p-3 bg-abyss-navy/50 border border-abyss-cyan/20 rounded">
            {searchResult.type === 'block' && (
              <div>
                <p className="text-abyss-cyan font-medium">Block #{searchResult.data.height}</p>
                <p className="text-xs text-gray-400 mt-1">Hash: <code>{searchResult.data.hash}</code></p>
              </div>
            )}
            {searchResult.type === 'transaction' && (
              <div>
                <p className="text-abyss-cyan font-medium">Transaction</p>
                <p className="text-xs text-gray-400 mt-1">Hash: <code>{searchResult.data.hash}</code></p>
              </div>
            )}
            {searchResult.type === 'address' && (
              <div>
                <p className="text-abyss-cyan font-medium">Address</p>
                <p className="text-xs text-gray-400 mt-1">Balance: {typeof searchResult.data.balance === 'number' ? searchResult.data.balance.toFixed(8) : String(searchResult.data.balance)} CGT</p>
              </div>
            )}
            {searchResult.type === 'not_found' && (
              <p className="text-red-400">Not found</p>
            )}
          </div>
        )}
      </div>
      
      {/* Blocks List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-abyss-cyan">Recent Blocks</h3>
          <Button onClick={loadRecentBlocks} disabled={isLoading} variant="secondary" className="text-xs">
            Refresh
          </Button>
        </div>
        
        {isLoading && blocks.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Loading blocks...</div>
        ) : blocks.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No blocks found</div>
        ) : (
          <div className="space-y-2">
            {blocks.map((block) => (
              <div
                key={block.height}
                onClick={() => loadBlockTransactions(block)}
                className={`bg-abyss-dark/50 border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedBlock?.height === block.height
                    ? 'border-abyss-cyan bg-abyss-cyan/10'
                    : 'border-abyss-cyan/20 hover:border-abyss-cyan/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-abyss-cyan font-medium">Block #{block.height}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Hash: <code className="text-gray-500">{block.hash.slice(0, 16)}...</code>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{block.txCount} txs</div>
                    <div className="text-xs text-gray-500">
                      {new Date(block.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Transactions */}
      {selectedBlock && (
        <div>
          <h3 className="text-lg font-bold text-abyss-cyan mb-4">
            Transactions in Block #{selectedBlock.height}
          </h3>
          
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No transactions in this block</div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.hash}
                  className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-xs text-abyss-cyan">{tx.hash.slice(0, 16)}...</code>
                    <div className="text-sm font-mono text-abyss-cyan">{tx.amount.toFixed(8)} CGT</div>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>From: <code className="text-gray-500">{tx.from.slice(0, 16)}...</code></div>
                    <div>To: <code className="text-gray-500">{tx.to.slice(0, 16)}...</code></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

