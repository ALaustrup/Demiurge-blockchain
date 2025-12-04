"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Camera, Activity, ArrowLeft } from "lucide-react";
import { SystemEvent, SystemSnapshot, TimelineFilters } from "@/lib/stateHistory/timelineTypes";
import { graphqlRequest } from "@/lib/graphql";

interface TimelineViewProps {
  onSnapshotSelect?: (snapshot: SystemSnapshot) => void;
  onReturnToLive?: () => void;
  selectedSnapshotId?: string | null;
}

export function TimelineView({ onSnapshotSelect, onReturnToLive, selectedSnapshotId }: TimelineViewProps) {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [snapshots, setSnapshots] = useState<SystemSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TimelineFilters>({
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    fetchTimeline();
  }, [filters]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      // Fetch events
      const eventsQuery = `
        query GetSystemEvents($type: String, $source: String, $startTime: Int, $endTime: Int, $limit: Int, $offset: Int) {
          systemEvents(type: $type, source: $source, startTime: $startTime, endTime: $endTime, limit: $limit, offset: $offset) {
            id
            type
            source
            title
            description
            timestamp
            metadata
            relatedSnapshotId
          }
        }
      `;
      const eventsData = await graphqlRequest<{ systemEvents: any[] }>(eventsQuery, filters);
      setEvents(eventsData.systemEvents.map((e: any) => {
        try {
          return {
            ...e,
            metadata: e.metadata ? JSON.parse(e.metadata) : undefined,
          };
        } catch (parseError) {
          console.warn(`Failed to parse event ${e.id} metadata:`, parseError);
          return { ...e, metadata: undefined };
        }
      }));

      // Fetch snapshots with error handling for corrupted/partial data
      const snapshotsQuery = `
        query GetSystemSnapshots($startTime: Int, $endTime: Int, $limit: Int, $offset: Int) {
          systemSnapshots(startTime: $startTime, endTime: $endTime, limit: $limit, offset: $offset) {
            id
            timestamp
            label
            fabricState
            ritualsState
            capsulesState
            shaderState
            metadata
          }
        }
      `;
      const snapshotsData = await graphqlRequest<{ systemSnapshots: any[] }>(snapshotsQuery, filters);
      setSnapshots(snapshotsData.systemSnapshots.map((s: any) => {
        try {
          // Safely parse each field, with fallbacks for corrupted data
          let fabricState = { nodes: [], edges: [] };
          let ritualsState: any[] = [];
          let capsulesState: any[] = [];
          let shaderState: any = {};
          let metadata: any = {};

          try {
            fabricState = s.fabricState ? JSON.parse(s.fabricState) : { nodes: [], edges: [] };
          } catch (e) {
            console.warn(`Failed to parse fabricState for snapshot ${s.id}:`, e);
          }

          try {
            ritualsState = s.ritualsState ? JSON.parse(s.ritualsState) : [];
          } catch (e) {
            console.warn(`Failed to parse ritualsState for snapshot ${s.id}:`, e);
          }

          try {
            capsulesState = s.capsulesState ? JSON.parse(s.capsulesState) : [];
          } catch (e) {
            console.warn(`Failed to parse capsulesState for snapshot ${s.id}:`, e);
          }

          try {
            shaderState = s.shaderState ? JSON.parse(s.shaderState) : {};
          } catch (e) {
            console.warn(`Failed to parse shaderState for snapshot ${s.id}:`, e);
          }

          try {
            metadata = s.metadata ? JSON.parse(s.metadata) : {};
          } catch (e) {
            console.warn(`Failed to parse metadata for snapshot ${s.id}:`, e);
          }

          return {
            ...s,
            fabricState,
            ritualsState,
            capsulesState,
            shaderState,
            metadata,
            _isCorrupted: false, // Flag for UI display
          };
        } catch (error) {
          console.error(`Failed to parse snapshot ${s.id}:`, error);
          // Return a minimal valid snapshot structure
          return {
            ...s,
            fabricState: { nodes: [], edges: [] },
            ritualsState: [],
            capsulesState: [],
            shaderState: {},
            metadata: {},
            _isCorrupted: true,
          };
        }
      }));
    } catch (err: any) {
      console.error("Failed to fetch timeline:", err);
      // Set empty arrays on error to prevent UI breakage
      setEvents([]);
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  };

  const [restoringSnapshot, setRestoringSnapshot] = useState(false);

  const handleSnapshotClick = async (snapshot: SystemSnapshot) => {
    if (restoringSnapshot) return; // Prevent multiple clicks
    
    setRestoringSnapshot(true);
    try {
      // Simulate restoration delay for UX feedback
      await new Promise((resolve) => setTimeout(resolve, 300));
      onSnapshotSelect?.(snapshot);
    } finally {
      setRestoringSnapshot(false);
    }
  };

  // Merge events and snapshots, sort by timestamp
  const timelineEntries = [
    ...events.map((e) => ({ type: "event" as const, data: e, timestamp: e.timestamp })),
    ...snapshots.map((s) => ({ type: "snapshot" as const, data: s, timestamp: s.timestamp })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="glass-dark rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-oswald text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timeline & Time Travel
          </h3>
          {selectedSnapshotId ? (
            <span className="px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-medium">
              HISTORICAL VIEW
            </span>
          ) : (
            <span className="px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium">
              LIVE
            </span>
          )}
        </div>
        {selectedSnapshotId && onReturnToLive && (
          <motion.button
            onClick={onReturnToLive}
            className="px-3 py-1.5 rounded bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 text-sm font-medium transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-3 h-3" />
            Return to Live
          </motion.button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Loading timeline...
        </div>
      )}

      {restoringSnapshot && (
        <div className="flex items-center gap-2 text-sm text-yellow-400 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
          <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          Restoring snapshot...
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {timelineEntries.map((entry) => (
          <motion.div
            key={entry.data.id}
            className={`p-3 rounded border ${
              entry.type === "snapshot"
                ? "border-blue-500/30 bg-blue-500/5"
                : "border-white/10 bg-white/5"
            } ${
              entry.type === "snapshot" && entry.data.id === selectedSnapshotId
                ? "ring-2 ring-blue-500"
                : ""
            } cursor-pointer hover:border-white/20 transition-colors`}
            onClick={() => entry.type === "snapshot" && handleSnapshotClick(entry.data)}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-start gap-3">
              {entry.type === "snapshot" ? (
                <Camera className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              ) : (
                <Activity className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {entry.type === "snapshot" ? (entry.data as SystemSnapshot).label || "Snapshot" : (entry.data as SystemEvent).title}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {entry.type === "snapshot" ? "System snapshot" : (entry.data as SystemEvent).description}
                </p>
                {entry.type === "snapshot" && entry.data.id === selectedSnapshotId && (
                  <div className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                    <span>✓ Currently viewing this snapshot</span>
                  </div>
                )}
                {entry.type === "snapshot" && (entry.data as any)._isCorrupted && (
                  <div className="mt-2 text-xs text-orange-400 flex items-center gap-1">
                    <span>⚠ Partial data (some fields may be missing)</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {timelineEntries.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No timeline entries yet.</p>
        </div>
      )}
    </div>
  );
}

