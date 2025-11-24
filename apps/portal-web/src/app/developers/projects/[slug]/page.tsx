"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Code, User, ArrowLeft, Plus, ExternalLink, Package, Edit } from "lucide-react";
import { graphqlQuery, getDevCapsulesByProject, createDevCapsule, updateDevCapsuleStatus, DevCapsule } from "@/lib/graphql";

interface Project {
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
  maintainers: Array<{
    address: string;
    username: string;
    reputation: number;
  }>;
}

export default function ProjectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMaintainer, setShowAddMaintainer] = useState(false);
  const [newMaintainerAddress, setNewMaintainerAddress] = useState("");
  const [adding, setAdding] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [capsules, setCapsules] = useState<DevCapsule[]>([]);
  const [showCreateCapsule, setShowCreateCapsule] = useState(false);
  const [capsuleNotes, setCapsuleNotes] = useState("");
  const [creatingCapsule, setCreatingCapsule] = useState(false);
  const [updatingCapsule, setUpdatingCapsule] = useState<string | null>(null);

  useEffect(() => {
    const storedAddress = localStorage.getItem("demiurge_address");
    setAddress(storedAddress);
    if (slug) {
      loadProject();
      loadCapsules();
    }
  }, [slug]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const query = `
        query {
          project(slug: "${slug}") {
            slug
            name
            description
            createdAt
            maintainers {
              address
              username
              reputation
            }
          }
        }
      `;
      const data = await graphqlQuery(query);
      if (data?.data?.project) {
        setProject(data.data.project);
      }
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCapsules = async () => {
    try {
      const data = await getDevCapsulesByProject(slug);
      setCapsules(data);
    } catch (err) {
      console.error("Failed to load capsules:", err);
    }
  };

  const handleAddMaintainer = async () => {
    if (!address || !newMaintainerAddress) {
      return;
    }

    try {
      setAdding(true);
      const mutation = `
        mutation {
          addProjectMaintainer(slug: "${slug}", address: "${newMaintainerAddress}") {
            slug
            name
          }
        }
      `;
      await graphqlQuery(mutation, { "x-demiurge-address": address });
      setShowAddMaintainer(false);
      setNewMaintainerAddress("");
      await loadProject();
    } catch (err: any) {
      alert(`Failed to add maintainer: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleCreateCapsule = async () => {
    if (!address || !capsuleNotes.trim()) {
      return;
    }

    try {
      setCreatingCapsule(true);
      await createDevCapsule(address, slug, capsuleNotes.trim(), address);
      setShowCreateCapsule(false);
      setCapsuleNotes("");
      await loadCapsules();
    } catch (err: any) {
      alert(`Failed to create capsule: ${err.message}`);
    } finally {
      setCreatingCapsule(false);
    }
  };

  const handleUpdateCapsuleStatus = async (capsuleId: string, newStatus: "draft" | "live" | "paused" | "archived") => {
    if (!address) {
      return;
    }

    try {
      setUpdatingCapsule(capsuleId);
      await updateDevCapsuleStatus(capsuleId, newStatus, address);
      await loadCapsules();
    } catch (err: any) {
      alert(`Failed to update capsule status: ${err.message}`);
    } finally {
      setUpdatingCapsule(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "paused":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "archived":
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const isMaintainer = project?.maintainers.some((m) => m.address === address);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-zinc-400">Project not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/developers/projects"
          className="text-zinc-400 hover:text-zinc-300 mb-6 inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="space-y-6">
          {/* Project Header */}
          <div className="p-8 rounded-lg border border-zinc-800 bg-zinc-900">
            <div className="flex items-start gap-4 mb-4">
              <Code className="h-8 w-8 text-rose-400" />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-zinc-50 mb-2">{project.name}</h1>
                <p className="text-sm text-zinc-400 font-mono mb-2">{project.slug}</p>
                {project.description && (
                  <p className="text-zinc-300 mb-4">{project.description}</p>
                )}
                <p className="text-sm text-zinc-500">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Maintainers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-50 flex items-center gap-2">
                <User className="h-5 w-5" />
                Maintainers ({project.maintainers.length})
              </h2>
              {isMaintainer && (
                <button
                  onClick={() => setShowAddMaintainer(!showAddMaintainer)}
                  className="px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Maintainer
                </button>
              )}
            </div>

            {showAddMaintainer && (
              <div className="mb-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900">
                <label className="block text-sm text-zinc-400 mb-2">Developer Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMaintainerAddress}
                    onChange={(e) => setNewMaintainerAddress(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50"
                  />
                  <button
                    onClick={handleAddMaintainer}
                    disabled={adding || !newMaintainerAddress}
                    className="px-6 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                  >
                    {adding ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {project.maintainers.map((maintainer) => (
                <Link
                  key={maintainer.address}
                  href={`/developers/${maintainer.username}`}
                  className="block p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-50">@{maintainer.username}</div>
                      <div className="text-sm text-zinc-400 font-mono">
                        {maintainer.address.slice(0, 10)}...{maintainer.address.slice(-8)}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Capsules */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-50 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Capsules ({capsules.length})
              </h2>
              {isMaintainer && (
                <button
                  onClick={() => setShowCreateCapsule(!showCreateCapsule)}
                  className="px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Create Capsule
                </button>
              )}
            </div>

            {showCreateCapsule && (
              <div className="mb-4 p-4 rounded-lg border border-zinc-800 bg-zinc-900">
                <label className="block text-sm text-zinc-400 mb-2">Capsule Notes</label>
                <textarea
                  value={capsuleNotes}
                  onChange={(e) => setCapsuleNotes(e.target.value)}
                  placeholder="Describe the purpose of this capsule..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50 mb-3 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateCapsule}
                    disabled={creatingCapsule || !capsuleNotes.trim()}
                    className="px-6 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                  >
                    {creatingCapsule ? "Creating..." : "Create"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateCapsule(false);
                      setCapsuleNotes("");
                    }}
                    className="px-6 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {capsules.length === 0 ? (
              <div className="p-8 rounded-lg border border-zinc-800 bg-zinc-900 text-center">
                <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">No capsules yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {capsules.map((capsule) => (
                  <div
                    key={capsule.id}
                    className="p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono text-zinc-400">#{capsule.id}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(capsule.status)}`}
                          >
                            {capsule.status.toUpperCase()}
                          </span>
                        </div>
                        {capsule.notes && (
                          <p className="text-zinc-300 text-sm mb-2">{capsule.notes}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                          <span>
                            Created: {new Date(capsule.createdAt * 1000).toLocaleDateString()}
                          </span>
                          <span>
                            Updated: {new Date(capsule.updatedAt * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {isMaintainer && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={capsule.status}
                            onChange={(e) =>
                              handleUpdateCapsuleStatus(
                                capsule.id,
                                e.target.value as "draft" | "live" | "paused" | "archived"
                              )
                            }
                            disabled={updatingCapsule === capsule.id}
                            className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-50 text-sm min-h-[44px] sm:min-h-0"
                          >
                            <option value="draft">Draft</option>
                            <option value="live">Live</option>
                            <option value="paused">Paused</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recursion Worlds */}
          <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-50 mb-4 flex items-center gap-2">
              <Code className="h-5 w-5" />
              Recursion Worlds
            </h2>
            <p className="text-zinc-400 text-sm mb-4">
              Recursion Engine worlds are chain-native game environments that can react to on-chain events.
            </p>
            <Link
              href="/docs/developers/recursion"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border border-violet-500/30 transition-colors text-sm"
            >
              Open Recursion Docs →
            </Link>
          </div>

          {/* Resources */}
          <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-50 mb-4">Resources</h2>
            <div className="space-y-2">
              <Link
                href="/docs/developers/templates"
                className="block text-rose-400 hover:text-rose-300"
              >
                View Templates →
              </Link>
              <Link
                href="/docs"
                className="block text-rose-400 hover:text-rose-300"
              >
                Documentation →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

