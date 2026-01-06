import { useState, useEffect } from 'react';
import { useAbyssID } from '../../hooks/useAbyssID';
import { useTheme } from '../../context/ThemeContext';
import { useMusicPlayerStore } from '../../state/musicPlayerStore';
import { useDesktopStore } from '../../state/desktopStore';
import { useWalletStore } from '../../state/walletStore';
import { useCustomizationStore } from '../../state/customizationStore';
import { backgroundMusicService } from '../../services/backgroundMusic';
import { StartButton3D } from './StartButton3D';
import { AppStoreMenu } from './AppStoreMenu';
import { CustomizationPanel } from './CustomizationPanel';
import { ChainStatusPill } from '../ChainStatusPill';

export function StatusBar() {
  const { session, logout } = useAbyssID();
  const { themeConfig } = useTheme();
  const { currentTrack, isPlaying, togglePlayPause, nextTrack, isBackgroundMode } = useMusicPlayerStore();
  const { openApp } = useDesktopStore();
  const { refreshBalance } = useWalletStore();
  const { toolbarWidgets, useCustomColors: useCustomColorsStore } = useCustomizationStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);

  // Subscribe to background music state
  useEffect(() => {
    const unsubscribe = backgroundMusicService.subscribe((enabled) => {
      setMusicEnabled(enabled);
    });
    return unsubscribe;
  }, []);

  const handleDisengage = async () => {
    await logout();
    setShowMenu(false);
    window.location.reload();
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (username: string) => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Get visible widgets in order
  const visibleWidgets = toolbarWidgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  // Apply custom colors if enabled
  const toolbarStyle = useCustomColorsStore && useCustomColorsStore
    ? {
        background: `var(--custom-background, ${themeConfig.toolbar.background})`,
        borderBottom: `1px solid var(--custom-accent, ${themeConfig.toolbar.border})`,
        backdropFilter: themeConfig.toolbar.backdropBlur,
        WebkitBackdropFilter: themeConfig.toolbar.backdropBlur,
      }
    : {
        background: themeConfig.toolbar.background,
        borderBottom: `1px solid ${themeConfig.toolbar.border}`,
        backdropFilter: themeConfig.toolbar.backdropBlur,
        WebkitBackdropFilter: themeConfig.toolbar.backdropBlur,
      };

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-8 z-50 flex items-center justify-between px-4 text-xs"
        style={toolbarStyle}
      >
        <div className="text-abyss-cyan">AbyssOS – Demiurge Devnet</div>
        
        {/* Start Button - Center */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <StartButton3D
            onClick={() => setShowSystemMenu(!showSystemMenu)}
            isOpen={showSystemMenu}
          />
        </div>
        
        {/* Widgetized Right Side - Render widgets in order */}
        <div className="flex items-center space-x-2 sm:space-x-4 pr-2 sm:pr-8">
          {/* RPC Status removed from status bar - now in Chain Ops app */}
          
          {visibleWidgets.map((widget) => {
            if (widget.id === 'music-player' && currentTrack && isBackgroundMode) {
              return (
                <div key={widget.id} className="flex items-center gap-2 px-2 py-1 rounded bg-abyss-navy/60 border border-abyss-cyan/20">
                  <span className="text-abyss-cyan text-[10px] truncate max-w-[120px]">
                    {currentTrack.music?.trackName || currentTrack.name || 'Unknown Track'}
                  </span>
                  <button
                    onClick={togglePlayPause}
                    className="w-5 h-5 rounded bg-abyss-cyan/20 hover:bg-abyss-cyan/40 text-abyss-cyan flex items-center justify-center text-[10px]"
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <button
                    onClick={nextTrack}
                    className="w-5 h-5 rounded bg-abyss-cyan/20 hover:bg-abyss-cyan/40 text-abyss-cyan flex items-center justify-center text-[10px]"
                  >
                    ⏭
                  </button>
                  <button
                    onClick={() => openApp('neonPlayer')}
                    className="w-5 h-5 rounded bg-abyss-cyan/20 hover:bg-abyss-cyan/40 text-abyss-cyan flex items-center justify-center text-[10px]"
                    title="Open NEON Player"
                  >
                    🎵
                  </button>
                </div>
              );
            }
            
            if (widget.id === 'background-music') {
              return (
                <button
                  key={widget.id}
                  onClick={() => backgroundMusicService.toggle()}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-abyss-cyan/20 transition-colors"
                  title={musicEnabled ? 'Disable background music' : 'Enable background music'}
                >
                  {musicEnabled ? '🔊' : '🔇'}
                </button>
              );
            }
            
            return null;
          })}
        </div>

        <div className="flex items-center space-x-2 relative ml-4">
          {/* Avatar Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white transition-all hover:ring-2 hover:ring-abyss-cyan/50"
            style={{
              backgroundColor: session?.username ? getAvatarColor(session.username) : '#666',
            }}
            title={session?.username || 'Guest'}
          >
            {session?.username ? getInitials(session.username) : 'G'}
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-abyss-navy/95 backdrop-blur-md border border-abyss-cyan/30 rounded-lg shadow-xl z-50">
              <div className="p-2">
                {/* Account Info */}
                <div className="px-3 py-2 border-b border-abyss-cyan/20">
                  <div className="text-sm font-medium text-abyss-cyan">{session?.username || 'Guest'}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {session?.username ? 'AbyssID Account' : 'Not logged in'}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowCustomization(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-abyss-cyan/10 hover:text-abyss-cyan rounded transition-colors"
                  >
                    🎨 Customize
                  </button>
                  <button
                    onClick={() => {
                      refreshBalance();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-abyss-cyan/10 hover:text-abyss-cyan rounded transition-colors"
                  >
                    🔄 Refresh Balance
                  </button>
                </div>

                {/* Disengage/Logout */}
                <div className="pt-1 border-t border-abyss-cyan/20">
                  <button
                    onClick={handleDisengage}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    Disengage
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* App Store Menu */}
      <AppStoreMenu isOpen={showSystemMenu} onClose={() => setShowSystemMenu(false)} />
      
      {/* Customization Panel */}
      <CustomizationPanel isOpen={showCustomization} onClose={() => setShowCustomization(false)} />
    </>
  );
}
