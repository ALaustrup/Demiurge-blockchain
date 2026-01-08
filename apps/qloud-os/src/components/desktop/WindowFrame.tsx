import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { useDesktopStore } from '../../state/desktopStore';
import { useMusicPlayerStore } from '../../state/musicPlayerStore';

interface WindowFrameProps {
  id: string;
  title: string;
  children: ReactNode;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const RESIZE_HANDLE_SIZE = 8;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;

export function WindowFrame({ id, title, children, x = 100, y = 100, width = 800, height = 600 }: WindowFrameProps) {
  const [position, setPosition] = useState({ x, y });
  const [size, setSize] = useState({ width, height });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef<HTMLDivElement>(null);
  
  const { 
    closeWindow, 
    focusWindow, 
    activeWindowId, 
    openWindows,
    minimizeWindow,
    maximizeWindow,
    restoreWindow,
    updateWindowSize,
    updateWindowPosition,
  } = useDesktopStore();
  const { currentTrack, isPlaying, setBackgroundMode } = useMusicPlayerStore();
  
  const windowInfo = openWindows.find(w => w.id === id);
  const isActive = activeWindowId === id;
  const isMinimized = windowInfo?.isMinimized || false;
  const isMaximized = windowInfo?.isMaximized || false;
  const isNeonPlayer = windowInfo?.appId === 'neonPlayer';

  // Sync with store
  useEffect(() => {
    if (windowInfo) {
      if (windowInfo.isMaximized) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight - 32; // Account for status bar
        setSize({ width: screenWidth, height: screenHeight });
        setPosition({ x: 0, y: 0 });
      } else if (windowInfo.originalSize) {
        setSize({ width: windowInfo.originalSize.width, height: windowInfo.originalSize.height });
        setPosition({ x: windowInfo.originalSize.x, y: windowInfo.originalSize.y });
      } else {
        if (windowInfo.width) setSize(prev => ({ ...prev, width: windowInfo.width! }));
        if (windowInfo.height) setSize(prev => ({ ...prev, height: windowInfo.height! }));
        if (windowInfo.x !== undefined) setPosition(prev => ({ ...prev, x: windowInfo.x! }));
        if (windowInfo.y !== undefined) setPosition(prev => ({ ...prev, y: windowInfo.y! }));
      }
    }
  }, [windowInfo?.isMaximized, windowInfo?.isMinimized, windowInfo?.x, windowInfo?.y, windowInfo?.width, windowInfo?.height]);

  const handleClose = () => {
    if (isNeonPlayer && currentTrack && isPlaying) {
      setBackgroundMode(true);
    }
    closeWindow(id);
  };

  const handleMinimize = () => {
    minimizeWindow(id);
  };

