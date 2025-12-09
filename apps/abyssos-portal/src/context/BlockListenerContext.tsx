/**
 * Block Listener Context
 * 
 * Provides real-time blockchain events to React components
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { blockListener, type BlockEvent, type TransactionEvent } from '../services/chain/BlockListener';

interface BlockListenerContextValue {
  currentBlockHeight: number;
  lastBlockTime: number;
  connectionStatus: 'connected' | 'polling' | 'disconnected';
  onBlock: (callback: (event: BlockEvent) => void) => () => void;
  onTransaction: (callback: (event: TransactionEvent) => void) => () => void;
}

const BlockListenerContext = createContext<BlockListenerContextValue | undefined>(undefined);

interface BlockListenerProviderProps {
  children: ReactNode;
}

export function BlockListenerProvider({ children }: BlockListenerProviderProps) {
  const [currentBlockHeight, setCurrentBlockHeight] = useState(0);
  const [lastBlockTime, setLastBlockTime] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'polling' | 'disconnected'>('disconnected');
  
  useEffect(() => {
    // Start the block listener (non-blocking)
    try {
      blockListener.start();
    } catch (error) {
      console.error('Failed to start block listener:', error);
      setConnectionStatus('disconnected');
    }
    
    // Subscribe to block events
    const unsubscribe = blockListener.onBlock((event) => {
      setCurrentBlockHeight(event.height);
      setLastBlockTime(event.timestamp);
      setConnectionStatus(blockListener.getStatus());
    });
    
    // Update connection status periodically
    const statusInterval = setInterval(() => {
      try {
        setConnectionStatus(blockListener.getStatus());
      } catch (error) {
        console.error('Block listener status error:', error);
        setConnectionStatus('disconnected');
      }
    }, 2000);
    
    return () => {
      unsubscribe();
      clearInterval(statusInterval);
      try {
        blockListener.stop();
      } catch (error) {
        console.error('Error stopping block listener:', error);
      }
    };
  }, []);
  
  const onBlock = (callback: (event: BlockEvent) => void) => {
    return blockListener.onBlock(callback);
  };
  
  const onTransaction = (callback: (event: TransactionEvent) => void) => {
    return blockListener.onTransaction(callback);
  };
  
  return (
    <BlockListenerContext.Provider
      value={{
        currentBlockHeight,
        lastBlockTime,
        connectionStatus,
        onBlock,
        onTransaction,
      }}
    >
      {children}
    </BlockListenerContext.Provider>
  );
}

export function useBlockListener() {
  const context = useContext(BlockListenerContext);
  if (!context) {
    throw new Error('useBlockListener must be used within BlockListenerProvider');
  }
  return context;
}

