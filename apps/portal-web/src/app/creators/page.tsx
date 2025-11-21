import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function CreatorsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">
          For Creators
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          Whether you&apos;re a gamer, musician, developer, artist, or writer,
          DEMIURGE provides the tools to build, monetize, and thrive.
        </p>
      </div>

      <div className="mb-12 flex justify-center">
        <Button variant="primary">
          Become an Archon
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Mint D-GEN NFTs</h2>
          <p className="mb-4 text-zinc-400">
            Create and mint your digital assets with the flexible D-GEN standard.
            Support for art, audio, game items, worlds, plugins, and more.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Upload to Fabric</h2>
          <p className="mb-4 text-zinc-400">
            Store your content on the decentralized Fabric network. Set up
            revenue hooks and earn CGT as seeders deliver your content.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Sell in the Abyss</h2>
          <p className="mb-4 text-zinc-400">
            List your NFTs in the marketplace with automatic royalty handling.
            Set your prices in CGT and reach a global audience.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-2xl font-semibold">Earn CGT</h2>
          <p className="mb-4 text-zinc-400">
            Generate income through Fabric seeding rewards, Forge compute jobs,
            and marketplace sales. CGT powers the entire ecosystem.
          </p>
        </Card>
      </div>
    </main>
  );
}

