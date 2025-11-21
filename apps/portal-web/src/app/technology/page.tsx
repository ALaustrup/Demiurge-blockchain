import { Card } from "@/components/ui/Card";

export default function TechnologyPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Technology</h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          Built on cutting-edge blockchain technology with a focus on
          performance, decentralization, and creator empowerment.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Sovereign L1 Chain</h2>
          <p className="mb-4 text-zinc-400">
            Custom-built blockchain in Rust with modular runtime architecture.
            Optimized for creator economy use cases with fast finality and low
            fees.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Forge PoW</h2>
          <p className="mb-4 text-zinc-400">
            Memory-hard Proof-of-Work using Argon2id + SHA-256. Provides
            security while enabling optional verifiable compute for advanced
            applications.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Fabric P2P Network</h2>
          <p className="mb-4 text-zinc-400">
            Content-addressed storage built on libp2p. Decentralized content
            delivery with Proof-of-Delivery rewards for seeders.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Indexer & GraphQL</h2>
          <p className="mb-4 text-zinc-400">
            High-performance block ingestor and GraphQL API gateway. Enables
            fast queries for NFTs, listings, and chain state.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">TypeScript & Rust SDKs</h2>
          <p className="mb-4 text-zinc-400">
            Comprehensive SDKs for both web and native applications. Easy
            integration with wallets, transactions, and chain queries.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Desktop Console</h2>
          <p className="mb-4 text-zinc-400">
            Qt 6.10-based Pantheon Console for desktop users. Full node
            management, wallet, and chain interaction in a native application.
          </p>
        </Card>
      </div>
    </main>
  );
}

