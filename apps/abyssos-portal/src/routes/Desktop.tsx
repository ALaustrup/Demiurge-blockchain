import React from 'react';
import { FullscreenContainer } from '../components/layout/FullscreenContainer';
import { AbyssBackground } from '../components/layout/AbyssBackground';
import { StatusBar } from '../components/desktop/StatusBar';
import { GlassDock } from '../components/desktop/GlassDock';
import { WindowFrame } from '../components/desktop/WindowFrame';
import { useDesktopStore } from '../state/desktopStore';
import { ChainOpsApp } from '../components/desktop/apps/ChainOpsApp';
import { MinerApp } from '../components/desktop/apps/MinerApp';
import { WalletApp } from '../components/desktop/apps/WalletApp';
import { AbyssBrowserApp } from '../components/desktop/apps/AbyssBrowserApp';
import { AbyssTorrentApp } from '../components/desktop/apps/AbyssTorrentApp';
import { OnChainFilesApp } from '../components/desktop/apps/OnChainFilesApp';

const appComponents: Record<string, React.ComponentType> = {
  chainOps: ChainOpsApp,
  miner: MinerApp,
  wallet: WalletApp,
  abyssBrowser: AbyssBrowserApp,
  abyssTorrent: AbyssTorrentApp,
  onChainFiles: OnChainFilesApp,
};

export function Desktop() {
  const { openWindows } = useDesktopStore();

  return (
    <FullscreenContainer>
      <AbyssBackground />
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

      <GlassDock />
    </FullscreenContainer>
  );
}

