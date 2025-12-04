import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';
import { useDesktopStore } from '../../state/desktopStore';

interface WindowFrameProps {
  id: string;
  title: string;
  children: ReactNode;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export function WindowFrame({ id, title, children, x = 100, y = 100, width = 800, height = 600 }: WindowFrameProps) {
  const [position, setPosition] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { closeWindow, focusWindow, activeWindowId } = useDesktopStore();
  const isActive = activeWindowId === id;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    focusWindow(id);
  };


  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: MouseEvent) => {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
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
  }, [isDragging, dragStart]);

  return (
    <motion.div
      className={`absolute bg-abyss-navy/90 backdrop-blur-md border rounded-2xl shadow-2xl ${
        isActive ? 'border-abyss-cyan' : 'border-abyss-cyan/30'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width,
        height,
        zIndex: isActive ? 100 : 10,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => focusWindow(id)}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-abyss-dark/50 border-b border-abyss-cyan/20 rounded-t-2xl cursor-move"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-sm font-medium text-abyss-cyan">{title}</h3>
        <button
          onClick={() => closeWindow(id)}
          className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs flex items-center justify-center transition-colors"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-4 h-[calc(100%-40px)] overflow-auto">{children}</div>
    </motion.div>
  );
}

