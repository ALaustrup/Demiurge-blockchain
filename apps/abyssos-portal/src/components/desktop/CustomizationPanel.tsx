/**
 * Customization Panel
 * 
 * Allows users to customize colors and toolbar widget positions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomizationStore, type ColorScheme } from '../../state/customizationStore';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomizationPanel({ isOpen, onClose }: CustomizationPanelProps) {
  const {
    colorScheme,
    useCustomColors,
    toolbarWidgets,
    setColorScheme,
    clearColorScheme,
    setUseCustomColors,
    updateToolbarWidget,
    resetToolbarWidgets,
  } = useCustomizationStore();

  const [localColors, setLocalColors] = useState<ColorScheme>(
    colorScheme || {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#00ffff',
      background: 'rgba(10, 10, 25, 0.75)',
      text: '#e4e4e7',
    }
  );
  const [activeTab, setActiveTab] = useState<'colors' | 'toolbar'>('colors');

  const handleColorChange = (key: keyof ColorScheme, value: string) => {
    const updated = { ...localColors, [key]: value };
    setLocalColors(updated);
    if (useCustomColors) {
      setColorScheme(updated);
    }
  };

  const handleApplyColors = () => {
    setColorScheme(localColors);
    setUseCustomColors(true);
  };

  const handleResetColors = () => {
    clearColorScheme();
    setLocalColors({
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#00ffff',
      background: 'rgba(10, 10, 25, 0.75)',
      text: '#e4e4e7',
    });
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const widget = toolbarWidgets.find(w => w.id === id);
    if (!widget) return;

    const currentIndex = toolbarWidgets.findIndex(w => w.id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= toolbarWidgets.length) return;

    // Swap orders
    const otherWidget = toolbarWidgets[newIndex];
    updateToolbarWidget(id, { order: otherWidget.order });
    updateToolbarWidget(otherWidget.id, { order: widget.order });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-abyss-cyan">Customization</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setActiveTab('colors')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'colors'
                      ? 'bg-abyss-cyan/20 text-abyss-cyan'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Colors
                </button>
                <button
                  onClick={() => setActiveTab('toolbar')}
                  className={`px-4 py-2 rounded ${
                    activeTab === 'toolbar'
                      ? 'bg-abyss-cyan/20 text-abyss-cyan'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Toolbar
                </button>
              </div>

              {/* Colors Tab */}
              {activeTab === 'colors' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300">Use Custom Colors</label>
                    <input
                      type="checkbox"
                      checked={useCustomColors}
                      onChange={(e) => setUseCustomColors(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  {useCustomColors && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Primary Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={localColors.primary}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            className="w-16 h-10 rounded"
                          />
                          <input
                            type="text"
                            value={localColors.primary}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            className="flex-1 px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Secondary Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={localColors.secondary}
                            onChange={(e) => handleColorChange('secondary', e.target.value)}
                            className="w-16 h-10 rounded"
                          />
                          <input
                            type="text"
                            value={localColors.secondary}
                            onChange={(e) => handleColorChange('secondary', e.target.value)}
                            className="flex-1 px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Accent Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={localColors.accent}
                            onChange={(e) => handleColorChange('accent', e.target.value)}
                            className="w-16 h-10 rounded"
                          />
                          <input
                            type="text"
                            value={localColors.accent}
                            onChange={(e) => handleColorChange('accent', e.target.value)}
                            className="flex-1 px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button onClick={handleApplyColors} className="flex-1">
                          Apply Colors
                        </Button>
                        <Button onClick={handleResetColors} variant="secondary" className="flex-1">
                          Reset
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Toolbar Tab */}
              {activeTab === 'toolbar' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400 mb-4">
                    Drag widgets to reorder. Changes apply immediately.
                  </p>
                  
                  <div className="space-y-2">
                    {toolbarWidgets
                      .sort((a, b) => a.order - b.order)
                      .map((widget, index) => (
                        <div
                          key={widget.id}
                          className="flex items-center justify-between p-3 bg-abyss-dark border border-abyss-cyan/30 rounded"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-400 w-6">{index + 1}</span>
                            <span className="text-gray-300 capitalize">
                              {widget.id.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => moveWidget(widget.id, 'up')}
                              disabled={index === 0}
                              className="px-2 py-1 text-xs bg-abyss-cyan/20 hover:bg-abyss-cyan/40 rounded disabled:opacity-50"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveWidget(widget.id, 'down')}
                              disabled={index === toolbarWidgets.length - 1}
                              className="px-2 py-1 text-xs bg-abyss-cyan/20 hover:bg-abyss-cyan/40 rounded disabled:opacity-50"
                            >
                              ↓
                            </button>
                            <input
                              type="checkbox"
                              checked={widget.visible}
                              onChange={(e) =>
                                updateToolbarWidget(widget.id, { visible: e.target.checked })
                              }
                              className="ml-2"
                            />
                          </div>
                        </div>
                      ))}
                  </div>

                  <Button onClick={resetToolbarWidgets} variant="secondary" className="w-full">
                    Reset Toolbar
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

