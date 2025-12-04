import { useAbyssID } from '../../hooks/useAbyssID';
import { ChainStatusPill } from '../ChainStatusPill';
import { useTheme } from '../../context/ThemeContext';

export function StatusBar() {
  const { session } = useAbyssID();
  const { themeConfig } = useTheme();

  return (
    <div
      className="fixed top-0 left-0 right-0 h-8 z-50 flex items-center justify-between px-4 text-xs"
      style={{
        background: themeConfig.toolbar.background,
        borderBottom: `1px solid ${themeConfig.toolbar.border}`,
        backdropFilter: themeConfig.toolbar.backdropBlur,
        WebkitBackdropFilter: themeConfig.toolbar.backdropBlur,
      }}
    >
      <div className="text-abyss-cyan">AbyssOS – Demiurge Devnet</div>
      
      <div className="flex items-center space-x-4">
        <ChainStatusPill />
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-300">{session?.username || 'Guest'}</span>
      </div>
    </div>
  );
}

