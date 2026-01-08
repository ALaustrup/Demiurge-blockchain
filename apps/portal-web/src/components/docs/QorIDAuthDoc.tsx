"use client";

export function QorIDAuthDoc() {
  return (
    <div className="space-y-6 text-sm text-zinc-200">
      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Overview</h3>
        <p className="text-zinc-300 mb-4">
          QorID provides username-based authentication with seed phrase recovery. Users can sign up, log in, and recover their accounts using an 8-word seed phrase.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Key Features</h3>
        <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
          <li><strong className="text-zinc-100">Username-based login:</strong> Unique username (case-insensitive, 3-32 chars)</li>
          <li><strong className="text-zinc-100">8-word seed phrase:</strong> Randomly generated, must be saved for recovery</li>
          <li><strong className="text-zinc-100">Deterministic key derivation:</strong> Same seed phrase always produces same Ed25519 keypair</li>
          <li><strong className="text-zinc-100">Public key verification:</strong> Login verifies derived public key matches stored key</li>
          <li><strong className="text-zinc-100">No password storage:</strong> Only public keys stored on server, seed phrase never leaves device</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Signup Flow</h3>
        <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside">
          <li>User enters desired username → System checks availability (case-insensitive)</li>
          <li>If available, system generates random 8-word seed phrase from word list</li>
          <li>User must save seed phrase securely (displayed once, never sent to server)</li>
          <li>Frontend derives Ed25519 keypair from seed phrase using SHA-256 hashing</li>
          <li>Frontend sends {`{username, publicKey, address}`} to backend</li>
          <li>Backend stores identity in SQLite database with COLLATE NOCASE for username</li>
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Login Flow</h3>
        <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside">
          <li>User enters username → System checks if username exists</li>
          <li>If exists, user enters their saved 8-word seed phrase</li>
          <li>Frontend derives keypair from seed phrase</li>
          <li>Frontend fetches stored publicKey from backend (GET /api/qorid/:username)</li>
          <li>Frontend compares derived publicKey with stored publicKey</li>
          <li>If match, login succeeds; if mismatch, error shown</li>
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">API Endpoints</h3>
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-black/20 border border-white/10 rounded">
            <code className="text-cyan-300">GET /api/qorid/check?username={"{username}"}</code>
            <p className="text-zinc-300 mt-1">Check username availability. Returns {`{available: true/false}`}</p>
          </div>
          <div className="p-2 bg-black/20 border border-white/10 rounded">
            <code className="text-cyan-300">POST /api/qorid/register</code>
            <p className="text-zinc-300 mt-1">Register new identity. Body: {`{username, publicKey, address}`}</p>
          </div>
          <div className="p-2 bg-black/20 border border-white/10 rounded">
            <code className="text-cyan-300">GET /api/qorid/:username</code>
            <p className="text-zinc-300 mt-1">Get identity by username. Returns {`{username, address, publicKey, createdAt}`}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Security Considerations</h3>
        <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
          <li>Seed phrase never stored on server - only public key</li>
          <li>Seed phrase never leaves user's device</li>
          <li>Usernames are case-insensitive (COLLATE NOCASE in database)</li>
          <li>Ed25519 provides strong cryptographic security</li>
          <li>Deterministic derivation ensures recoverability</li>
        </ul>
      </div>

      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <p className="text-xs text-zinc-200">
          <strong>Complete Documentation:</strong> See <code className="bg-black/30 px-1 rounded">docs/QORID_AUTHENTICATION.md</code> for full API reference, key derivation algorithm, and troubleshooting guide.
        </p>
      </div>
    </div>
  );
}
