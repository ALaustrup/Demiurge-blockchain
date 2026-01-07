/**
 * WRYT Auto-Save Hook
 * 
 * Automatically saves document content at regular intervals
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  content: string;
  hasChanges: boolean;
  enabled: boolean;
  interval: number; // in milliseconds
  onSave: () => void;
}

export function useAutoSave({
  content,
  hasChanges,
  enabled,
  interval,
  onSave,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef(content);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Auto-save effect
  useEffect(() => {
    if (!enabled || !hasChanges) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      if (content !== lastSavedContentRef.current) {
        onSave();
        lastSavedContentRef.current = content;
      }
    }, interval);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, hasChanges, enabled, interval, onSave]);
  
  // Manual save function
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onSave();
    lastSavedContentRef.current = content;
  }, [content, onSave]);
  
  return { saveNow };
}

/**
 * Keyboard shortcut hook for save
 */
export function useSaveShortcut(onSave: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);
}
