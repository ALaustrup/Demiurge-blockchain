import { Card } from "@/components/ui/Card";

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Documentation</h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          Comprehensive guides and references for developers, creators, and
          users.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 text-xl font-semibold">Architecture</h2>
          <p className="mb-4 text-zinc-400">
            System design, chain architecture, Fabric, and Abyss deep dives.
          </p>
          <a
            href="#"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            Coming soon →
          </a>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">Economics</h2>
          <p className="mb-4 text-zinc-400">
            CGT tokenomics, emission schedules, rewards, and fee structures.
          </p>
          <a
            href="#"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            Coming soon →
          </a>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">My Void & Identity</h2>
          <p className="mb-4 text-zinc-400">
            UrgeID profiles (accessible via "My Void" in the portal), username registration, leveling system, and how to use usernames for transfers and messaging.
          </p>
          <div className="space-y-2 text-sm text-zinc-300">
            <p><strong>My Void</strong> is your personal UrgeID dashboard where you can:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 ml-2">
              <li>View your profile, level, and Syzygy score</li>
              <li>Claim a globally unique username</li>
              <li>Manage your CGT wallet and transaction history</li>
              <li>Track your leveling progress and CGT rewards</li>
            </ul>
            <p className="mt-2"><strong>Usernames</strong> are globally unique and bound to a single UrgeID address. You can:</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 ml-2">
              <li>Be looked up by username</li>
              <li>Receive CGT payments by username</li>
              <li>Be messaged by username in chat</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              Usernames must be 3-32 characters, lowercase letters, numbers, underscores, and dots only.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">CGT & Transfers</h2>
          <p className="mb-4 text-zinc-400">
            Send CGT using usernames or addresses. The portal automatically resolves usernames to addresses.
          </p>
          <div className="space-y-2 text-sm text-zinc-300">
            <p><strong>Recipient formats:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 ml-2">
              <li><code className="text-xs bg-zinc-800 px-1 rounded">@username</code> - Username (e.g., @oracle)</li>
              <li><code className="text-xs bg-zinc-800 px-1 rounded">0992f7f1...fc4c</code> - 64-character hex address</li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              The portal will resolve usernames to addresses and display who you're sending to before confirming.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">Creators Handbook</h2>
          <p className="mb-4 text-zinc-400">
            How to become an Archon, mint D-GEN NFTs, and earn CGT.
          </p>
          <a
            href="#"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            Coming soon →
          </a>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">Chat & Social</h2>
          <p className="mb-4 text-zinc-400">
            World Chat, Direct Messages, and the social layer of Demiurge.
          </p>
          <a
            href="/docs/chat"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            Learn more →
          </a>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">The Seven Archons</h2>
          <p className="mb-4 text-zinc-400">
            Meet the Archon NPCs: Ialdabaoth, Sabaoth, Abrasax, and the others.
          </p>
          <a
            href="/docs/archons"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            Learn more →
          </a>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">Pantheon Lore</h2>
          <p className="mb-4 text-zinc-400">
            The mythic framing and narrative behind DEMIURGE.
          </p>
          <a
            href="#"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            Coming soon →
          </a>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">API Reference</h2>
          <p className="mb-4 text-zinc-400">
            JSON-RPC and GraphQL API documentation for developers.
          </p>
          <a
            href="#"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            Coming soon →
          </a>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">SDK Guides</h2>
          <p className="mb-4 text-zinc-400">
            TypeScript and Rust SDK tutorials and examples.
          </p>
          <a
            href="#"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            Coming soon →
          </a>
        </Card>
      </div>
    </main>
  );
}

