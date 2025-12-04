"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Filter, Clock, User, Bot, Settings } from "lucide-react";
import { SystemEvent } from "@/lib/stateHistory/timelineTypes";
import { graphqlRequest } from "@/lib/graphql";

type ActorFilter = "ALL" | "SYSTEM" | "ARCHON" | "OPERATOR";

export function OpsLogView() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [actorFilter, setActorFilter] = useState<ActorFilter>("ALL");

  useEffect(() => {
    fetchOpsLog();
  }, [actorFilter]);

  const fetchOpsLog = async () => {
    setLoading(true);
    try {
      // Map actor filter to source filter
      const sourceFilter = actorFilter === "ALL" 
        ? undefined 
        : actorFilter === "ARCHON"
        ? "archon_ai"
        : actorFilter === "OPERATOR"
        ? "operator"
        : "system";

      const query = `
        query GetSystemEvents($type: String, $source: String, $limit: Int, $offset: Int) {
          systemEvents(type: $type, source: $source, limit: $limit, offset: $offset) {
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
      const data = await graphqlRequest<{ systemEvents: any[] }>(query, {
        source: sourceFilter,
        limit: 100,
        offset: 0,
      });
      setEvents(data.systemEvents.map((e: any) => ({
        ...e,
        metadata: e.metadata ? JSON.parse(e.metadata) : undefined,
      })));
    } catch (err: any) {
      console.error("Failed to fetch ops log:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActorIcon = (source: string) => {
    if (source === "archon_ai" || source.includes("archon")) {
      return <Bot className="w-4 h-4 text-purple-400" />;
    }
    if (source === "operator" || source.includes("user")) {
      return <User className="w-4 h-4 text-blue-400" />;
    }
    return <Settings className="w-4 h-4 text-gray-400" />;
  };

  const getEventTypeColor = (type: string) => {
    if (type.includes("ARCHON")) return "text-purple-400";
    if (type.includes("RITUAL")) return "text-yellow-400";
    if (type.includes("FABRIC") || type.includes("ANOMALY")) return "text-red-400";
    if (type.includes("ACTION")) return "text-green-400";
    return "text-gray-400";
  };

  const filteredEvents = events.filter((e) => {
    if (actorFilter === "ALL") return true;
    if (actorFilter === "ARCHON") return e.source.includes("archon");
    if (actorFilter === "OPERATOR") return e.source === "operator" || e.source.includes("user");
    return e.source === "system";
  });

  return (
    <div className="glass-dark rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-oswald text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Operations Log
        </h3>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value as ActorFilter)}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm"
          >
            <option value="ALL">All Actors</option>
            <option value="SYSTEM">System</option>
            <option value="ARCHON">ArchonAI</option>
            <option value="OPERATOR">Operators</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Loading ops log...
        </div>
      )}

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredEvents.map((event) => (
          <motion.div
            key={event.id}
            className="p-3 rounded bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getActorIcon(event.source)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-white font-medium mb-1">{event.title}</div>
                <div className="text-xs text-gray-400">{event.description}</div>
                {event.relatedSnapshotId && (
                  <div className="mt-2 text-xs text-blue-400">
                    Related to snapshot: {event.relatedSnapshotId.slice(0, 16)}...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredEvents.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No operations logged yet.</p>
        </div>
      )}
    </div>
  );
}

