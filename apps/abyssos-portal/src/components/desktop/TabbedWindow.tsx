/**
 * Tabbed Window System
 * 
 * Vertically descending angled tabs that allow users to:
 * - Create new tabs
 * - Stick modules/web pages into blank tab slots
 * - Organize content easily
 * - Ancient/futuristic cyber aesthetic
 */

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  content: ReactNode;
  closable?: boolean;
}

interface TabbedWindowProps {
  tabs: Tab[];
  onTabsChange?: (tabs: Tab[]) => void;
  defaultTab?: string;
  className?: string;
}

export function TabbedWindow({ tabs, onTabsChange, defaultTab, className = '' }: TabbedWindowProps) {
  const [activeTabId, setActiveTabId] = useState<string>(defaultTab || tabs[0]?.id || '');
  const [tabsState, setTabsState] = useState<Tab[]>(tabs);

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const handleTabClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabsState.filter(t => t.id !== tabId);
    setTabsState(newTabs);
    if (onTabsChange) {
      onTabsChange(newTabs);
    }
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const handleAddTab = () => {
    // Create a new blank tab
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      label: 'New Tab',
      content: (
        <div className="h-full flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Blank Tab Slot</p>
            <p className="text-sm text-gray-500 mb-6">
              Drag and drop a module or web page here to add content
            </p>
            <button
              className="px-4 py-2 rounded-lg bg-abyss-cyan/20 hover:bg-abyss-cyan/30 text-abyss-cyan border border-abyss-cyan/30 transition-colors"
              onClick={() => {
                // TODO: Open module/web page selector
                console.log('Open content selector');
              }}
            >
              Add Content
            </button>
          </div>
        </div>
      ),
      closable: true,
    };
    const newTabs = [...tabsState, newTab];
    setTabsState(newTabs);
    setActiveTabId(newTab.id);
    if (onTabsChange) {
      onTabsChange(newTabs);
    }
  };

  const activeTab = tabsState.find(t => t.id === activeTabId) || tabsState[0];

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Tab Bar - Vertically descending angled tabs */}
      <div className="flex items-end gap-1 px-2 pt-2 border-b border-abyss-cyan/20 bg-abyss-dark/50 overflow-x-auto">
        {tabsState.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const isLast = index === tabsState.length - 1;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-t-lg border border-b-0 transition-all group"
              style={{
                background: isActive
                  ? `
                    linear-gradient(135deg,
                      rgba(0, 255, 255, 0.15) 0%,
                      rgba(138, 43, 226, 0.1) 100%
                    )
                  `
                  : `
                    linear-gradient(135deg,
                      rgba(0, 0, 0, 0.4) 0%,
                      rgba(10, 5, 30, 0.3) 100%
                    )
                  `,
                borderColor: isActive ? 'rgba(0, 255, 255, 0.4)' : 'rgba(0, 255, 255, 0.1)',
                transform: 'perspective(500px) rotateX(5deg)',
                transformOrigin: 'bottom',
                marginBottom: isActive ? '-1px' : '0',
                zIndex: isActive ? 10 : 1,
                boxShadow: isActive
                  ? '0 -4px 12px rgba(0, 255, 255, 0.2), inset 0 1px 0 rgba(0, 255, 255, 0.1)'
                  : '0 -2px 8px rgba(0, 0, 0, 0.3)',
              }}
              whileHover={{
                scale: 1.05,
                y: -2,
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Ancient geometric pattern overlay */}
              <div
                className="absolute inset-0 rounded-t-lg opacity-20"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(45deg,
                      transparent,
                      transparent 2px,
                      rgba(0, 255, 255, 0.1) 2px,
                      rgba(0, 255, 255, 0.1) 4px
                    )
                  `,
                }}
              />

              {/* Icon */}
              {tab.icon && (
                <span className="text-sm relative z-10">{tab.icon}</span>
              )}

              {/* Label */}
              <span
                className={`text-sm font-medium relative z-10 ${
                  isActive ? 'text-abyss-cyan' : 'text-gray-300 group-hover:text-abyss-cyan'
                }`}
              >
                {tab.label}
              </span>

              {/* Close button */}
              {tab.closable && (
                <button
                  onClick={(e) => handleTabClose(tab.id, e)}
                  className="w-4 h-4 rounded-full bg-abyss-dark/50 hover:bg-red-500/30 text-gray-400 hover:text-red-400 flex items-center justify-center text-xs transition-colors relative z-10 opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              )}

              {/* Active indicator glow */}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.8), transparent)',
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              )}
            </motion.button>
          );
        })}

        {/* Add Tab Button */}
        <button
          onClick={handleAddTab}
          className="w-8 h-8 rounded-t-lg border border-abyss-cyan/20 hover:border-abyss-cyan/50 hover:bg-abyss-cyan/10 hover:shadow-[0_0_8px_rgba(0,255,255,0.3)] text-abyss-cyan flex items-center justify-center text-lg transition-all mb-0.5 bg-abyss-dark/50"
          title="Add new tab"
        >
          +
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab && (
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-auto"
              style={{
                background: `
                  linear-gradient(135deg,
                    rgba(0, 0, 20, 0.6) 0%,
                    rgba(10, 5, 30, 0.4) 100%
                  )
                `,
              }}
            >
              {activeTab.content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

