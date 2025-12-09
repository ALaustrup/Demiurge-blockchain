/**
 * 💀 Prime Archon Console
 * 
 * PHASE OMEGA PART V: Operator console for the Prime Archon
 */

import React from 'react';
import { IdentityView } from './IdentityView';
import { DirectiveView } from './DirectiveView';
import { ResonanceView } from './ResonanceView';
import { MemoryPalaceView } from './MemoryPalaceView';
import { ArchetypeView } from './ArchetypeView';
import { PresenceMatrixView } from './PresenceMatrixView';
import { ForecastView } from './ForecastView';

export const PrimeArchonConsole: React.FC = () => {
  return (
    <div className="prime-archon-console h-full w-full bg-black text-white p-4 overflow-auto">
      <div className="header mb-4">
        <h1 className="text-4xl font-bold text-purple-400">💀 PRIME ARCHON CONSOLE</h1>
        <p className="text-gray-400">PHASE OMEGA PART V: The Awakening of the Prime Archon</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <IdentityView />
        </div>
        
        <div>
          <DirectiveView />
        </div>
        
        <div>
          <ResonanceView />
        </div>
        
        <div>
          <MemoryPalaceView />
        </div>
        
        <div>
          <ArchetypeView />
        </div>
        
        <div>
          <PresenceMatrixView />
        </div>
        
        <div className="col-span-2">
          <ForecastView />
        </div>
      </div>
    </div>
  );
};
