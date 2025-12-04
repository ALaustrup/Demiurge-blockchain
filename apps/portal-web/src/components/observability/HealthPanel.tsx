"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle, XCircle, Brain, Sparkles } from "lucide-react";
import { useArchon } from "@/lib/archon/ArchonContextProvider";
import { useRitual } from "@/lib/rituals/RitualContextProvider";
import { graphqlRequest } from "@/lib/graphql";

interface HealthMetrics {
  fabric: {
    nodeCount: number;
    activeNodes: number;
    averageLatency: number;
    unstableNodes: string[];
  };
  rituals: {
    active: number;
    total: number;
  };
  archon: {
    lastProposalTime: number | null;
    pendingProposals: number;
  };
  anomalies: {
    recent: number;
    critical: number;
  };
}

export function HealthPanel() {
  const { proposals, context: archonContext } = useArchon();
  const { currentRitual } = useRitual();
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHealthMetrics();
    const interval = setInterval(fetchHealthMetrics, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealthMetrics = async () => {
    setLoading(true);
    try {
      // Fetch recent anomalies
      const eventsQuery = `
        query GetAnomalies {
          systemEvents(type: "anomaly", limit: 10) {
            id
            type
            title
            timestamp
            metadata
          }
        }
      `;
      const eventsData = await graphqlRequest<{ systemEvents: any[] }>(eventsQuery);
      const anomalies = eventsData.systemEvents;
      const criticalAnomalies = anomalies.filter((a: any) => {
        const meta = a.metadata ? JSON.parse(a.metadata) : {};
        return meta.severity === "critical";
      });

      // Aggregate metrics
      const fabric = archonContext?.fabric || { nodeCount: 0, activeNodes: 0, averageLatency: 0, unstableNodes: [] };
      const rituals = {
        active: currentRitual ? 1 : 0,
        total: 0, // Could fetch from backend
      };
      const archon = {
        lastProposalTime: proposals.length > 0 ? proposals[0].createdAt : null,
        pendingProposals: proposals.filter((p) => p.status === "pending").length,
      };

      setMetrics({
        fabric,
        rituals,
        archon,
        anomalies: {
          recent: anomalies.length,
          critical: criticalAnomalies.length,
        },
      });
    } catch (err: any) {
      console.error("Failed to fetch health metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!metrics) {
    return (
      <div className="glass-dark rounded-lg p-6">
        <div className="text-sm text-gray-400">Loading health metrics...</div>
      </div>
    );
  }

  const overallHealth = metrics.anomalies.critical > 0 ? "critical" : metrics.anomalies.recent > 5 ? "warning" : "healthy";

  return (
    <div className="glass-dark rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-oswald text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Health
        </h3>
        <div className="flex items-center gap-2">
          {overallHealth === "healthy" && (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Healthy
            </div>
          )}
          {overallHealth === "warning" && (
            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Warning
            </div>
          )}
          {overallHealth === "critical" && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <XCircle className="w-4 h-4" />
              Critical
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Fabric Health */}
        <div className="p-4 rounded border border-white/10 bg-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-medium text-white">Fabric Network</h4>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Nodes:</span>
              <span className="text-white">{metrics.fabric.nodeCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active:</span>
              <span className="text-green-400">{metrics.fabric.activeNodes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Latency:</span>
              <span className="text-white">{metrics.fabric.averageLatency.toFixed(0)}ms</span>
            </div>
            {metrics.fabric.unstableNodes.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Unstable:</span>
                <span className="text-red-400">{metrics.fabric.unstableNodes.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ritual Engine */}
        <div className="p-4 rounded border border-white/10 bg-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-medium text-white">Ritual Engine</h4>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Active Rituals:</span>
              <span className={currentRitual ? "text-green-400" : "text-gray-400"}>
                {metrics.rituals.active}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={currentRitual ? "text-green-400" : "text-gray-400"}>
                {currentRitual ? currentRitual.phase : "Idle"}
              </span>
            </div>
          </div>
        </div>

        {/* ArchonAI */}
        <div className="p-4 rounded border border-white/10 bg-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-medium text-white">ArchonAI</h4>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Pending:</span>
              <span className="text-yellow-400">{metrics.archon.pendingProposals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Proposal:</span>
              <span className="text-gray-400">
                {metrics.archon.lastProposalTime
                  ? new Date(metrics.archon.lastProposalTime).toLocaleTimeString()
                  : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Anomalies */}
        <div className="p-4 rounded border border-white/10 bg-white/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h4 className="text-sm font-medium text-white">Anomalies</h4>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Recent (1h):</span>
              <span className={metrics.anomalies.recent > 0 ? "text-yellow-400" : "text-green-400"}>
                {metrics.anomalies.recent}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Critical:</span>
              <span className={metrics.anomalies.critical > 0 ? "text-red-400" : "text-green-400"}>
                {metrics.anomalies.critical}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