  const handleMaximize = () => {
    if (isMaximized) {
      restoreWindow(id);
    } else {
      maximizeWindow(id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) {
      return;
    }
    if (isResizing) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    focusWindow(id);
  };

  const handleResizeStart = (edge: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(edge);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
    focusWindow(id);
  };

  useEffect(() => {
    if (isDragging && !isMaximized) {
      const handleMove = (e: MouseEvent) => {
        const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - size.width));
        const newY = Math.max(32, Math.min(e.clientY - dragStart.y, window.innerHeight - size.height));
        setPosition({ x: newX, y: newY });
        updateWindowPosition(id, newX, newY);
      };

      const handleUp = () => {
        setIsDragging(false);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isDragging, dragStart, isMaximized, size, id, updateWindowPosition]);

  useEffect(() => {
    if (isResizing && !isMaximized) {
      const handleMove = (e: MouseEvent) => {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = position.x;
        let newY = position.y;

        if (isResizing.includes('right')) {
          newWidth = Math.max(MIN_WIDTH, resizeStart.width + deltaX);
        }
        if (isResizing.includes('left')) {
          const widthChange = resizeStart.width - Math.max(MIN_WIDTH, resizeStart.width - deltaX);
          newWidth = Math.max(MIN_WIDTH, resizeStart.width - deltaX);
          newX = position.x + (resizeStart.width - newWidth);
        }
        if (isResizing.includes('bottom')) {
          newHeight = Math.max(MIN_HEIGHT, resizeStart.height + deltaY);
        }
        if (isResizing.includes('top')) {
          const heightChange = resizeStart.height - Math.max(MIN_HEIGHT, resizeStart.height - deltaY);
          newHeight = Math.max(MIN_HEIGHT, resizeStart.height - deltaY);
          newY = position.y + (resizeStart.height - newHeight);
        }

        // Constrain to screen bounds
        if (newX < 0) {
          newWidth += newX;
          newX = 0;
        }
        if (newY < 32) {
          newHeight += (newY - 32);
          newY = 32;
        }
        if (newX + newWidth > window.innerWidth) {
          newWidth = window.innerWidth - newX;
        }
        if (newY + newHeight > window.innerHeight) {
          newHeight = window.innerHeight - newY;
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
        updateWindowSize(id, newWidth, newHeight);
        updateWindowPosition(id, newX, newY);
      };

      const handleUp = () => {
        setIsResizing(null);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isResizing, resizeStart, position, isMaximized, id, updateWindowSize, updateWindowPosition]);

  if (isMinimized) {
    return null; // Hide minimized windows
  }

  return (
    <motion.div
      ref={windowRef}
      className={`absolute bg-abyss-navy/90 backdrop-blur-md border rounded-2xl shadow-2xl ${
        isActive ? 'border-genesis-border-default' : 'border-genesis-border-default/30'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: isActive ? 100 : 10,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => focusWindow(id)}
    >
      {/* Resize handles */}
      {!isMaximized && (
        <>
          {/* Top edge */}
          <div
            className="absolute top-0 left-0 right-0 cursor-ns-resize"
            style={{ height: `${RESIZE_HANDLE_SIZE}px` }}
            onMouseDown={handleResizeStart('top')}
          />
          {/* Bottom edge */}
          <div
            className="absolute bottom-0 left-0 right-0 cursor-ns-resize"
            style={{ height: `${RESIZE_HANDLE_SIZE}px` }}
            onMouseDown={handleResizeStart('bottom')}
          />
          {/* Left edge */}
          <div
            className="absolute top-0 bottom-0 left-0 cursor-ew-resize"
            style={{ width: `${RESIZE_HANDLE_SIZE}px` }}
            onMouseDown={handleResizeStart('left')}
          />
          {/* Right edge */}
          <div
            className="absolute top-0 bottom-0 right-0 cursor-ew-resize"
            style={{ width: `${RESIZE_HANDLE_SIZE}px` }}
            onMouseDown={handleResizeStart('right')}
          />
          {/* Corners */}
          <div
            className="absolute top-0 left-0 cursor-nwse-resize"
            style={{ width: `${RESIZE_HANDLE_SIZE}px`, height: `${RESIZE_HANDLE_SIZE}px` }}
            onMouseDown={handleResizeStart('top-left')}
          />
          <div
            className="absolute top-0 right-0 cursor-nesw-resize"
            style={{ width: `${RESIZE_HANDLE_SIZE}px`, height: `${RESIZE_HANDLE_SIZE}px` }}
            onMouseDown={handleResizeStart('top-right')}
          />
          <div
            className="absolute bottom-0 left-0 cursor-nesw-resize"
            style={{ width: `${RESIZE_HANDLE_SIZE}px`, height: `${RESIZE_HANDLE_SIZE}px` }}
            onMouseDown={handleResizeStart('bottom-left')}
          />
          <div
            className="absolute bottom-0 right-0 cursor-nwse-resize"
            style={{ width: `${RESIZE_HANDLE_SIZE}px`, height: `${RESIZE_HANDLE_SIZE}px` }}
            onMouseDown={handleResizeStart('bottom-right')}
          />
        </>
      )}

      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-genesis-glass-light/50 border-b border-genesis-border-default/20 rounded-t-2xl cursor-move"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-sm font-medium text-genesis-cipher-cyan">{title}</h3>
        <div className="flex items-center gap-2">
          {/* Minimize button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMinimize();
            }}
            className="w-6 h-6 rounded bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 text-xs flex items-center justify-center transition-colors"
            title="Minimize"
          >
            −
          </button>
          {/* Maximize/Fullscreen button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMaximize();
            }}
            className="w-6 h-6 rounded bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 text-xs flex items-center justify-center transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? '⤓' : '□'}
          </button>
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs flex items-center justify-center transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 h-[calc(100%-40px)] overflow-auto">{children}</div>
    </motion.div>
  );
}
