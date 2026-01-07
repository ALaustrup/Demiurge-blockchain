/**
 * WRYT State Store
 * 
 * Zustand store for managing WRYT document editor state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  WrytProject, 
  WrytDocument, 
  EditorSettings, 
  ToolbarConfig,
  LayoutPreset,
  PanelState,
  WrytView,
  TemplateConfig
} from '../types';
import { DEFAULT_TEMPLATES } from '../utils/templates';

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Store Types
// ============================================================================

interface WrytState {
  // View
  currentView: WrytView;
  
  // Projects & Documents
  projects: WrytProject[];
  documents: WrytDocument[];
  activeProjectId: string | null;
  activeDocumentId: string | null;
  
  // Editor
  editorSettings: EditorSettings;
  toolbarConfig: ToolbarConfig;
  layout: LayoutPreset;
  panels: PanelState;
  
  // Auto-save
  lastSavedAt: number | null;
  hasUnsavedChanges: boolean;
  
  // View actions
  setView: (view: WrytView) => void;
  
  // Project actions
  createProject: (name: string, templateId: string, description?: string) => WrytProject;
  updateProject: (id: string, updates: Partial<WrytProject>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  
  // Document actions
  createDocument: (projectId: string, title: string, templateId: string) => WrytDocument;
  updateDocument: (id: string, updates: Partial<WrytDocument>) => void;
  updateDocumentContent: (id: string, content: string, wordCount: number, charCount: number) => void;
  deleteDocument: (id: string) => void;
  setActiveDocument: (id: string | null) => void;
  
  // Settings actions
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  updateToolbarConfig: (config: Partial<ToolbarConfig>) => void;
  setLayout: (layout: LayoutPreset) => void;
  togglePanel: (panel: keyof PanelState) => void;
  
  // Auto-save actions
  markSaved: () => void;
  markUnsaved: () => void;
  
  // Getters
  getActiveProject: () => WrytProject | null;
  getActiveDocument: () => WrytDocument | null;
  getProjectDocuments: (projectId: string) => WrytDocument[];
  getRecentProjects: (limit?: number) => WrytProject[];
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  theme: 'dark',
  fontSize: 16,
  fontFamily: 'Georgia, serif',
  lineHeight: 1.8,
  showLineNumbers: false,
  showWordCount: true,
  autoSave: true,
  autoSaveInterval: 30,
  spellCheck: true,
  focusModeEnabled: false,
};

const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
  position: 'top',
  size: 'standard',
  items: [
    { id: 'bold', type: 'button', visible: true, order: 0 },
    { id: 'italic', type: 'button', visible: true, order: 1 },
    { id: 'underline', type: 'button', visible: true, order: 2 },
    { id: 'separator1', type: 'separator', visible: true, order: 3 },
    { id: 'heading', type: 'dropdown', visible: true, order: 4 },
    { id: 'separator2', type: 'separator', visible: true, order: 5 },
    { id: 'alignLeft', type: 'button', visible: true, order: 6 },
    { id: 'alignCenter', type: 'button', visible: true, order: 7 },
    { id: 'alignRight', type: 'button', visible: true, order: 8 },
    { id: 'separator3', type: 'separator', visible: true, order: 9 },
    { id: 'bulletList', type: 'button', visible: true, order: 10 },
    { id: 'orderedList', type: 'button', visible: true, order: 11 },
  ],
};

const DEFAULT_PANELS: PanelState = {
  navigator: true,
  info: true,
  comments: false,
  preview: false,
};

// ============================================================================
// Store
// ============================================================================

export const useWrytStore = create<WrytState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentView: 'welcome',
      projects: [],
      documents: [],
      activeProjectId: null,
      activeDocumentId: null,
      editorSettings: DEFAULT_EDITOR_SETTINGS,
      toolbarConfig: DEFAULT_TOOLBAR_CONFIG,
      layout: 'editing',
      panels: DEFAULT_PANELS,
      lastSavedAt: null,
      hasUnsavedChanges: false,
      
      // View actions
      setView: (view) => set({ currentView: view }),
      
      // Project actions
      createProject: (name, templateId, description = '') => {
        const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
        const project: WrytProject = {
          id: generateId(),
          name,
          description,
          template: templateId,
          documents: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          wordCount: 0,
          progress: 0,
        };
        
        set((state) => ({
          projects: [...state.projects, project],
          activeProjectId: project.id,
          currentView: 'editor',
        }));
        
        // Create initial document
        const doc = get().createDocument(project.id, 'Untitled', templateId);
        
        return project;
      },
      
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },
      
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          documents: state.documents.filter((d) => d.projectId !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
          activeDocumentId: state.documents.find(d => d.id === state.activeDocumentId)?.projectId === id 
            ? null 
            : state.activeDocumentId,
        }));
      },
      
      setActiveProject: (id) => {
        set({ activeProjectId: id });
        // Also set first document as active
        if (id) {
          const docs = get().getProjectDocuments(id);
          if (docs.length > 0) {
            set({ activeDocumentId: docs[0].id });
          }
        }
      },
      
      // Document actions
      createDocument: (projectId, title, templateId) => {
        const doc: WrytDocument = {
          id: generateId(),
          projectId,
          title,
          content: '',
          template: templateId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          wordCount: 0,
          characterCount: 0,
          tags: ['textual'],
        };
        
        set((state) => ({
          documents: [...state.documents, doc],
          activeDocumentId: doc.id,
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, documents: [...p.documents, doc.id], updatedAt: Date.now() }
              : p
          ),
        }));
        
        return doc;
      },
      
      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
          ),
          hasUnsavedChanges: true,
        }));
      },
      
      updateDocumentContent: (id, content, wordCount, charCount) => {
        set((state) => {
          const doc = state.documents.find(d => d.id === id);
          if (!doc) return state;
          
          return {
            documents: state.documents.map((d) =>
              d.id === id 
                ? { ...d, content, wordCount, characterCount: charCount, updatedAt: Date.now() } 
                : d
            ),
            projects: state.projects.map((p) =>
              p.id === doc.projectId
                ? {
                    ...p,
                    wordCount: state.documents
                      .filter(d => d.projectId === p.id)
                      .reduce((sum, d) => sum + (d.id === id ? wordCount : d.wordCount), 0),
                    updatedAt: Date.now(),
                  }
                : p
            ),
            hasUnsavedChanges: true,
          };
        });
      },
      
      deleteDocument: (id) => {
        const doc = get().documents.find(d => d.id === id);
        if (!doc) return;
        
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
          projects: state.projects.map((p) =>
            p.id === doc.projectId
              ? { ...p, documents: p.documents.filter((dId) => dId !== id) }
              : p
          ),
          activeDocumentId: state.activeDocumentId === id ? null : state.activeDocumentId,
        }));
      },
      
      setActiveDocument: (id) => set({ activeDocumentId: id }),
      
      // Settings actions
      updateEditorSettings: (settings) => {
        set((state) => ({
          editorSettings: { ...state.editorSettings, ...settings },
        }));
      },
      
      updateToolbarConfig: (config) => {
        set((state) => ({
          toolbarConfig: { ...state.toolbarConfig, ...config },
        }));
      },
      
      setLayout: (layout) => set({ layout }),
      
      togglePanel: (panel) => {
        set((state) => ({
          panels: { ...state.panels, [panel]: !state.panels[panel] },
        }));
      },
      
      // Auto-save actions
      markSaved: () => set({ lastSavedAt: Date.now(), hasUnsavedChanges: false }),
      markUnsaved: () => set({ hasUnsavedChanges: true }),
      
      // Getters
      getActiveProject: () => {
        const state = get();
        return state.projects.find((p) => p.id === state.activeProjectId) || null;
      },
      
      getActiveDocument: () => {
        const state = get();
        return state.documents.find((d) => d.id === state.activeDocumentId) || null;
      },
      
      getProjectDocuments: (projectId) => {
        return get().documents.filter((d) => d.projectId === projectId);
      },
      
      getRecentProjects: (limit = 10) => {
        return [...get().projects]
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, limit);
      },
    }),
    {
      name: 'wryt-storage',
      partialize: (state) => ({
        projects: state.projects,
        documents: state.documents,
        editorSettings: state.editorSettings,
        toolbarConfig: state.toolbarConfig,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectActiveProject = (state: WrytState) =>
  state.projects.find((p) => p.id === state.activeProjectId) || null;

export const selectActiveDocument = (state: WrytState) =>
  state.documents.find((d) => d.id === state.activeDocumentId) || null;

export const selectProjectDocuments = (state: WrytState, projectId: string) =>
  state.documents.filter((d) => d.projectId === projectId);
