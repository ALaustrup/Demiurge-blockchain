"use client";

import { motion } from "framer-motion";
import { useArchon } from "@/lib/archon/ArchonContextProvider";
import { ArchonProposal } from "@/lib/archon/archonTypes";
import { Check, X, Zap, AlertTriangle } from "lucide-react";
import { useOperator } from "@/lib/operator/OperatorContextProvider";

interface ArchonProposalCardProps {
  proposal: ArchonProposal;
}

const SEVERITY_COLORS = {
  low: "text-blue-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

export function ArchonProposalCard({ proposal }: ArchonProposalCardProps) {
  const { reviewProposal, applyProposal } = useArchon();
  const { hasPermission } = useOperator();

  const canApply = hasPermission("apply_proposal");

  const handleApprove = () => {
    reviewProposal(proposal.id, "approved");
  };

  const handleReject = () => {
    reviewProposal(proposal.id, "rejected");
  };

  const handleApply = () => {
    if (!canApply) {
      alert("Requires OPERATOR role to apply proposals");
      return;
    }
    applyProposal(proposal.id);
  };

  const severity = proposal.predictedImpact.severity;
  const severityColor = SEVERITY_COLORS[severity] || "text-gray-400";

  return (
    <motion.div
      className="glass-dark border border-white/10 rounded-lg p-4 space-y-3"
      whileHover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-oswald text-white mb-1">{proposal.title}</h4>
          <p className="text-sm text-gray-300 mb-2">{proposal.rationale}</p>
        </div>
        <div className={`text-xs font-medium ${severityColor} flex items-center gap-1`}>
          <AlertTriangle className="w-3 h-3" />
          {severity.toUpperCase()}
        </div>
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <div>
          <span className="font-medium">Impact:</span> {proposal.predictedImpact.description}
        </div>
        <div>
          <span className="font-medium">Affected Systems:</span> {proposal.predictedImpact.affectedSystems.join(", ")}
        </div>
        <div>
          <span className="font-medium">Actions:</span> {proposal.actions.length} action(s)
        </div>
      </div>

      {proposal.status === "pending" && (
        <div className="flex gap-2 pt-2 border-t border-white/10">
          <motion.button
            onClick={handleApprove}
            className="flex-1 px-3 py-1.5 rounded bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 text-sm font-medium transition-colors flex items-center justify-center gap-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Check className="w-3 h-3" />
            Approve
          </motion.button>
          <motion.button
            onClick={handleReject}
            className="flex-1 px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-medium transition-colors flex items-center justify-center gap-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X className="w-3 h-3" />
            Reject
          </motion.button>
        </div>
      )}

      {proposal.status === "approved" && (
        <motion.button
          onClick={handleApply}
          disabled={!canApply}
          className={`w-full px-3 py-2 rounded border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            canApply
              ? "bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/30 text-yellow-400"
              : "bg-gray-500/10 border-gray-500/20 text-gray-500 cursor-not-allowed"
          }`}
          whileHover={canApply ? { scale: 1.02 } : {}}
          whileTap={canApply ? { scale: 0.98 } : {}}
          title={!canApply ? "Requires OPERATOR role" : undefined}
        >
          <Zap className="w-4 h-4" />
          Apply Proposal
        </motion.button>
      )}

      {proposal.status === "applied" && (
        <div className="text-xs text-green-400 flex items-center gap-1 pt-2 border-t border-white/10">
          <Check className="w-3 h-3" />
          Applied {proposal.appliedAt ? new Date(proposal.appliedAt).toLocaleString() : ""}
        </div>
      )}

      {proposal.status === "rejected" && (
        <div className="text-xs text-red-400 pt-2 border-t border-white/10">
          Rejected {proposal.reviewedAt ? new Date(proposal.reviewedAt).toLocaleString() : ""}
        </div>
      )}
    </motion.div>
  );
}

