"use client";

import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";

const creatorTypes = [
  {
    title: "Gamers",
    description: "Create and trade game items, worlds, and experiences.",
  },
  {
    title: "Musicians",
    description: "Mint audio NFTs and build your fan economy.",
  },
  {
    title: "Developers",
    description: "Build tools, plugins, and code modules for the ecosystem.",
  },
  {
    title: "Artists",
    description: "Showcase your digital art with provenance and royalties.",
  },
  {
    title: "Writers",
    description: "Publish and monetize your written works as NFTs.",
  },
];

export function CreatorsSection() {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Built for All Creators
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            DEMIURGE empowers creators across all mediums to build, monetize,
            and thrive in a decentralized economy.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {creatorTypes.map((type, index) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <h3 className="mb-2 text-xl font-semibold">{type.title}</h3>
                <p className="text-zinc-400">{type.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

