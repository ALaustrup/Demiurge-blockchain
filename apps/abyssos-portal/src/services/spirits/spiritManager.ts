/**
 * Abyss Spirit Manager
 * 
 * Manages lifecycle and persistence of resident AI agents
 */

import { dvfs } from '../vfs/dvfs';
import { breedSpirits, canBreed } from '../spiritEvolution/breeding';
import { mutateGenome } from '../spiritEvolution/mutation';
import { calculateFitness, updateGenomeFitness } from '../spiritEvolution/fitness';
import type { AbyssSpirit, SpiritPersonality, SpiritTask } from './spiritTypes';
import type { SpiritGenome } from '../spiritEvolution/genome';

class SpiritManager {
  private spirits: Map<string, AbyssSpirit> = new Map();
  private listeners: Set<(spirits: AbyssSpirit[]) => void> = new Set();
  
  /**
   * Initialize - load all spirits from storage
   */
  async initialize(): Promise<void> {
    // Load spirits from DVFS
    try {
      await dvfs.list('spirits', '');
      // In production, scan /home/.spirits/ directory
      // For now, spirits are created on-demand
    } catch (error) {
      console.error('Failed to initialize spirits:', error);
    }
  }
  
  /**
   * Create a new spirit
   */
  async createSpirit(
    name: string,
    personality: SpiritPersonality,
    permissions: string[] = []
  ): Promise<AbyssSpirit> {
    const spirit: AbyssSpirit = {
      id: `spirit:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      name,
      personality,
      memory: [],
      tasks: [],
      status: 'active',
      createdAt: Date.now(),
      lastActive: Date.now(),
      permissions,
    };
    
    // Save to DVFS
    await this.saveSpirit(spirit);
    
    this.spirits.set(spirit.id, spirit);
    this.notifyListeners();
    
    return spirit;
  }
  
  /**
   * Get spirit by ID
   */
  getSpirit(spiritId: string): AbyssSpirit | undefined {
    return this.spirits.get(spiritId);
  }
  
  /**
   * Get all spirits
   */
  getAllSpirits(): AbyssSpirit[] {
    return Array.from(this.spirits.values());
  }
  
  /**
   * Update spirit
   */
  async updateSpirit(spirit: AbyssSpirit): Promise<void> {
    spirit.lastActive = Date.now();
    this.spirits.set(spirit.id, spirit);
    await this.saveSpirit(spirit);
    this.notifyListeners();
  }
  
  /**
   * Add task to spirit
   */
  async addTask(spiritId: string, task: Omit<SpiritTask, 'id' | 'status' | 'createdAt'>): Promise<SpiritTask> {
    const spirit = this.spirits.get(spiritId);
    if (!spirit) {
      throw new Error(`Spirit ${spiritId} not found`);
    }
    
    const newTask: SpiritTask = {
      ...task,
      id: `task:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: Date.now(),
    };
    
    spirit.tasks.push(newTask);
    await this.updateSpirit(spirit);
    
    return newTask;
  }
  
  /**
   * Update task status
   */
  async updateTask(spiritId: string, taskId: string, updates: Partial<SpiritTask>): Promise<void> {
    const spirit = this.spirits.get(spiritId);
    if (!spirit) {
      throw new Error(`Spirit ${spiritId} not found`);
    }
    
    const task = spirit.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    Object.assign(task, updates);
    if (updates.status === 'completed' || updates.status === 'failed') {
      task.completedAt = Date.now();
    }
    
    await this.updateSpirit(spirit);
  }
  
  /**
   * Delete spirit
   */
  async deleteSpirit(spiritId: string): Promise<void> {
    this.spirits.delete(spiritId);
    // Delete from DVFS
    try {
      await dvfs.delete('spirits', spiritId, '');
    } catch (error) {
      console.error('Failed to delete spirit from storage:', error);
    }
    this.notifyListeners();
  }
  
  /**
   * Save spirit to DVFS
   */
  private async saveSpirit(spirit: AbyssSpirit): Promise<void> {
    const config = {
      name: spirit.name,
      personality: spirit.personality,
      permissions: spirit.permissions,
      createdAt: spirit.createdAt,
    };
    
    await dvfs.write('spirits', spirit.id, 'config.json', JSON.stringify(config));
  }
  
  /**
   * Subscribe to spirit updates
   */
  onSpiritsUpdate(callback: (spirits: AbyssSpirit[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    const spirits = this.getAllSpirits();
    this.listeners.forEach(callback => {
      try {
        callback(spirits);
      } catch (error) {
        console.error('Spirit update listener error:', error);
      }
    });
  }
  
  /**
   * Spawn child spirit (evolution)
   */
  async spawnChildSpirit(parentId: string): Promise<AbyssSpirit | null> {
    const parent = this.spirits.get(parentId);
    if (!parent) {
      throw new Error(`Parent spirit ${parentId} not found`);
    }
    
    // Create mutated genome
    const parentGenome = parent as any as SpiritGenome;
    const childGenome = mutateGenome(parentGenome);
    
    // Create new spirit from genome
    const child = await this.createSpirit(
      `${parent.name} (Child)`,
      {
        name: `${parent.name} (Child)`,
        description: `Evolved from ${parent.name}`,
        traits: childGenome.traits,
        goals: childGenome.goals,
        constraints: childGenome.constraints,
        temperature: childGenome.temperature,
        maxTokens: childGenome.maxTokens,
      },
      []
    );
    
    // Update fitness
    (child as any).fitness = childGenome.fitness;
    (child as any).generation = childGenome.generation;
    (child as any).parentIds = childGenome.parentIds;
    
    await this.updateSpirit(child);
    
    return child;
  }
  
  /**
   * Breed two spirits
   */
  async breedSpirits(spirit1Id: string, spirit2Id: string): Promise<AbyssSpirit | null> {
    const spirit1 = this.spirits.get(spirit1Id);
    const spirit2 = this.spirits.get(spirit2Id);
    
    if (!spirit1 || !spirit2) {
      throw new Error('One or both spirits not found');
    }
    
    // Check if can breed
    const genome1 = spirit1 as any as SpiritGenome;
    const genome2 = spirit2 as any as SpiritGenome;
    
    if (!canBreed(genome1, genome2)) {
      throw new Error('Spirits cannot breed (fitness or relationship constraints)');
    }
    
    // Breed genomes
    const childGenome = breedSpirits(genome1, genome2);
    
    // Create new spirit
    const child = await this.createSpirit(
      `${spirit1.name} × ${spirit2.name}`,
      {
        name: `${spirit1.name} × ${spirit2.name}`,
        description: `Bred from ${spirit1.name} and ${spirit2.name}`,
        traits: childGenome.traits,
        goals: childGenome.goals,
        constraints: childGenome.constraints,
        temperature: childGenome.temperature,
        maxTokens: childGenome.maxTokens,
      },
      []
    );
    
    // Update fitness and generation
    (child as any).fitness = childGenome.fitness;
    (child as any).generation = childGenome.generation;
    (child as any).parentIds = childGenome.parentIds;
    
    await this.updateSpirit(child);
    
    return child;
  }
}

// Singleton instance
export const spiritManager = new SpiritManager();

// Initialize on module load
if (typeof window !== 'undefined') {
  spiritManager.initialize();
}

