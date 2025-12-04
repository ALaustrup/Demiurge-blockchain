"use client";

import { FractureShell } from "@/components/fracture/FractureShell";
import { HeroPanel } from "@/components/fracture/HeroPanel";
import { TimelineView } from "@/components/timeline/TimelineView";
import { useState } from "react";
import type { SystemSnapshot } from "@/lib/stateHistory/timelineTypes";
import { GENESIS_CONFIG } from "@/config/genesis";
import { graphqlRequest } from "@/lib/graphql";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { useOperator } from "@/lib/operator/OperatorContextProvider";

export default function TimelinePage() {
  const [selectedSnapshot, setSelectedSnapshot] = useState<SystemSnapshot | null>(null);
  const [isTimeTraveling, setIsTimeTraveling] = useState(false);
  const { hasPermission } = useOperator();

  const handleSnapshotSelect = (snapshot: SystemSnapshot) => {
    setSelectedSnapshot(snapshot);
    setIsTimeTraveling(true);
    // TODO: Apply snapshot state to components (ShaderPlane, FabricTopology, etc.)
    console.log("Selected snapshot:", snapshot);
  };

  const handleReturnToLive = () => {
    setSelectedSnapshot(null);
    setIsTimeTraveling(false);
    // TODO: Restore live state
    console.log("Returned to live state");
  };

  const handleExportSession = async () => {
    if (!hasPermission("export_session")) {
      alert("Requires OPERATOR role to export sessions");
      return;
    }
    try {
      const query = `
        query ExportGenesisSession {
          exportGenesisSession
        }
      `;
      const data = await graphqlRequest<{ exportGenesisSession: string }>(query);
      
      // Create download
      const blob = new Blob([data.exportGenesisSession], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `genesis-session-${Date.now()}.fracture-session.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to export session:", error);
      alert("Failed to export session: " + error.message);
    }
  };

  return (
    <FractureShell>
      <HeroPanel
        title="Timeline"
        subtitle="Browse system history and travel through time"
      />

      <div className="space-y-6">
        {GENESIS_CONFIG.enabled && hasPermission("export_session") && (
          <div className="flex justify-end">
            <motion.button
              onClick={handleExportSession}
              className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-sm font-medium transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-4 h-4" />
              Export Genesis Session
            </motion.button>
          </div>
        )}

        {isTimeTraveling && selectedSnapshot && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <span className="px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/30 text-xs font-medium">
                HISTORICAL VIEW
              </span>
              <span className="text-yellow-500/70">
                Viewing snapshot from {new Date(selectedSnapshot.timestamp).toLocaleString()}
              </span>
            </div>
            {selectedSnapshot.label && (
              <span className="text-xs text-yellow-500/60">{selectedSnapshot.label}</span>
            )}
          </div>
        </div>
      )}

        <TimelineView
          onSnapshotSelect={handleSnapshotSelect}
          onReturnToLive={handleReturnToLive}
          selectedSnapshotId={selectedSnapshot?.id || null}
        />
      </div>
    </FractureShell>
  );
}

