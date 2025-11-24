"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Code, User, Star, ArrowRight, Plus } from "lucide-react";
import { graphqlQuery } from "@/lib/graphql";

interface Developer {
  address: string;
  username: string;
  reputation: number;
  createdAt: string;
}

interface Project {
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function DevelopersPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  
  useEffect(() => {
    const storedAddress = localStorage.getItem("demiurge_urgeid_wallet_address") || localStorage.getItem("demiurge_address");
    if (storedAddress) {
      setAddress(storedAddress);
      // Try to load profile
      loadProfile(storedAddress);
    }
  }, []);

  const loadProfile = async (addr: string) => {
    try {
      const { callRpc } = await import("@/lib/rpc");
      const prof = await callRpc<any>("urgeid_getProfile", { address: addr });
      setProfile(prof);
    } catch (err) {
      // Ignore errors
    }
  };
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch developers
      const devsQuery = `
        query {
          developers {
            address
            username
            reputation
            createdAt
          }
        }
      `;
      const devsData = await graphqlQuery(devsQuery);
      if (devsData?.data?.developers) {
        setDevelopers(devsData.data.developers);
      }

      // Fetch projects
      const projectsQuery = `
        query {
          projects {
            slug
            name
            description
            createdAt
          }
        }
      `;
      const projectsData = await graphqlQuery(projectsQuery);
      if (projectsData?.data?.projects) {
        setProjects(projectsData.data.projects);
      }
    } catch (err) {
      console.error("Failed to load developers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!address || !profile?.username) {
      return;
    }

    try {
      setRegistering(true);
      const mutation = `
        mutation {
          registerDeveloper(username: "${profile.username}") {
            address
            username
            reputation
            createdAt
          }
        }
      `;
      await graphqlQuery(mutation, { "x-demiurge-address": address, "x-demiurge-username": profile.username });
      await loadData();
    } catch (err: any) {
      alert(`Failed to register: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-zinc-50 flex items-center gap-3">
            <Code className="h-8 w-8 text-rose-400" />
            Developers
          </h1>
          
          {address && profile?.username && (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="px-6 py-3 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              {registering ? "Registering..." : "Become a Developer"}
            </button>
          )}
        </div>

        {!address && (
          <div className="mb-8 p-6 rounded-lg border border-zinc-800 bg-zinc-900">
            <p className="text-zinc-400 mb-4">
              Create an UrgeID to register as a developer and start building on Demiurge.
            </p>
            <Link
              href="/urgeid"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
            >
              Go to My Void <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-zinc-400">Loading...</div>
        ) : (
          <div className="space-y-12">
            {/* Developers Section */}
            <section>
              <h2 className="text-2xl font-semibold text-zinc-50 mb-6 flex items-center gap-2">
                <User className="h-6 w-6" />
                Developer Directory
              </h2>
              {developers.length === 0 ? (
                <p className="text-zinc-400">No developers registered yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {developers.map((dev) => (
                    <Link
                      key={dev.address}
                      href={`/developers/${dev.username}`}
                      className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-rose-400">@{dev.username}</h3>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="h-4 w-4" />
                          <span className="text-sm">{dev.reputation}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono mb-2">
                        {dev.address.slice(0, 10)}...{dev.address.slice(-8)}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <span>View Profile</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Projects Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-zinc-50 flex items-center gap-2">
                  <Code className="h-6 w-6" />
                  Projects
                </h2>
                <Link
                  href="/developers/projects"
                  className="text-rose-400 hover:text-rose-300 text-sm flex items-center gap-1"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {projects.length === 0 ? (
                <p className="text-zinc-400">No projects yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.slice(0, 6).map((project) => (
                    <Link
                      key={project.slug}
                      href={`/developers/projects/${project.slug}`}
                      className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-zinc-50 mb-2">{project.name}</h3>
                      <p className="text-sm text-zinc-400 mb-2">{project.slug}</p>
                      {project.description && (
                        <p className="text-sm text-zinc-500 line-clamp-2">{project.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

