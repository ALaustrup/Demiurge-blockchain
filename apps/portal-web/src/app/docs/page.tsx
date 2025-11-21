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

