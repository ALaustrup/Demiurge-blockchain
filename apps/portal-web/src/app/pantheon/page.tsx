import { Card } from "@/components/ui/Card";

export default function PantheonPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">The Pantheon</h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          Understanding the universe of DEMIURGE: roles, systems, and the
          creative economy.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Demiurge</h2>
          <p className="text-zinc-400">
            The sovereign L1 blockchain at the heart of the ecosystem. Built
            with Rust, featuring custom Proof-of-Work (Forge) and a modular
            runtime.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Archons</h2>
          <p className="text-zinc-400">
            Creators who have ascended to full creator status. Archons can mint
            D-GEN NFTs, upload to Fabric, list in the Abyss, and earn CGT
            through seeding and compute.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Nomads</h2>
          <p className="text-zinc-400">
            Any user with a Demiurge address. Nomads can browse Fabric, buy
            NFTs, explore worlds, and hold CGT and assets.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Forge</h2>
          <p className="text-zinc-400">
            Memory-hard Proof-of-Work for block production. Also supports
            optional zkML and verifiable compute jobs for advanced use cases.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Fabric</h2>
          <p className="text-zinc-400">
            Content-addressed P2P network (libp2p) for decentralized content
            storage and delivery. Seeders earn CGT via Proof-of-Delivery
            rewards.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Abyss</h2>
          <p className="text-zinc-400">
            The marketplace and developer hub. List NFTs, handle royalties,
            licensing, and access the GraphQL API for apps and games.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">CGT</h2>
          <p className="text-zinc-400">
            Creator God Token - the native L1 token. Powers gas, fees, Fabric
            seeding rewards, Forge compute, marketplace transactions, and creator
            royalties.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">D-GEN</h2>
          <p className="text-zinc-400">
            The unified NFT standard (D-721) with flexible metadata profiles for
            art, audio, game items, worlds, plugins, tools, and code modules.
          </p>
        </Card>
      </div>
    </main>
  );
}

