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
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl font-display">
            <span className="bg-gradient-to-r from-[var(--genesis-flame-orange)] via-[var(--genesis-cipher-cyan)] to-[var(--genesis-flame-orange)] bg-clip-text text-transparent">
              GENESIS
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-[var(--genesis-text-primary)] sm:text-2xl">
            A sovereign Layer 1 blockchain ecosystem built for creators.
            <br />
            <span className="text-[var(--genesis-text-secondary)]">Build. Mint. Trade. Earn.</span>
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="https://demiurge.cloud">
              <Button variant="primary">Enter the Abyss</Button>
            </a>
            <a href="/docs">
              <Button variant="outline">Documentation</Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

