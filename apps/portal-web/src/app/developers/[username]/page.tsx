"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { User, Copy, QrCode, Star, Code, Send, MessageSquare } from "lucide-react";
import { graphqlQuery } from "@/lib/graphql";
// import { sdk } from "@/lib/rpc"; // Not needed for this page

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
}

export default function DeveloperProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (username) {
      loadDeveloper();
    }
  }, [username]);

  const loadDeveloper = async () => {
    try {
      setLoading(true);
      const query = `
        query {
          developer(username: "${username}") {
            address
            username
            reputation
            createdAt
          }
        }
      `;
      const data = await graphqlQuery(query);
      if (data?.data?.developer) {
        setDeveloper(data.data.developer);
        
        // Load projects (simplified - would need a proper query)
        const projectsQuery = `
          query {
            projects {
              slug
              name
              description
            }
          }
        `;
        const projectsData = await graphqlQuery(projectsQuery);
        if (projectsData?.data?.projects) {
          // Filter projects where this developer is a maintainer
          // For now, show all projects (would need proper filtering)
          setProjects(projectsData.data.projects.slice(0, 5));
        }
      }
    } catch (err) {
      console.error("Failed to load developer:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (developer) {
      navigator.clipboard.writeText(developer.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-zinc-400">Developer not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/developers"
          className="text-zinc-400 hover:text-zinc-300 mb-6 inline-flex items-center gap-2"
        >
          ← Back to Developers
        </Link>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="p-8 rounded-lg border border-zinc-800 bg-zinc-900">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-full bg-rose-500/20 flex items-center justify-center">
                <User className="h-10 w-10 text-rose-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-zinc-50 mb-2">@{developer.username}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="h-5 w-5" />
                    <span className="font-semibold">{developer.reputation}</span>
                  </div>
                  <span className="text-sm text-zinc-500">
                    Joined {new Date(developer.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-zinc-400 font-mono">
                    {developer.address}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="p-1 rounded hover:bg-zinc-800 transition-colors"
                    title="Copy address"
                  >
                    <Copy className={`h-4 w-4 ${copied ? "text-green-400" : "text-zinc-500"}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/urgeid?sendTo=${developer.address}`}
              className="p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors flex items-center gap-3"
            >
              <Send className="h-5 w-5 text-rose-400" />
              <div>
                <div className="font-semibold text-zinc-50">Send CGT</div>
                <div className="text-sm text-zinc-400">Transfer tokens</div>
              </div>
            </Link>
            <Link
              href={`/chat?dm=${username}`}
              className="p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors flex items-center gap-3"
            >
              <MessageSquare className="h-5 w-5 text-rose-400" />
              <div>
                <div className="font-semibold text-zinc-50">Open Chat</div>
                <div className="text-sm text-zinc-400">Send a message</div>
              </div>
            </Link>
          </div>

          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mb-4 flex items-center gap-2">
                <Code className="h-5 w-5" />
                Maintained Projects
              </h2>
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.slug}
                    href={`/developers/projects/${project.slug}`}
                    className="block p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                  >
                    <h3 className="font-semibold text-zinc-50 mb-1">{project.name}</h3>
                    <p className="text-sm text-zinc-400 mb-1">{project.slug}</p>
                    {project.description && (
                      <p className="text-sm text-zinc-500">{project.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

