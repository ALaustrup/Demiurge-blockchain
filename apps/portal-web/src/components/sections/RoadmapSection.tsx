"use client";

import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";

const phases = [
  {
    phase: "Phase 0",
    title: "Repo Bootstrap",
    status: "Complete",
    description: "Repository structure, tooling, website skeleton, and Qt shell.",
  },
  {
    phase: "Phase 1",
    title: "Chain Skeleton",
    status: "Upcoming",
    description: "Core L1 structure: blocks, transactions, state abstraction.",
  },
  {
    phase: "Phase 2",
    title: "Persistence & PoW",
    status: "Upcoming",
    description: "RocksDB state, Forge PoW, JSON-RPC server.",
  },
  {
    phase: "Phase 3",
    title: "Core Runtime",
    status: "Upcoming",
    description: "CGT, D-GEN NFTs, identity/role flags.",
  },
  {
    phase: "Phase 4",
    title: "Fabric & Abyss",
    status: "Upcoming",
    description: "Content network and marketplace integration.",
  },
  {
    phase: "Phase 5",
    title: "UX Layer",
    status: "Upcoming",
    description: "Portal web and Qt console integration.",
  },
  {
    phase: "Phase 6",
    title: "Docker & Deployment",
    status: "Upcoming",
    description: "Localnet setup and Vercel deployment.",
  },
];

export function RoadmapSection() {
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
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Roadmap</h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Our development journey from bootstrap to full ecosystem.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {phases.map((item, index) => (
            <motion.div
              key={item.phase}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-500">
                    {item.phase}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      item.status === "Complete"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

