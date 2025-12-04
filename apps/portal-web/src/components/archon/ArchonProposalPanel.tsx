"use client";

import { motion } from "framer-motion";
import { useArchon } from "@/lib/archon/ArchonContextProvider";
import { ArchonProposalCard } from "./ArchonProposalCard";
import { Brain, AlertCircle } from "lucide-react";

export function ArchonProposalPanel() {
  const { proposals, loading, error } = useArchon();

  const pendingProposals = proposals.filter((p) => p.status === "pending");
  const approvedProposals = proposals.filter((p) => p.status === "approved");
  const appliedProposals = proposals.filter((p) => p.status === "applied");

  return (
    <div className="glass-dark rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-oswald text-white flex items-center gap-2">
          <Brain className="w-5 h-5" />
          ArchonAI Proposals
        </h3>
        {loading && <div className="text-sm text-gray-400">Loading...</div>}
      </div>

      {error && (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {pendingProposals.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Pending Review</h4>
          {pendingProposals.map((proposal) => (
            <ArchonProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {approvedProposals.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Approved (Ready to Apply)</h4>
          {approvedProposals.map((proposal) => (
            <ArchonProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {appliedProposals.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Applied</h4>
          {appliedProposals.slice(0, 5).map((proposal) => (
            <ArchonProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {proposals.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No proposals yet. ArchonAI will surface actionable insights here.</p>
        </div>
      )}
    </div>
  );
}

