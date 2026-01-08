/**
 * Abyss DNS Console Application
 * 
 * DNS Intelligence Layer UI
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dnsClient } from '../../../services/dns/dnsClient';
import { gridDnsResolver } from '../../../services/grid/dns/gridDnsResolver';
import { normalizeDomain, isValidDomain } from '../../../utils/dns/normalizeDomain';
import { formatExpiration } from '../../../utils/dns/cacheHelpers';
import type { DNSLookupResult, ChainDNSRecord } from '../../../services/dns/dnsClient';
import { Button } from '../../shared/Button';

type RecordType = 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'NS';

export function AbyssDNSApp() {
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState<RecordType>('A');
  const [result, setResult] = useState<DNSLookupResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trace, setTrace] = useState(false);
  const [useGrid, setUseGrid] = useState(false);
  const [cacheEntries, setCacheEntries] = useState<any[]>([]);
  const [chainRecord, setChainRecord] = useState<ChainDNSRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'lookup' | 'cache' | 'chain'>('lookup');
  
  useEffect(() => {
    loadCacheEntries();
  }, []);
  
  const loadCacheEntries = async () => {
    try {
      // In production, would fetch all cache entries
      // For now, use placeholder
      setCacheEntries([]);
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  };
  
  const handleLookup = async () => {
    if (!domain || !isValidDomain(domain)) {
      alert('Invalid domain');
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    setChainRecord(null);
    
    try {
      const normalized = normalizeDomain(domain);
      
      // Check for chain record
      const chain = await dnsClient.getChainRecord(normalized);
      if (chain) {
        setChainRecord(chain);
      }
      
      // Perform lookup
      let lookupResult: DNSLookupResult;
      if (useGrid) {
        lookupResult = await gridDnsResolver.resolveWithFallback(normalized, recordType);
      } else {
        lookupResult = await dnsClient.lookup(normalized, recordType, trace);
      }
      
      setResult(lookupResult);
    } catch (error: any) {
      alert(`DNS lookup failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearCache = async () => {
    try {
      await dnsClient.clearCache();
      await loadCacheEntries();
      alert('Cache cleared');
    } catch (error: any) {
      alert(`Failed to clear cache: ${error.message}`);
    }
  };
  
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'chain': return 'text-abyss-purple';
      case 'cache': return 'text-genesis-cipher-cyan';
      case 'unbound': return 'text-green-400';
      case 'upstream': return 'text-yellow-400';
      case 'grid': return 'text-abyss-purple';
      default: return 'text-genesis-text-tertiary';
    }
  };
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-4 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">Abyss DNS Console</h2>
        <p className="text-sm text-genesis-text-tertiary">DNS Intelligence Layer</p>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-genesis-border-default/20">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'lookup'
              ? 'text-genesis-cipher-cyan border-b-2 border-genesis-border-default'
              : 'text-genesis-text-tertiary hover:text-genesis-cipher-cyan'
          }`}
          onClick={() => setActiveTab('lookup')}
        >
          Lookup
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'cache'
              ? 'text-genesis-cipher-cyan border-b-2 border-genesis-border-default'
              : 'text-genesis-text-tertiary hover:text-genesis-cipher-cyan'
          }`}
          onClick={() => setActiveTab('cache')}
        >
          Cache
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'chain'
              ? 'text-genesis-cipher-cyan border-b-2 border-genesis-border-default'
              : 'text-genesis-text-tertiary hover:text-genesis-cipher-cyan'
          }`}
          onClick={() => setActiveTab('chain')}
        >
          Chain Records
        </button>
      </div>
      
      {/* Lookup Tab */}
      {activeTab === 'lookup' && (
        <div className="space-y-4">
          {/* Input Bar */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1 px-4 py-2 bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded text-genesis-cipher-cyan placeholder-gray-500 focus:border-genesis-border-default focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
            />
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as RecordType)}
              className="px-4 py-2 bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded text-genesis-cipher-cyan focus:border-genesis-border-default focus:outline-none"
            >
              <option value="A">A</option>
              <option value="AAAA">AAAA</option>
              <option value="CNAME">CNAME</option>
              <option value="TXT">TXT</option>
              <option value="NS">NS</option>
            </select>
            <Button
              onClick={handleLookup}
              disabled={isLoading || !domain}
              className="px-6"
            >
              {isLoading ? 'Resolving...' : 'Lookup'}
            </Button>
          </div>
          
          {/* Options */}
          <div className="flex items-center space-x-4 text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trace}
                onChange={(e) => setTrace(e.target.checked)}
                className="w-4 h-4 text-genesis-cipher-cyan bg-genesis-glass-light border-genesis-border-default/20 rounded focus:ring-abyss-cyan"
              />
              <span className="text-genesis-text-tertiary">Trace Mode</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useGrid}
                onChange={(e) => setUseGrid(e.target.checked)}
                className="w-4 h-4 text-genesis-cipher-cyan bg-genesis-glass-light border-genesis-border-default/20 rounded focus:ring-abyss-cyan"
              />
              <span className="text-genesis-text-tertiary">Resolve Using Grid</span>
            </label>
          </div>
          
          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-6 space-y-4"
            >
              <div>
                <div className="text-sm text-genesis-text-tertiary mb-1">Domain</div>
                <div className="font-mono text-genesis-cipher-cyan">{result.domain}</div>
              </div>
              
              <div>
                <div className="text-sm text-genesis-text-tertiary mb-1">Source</div>
                <div className={`font-medium ${getSourceColor(result.source)}`}>
                  {result.source.toUpperCase()}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-genesis-text-tertiary mb-2">Records</div>
                <div className="space-y-2">
                  {result.records.map((record, i) => (
                    <div key={i} className="p-3 bg-abyss-navy/30 rounded border border-genesis-border-default/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm text-genesis-cipher-cyan">{record.type}</span>
                        <span className={`text-xs ${getSourceColor(record.source)}`}>
                          {record.source}
                        </span>
                      </div>
                      <div className="font-mono text-sm text-genesis-text-secondary">
                        {Array.isArray(record.value) ? record.value.join(', ') : record.value}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        TTL: {record.ttl}s
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Trace */}
              {result.trace && result.trace.length > 0 && (
                <div>
                  <div className="text-sm text-genesis-text-tertiary mb-2">Resolver Trace</div>
                  <div className="space-y-1">
                    {result.trace.map((step, i) => (
                      <div key={i} className="text-xs text-gray-500">
                        {step.step}: {step.duration}ms
                        {step.error && <span className="text-red-400 ml-2">({step.error})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Chain Record Indicator */}
          {chainRecord && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-abyss-purple/20 border border-abyss-purple/30 rounded-lg p-4"
            >
              <div className="text-sm font-medium text-abyss-purple mb-2">On-Chain DNS Record</div>
              <div className="text-xs text-genesis-text-tertiary space-y-1">
                <div>Asset ID: {chainRecord.assetId.slice(0, 16)}...</div>
                <div>TX Hash: {chainRecord.txHash.slice(0, 16)}...</div>
                <div>Block: {chainRecord.blockHeight}</div>
              </div>
            </motion.div>
          )}
        </div>
      )}
      
      {/* Cache Tab */}
      {activeTab === 'cache' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-genesis-text-tertiary">Cached DNS Records</div>
            <Button onClick={handleClearCache} className="text-xs">
              Clear Cache
            </Button>
          </div>
          
          {cacheEntries.length > 0 ? (
            <div className="space-y-2">
              {cacheEntries.map((entry, i) => (
                <div key={i} className="p-3 bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded">
                  <div className="font-mono text-sm text-genesis-cipher-cyan">{entry.domain}</div>
                  <div className="text-xs text-genesis-text-tertiary mt-1">
                    {entry.type} · {formatExpiration(entry)} remaining
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">No cached entries</div>
          )}
        </div>
      )}
      
      {/* Chain Records Tab */}
      {activeTab === 'chain' && (
        <div className="space-y-4">
          <div className="text-sm text-genesis-text-tertiary">On-Chain DNS Records</div>
          {chainRecord ? (
            <div className="bg-genesis-glass-light/50 border border-abyss-purple/20 rounded-lg p-6">
              <div className="font-mono text-lg text-abyss-purple mb-4">{chainRecord.domain}</div>
              <div className="space-y-3">
                {chainRecord.records.a && (
                  <div>
                    <div className="text-xs text-genesis-text-tertiary mb-1">A Records</div>
                    <div className="font-mono text-sm text-genesis-cipher-cyan">
                      {chainRecord.records.a.join(', ')}
                    </div>
                  </div>
                )}
                {chainRecord.records.aaaa && (
                  <div>
                    <div className="text-xs text-genesis-text-tertiary mb-1">AAAA Records</div>
                    <div className="font-mono text-sm text-genesis-cipher-cyan">
                      {chainRecord.records.aaaa.join(', ')}
                    </div>
                  </div>
                )}
                {chainRecord.records.cname && (
                  <div>
                    <div className="text-xs text-genesis-text-tertiary mb-1">CNAME</div>
                    <div className="font-mono text-sm text-genesis-cipher-cyan">
                      {chainRecord.records.cname.join(', ')}
                    </div>
                  </div>
                )}
                {chainRecord.records.txt && (
                  <div>
                    <div className="text-xs text-genesis-text-tertiary mb-1">TXT</div>
                    <div className="font-mono text-sm text-genesis-cipher-cyan">
                      {chainRecord.records.txt.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">No chain records found</div>
          )}
        </div>
      )}
    </div>
  );
}

