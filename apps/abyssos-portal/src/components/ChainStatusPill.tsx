import { useChainStatus } from '../hooks/useChainStatus';

export function ChainStatusPill() {
  const { status, info } = useChainStatus();

  let label = 'Connecting to Demiurge…';
  let className = 'abyss-pill abyss-pill--connecting';

  if (status === 'online') {
    label = `Connected · Height ${info?.height ?? 0}`;
    className = 'abyss-pill abyss-pill--online';
  } else if (status === 'offline') {
    label = 'Offline · Retry in a moment';
    className = 'abyss-pill abyss-pill--offline';
  }

  return (
    <div className={className}>
      <span className="abyss-pill-dot" />
      <span className="abyss-pill-text">{label}</span>
    </div>
  );
}

