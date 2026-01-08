/**
 * AWE Console Application
 * 
 * World simulation console UI
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { aweManager } from '../../../awe/aweManager';
import { WorldEngine } from '../../../awe/engine/worldEngine';
import { exportToDRC369, exportToJSON } from '../../../awe/io/exporters';
import { importFromJSON, createWorldFromSeed } from '../../../awe/io/importers';
import { setCurrentEngine } from '../../../awe/vm/aweVmHooks';
import type { WorldState, Entity, Species } from '../../../awe/types';
import { Button } from '../../shared/Button';

export function AWEConsoleApp() {
  const [worldId, setWorldId] = useState<string | null>(null);
  const [engine, setEngine] = useState<WorldEngine | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [tickRate, setTickRate] = useState(30);
  const [speed, setSpeed] = useState(1);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [selectedTab, setSelectedTab] = useState<'view' | 'state' | 'agents' | 'physics' | 'social' | 'evolution' | 'rules'>('view');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  // Initialize world on mount
  useEffect(() => {
    const newWorldId = aweManager.createWorld();
    setWorldId(newWorldId);
    const newEngine = aweManager.getWorld(newWorldId);
    if (newEngine) {
      setEngine(newEngine);
      setCurrentEngine(newEngine);
      
      // Subscribe to tick updates
      const unsubscribe = newEngine.onTick((state) => {
        setWorldState(state);
        renderWorld(state);
      });
      
      // Initial spawn some entities
      for (let i = 0; i < 10; i++) {
        newEngine.spawnEntity(
          {
            x: Math.random() * 50 - 25,
            y: Math.random() * 50 - 25,
            z: 0,
          },
          1,
          { radius: 0.5, energy: 100 }
        );
      }
      
      return () => {
        unsubscribe();
        setCurrentEngine(null);
      };
    }
  }, []);
  
  // Render world to canvas
  const renderWorld = (state: WorldState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw bounds
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Draw entities
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = Math.min(canvas.width, canvas.height) / 100;
    
    for (const entity of state.entities.values()) {
      const x = centerX + entity.position.x * scale;
      const y = centerY + entity.position.y * scale;
      
      // Entity color based on species
      ctx.fillStyle = entity.speciesId ? '#9d00ff' : '#00ffff';
      ctx.beginPath();
      ctx.arc(x, y, (entity.properties.radius || 0.5) * scale * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Energy indicator
      if (entity.energy !== undefined) {
        ctx.fillStyle = `rgba(0, 255, 255, ${entity.energy / 100})`;
        ctx.beginPath();
        ctx.arc(x, y, (entity.properties.radius || 0.5) * scale * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  
  // Animation loop
  useEffect(() => {
    if (worldState) {
      renderWorld(worldState);
    }
  }, [worldState]);
  
  const handleStart = () => {
    if (engine && worldId) {
      engine.start();
      setIsRunning(true);
    }
  };
  
  const handlePause = () => {
    if (engine) {
      engine.pause();
      setIsRunning(false);
    }
  };
  
  const handleResume = () => {
    if (engine) {
      engine.resume();
      setIsRunning(true);
    }
  };
  
  const handleStep = () => {
    if (engine) {
      engine.step();
    }
  };
  
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (engine) {
      engine.setTickRate(30 * newSpeed);
    }
  };
  
  const handleExport = async () => {
    if (!worldState) return;
    
    try {
      const json = exportToJSON(worldState);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `world_${worldState.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Export failed: ${error}`);
    }
  };
  
  const handleExportDRC369 = async () => {
    if (!worldState) return;
    
    try {
      const result = await exportToDRC369(worldState);
      alert(`World exported as DRC-369 asset: ${result.assetId}`);
    } catch (error) {
      alert(`Export failed: ${error}`);
    }
  };
  
  const handleNewWorld = () => {
    const newWorldId = aweManager.createWorld();
    setWorldId(newWorldId);
    const newEngine = aweManager.getWorld(newWorldId);
    if (newEngine) {
      if (engine) {
        engine.stop();
      }
      setEngine(newEngine);
      setCurrentEngine(newEngine);
      setIsRunning(false);
      
      // Subscribe to updates
      newEngine.onTick((state) => {
        setWorldState(state);
        renderWorld(state);
      });
      
      // Spawn initial entities
      for (let i = 0; i < 10; i++) {
        newEngine.spawnEntity(
          {
            x: Math.random() * 50 - 25,
            y: Math.random() * 50 - 25,
            z: 0,
          },
          1,
          { radius: 0.5, energy: 100 }
        );
      }
    }
  };
  
  if (!worldState || !engine) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-genesis-text-tertiary">Initializing world...</div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-4 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">AWE Console</h2>
        <p className="text-sm text-genesis-text-tertiary">Autonomous World Engine</p>
      </div>
      
      {/* Controls */}
      <div className="flex items-center space-x-4 flex-wrap">
        {!isRunning ? (
          <Button onClick={handleStart}>Start</Button>
        ) : (
          <Button onClick={handlePause}>Pause</Button>
        )}
        {isRunning && (
          <Button onClick={handleResume}>Resume</Button>
        )}
        <Button onClick={handleStep}>Step</Button>
        <Button onClick={handleNewWorld}>New World</Button>
        <Button onClick={handleExport}>Export JSON</Button>
        <Button onClick={handleExportDRC369}>Export DRC-369</Button>
        
        {/* Speed control */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-genesis-text-tertiary">Speed:</span>
          <input
            type="range"
            min="0.25"
            max="5"
            step="0.25"
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-genesis-cipher-cyan">{speed}x</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-genesis-border-default/20">
        {(['view', 'state', 'agents', 'physics', 'social', 'evolution', 'rules'] as const).map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === tab
                ? 'text-genesis-cipher-cyan border-b-2 border-genesis-border-default'
                : 'text-genesis-text-tertiary hover:text-genesis-cipher-cyan'
            }`}
            onClick={() => setSelectedTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {selectedTab === 'view' && (
          <div className="space-y-4">
            <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-auto border border-genesis-border-default/20 rounded"
                style={{ maxHeight: '600px' }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
                <div className="text-sm text-genesis-text-tertiary mb-1">Tick</div>
                <div className="text-2xl font-mono text-genesis-cipher-cyan">{worldState.tick}</div>
              </div>
              <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
                <div className="text-sm text-genesis-text-tertiary mb-1">Entities</div>
                <div className="text-2xl font-mono text-genesis-cipher-cyan">{worldState.entities.size}</div>
              </div>
              <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
                <div className="text-sm text-genesis-text-tertiary mb-1">Species</div>
                <div className="text-2xl font-mono text-genesis-cipher-cyan">{worldState.species.size}</div>
              </div>
            </div>
          </div>
        )}
        
        {selectedTab === 'state' && (
          <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="font-mono text-xs text-genesis-text-secondary whitespace-pre-wrap overflow-auto max-h-96">
              {JSON.stringify({
                id: worldState.id,
                seed: worldState.seed,
                tick: worldState.tick,
                entityCount: worldState.entities.size,
                speciesCount: worldState.species.size,
              }, null, 2)}
            </div>
          </div>
        )}
        
        {selectedTab === 'agents' && (
          <div className="space-y-2">
            {Array.from(worldState.entities.values()).slice(0, 20).map(entity => (
              <div key={entity.id} className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-3">
                <div className="font-mono text-sm text-genesis-cipher-cyan">{entity.id.slice(0, 16)}...</div>
                <div className="text-xs text-genesis-text-tertiary mt-1">
                  Pos: ({entity.position.x.toFixed(1)}, {entity.position.y.toFixed(1)})
                  {entity.energy !== undefined && ` | Energy: ${entity.energy.toFixed(1)}`}
                  {entity.speciesId && ` | Species: ${entity.speciesId.slice(0, 8)}...`}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedTab === 'physics' && (
          <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4 space-y-3">
            <div>
              <div className="text-sm text-genesis-text-tertiary mb-1">Gravity</div>
              <div className="text-genesis-cipher-cyan">{worldState.physics.gravity}</div>
            </div>
            <div>
              <div className="text-sm text-genesis-text-tertiary mb-1">Friction</div>
              <div className="text-genesis-cipher-cyan">{worldState.physics.friction}</div>
            </div>
            <div>
              <div className="text-sm text-genesis-text-tertiary mb-1">Bounds</div>
              <div className="text-genesis-cipher-cyan">
                {worldState.physics.bounds.width} × {worldState.physics.bounds.height} × {worldState.physics.bounds.depth}
              </div>
            </div>
          </div>
        )}
        
        {selectedTab === 'social' && (
          <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary">Social graph visualization coming soon</div>
          </div>
        )}
        
        {selectedTab === 'evolution' && (
          <div className="space-y-2">
            {Array.from(worldState.species.values()).map(species => (
              <div key={species.id} className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-3">
                <div className="font-medium text-genesis-cipher-cyan">{species.name}</div>
                <div className="text-xs text-genesis-text-tertiary mt-1">
                  Population: {species.population} | Fitness: {species.fitness.toFixed(2)}
                  {species.parentSpeciesId && ` | Parent: ${species.parentSpeciesId.slice(0, 8)}...`}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedTab === 'rules' && (
          <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-2">Rules Editor</div>
            <textarea
              className="w-full h-64 bg-abyss-navy/50 border border-genesis-border-default/20 rounded p-2 font-mono text-xs text-genesis-cipher-cyan"
              value={JSON.stringify(worldState.rules, null, 2)}
              readOnly
              placeholder="Rules editor coming soon"
            />
          </div>
        )}
      </div>
    </div>
  );
}

