/**
 * 💀 Ascension Console
 * 
 * PHASE OMEGA PART III: Operator console for the self-governing Demiurge
 */

import React from 'react';
import { SelfModelView } from './SelfModelView';
import { IntentionStackView } from './IntentionStackView';
import { EvolutionKernelView } from './EvolutionKernelView';
import { ImprovementLogView } from './ImprovementLogView';
import { ForecastingView } from './ForecastingView';
import { SpiritCollectiveView } from './SpiritCollectiveView';
import { SentinelStatusView } from './SentinelStatusView';

export const AscensionConsole: React.FC = () => {
  return (
    <div className="ascension-console h-full w-full bg-black text-white p-4 overflow-auto">
      <div className="header mb-4">
        <h1 className="text-3xl font-bold text-cyan-400">💀 ASCENSION CONSOLE</h1>
        <p className="text-gray-400">PHASE OMEGA PART III: Self-Governing Sovereign Computation</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <SelfModelView />
        </div>
        
        <div>
          <IntentionStackView />
        </div>
        
        <div>
          <EvolutionKernelView />
        </div>
        
        <div className="col-span-2">
          <ImprovementLogView />
        </div>
        
        <div>
          <ForecastingView />
        </div>
        
        <div>
          <SpiritCollectiveView />
        </div>
        
        <div className="col-span-2">
          <SentinelStatusView />
        </div>
      </div>
    </div>
  );
};
