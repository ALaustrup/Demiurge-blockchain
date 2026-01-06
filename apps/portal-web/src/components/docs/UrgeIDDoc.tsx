"use client";

export function AbyssIDDoc() {
  return (
    <div className="space-y-6 text-sm text-zinc-200">
      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Overview</h3>
        <p className="text-zinc-300 mb-4">
          AbyssID is the on-chain identity system for Demiurge. Every user has an AbyssID profile that serves as their wallet address, identity, and contribution tracker.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-3">Profile Features</h3>
        <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
          <li><strong className="text-zinc-100">Display Name:</strong> User's chosen display name</li>
          <li><strong className="text-zinc-100">Bio:</strong> Optional biography text</li>
          <li><strong className="text-zinc-100">Username:</strong> Globally unique, 3-32 characters (lowercase alphanumeric + dots/underscores)</li>
          <li><strong className="text-zinc-100">Level:</strong> Starts at 1, increases with Syzygy score (level = 1 + syzygy/1000)</li>
          <li><strong className="text-zinc-100">Syzygy Score:</strong> Contribution score for seeding/serving content</li>
          <li><strong className="text-zinc-100">Badges:</strong> Achievement markers (e.g., "Luminary" at 10,000 syzygy)</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-3">Username Rules</h3>
        <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
          <li>Length: 3-32 characters</li>
          <li>Characters: lowercase letters (a-z), numbers (0-9), underscores (_), dots (.)</li>
          <li>Cannot start or end with a dot</li>
          <li>Cannot contain consecutive dots</li>
          <li>Globally unique across all users</li>
          <li>Case-insensitive (normalized to lowercase)</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Leveling System</h3>
        <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
          <p className="text-xs text-zinc-300 mb-2">
            <strong className="text-zinc-100">Formula:</strong> Level = 1 + (syzygy_score / 1000)
          </p>
          <p className="text-xs text-zinc-300 mb-2">
            <strong className="text-zinc-100">CGT Rewards:</strong> Each level-up mints CGT reward: level * 1000 * 10^8 smallest units
          </p>
          <p className="text-xs text-zinc-300">
            <strong className="text-zinc-100">Cumulative:</strong> Reaching level 5 gives rewards for levels 2, 3, 4, and 5
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Badges</h3>
        <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
          <p className="text-xs text-zinc-300">
            <strong className="text-zinc-100">Luminary:</strong> Awarded when syzygy_score {">="} 10,000
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Usernames for Transfers</h3>
        <p className="text-xs text-zinc-300 mb-2">
          You can send CGT using usernames instead of addresses:
        </p>
        <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
          <li>Format: <code className="bg-black/30 px-1 rounded">@username</code> (e.g., @oracle)</li>
          <li>The portal automatically resolves usernames to addresses</li>
          <li>You can also use full 64-character hex addresses</li>
          <li>Usernames work in chat for messaging (@username mentions)</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">My Void Dashboard</h3>
        <p className="text-xs text-zinc-300 mb-2">
          Access your AbyssID profile via "My Void" in the portal:
        </p>
        <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
          <li>View profile, level, and Syzygy score</li>
          <li>Claim a globally unique username</li>
          <li>Manage CGT wallet and transaction history</li>
          <li>Track leveling progress and CGT rewards</li>
          <li>View badges and achievements</li>
        </ul>
      </div>

      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
        <p className="text-xs text-zinc-200">
          <strong>Complete Documentation:</strong> See Runtime Modules → AbyssID Registry for full API reference, transaction calls, and storage keys.
        </p>
      </div>
    </div>
  );
}
