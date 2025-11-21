"use client";

import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";

const pillars = [
  {
    title: "Demiurge L1",
    description: "Sovereign blockchain with custom PoW and modular runtime.",
  },
  {
    title: "Forge",
    description: "Memory-hard PoW for security and verifiable compute.",
  },
  {
    title: "Fabric",
    description: "Content-addressed P2P network with Proof-of-Delivery rewards.",
  },
  {
    title: "Abyss",
    description: "Marketplace and dev hub with GraphQL API.",
  },
];

export function TechPillarsSection() {
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
            Core Technology Pillars
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Four interconnected systems powering the DEMIURGE ecosystem.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <h3 className="mb-2 text-2xl font-semibold">{pillar.title}</h3>
                <p className="text-zinc-400">{pillar.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

