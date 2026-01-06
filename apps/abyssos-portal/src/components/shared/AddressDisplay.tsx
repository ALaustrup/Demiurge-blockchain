/**
 * AddressDisplay Component
 * 
 * Displays a blockchain address with automatic username resolution.
 * Shows the username if available, otherwise shows a truncated address.
 */

import { useAddressDisplay, formatAddress } from '../../hooks/useAddressDisplay';

interface AddressDisplayProps {
  /** The address to display */
  address: string;
  /** Number of characters to show on each side of truncated address */
  truncateLength?: number;
  /** Whether to show the full address in a tooltip */
  showTooltip?: boolean;
  /** Whether to show Archon badge */
  showArchonBadge?: boolean;
  /** Whether to copy address on click */
  copyOnClick?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Style for username display */
  usernameClassName?: string;
  /** Style for address display */
  addressClassName?: string;
  /** Show loading indicator */
  showLoading?: boolean;
  /** Link to explorer/profile */
  linkTo?: 'explorer' | 'profile' | null;
}

export function AddressDisplay({
  address,
  truncateLength = 8,
  showTooltip = true,
  showArchonBadge = true,
  copyOnClick = true,
  className = '',
  usernameClassName = 'text-abyss-cyan font-semibold',
  addressClassName = 'font-mono text-gray-400',
  showLoading = true,
  linkTo = null,
}: AddressDisplayProps) {
  const {
    displayName,
    username,
    isArchon,
    isLoading,
    formattedAddress,
  } = useAddressDisplay(address, { truncateLength });

  const handleClick = async () => {
    if (copyOnClick) {
      try {
        const fullAddress = address.startsWith('0x') ? address : `0x${address}`;
        await navigator.clipboard.writeText(fullAddress);
        // Could add toast notification here
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const content = (
    <span
      className={`inline-flex items-center gap-1 ${copyOnClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      onClick={handleClick}
      title={showTooltip ? `0x${address.replace(/^0x/, '')}` : undefined}
    >
      {showLoading && isLoading ? (
        <span className={`animate-pulse ${addressClassName}`}>
          {formattedAddress}
        </span>
      ) : username ? (
        <>
          <span className={usernameClassName}>
            {username}
          </span>
          {showArchonBadge && isArchon && (
            <span className="text-xs bg-abyss-cyan/20 text-abyss-cyan px-1 rounded">
              ARCHON
            </span>
          )}
        </>
      ) : (
        <code className={addressClassName}>
          {formattedAddress}
        </code>
      )}
    </span>
  );

  if (linkTo === 'explorer') {
    return (
      <a 
        href={`/explorer/address/${address}`}
        className="hover:underline"
      >
        {content}
      </a>
    );
  }

  if (linkTo === 'profile') {
    return (
      <a 
        href={`/profile/${address}`}
        className="hover:underline"
      >
        {content}
      </a>
    );
  }

  return content;
}

/**
 * Simple inline address display (no resolution, just formatting)
 */
export function AddressCode({
  address,
  truncateLength = 8,
  className = 'font-mono text-gray-400',
}: {
  address: string;
  truncateLength?: number;
  className?: string;
}) {
  return (
    <code className={className}>
      {formatAddress(address, truncateLength)}
    </code>
  );
}

/**
 * Address with username above/below
 */
export function AddressWithUsername({
  address,
  layout = 'vertical',
  className = '',
}: {
  address: string;
  layout?: 'vertical' | 'horizontal';
  className?: string;
}) {
  const { username, formattedAddress, isArchon } = useAddressDisplay(address);

  if (layout === 'horizontal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {username && (
          <span className="text-abyss-cyan font-semibold">
            {username}
            {isArchon && (
              <span className="ml-1 text-xs bg-abyss-cyan/20 px-1 rounded">
                ARCHON
              </span>
            )}
          </span>
        )}
        <code className="text-xs text-gray-500">{formattedAddress}</code>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {username && (
        <span className="text-abyss-cyan font-semibold">
          {username}
          {isArchon && (
            <span className="ml-1 text-xs bg-abyss-cyan/20 px-1 rounded">
              ARCHON
            </span>
          )}
        </span>
      )}
      <code className="text-xs text-gray-500">{formattedAddress}</code>
    </div>
  );
}

export default AddressDisplay;
