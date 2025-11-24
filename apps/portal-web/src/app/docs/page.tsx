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
          <h2 className="mb-3 text-xl font-semibold">Profile Analytics</h2>
          <p className="mb-4 text-zinc-400">
            Track your contribution to the network, view metrics, and understand your impact.
          </p>
          <a
            href="/docs/analytics"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            Learn more →
          </a>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">API Reference</h2>
          <p className="mb-4 text-zinc-400">
            Complete JSON-RPC and GraphQL API documentation for developers.
          </p>
          <a
            href="/docs/api"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            View API Docs →
          </a>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">Creators Handbook</h2>
          <p className="mb-4 text-zinc-400">
            Guide for Archons: minting NFTs, listing in Abyss, earning CGT, and best practices.
          </p>
          <a
            href="/docs/creators"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            Learn more →
          </a>
        </Card>

        <Card>
          <h2 className="mb-3 text-xl font-semibold">System & Operations</h2>
          <p className="mb-4 text-zinc-400">
            Technical documentation for node operators, system administrators, and infrastructure providers.
          </p>
          <a
            href="/docs/system"
            className="text-zinc-300 hover:text-zinc-50 underline"
          >
            View Docs →
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
          <h2 className="mb-3 text-xl font-semibold">Developer Guide</h2>
          <p className="mb-4 text-zinc-400">
            Get started building on Demiurge: SDKs, templates, Developer Registry, and best practices.
          </p>
          <div className="space-y-2">
            <a
              href="/docs/developers/getting-started"
              className="block text-rose-400 hover:text-rose-300 underline text-sm"
            >
              Getting Started →
            </a>
            <a
              href="/docs/developers/sdk-ts"
              className="block text-rose-400 hover:text-rose-300 underline text-sm"
            >
              TypeScript SDK →
            </a>
            <a
              href="/docs/developers/sdk-rust"
              className="block text-rose-400 hover:text-rose-300 underline text-sm"
            >
              Rust SDK →
            </a>
            <a
              href="/docs/developers/templates"
              className="block text-rose-400 hover:text-rose-300 underline text-sm"
            >
              Templates →
            </a>
            <a
              href="/docs/developers/mobile"
              className="block text-rose-400 hover:text-rose-300 underline text-sm"
            >
              Mobile & Pocket Studio →
            </a>
            <a
              href="/docs/developers/dev-capsules"
              className="block text-rose-400 hover:text-rose-300 underline text-sm"
            >
              Dev Capsules →
            </a>
            <a
              href="/docs/developers/recursion"
              className="block text-rose-400 hover:text-rose-300 underline text-sm"
            >
              Recursion Engine Prelude →
            </a>
          </div>
        </Card>
      </div>
    </main>
  );
}

