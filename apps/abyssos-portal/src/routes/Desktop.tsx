import React from 'react';
import { FullscreenContainer } from '../components/layout/FullscreenContainer';
import { AudioReactiveBackground } from '../components/layout/AudioReactiveBackground';
import { StatusBar } from '../components/desktop/StatusBar';
import { WindowFrame } from '../components/desktop/WindowFrame';
import { useDesktopStore } from '../state/desktopStore';
import { WalletInitializer } from '../components/WalletInitializer';
import { FileDropZone } from '../components/desktop/FileDropZone';
import { ChainOpsApp } from '../components/desktop/apps/ChainOpsApp';
import { MinerApp } from '../components/desktop/apps/MinerApp';
import { AbyssWalletApp } from '../components/desktop/apps/AbyssWalletApp';
import { AbyssBrowserApp } from '../components/desktop/apps/AbyssBrowserApp';
import { AbyssTorrentApp } from '../components/desktop/apps/AbyssTorrentApp';
import { OnChainFilesApp } from '../components/desktop/apps/OnChainFilesApp';
import { DRC369StudioApp } from '../components/desktop/apps/DRC369StudioApp';
import { BlockExplorerApp } from '../components/desktop/apps/BlockExplorerApp';
import { AbyssShellApp } from '../components/desktop/apps/AbyssShellApp';
import { AbyssRuntimeApp } from '../components/desktop/apps/AbyssRuntimeApp';
import { SystemMonitorApp } from '../components/desktop/apps/SystemMonitorApp';
import { AbyssGridMonitorApp } from '../components/desktop/apps/AbyssGridMonitorApp';
import { AbyssSpiritConsoleApp } from '../components/desktop/apps/AbyssSpiritConsoleApp';
import { CogFabricConsoleApp } from '../components/desktop/apps/CogFabricConsoleApp';
import { CogSingularityApp } from '../components/desktop/apps/CogSingularityApp';
import { GenesisConsoleApp } from '../components/desktop/apps/GenesisConsoleApp';
import { TemporalObservatoryApp } from '../components/desktop/apps/TemporalObservatoryApp';
import { AbyssDNSApp } from '../components/desktop/apps/AbyssDNSApp';
import { AWEConsoleApp } from '../components/desktop/apps/AWEConsoleApp';
import { AWEAtlasApp } from '../components/desktop/apps/AWEAtlasApp';
import { NeonPlayerApp } from '../components/desktop/apps/NeonPlayerApp';
import { NeonRadioApp } from '../components/desktop/apps/NeonRadioApp';
import { DocumentEditorApp } from '../components/desktop/apps/DocumentEditorApp';
import { VYBSocialApp } from '../components/desktop/apps/VYBSocialApp';
import { AbyssWriterApp } from '../components/desktop/apps/AbyssWriterApp';
import { AbyssCalcApp } from '../components/desktop/apps/AbyssCalcApp';
import { CraftApp } from '../components/desktop/apps/CraftApp';
import { AppMarketplaceApp } from '../components/desktop/apps/AppMarketplaceApp';
import { ArchonAIAssistantApp } from '../components/desktop/apps/ArchonAIAssistantApp';
import { MiningAccountingApp } from '../components/desktop/apps/MiningAccountingApp';

const appComponents: Record<string, React.ComponentType> = {
  chainOps: ChainOpsApp,
  miner: MinerApp,
  wallet: AbyssWalletApp,
  abyssBrowser: AbyssBrowserApp,
  abyssTorrent: AbyssTorrentApp,
  onChainFiles: OnChainFilesApp,
  drc369Studio: DRC369StudioApp,
  blockExplorer: BlockExplorerApp,
  abyssShell: AbyssShellApp,
  abyssRuntime: AbyssRuntimeApp,
  systemMonitor: SystemMonitorApp,
  abyssGridMonitor: AbyssGridMonitorApp,
  abyssSpiritConsole: AbyssSpiritConsoleApp,
  cogFabricConsole: CogFabricConsoleApp,
  cogSingularity: CogSingularityApp,
  genesisConsole: GenesisConsoleApp,
  temporalObservatory: TemporalObservatoryApp,
  dnsConsole: AbyssDNSApp,
  aweConsole: AWEConsoleApp,
  aweAtlas: AWEAtlasApp,
  neonPlayer: NeonPlayerApp,
  neonRadio: NeonRadioApp,
  documentEditor: DocumentEditorApp,
  vybSocial: VYBSocialApp,
  abyssWriter: AbyssWriterApp,
  abyssCalc: AbyssCalcApp,
  craft: CraftApp,
  appMarketplace: AppMarketplaceApp,
  archonAI: ArchonAIAssistantApp,
  miningAccounting: MiningAccountingApp,
};

export function Desktop() {
  const { openWindows } = useDesktopStore();

  return (
    <FullscreenContainer>
      <WalletInitializer />
      <FileDropZone
        onUploadComplete={(fileId, assetId) => {
          console.log('File uploaded and minted:', { fileId, assetId });
          // TODO: Refresh file explorer or show notification
        }}
        onUploadError={(error) => {
          console.error('Upload error:', error);
          // TODO: Show error notification
        }}
      />
      <AudioReactiveBackground />
      <StatusBar />

      {/* Windows */}
      {openWindows.map((window) => {
        const AppComponent = appComponents[window.appId];
        if (!AppComponent) return null;

        return (
          <WindowFrame
            key={window.id}
            id={window.id}
            title={window.title}
            x={window.x}
            y={window.y}
            width={window.width}
            height={window.height}
          >
            <AppComponent />
          </WindowFrame>
        );
      })}

      {/* GlassDock removed - using System Menu instead */}
    </FullscreenContainer>
  );
}

