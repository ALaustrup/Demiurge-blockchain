"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Code, User, ArrowLeft, Plus, ExternalLink } from "lucide-react";
import { graphqlQuery } from "@/lib/graphql";

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

  useEffect(() => {
    const storedAddress = localStorage.getItem("demiurge_address");
    setAddress(storedAddress);
    if (slug) {
      loadProject();
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

