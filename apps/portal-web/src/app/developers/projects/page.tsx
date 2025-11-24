"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Code, Plus, Search, ArrowRight } from "lucide-react";
import { graphqlQuery } from "@/lib/graphql";

interface Project {
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ slug: "", name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const storedAddress = localStorage.getItem("demiurge_address");
    setAddress(storedAddress);
    loadProjects();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.slug.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [search, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const query = `
        query {
          projects {
            slug
            name
            description
            createdAt
          }
        }
      `;
      const data = await graphqlQuery(query);
      if (data?.data?.projects) {
        setProjects(data.data.projects);
        setFilteredProjects(data.data.projects);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!address || !newProject.slug || !newProject.name) {
      return;
    }

    try {
      setCreating(true);
      const mutation = `
        mutation {
          createProject(
            slug: "${newProject.slug.toLowerCase().trim()}"
            name: "${newProject.name}"
            description: ${newProject.description ? `"${newProject.description}"` : "null"}
          ) {
            slug
            name
            description
          }
        }
      `;
      await graphqlQuery(mutation, { "x-demiurge-address": address });
      setShowCreate(false);
      setNewProject({ slug: "", name: "", description: "" });
      await loadProjects();
    } catch (err: any) {
      alert(`Failed to create project: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-zinc-50 flex items-center gap-3">
            <Code className="h-8 w-8 text-rose-400" />
            Projects
          </h1>
          
          {address && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-6 py-3 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Create Project
            </button>
          )}
        </div>

        {showCreate && (
          <div className="mb-8 p-6 rounded-lg border border-zinc-800 bg-zinc-900">
            <h2 className="text-xl font-semibold text-zinc-50 mb-4">Create New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Slug</label>
                <input
                  type="text"
                  value={newProject.slug}
                  onChange={(e) => setNewProject({ ...newProject, slug: e.target.value })}
                  placeholder="my-awesome-project"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="My Awesome Project"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Description (optional)</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="A brief description of your project..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={creating || !newProject.slug || !newProject.name}
                  className="px-6 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setNewProject({ slug: "", name: "", description: "" });
                  }}
                  className="px-6 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50"
            />
          </div>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="text-zinc-400">Loading...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-zinc-400 text-center py-12">
            {search ? "No projects found matching your search." : "No projects yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Link
                key={project.slug}
                href={`/developers/projects/${project.slug}`}
                className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                <h3 className="text-lg font-semibold text-zinc-50 mb-2">{project.name}</h3>
                <p className="text-sm text-zinc-400 mb-2 font-mono">{project.slug}</p>
                {project.description && (
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{project.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-rose-400">
                  <span>View Project</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

