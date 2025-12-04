import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AppIcon } from './AppIcon';
import { useDesktopStore, APP_INFOS, AppId } from '../../state/desktopStore';
import { useTheme } from '../../context/ThemeContext';

const LONG_PRESS_DURATION = 600; // ms
const DRAG_THRESHOLD = 10; // pixels

export function GlassDock() {
  const { themeConfig } = useTheme();
  const { launcherApps, openApp, reorderLauncher } = useDesktopStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const velocityRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const lastMoveXRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Get app info for each launcher app
  const getAppInfo = (appId: AppId) => APP_INFOS.find((app) => app.id === appId);

  // Handle long press detection
  const handlePointerDown = useCallback((index: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isEditMode) {
      // Already in edit mode, start dragging
      setDraggedIndex(index);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset(e.clientX - rect.left - rect.width / 2);
      return;
    }

    touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    lastMoveXRef.current = e.clientX;
    lastMoveTimeRef.current = Date.now();
    velocityRef.current = 0;

    longPressTimerRef.current = window.setTimeout(() => {
      setIsEditMode(true);
      setDraggedIndex(index);
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, LONG_PRESS_DURATION);
  }, [isEditMode]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (longPressTimerRef.current && touchStartRef.current) {
      const dx = Math.abs(e.clientX - touchStartRef.current.x);
      const dy = Math.abs(e.clientY - touchStartRef.current.y);
      
      // Cancel long press if moved too much
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        if (longPressTimerRef.current) {
          window.clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }

    // Track velocity for momentum scrolling
    const now = Date.now();
    const dt = now - lastMoveTimeRef.current;
    if (dt > 0) {
      const dx = e.clientX - lastMoveXRef.current;
      velocityRef.current = dx / dt;
    }
    lastMoveXRef.current = e.clientX;
    lastMoveTimeRef.current = now;

    // Handle dragging in edit mode
    if (isEditMode && draggedIndex !== null) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset(e.clientX - rect.left - rect.width / 2);
    }
  }, [isEditMode, draggedIndex]);

  const handlePointerUp = useCallback((index: number) => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isEditMode && draggedIndex !== null) {
      // Handle drop
      const targetIndex = calculateDropIndex(draggedIndex, dragOffset);
      if (targetIndex !== draggedIndex) {
        reorderLauncher(draggedIndex, targetIndex);
      }
      setDraggedIndex(null);
      setDragOffset(0);
    } else if (!isEditMode && longPressTimerRef.current === null) {
      // Normal tap - open app (only if long press was cancelled)
      const appId = launcherApps[index];
      if (appId) {
        openApp(appId);
      }
    }
  }, [isEditMode, draggedIndex, dragOffset, launcherApps, openApp, reorderLauncher]);

  // Momentum scrolling on release
  useEffect(() => {
    if (!isEditMode && scrollRef.current && Math.abs(velocityRef.current) > 0.1) {
      const applyMomentum = () => {
        if (scrollRef.current) {
          const currentScroll = scrollRef.current.scrollLeft;
          scrollRef.current.scrollLeft = currentScroll - velocityRef.current * 16;
          velocityRef.current *= 0.92; // Deceleration
          
          if (Math.abs(velocityRef.current) > 0.1) {
            animationFrameRef.current = requestAnimationFrame(applyMomentum);
          }
        }
      };
      animationFrameRef.current = requestAnimationFrame(applyMomentum);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isEditMode]);

  const calculateDropIndex = (fromIndex: number, offset: number): number => {
    const itemWidth = 80; // Approximate icon width + spacing
    const targetOffset = fromIndex * itemWidth + offset;
    const targetIndex = Math.round(targetOffset / itemWidth);
    return Math.max(0, Math.min(targetIndex, launcherApps.length - 1));
  };

  // Exit edit mode on outside click
  useEffect(() => {
    if (isEditMode) {
      const handleClickOutside = (e: MouseEvent) => {
        if (scrollRef.current && !scrollRef.current.contains(e.target as Node)) {
          setIsEditMode(false);
          setDraggedIndex(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditMode]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-10 flex justify-center">
      <motion.div
        ref={scrollRef}
        className={`flex items-center gap-4 px-6 py-4 rounded-3xl ${
          isMobile ? 'overflow-x-auto overflow-y-hidden' : 'overflow-visible'
        }`}
        style={{
          background: themeConfig.dock.background,
          border: `1px solid ${themeConfig.dock.border}`,
          backdropFilter: themeConfig.dock.backdropBlur,
          WebkitBackdropFilter: themeConfig.dock.backdropBlur,
          boxShadow: themeConfig.dock.shadow,
          scrollSnapType: isMobile ? 'x mandatory' : 'none',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onPointerMove={handlePointerMove}
      >
        <style>{`
          ${scrollRef.current ? scrollRef.current.constructor.name : ''}::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {launcherApps.map((appId, index) => {
          const appInfo = getAppInfo(appId);
          if (!appInfo) return null;

          const isDragging = draggedIndex === index;
          const dragStyle = isDragging && isEditMode
            ? { x: dragOffset, scale: 1.1, zIndex: 100 }
            : { x: 0, scale: 1, zIndex: 1 };

          return (
            <motion.div
              key={`${appId}-${index}`}
              style={{
                scrollSnapAlign: isMobile ? 'center' : 'none',
                ...dragStyle,
              }}
              animate={dragStyle}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onPointerDown={(e) => handlePointerDown(index, e)}
              onPointerUp={() => handlePointerUp(index)}
            >
              <div className={isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}>
                <AppIcon
                  icon={<span>{appInfo.icon}</span>}
                  label={appInfo.label}
                  onClick={() => {
                    if (!isEditMode) {
                      openApp(appId);
                    }
                  }}
                />
              </div>
            </motion.div>
          );
        })}

        {isEditMode && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => {
              setIsEditMode(false);
              setDraggedIndex(null);
            }}
            className="ml-4 px-3 py-1.5 text-xs text-abyss-cyan border border-abyss-cyan/30 rounded-lg hover:bg-abyss-cyan/10"
          >
            Done
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

