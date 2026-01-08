/**
 * NEON Equalizer Component
 * 
 * 10-band graphic equalizer with presets
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNeonStore } from './useNeonStore';
import { EQ_PRESETS } from './types';

// ============================================================================
// EQ Band Slider
// ============================================================================

interface EQBandProps {
  id: string;
  frequency: number;
  gain: number;
  onChange: (gain: number) => void;
  disabled?: boolean;
}

function EQBand({ id, frequency, gain, onChange, disabled }: EQBandProps) {
  const formatFrequency = (freq: number) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(freq >= 10000 ? 0 : 1)}k`;
    }
    return freq.toString();
  };
  
  const percentage = ((gain + 12) / 24) * 100;
  
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Gain value */}
      <span className="text-xs text-genesis-text-tertiary w-10 text-center">
        {gain > 0 ? '+' : ''}{gain.toFixed(1)}
      </span>
      
      {/* Slider track */}
      <div className="relative h-32 w-6 flex items-center justify-center">
        {/* Track background */}
        <div className="absolute h-full w-1 bg-genesis-glass-light rounded-full">
          {/* Fill */}
          <motion.div
            className="absolute bottom-1/2 left-0 w-full bg-gradient-to-t from-abyss-cyan to-abyss-cyan/50 rounded-full"
            style={{ height: `${Math.abs(percentage - 50)}%` }}
            animate={{ 
              top: percentage < 50 ? '50%' : undefined,
              bottom: percentage >= 50 ? '50%' : undefined,
            }}
          />
        </div>
        
        {/* Center line */}
        <div className="absolute w-3 h-0.5 bg-gray-600" style={{ top: '50%' }} />
        
        {/* Slider thumb */}
        <input
          type="range"
          min={-12}
          max={12}
          step={0.5}
          value={gain}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="absolute h-32 w-6 appearance-none bg-transparent cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-abyss-cyan
                   [&::-webkit-slider-thumb]:border-2
                   [&::-webkit-slider-thumb]:border-white
                   [&::-webkit-slider-thumb]:cursor-grab
                   [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,212,255,0.5)]
                   [&::-webkit-slider-runnable-track]:w-1
                   [&::-webkit-slider-runnable-track]:h-full
                   [&::-webkit-slider-runnable-track]:bg-transparent
                   disabled:opacity-50"
          style={{
            writingMode: 'vertical-lr' as never,
            direction: 'rtl',
          }}
        />
      </div>
      
      {/* Frequency label */}
      <span className="text-xs text-gray-500">{formatFrequency(frequency)}</span>
    </div>
  );
}

// ============================================================================
// Preset Button
// ============================================================================

interface PresetButtonProps {
  preset: typeof EQ_PRESETS[number];
  isActive: boolean;
  onClick: () => void;
}

function PresetButton({ preset, isActive, onClick }: PresetButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-2 rounded-lg text-sm font-medium transition-all
        ${isActive 
          ? 'bg-abyss-cyan text-abyss-dark' 
          : 'bg-genesis-glass-light/60 text-genesis-text-tertiary hover:text-white hover:bg-genesis-glass-light'
        }
      `}
    >
      <span className="mr-1.5">{preset.icon}</span>
      {preset.name}
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface NeonEqualizerProps {
  onClose?: () => void;
}

export function NeonEqualizer({ onClose }: NeonEqualizerProps) {
  const {
    equalizerEnabled,
    equalizerBands,
    currentPreset,
    toggleEqualizer,
    setEqualizerBand,
    setEqualizerPreset,
    resetEqualizer,
  } = useNeonStore();
  
  const handleBandChange = useCallback((bandId: string, gain: number) => {
    setEqualizerBand(bandId, gain);
  }, [setEqualizerBand]);
  
  return (
    <div className="bg-abyss-navy/90 border border-genesis-border-default/30 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-white">Equalizer</h3>
          
          {/* Enable toggle */}
          <button
            onClick={toggleEqualizer}
            className={`
              relative w-12 h-6 rounded-full transition-colors
              ${equalizerEnabled ? 'bg-abyss-cyan' : 'bg-gray-600'}
            `}
          >
            <motion.div
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
              animate={{ left: equalizerEnabled ? 'calc(100% - 1.25rem)' : '0.25rem' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
          
          <span className="text-xs text-gray-500">
            {equalizerEnabled ? 'On' : 'Off'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={resetEqualizer}
            className="px-3 py-1 text-xs text-genesis-text-tertiary hover:text-white"
          >
            Reset
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-genesis-text-tertiary hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {EQ_PRESETS.map(preset => (
          <PresetButton
            key={preset.id}
            preset={preset}
            isActive={currentPreset === preset.id}
            onClick={() => setEqualizerPreset(preset.id)}
          />
        ))}
      </div>
      
      {/* EQ Bands */}
      <div className="flex justify-between px-4">
        {equalizerBands.map(band => (
          <EQBand
            key={band.id}
            id={band.id}
            frequency={band.frequency}
            gain={band.gain}
            onChange={(gain) => handleBandChange(band.id, gain)}
            disabled={!equalizerEnabled}
          />
        ))}
      </div>
      
      {/* Scale labels */}
      <div className="flex justify-between px-2 mt-4 text-xs text-gray-600">
        <span>Bass</span>
        <span>Mid</span>
        <span>Treble</span>
      </div>
      
      {/* dB scale */}
      <div className="flex justify-center gap-8 mt-2 text-xs text-gray-600">
        <span>+12dB</span>
        <span>0dB</span>
        <span>-12dB</span>
      </div>
    </div>
  );
}

// ============================================================================
// Compact Equalizer (for inline display)
// ============================================================================

export function NeonEqualizerCompact() {
  const { equalizerEnabled, equalizerBands, toggleEqualizer } = useNeonStore();
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleEqualizer}
        className={`
          px-2 py-1 rounded text-xs font-medium transition-colors
          ${equalizerEnabled 
            ? 'bg-abyss-cyan text-abyss-dark' 
            : 'bg-genesis-glass-light/60 text-genesis-text-tertiary'
          }
        `}
      >
        EQ
      </button>
      
      {/* Mini visualization */}
      <div className="flex items-end gap-0.5 h-4">
        {equalizerBands.slice(0, 10).map((band, i) => (
          <div
            key={band.id}
            className="w-1 bg-abyss-cyan/60 rounded-t"
            style={{
              height: `${((band.gain + 12) / 24) * 100}%`,
              opacity: equalizerEnabled ? 1 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
