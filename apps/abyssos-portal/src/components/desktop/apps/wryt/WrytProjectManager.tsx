/**
 * WRYT Project Manager
 * 
 * Welcome screen with project list and new project creation
 */

import { useState } from 'react';
import { useWrytStore } from './hooks/useWrytStore';
import type { WrytProject } from './types';

// ============================================================================
// Project Card Component
// ============================================================================

interface ProjectCardProps {
  project: WrytProject;
  onClick: () => void;
  onDelete: () => void;
}

function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return date.toLocaleDateString();
  };
  
  return (
    <div 
      className="relative bg-abyss-dark/40 border border-abyss-cyan/20 rounded-lg p-4 
                 hover:border-abyss-cyan/40 hover:bg-abyss-dark/60 transition-all cursor-pointer
                 group"
      onClick={onClick}
    >
      {/* Cover/Icon */}
      <div className="w-full h-24 bg-gradient-to-br from-abyss-cyan/20 to-abyss-purple/20 rounded-md mb-3 flex items-center justify-center">
        <span className="text-4xl opacity-60">📄</span>
      </div>
      
      {/* Title */}
      <h3 className="font-medium text-white truncate mb-1">{project.name}</h3>
      
      {/* Meta */}
      <div className="text-xs text-gray-500 space-y-0.5">
        <div>{project.wordCount.toLocaleString()} words</div>
        <div>{formatDate(project.updatedAt)}</div>
      </div>
      
      {/* Progress bar */}
      {project.progress > 0 && (
        <div className="mt-2">
          <div className="h-1 bg-abyss-dark rounded-full overflow-hidden">
            <div 
              className="h-full bg-abyss-cyan transition-all" 
              style={{ width: `${project.progress}%` }} 
            />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{project.progress}% complete</div>
        </div>
      )}
      
      {/* Menu button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ⋮
      </button>
      
      {/* Dropdown menu */}
      {showMenu && (
        <div 
          className="absolute top-8 right-2 bg-abyss-dark border border-abyss-cyan/30 rounded-lg shadow-lg py-1 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="w-full px-4 py-1.5 text-left text-sm text-gray-300 hover:bg-abyss-cyan/20">
            Rename
          </button>
          <button className="w-full px-4 py-1.5 text-left text-sm text-gray-300 hover:bg-abyss-cyan/20">
            Duplicate
          </button>
          <button className="w-full px-4 py-1.5 text-left text-sm text-gray-300 hover:bg-abyss-cyan/20">
            Export
          </button>
          <hr className="border-abyss-cyan/20 my-1" />
          <button 
            className="w-full px-4 py-1.5 text-left text-sm text-red-400 hover:bg-red-500/20"
            onClick={() => {
              if (confirm('Delete this project?')) {
                onDelete();
              }
              setShowMenu(false);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// New Project Card
// ============================================================================

interface NewProjectCardProps {
  onClick: () => void;
}

function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <div 
      className="bg-abyss-dark/20 border-2 border-dashed border-abyss-cyan/30 rounded-lg p-4 
                 hover:border-abyss-cyan/60 hover:bg-abyss-dark/40 transition-all cursor-pointer
                 flex flex-col items-center justify-center min-h-[180px]"
      onClick={onClick}
    >
      <div className="text-4xl text-abyss-cyan/60 mb-2">+</div>
      <div className="text-gray-400 text-sm">New Project</div>
    </div>
  );
}

// ============================================================================
// Recent File Item
// ============================================================================

interface RecentFileProps {
  name: string;
  template: string;
  time: string;
  onClick: () => void;
}

function RecentFile({ name, template, time, onClick }: RecentFileProps) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-abyss-dark/40 rounded-lg transition-colors"
    >
      <span className="text-gray-500">📄</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-300 truncate">{name}</div>
        <div className="text-xs text-gray-500">{template} • {time}</div>
      </div>
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface WrytProjectManagerProps {
  username?: string;
  onNewProject: () => void;
  onOpenProject: (projectId: string) => void;
}

export function WrytProjectManager({ username, onNewProject, onOpenProject }: WrytProjectManagerProps) {
  const { projects, documents, deleteProject, getRecentProjects } = useWrytStore();
  
  const recentProjects = getRecentProjects(8);
  const recentDocs = [...documents]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);
  
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    return new Date(timestamp).toLocaleDateString();
  };
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          <span className="text-abyss-cyan">✍️</span> WRYT
        </h1>
        {username && (
          <p className="text-gray-400">
            Welcome back, <span className="text-abyss-cyan">@{username}</span>!
          </p>
        )}
      </div>
      
      {/* Main content area */}
      <div className="w-full max-w-4xl bg-abyss-dark/30 border border-abyss-cyan/20 rounded-xl p-6">
        {/* Projects section */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span>📁</span> Your Projects
          </h2>
          
          {projects.length === 0 ? (
            /* Empty state */
            <div className="text-center py-8">
              <div className="text-6xl mb-4 opacity-30">📝</div>
              <p className="text-gray-400 mb-4">No projects yet. Create your first project to get started!</p>
              <button
                onClick={onNewProject}
                className="px-6 py-2 bg-abyss-cyan text-abyss-dark font-medium rounded-lg
                         hover:bg-abyss-cyan/80 transition-colors"
              >
                + New Project
              </button>
            </div>
          ) : (
            /* Project grid */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => onOpenProject(project.id)}
                  onDelete={() => deleteProject(project.id)}
                />
              ))}
              <NewProjectCard onClick={onNewProject} />
            </div>
          )}
        </div>
        
        {/* Recent files section */}
        {recentDocs.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-3">Recent Files</h2>
            <div className="space-y-1">
              {recentDocs.map((doc) => {
                const project = projects.find(p => p.id === doc.projectId);
                return (
                  <RecentFile
                    key={doc.id}
                    name={`${doc.title}.wryt`}
                    template={project?.name || 'Unknown'}
                    time={formatTime(doc.updatedAt)}
                    onClick={() => {
                      if (project) {
                        onOpenProject(project.id);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer tips */}
      <div className="mt-6 text-center text-xs text-gray-600">
        💡 Tip: Press <kbd className="px-1 py-0.5 bg-abyss-dark/60 rounded">Ctrl+N</kbd> to create a new project
      </div>
    </div>
  );
}
