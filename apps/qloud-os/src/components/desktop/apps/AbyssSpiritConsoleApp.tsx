/**
 * Abyss Spirit Console Application
 * 
 * Interface for managing resident AI agents
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { spiritManager } from '../../../services/spirits/spiritManager';
import { spiritMemory } from '../../../services/spirits/spiritMemory';
import { PERSONALITY_TEMPLATES } from '../../../services/spirits/personality';
import type { AbyssSpirit, SpiritPersonality, SpiritTask } from '../../../services/spirits/spiritTypes';
import { Button } from '../../shared/Button';

export function AbyssSpiritConsoleApp() {
  const [spirits, setSpirits] = useState<AbyssSpirit[]>([]);
  const [selectedSpirit, setSelectedSpirit] = useState<AbyssSpirit | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSpiritName, setNewSpiritName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('assistant');
  const [memories, setMemories] = useState<any[]>([]);
  const [tasks, setTasks] = useState<SpiritTask[]>([]);
  
  useEffect(() => {
    const updateSpirits = () => {
      setSpirits(spiritManager.getAllSpirits());
    };
    
    updateSpirits();
    const unsubscribe = spiritManager.onSpiritsUpdate(updateSpirits);
    
    return unsubscribe;
  }, []);
  
  useEffect(() => {
    if (selectedSpirit) {
      loadSpiritData(selectedSpirit.id);
    }
  }, [selectedSpirit]);
  
  const loadSpiritData = async (spiritId: string) => {
    const mems = await spiritMemory.loadMemories(spiritId);
    setMemories(mems);
    
    const spirit = spiritManager.getSpirit(spiritId);
    if (spirit) {
      setTasks(spirit.tasks);
    }
  };
  
  const handleCreateSpirit = async () => {
    if (!newSpiritName.trim()) {
      alert('Please enter a spirit name');
      return;
    }
    
    const template = PERSONALITY_TEMPLATES[selectedTemplate];
    if (!template) {
      alert('Invalid template');
      return;
    }
    
    const personality: SpiritPersonality = {
      ...template,
      name: newSpiritName.trim(),
    };
    
    const spirit = await spiritManager.createSpirit(newSpiritName.trim(), personality);
    setSelectedSpirit(spirit);
    setShowCreateModal(false);
    setNewSpiritName('');
  };
  
  const handleAddTask = async (type: SpiritTask['type'], description: string) => {
    if (!selectedSpirit) return;
    
    await spiritManager.addTask(selectedSpirit.id, {
      type,
      description,
    });
    
    loadSpiritData(selectedSpirit.id);
  };
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-6 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">Abyss Spirit Console</h2>
          <p className="text-sm text-genesis-text-tertiary">Manage resident AI agents</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Create Spirit
        </Button>
      </div>
      
      {/* Spirits List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {spirits.map((spirit) => (
          <motion.div
            key={spirit.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedSpirit(spirit)}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedSpirit?.id === spirit.id
                ? 'bg-abyss-cyan/10 border-genesis-border-default'
                : 'bg-genesis-glass-light/50 border-genesis-border-default/20 hover:border-genesis-border-default/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-genesis-cipher-cyan">{spirit.name}</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                spirit.status === 'active' ? 'bg-green-400/20 text-green-400' :
                spirit.status === 'sleeping' ? 'bg-yellow-400/20 text-yellow-400' :
                'bg-gray-400/20 text-genesis-text-tertiary'
              }`}>
                {spirit.status}
              </span>
            </div>
            <p className="text-sm text-genesis-text-tertiary mb-2">{spirit.personality.description}</p>
            <div className="flex flex-wrap gap-2">
              {spirit.personality.traits.slice(0, 3).map(trait => (
                <span key={trait} className="text-xs px-2 py-0.5 bg-abyss-purple/20 text-abyss-purple border border-abyss-purple/30 rounded">
                  {trait}
                </span>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {spirit.tasks.length} tasks • {spirit.memory.length} memories
            </div>
          </motion.div>
        ))}
        
        {spirits.length === 0 && (
          <div className="col-span-2 text-center py-12 text-genesis-text-tertiary">
            <div className="text-4xl mb-4">👻</div>
            <div>No spirits created yet</div>
            <Button onClick={() => setShowCreateModal(true)} className="mt-4">
              Create Your First Spirit
            </Button>
          </div>
        )}
      </div>
      
      {/* Selected Spirit Details */}
      {selectedSpirit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-genesis-cipher-cyan">{selectedSpirit.name}</h3>
            <button
              onClick={() => setSelectedSpirit(null)}
              className="text-genesis-text-tertiary hover:text-white"
            >
              ✕
            </button>
          </div>
          
          {/* Personality */}
          <div>
            <h4 className="text-sm font-bold text-genesis-text-tertiary mb-2">Personality</h4>
            <p className="text-sm text-genesis-text-secondary mb-2">{selectedSpirit.personality.description}</p>
            <div className="flex flex-wrap gap-2">
              <div>
                <span className="text-xs text-genesis-text-tertiary">Traits: </span>
                {selectedSpirit.personality.traits.map(trait => (
                  <span key={trait} className="text-xs px-2 py-0.5 bg-abyss-purple/20 text-abyss-purple border border-abyss-purple/30 rounded mr-1">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-genesis-text-tertiary">Tasks</h4>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-xs bg-genesis-glass-light border border-genesis-border-default/20 rounded hover:border-genesis-border-default/50 text-genesis-cipher-cyan"
                  onClick={() => handleAddTask('index', 'Index DRC-369 assets')}
                >
                  + Index
                </button>
                <button
                  className="px-3 py-1 text-xs bg-genesis-glass-light border border-genesis-border-default/20 rounded hover:border-genesis-border-default/50 text-genesis-cipher-cyan"
                  onClick={() => handleAddTask('monitor', 'Monitor chain events')}
                >
                  + Monitor
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-40 overflow-auto">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="p-2 bg-genesis-glass-light/50 rounded text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-genesis-text-secondary">{task.description}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      task.status === 'completed' ? 'bg-green-400/20 text-green-400' :
                      task.status === 'running' ? 'bg-yellow-400/20 text-yellow-400' :
                      task.status === 'failed' ? 'bg-red-400/20 text-red-400' :
                      'bg-gray-400/20 text-genesis-text-tertiary'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">No tasks yet</div>
              )}
            </div>
          </div>
          
          {/* Memories */}
          <div>
            <h4 className="text-sm font-bold text-genesis-text-tertiary mb-2">Recent Memories</h4>
            <div className="space-y-2 max-h-40 overflow-auto">
              {memories.slice(0, 5).map(memory => (
                <div key={memory.id} className="p-2 bg-genesis-glass-light/50 rounded text-sm">
                  <div className="text-genesis-text-secondary">{memory.content}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(memory.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
              {memories.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">No memories yet</div>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-abyss-navy border border-genesis-border-default/20 rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-genesis-cipher-cyan mb-4">Create New Spirit</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-genesis-text-tertiary mb-2">Name</label>
                <input
                  type="text"
                  value={newSpiritName}
                  onChange={(e) => setNewSpiritName(e.target.value)}
                  className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/20 rounded text-white"
                  placeholder="Enter spirit name"
                />
              </div>
              
              <div>
                <label className="block text-sm text-genesis-text-tertiary mb-2">Personality Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/20 rounded text-white"
                >
                  {Object.entries(PERSONALITY_TEMPLATES).map(([key, template]) => (
                    <option key={key} value={key}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleCreateSpirit} className="flex-1">
                  Create
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewSpiritName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

