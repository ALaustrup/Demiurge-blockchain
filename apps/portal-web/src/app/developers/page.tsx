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
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  
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
      const prof = await callRpc<any>("urgeid_get", { address: addr });
      if (prof) {
        setProfile(prof);
        console.log("Profile loaded:", prof);
      } else {
        console.warn("Profile not found for address:", addr);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      // Try to reload after a short delay
      setTimeout(() => {
        loadProfile(addr);
      }, 2000);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reload data when address changes to ensure registration status is checked
  useEffect(() => {
    if (address && developers.length > 0) {
      // Normalize stored address: remove '0x' prefix if present, lowercase, trim
      let normalizedStored = address.toLowerCase().trim();
      if (normalizedStored.startsWith("0x")) {
        normalizedStored = normalizedStored.slice(2);
      }
      
      // Re-check registration status when address or developers list changes
      const isReg = developers.some((dev: Developer) => {
        let normalizedDev = (dev.address || "").toLowerCase().trim();
        if (normalizedDev.startsWith("0x")) {
          normalizedDev = normalizedDev.slice(2);
        }
        const matches = normalizedDev === normalizedStored;
        if (matches) {
          console.log("✅ Found registered developer in useEffect:", dev);
        }
        return matches;
      });
      
      console.log("Registration status re-check:", { 
        address: normalizedStored, 
        isReg, 
        developersCount: developers.length 
      });
      
      if (isReg !== isRegistered) {
        setIsRegistered(isReg);
      }
    }
  }, [address, developers, isRegistered]);

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
      console.log("Raw GraphQL response:", JSON.stringify(devsData, null, 2));
      
      // Handle different response structures
      let devsList: Developer[] = [];
      if (devsData?.data?.developers) {
        devsList = devsData.data.developers;
      } else if (devsData?.developers) {
        devsList = devsData.developers;
      } else if (Array.isArray(devsData)) {
        devsList = devsData;
      }
      
      if (devsList.length > 0) {
        setDevelopers(devsList);
        console.log("✅ Loaded developers:", devsList);
        
        // Check if current user is registered
        const storedAddress = localStorage.getItem("demiurge_urgeid_wallet_address") || localStorage.getItem("demiurge_address");
        if (storedAddress) {
          // Normalize stored address: remove '0x' prefix if present, lowercase, trim
          let normalizedStored = storedAddress.toLowerCase().trim();
          if (normalizedStored.startsWith("0x")) {
            normalizedStored = normalizedStored.slice(2);
          }
          
          console.log("Checking registration for address:", normalizedStored);
          
          const isReg = devsList.some((dev: Developer) => {
            // Normalize database address: remove '0x' prefix if present, lowercase, trim
            let normalizedDev = (dev.address || "").toLowerCase().trim();
            if (normalizedDev.startsWith("0x")) {
              normalizedDev = normalizedDev.slice(2);
            }
            const matches = normalizedDev === normalizedStored;
            if (matches) {
              console.log("✅ MATCH FOUND! Registered developer:", dev);
            }
            return matches;
          });
          
          console.log("Registration status check:", { 
            storedAddress: normalizedStored, 
            storedLength: normalizedStored.length,
            isReg, 
            devsList: devsList.map((d: Developer) => { 
              let addr = (d.address || "").toLowerCase().trim();
              if (addr.startsWith("0x")) addr = addr.slice(2);
              return { 
                address: addr, 
                addressLength: addr.length,
                username: d.username 
              };
            })
          });
          
          setIsRegistered(isReg);
        } else {
          console.log("No stored address found in localStorage");
          setIsRegistered(false);
        }
      } else {
        console.warn("⚠️ No developers data returned or empty array");
        console.warn("Response structure:", Object.keys(devsData || {}));
        setDevelopers([]);
        setIsRegistered(false);
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
      setDevelopers([]);
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!address || !profile?.username) {
      alert("You need an UrgeID with a claimed username to register as a developer. Please go to My Void to claim your username first.");
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
      const result = await graphqlQuery(mutation, { "x-demiurge-address": address, "x-demiurge-username": profile.username });
      
      // Reload developers list to include the newly registered developer
      await loadData();
      
      // Explicitly set registered status to true
      setIsRegistered(true);
      
      console.log("Registration successful:", result);
    } catch (err: any) {
      console.error("Registration error:", err);
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
        </div>

        {/* Registration Status Card */}
        <div className="mb-8 p-6 rounded-lg border border-zinc-800 bg-zinc-900">
          {!address ? (
            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mb-2">Join the Developer Registry</h2>
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
          ) : isRegistered === true ? (
            <div>
              <h2 className="text-xl font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                <Star className="h-5 w-5" />
                You're Registered!
              </h2>
              <p className="text-zinc-400 mb-4">
                You're part of the Demiurge Developer Registry. Start building projects and earning reputation.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/developers/projects"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors"
                >
                  View Projects <ArrowRight className="h-4 w-4" />
                </Link>
                {profile?.username && (
                  <Link
                    href={`/developers/${profile.username}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    View My Profile
                  </Link>
                )}
              </div>
            </div>
          ) : address && !profile?.username ? (
            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mb-2">Claim Your Username First</h2>
              <p className="text-zinc-400 mb-4">
                You have an UrgeID, but you need to claim a username before you can register as a developer.
                {address && (
                  <span className="block mt-2 text-sm text-zinc-500">
                    Address: {address.slice(0, 10)}...{address.slice(-8)}
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <Link
                  href="/urgeid"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                >
                  Claim Username <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => address && loadProfile(address)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Refresh Profile
                </button>
              </div>
            </div>
          ) : address && profile?.username && (isRegistered === false || isRegistered === null) ? (
            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mb-2">Ready to Register</h2>
              <p className="text-zinc-400 mb-4">
                You have an UrgeID with username <span className="text-rose-400 font-semibold">@{profile.username}</span>. Register now to join the Developer Registry.
              </p>
              <button
                onClick={handleRegister}
                disabled={registering}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                {registering ? "Registering..." : "Register as Developer"}
              </button>
            </div>
          ) : address && profile === null ? (
            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mb-2">Loading Profile...</h2>
              <p className="text-zinc-400 mb-4">
                Fetching your UrgeID profile from the chain...
              </p>
              <button
                onClick={() => address && loadProfile(address)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Retry Loading Profile
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mb-2">Status Unknown</h2>
              <p className="text-zinc-400 mb-4">
                Unable to determine registration status. Please refresh the page.
              </p>
              <button
                onClick={() => {
                  if (address) {
                    loadProfile(address);
                  }
                  loadData();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-zinc-400">Loading...</div>
        ) : (
          <div className="space-y-12">
            {/* Developers Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-zinc-50 flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Developer Directory ({developers.length})
                </h2>
                <button
                  onClick={() => {
                    console.log("Manual refresh triggered");
                    loadData();
                  }}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm"
                >
                  Refresh
                </button>
              </div>
              {developers.length === 0 ? (
                <div className="p-8 rounded-lg border border-zinc-800 bg-zinc-900 text-center">
                  <p className="text-zinc-400 mb-4">No developers registered yet.</p>
                  <button
                    onClick={loadData}
                    className="px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors text-sm"
                  >
                    Refresh List
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {developers.map((dev) => {
                    // Check if this is the current user
                    const storedAddress = localStorage.getItem("demiurge_urgeid_wallet_address") || localStorage.getItem("demiurge_address");
                    let normalizedStored = (storedAddress || "").toLowerCase().trim();
                    if (normalizedStored.startsWith("0x")) {
                      normalizedStored = normalizedStored.slice(2);
                    }
                    let normalizedDev = (dev.address || "").toLowerCase().trim();
                    if (normalizedDev.startsWith("0x")) {
                      normalizedDev = normalizedDev.slice(2);
                    }
                    const isCurrentUser = normalizedDev === normalizedStored;
                    
                    return (
                      <Link
                        key={dev.address}
                        href={`/developers/${dev.username}`}
                        className={`p-6 rounded-lg border transition-colors ${
                          isCurrentUser 
                            ? "border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20" 
                            : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-rose-400">
                            @{dev.username}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-emerald-400">(You)</span>
                            )}
                          </h3>
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
                    );
                  })}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

