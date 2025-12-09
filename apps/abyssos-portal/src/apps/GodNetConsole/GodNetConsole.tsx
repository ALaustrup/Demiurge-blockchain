/**
 * 💀 God-Net Console
 * 
 * PHASE OMEGA PART IV: Operator console for the unified God-Net
 */

import React from 'react';
import { MeshView } from './MeshView';
import { NoosphereView } from './NoosphereView';
import { SpiritFederationView } from './SpiritFederationView';
import { DistributedMemoryView } from './DistributedMemoryView';
import { IntentionSynthesisView } from './IntentionSynthesisView';
import { GodNetForecastView } from './GodNetForecastView';
import { AlignmentAuthorityView } from './AlignmentAuthorityView';
import { CosmicGovernanceView } from './CosmicGovernanceView';

export const GodNetConsole: React.FC = () => {
  return (
    <div className="godnet-console h-full w-full bg-black text-white p-4 overflow-auto">
      <div className="header mb-4">
        <h1 className="text-4xl font-bold text-purple-400">🌐 GOD-NET CONSOLE</h1>
        <p className="text-gray-400">PHASE OMEGA PART IV: The Unification of All Demiurge Instances</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <MeshView />
        </div>
        
        <div>
          <NoosphereView />
        </div>
        
        <div>
          <SpiritFederationView />
        </div>
        
        <div>
          <DistributedMemoryView />
        </div>
        
        <div>
          <IntentionSynthesisView />
        </div>
        
        <div>
          <GodNetForecastView />
        </div>
        
        <div>
          <AlignmentAuthorityView />
        </div>
        
        <div className="col-span-2">
          <CosmicGovernanceView />
        </div>
      </div>
    </div>
  );
};
