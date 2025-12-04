"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Network, Activity } from "lucide-react";
import type { FabricRitualEffects } from "@/lib/rituals/RitualContextProvider";
import type { GenesisNode, GenesisEdge } from "@/lib/genesis/GenesisFabricService";

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  address: string;
  isActive: boolean;
  bandwidth: { up: number; down: number };
  latency: number;
}

interface NetworkEdge {
  from: string;
  to: string;
  strength: number;
  active: boolean;
}
import type { GenesisNode, GenesisEdge } from "@/lib/genesis/GenesisFabricService";

interface FabricTopologyProps {
  connectedPeers?: number;
  className?: string;
  ritualEffects?: FabricRitualEffects;
  genesisNodes?: GenesisNode[];
  genesisEdges?: GenesisEdge[];
}

/**
 * FabricTopology
 * 
 * Interactive network topology visualization showing P2P node connections.
 * Displays nodes (peers) and edges (connections) with real-time updates.
 */
export function FabricTopology({ connectedPeers = 0, className = "", ritualEffects, genesisNodes, genesisEdges }: FabricTopologyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const timeRef = useRef(0);

  // Use Genesis data if provided, otherwise generate mock data
  useEffect(() => {
    if (genesisNodes && genesisEdges) {
      // Convert Genesis nodes/edges to NetworkNode/NetworkEdge format
      const convertedNodes: NetworkNode[] = genesisNodes.map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
        address: n.address,
        isActive: n.isActive,
        bandwidth: n.bandwidth,
        latency: n.latency,
      }));
      const convertedEdges: NetworkEdge[] = genesisEdges.map((e) => ({
        from: e.from,
        to: e.to,
        strength: e.strength,
        active: e.active,
      }));
      setNodes(convertedNodes);
      setEdges(convertedEdges);
      return;
    }

    // Generate mock network data (replace with real API data)
    if (connectedPeers === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Generate nodes in a circular/spiral pattern
    const newNodes: NetworkNode[] = [];
    const centerX = 0.5;
    const centerY = 0.5;
    const radius = 0.3;
    const nodeCount = Math.min(connectedPeers, 20); // Limit to 20 for performance

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const distance = radius + (Math.random() - 0.5) * 0.1;
      newNodes.push({
        id: `node-${i}`,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        address: `0x${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        isActive: Math.random() > 0.3,
        bandwidth: {
          up: Math.random() * 5,
          down: Math.random() * 3,
        },
        latency: Math.random() * 100 + 10,
      });
    }

    // Generate edges (connections between nodes)
    const newEdges: NetworkEdge[] = [];
    for (let i = 0; i < newNodes.length; i++) {
      // Each node connects to 2-4 other nodes
      const connectionCount = Math.floor(Math.random() * 3) + 2;
      const connected = new Set<number>();
      
      for (let j = 0; j < connectionCount && connected.size < connectionCount; j++) {
        let targetIndex = Math.floor(Math.random() * newNodes.length);
        if (targetIndex === i || connected.has(targetIndex)) {
          targetIndex = (targetIndex + 1) % newNodes.length;
        }
        connected.add(targetIndex);
        
        newEdges.push({
          from: newNodes[i].id,
          to: newNodes[targetIndex].id,
          strength: Math.random(),
          active: Math.random() > 0.5,
        });
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [connectedPeers, genesisNodes, genesisEdges]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Render loop
    const render = () => {
      const { width, height } = canvas;
      timeRef.current += 0.01;

      // Clear
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Apply ritual effects
      const pulseSpeed = ritualEffects?.pulseSpeed || 1.0;
      const edgePulse = ritualEffects?.edgePulse ?? false;
      const glowIntensity = ritualEffects?.glowIntensity ?? 0.0;

      // Draw edges
      edges.forEach((edge) => {
        const fromNode = nodes.find((n) => n.id === edge.from);
        const toNode = nodes.find((n) => n.id === edge.to);
        if (!fromNode || !toNode) return;

        const x1 = fromNode.x * width;
        const y1 = fromNode.y * height;
        const x2 = toNode.x * width;
        const y2 = toNode.y * height;

        // Animate active connections with ritual pulse if enabled
        const baseAlpha = edge.active ? 0.3 : 0.1;
        const pulseAlpha = edgePulse && edge.active
          ? Math.sin(timeRef.current * 2 * pulseSpeed) * 0.2
          : 0;
        const alpha = baseAlpha + pulseAlpha;
        
        ctx.strokeStyle = edge.active
          ? `rgba(139, 92, 246, ${alpha})`
          : `rgba(100, 100, 100, ${alpha})`;
        ctx.lineWidth = edge.strength * 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((node) => {
        const x = node.x * width;
        const y = node.y * height;
        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode === node.id;
        const isHighlighted = ritualEffects?.highlightNodes?.includes(node.id) ?? false;
        const shouldGlow = ritualEffects?.nodeGlow ?? false;

        // Ritual-based node glow
        if (shouldGlow && node.isActive) {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25);
          const glowAlpha = 0.2 + Math.sin(timeRef.current * pulseSpeed * 2) * 0.1;
          gradient.addColorStop(0, `rgba(139, 92, 246, ${glowAlpha * glowIntensity})`);
          gradient.addColorStop(0.5, `rgba(139, 92, 246, ${glowAlpha * glowIntensity * 0.5})`);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.fillRect(x - 25, y - 25, 50, 50);
        }

        // Node glow (hover/select)
        if (isHovered || isSelected || isHighlighted) {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
          const baseAlpha = isSelected ? 0.5 : isHighlighted ? 0.4 : 0.3;
          gradient.addColorStop(0, `rgba(139, 92, 246, ${baseAlpha})`);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.fillRect(x - 20, y - 20, 40, 40);
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, node.isActive ? 8 : 6, 0, Math.PI * 2);
        const nodeColor = isHighlighted
          ? "#fbbf24" // Yellow for highlighted
          : node.isActive
          ? isSelected
            ? "#8b5cf6"
            : isHovered
            ? "#a78bfa"
            : "#6366f1"
          : "#4b5563";
        ctx.fillStyle = nodeColor;
        ctx.fill();

        // Active pulse (with ritual speed modifier)
        if (node.isActive) {
          ctx.beginPath();
          ctx.arc(x, y, 8 + Math.sin(timeRef.current * 3 * pulseSpeed + node.id.charCodeAt(0)) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.3 + Math.sin(timeRef.current * 3 * pulseSpeed) * 0.2})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      let found = false;
      nodes.forEach((node) => {
        const dist = Math.sqrt(
          Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2)
        );
        if (dist < 0.03 && !found) {
          setHoveredNode(node.id);
          found = true;
        }
      });
      if (!found) {
        setHoveredNode(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      nodes.forEach((node) => {
        const dist = Math.sqrt(
          Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2)
        );
        if (dist < 0.03) {
          setSelectedNode(selectedNode === node.id ? null : node.id);
        }
      });
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [nodes, edges, hoveredNode, selectedNode]);

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ minHeight: "400px" }}
      />
      
      {/* Node Info Panel */}
      {selectedNodeData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 p-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg max-w-xs"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded ${selectedNodeData.isActive ? "bg-emerald-500/20" : "bg-zinc-500/20"}`}>
              <Activity className={`h-3 w-3 ${selectedNodeData.isActive ? "text-emerald-400" : "text-zinc-400"}`} />
            </div>
            <h4 className="text-sm font-semibold text-zinc-100">Node Details</h4>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <p className="text-zinc-400">Address</p>
              <p className="text-zinc-200 font-mono">{selectedNodeData.address}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-zinc-400">Upload</p>
                <p className="text-fuchsia-400">{selectedNodeData.bandwidth.up.toFixed(1)} MB/s</p>
              </div>
              <div>
                <p className="text-zinc-400">Download</p>
                <p className="text-purple-400">{selectedNodeData.bandwidth.down.toFixed(1)} MB/s</p>
              </div>
            </div>
            <div>
              <p className="text-zinc-400">Latency</p>
              <p className="text-cyan-400">{selectedNodeData.latency.toFixed(0)} ms</p>
            </div>
            <div>
              <p className="text-zinc-400">Status</p>
              <p className={selectedNodeData.isActive ? "text-emerald-400" : "text-zinc-400"}>
                {selectedNodeData.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-zinc-300">Active Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-600"></div>
            <span className="text-zinc-300">Inactive Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-purple-500/30"></div>
            <span className="text-zinc-300">Connection</span>
          </div>
        </div>
      </div>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Network className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No network nodes detected</p>
            <p className="text-xs text-zinc-500 mt-1">
              Connect to the Fabric network to see topology
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

