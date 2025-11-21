"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
              DEMIURGE
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-zinc-400 sm:text-2xl">
            A sovereign L1 blockchain ecosystem for creators, gamers, musicians,
            developers, and artists. Build, mint, trade, and earn.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="/creators">
              <Button variant="primary">Become an Archon</Button>
            </a>
            <a href="/pantheon">
              <Button variant="outline">Explore the Pantheon</Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

