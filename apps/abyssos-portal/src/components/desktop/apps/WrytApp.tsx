/**
 * WRYT - Document Creation Suite
 * 
 * A professional document editor with rich text editing,
 * multiple format support, templates, and cloud sync via AbyssID.
 * 
 * Write. Create. Publish.
 */

import { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { useAbyssIDIdentity } from '../../../hooks/useAbyssIDIdentity';
import { 
  WrytProjectManager, 
  WrytTemplateSelector, 
  WrytToolbar,
  useWrytStore,
  getTemplateById,
} from './wryt';
import { useAutoSave, useSaveShortcut } from './wryt/hooks/useAutoSave';

// ============================================================================
// Editor Styles
// ============================================================================

const editorStyles = `
  .ProseMirror {
    outline: none;
    min-height: 100%;
  }
  
  .ProseMirror.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #6b7280;
    pointer-events: none;
    height: 0;
  }
  
  .ProseMirror p {
    margin: 0 0 1em 0;
  }
  
  .ProseMirror h1 {
    font-size: 2em;
    font-weight: bold;
    margin: 1em 0 0.5em 0;
  }
  
  .ProseMirror h2 {
    font-size: 1.5em;
    font-weight: bold;
    margin: 1em 0 0.5em 0;
  }
  
  .ProseMirror h3 {
    font-size: 1.25em;
    font-weight: bold;
    margin: 1em 0 0.5em 0;
  }
  
  .ProseMirror h4 {
    font-size: 1.125em;
    font-weight: bold;
    margin: 1em 0 0.5em 0;
  }
  
  .ProseMirror ul,
  .ProseMirror ol {
    margin: 0 0 1em 1.5em;
    padding: 0;
  }
  
  .ProseMirror li {
    margin: 0.25em 0;
  }
  
  .ProseMirror blockquote {
    border-left: 3px solid #00d4ff;
    margin: 1em 0;
    padding-left: 1em;
    color: #9ca3af;
    font-style: italic;
  }
  
  .ProseMirror code {
    background: rgba(0, 212, 255, 0.1);
    border-radius: 0.25em;
    padding: 0.2em 0.4em;
    font-family: 'Fira Code', monospace;
    font-size: 0.9em;
  }
  
  .ProseMirror pre {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 0.5em;
    padding: 1em;
    margin: 1em 0;
    overflow-x: auto;
  }
  
  .ProseMirror pre code {
    background: none;
    padding: 0;
  }
  
  .ProseMirror hr {
    border: none;
    border-top: 1px solid rgba(0, 212, 255, 0.2);
    margin: 2em 0;
  }
  
  .ProseMirror img {
    max-width: 100%;
    height: auto;
  }
  
  .ProseMirror mark {
    background-color: rgba(255, 230, 0, 0.3);
    border-radius: 0.25em;
  }
`;

// ============================================================================
// Navigator Panel
// ============================================================================

interface NavigatorPanelProps {
  title: string;
  content: string;
}

function NavigatorPanel({ title, content }: NavigatorPanelProps) {
  // Extract headings from content for outline
  const extractHeadings = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3, h4');
    return Array.from(headings).map((h, i) => ({
      id: `heading-${i}`,
      level: parseInt(h.tagName[1]),
      text: h.textContent || '',
    }));
  };
  
  const headings = extractHeadings(content);
  
  return (
    <div className="w-48 border-r border-abyss-cyan/20 p-3 overflow-y-auto flex-shrink-0">
      <h3 className="text-xs font-medium text-gray-500 mb-2">📄 Outline</h3>
      <div className="text-sm text-gray-400">
        {headings.length > 0 ? (
          headings.map((h) => (
            <div 
              key={h.id}
              className="py-1 hover:text-white cursor-pointer truncate"
              style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
            >
              {h.text}
            </div>
          ))
        ) : (
          <div className="text-gray-600 text-xs italic">No headings yet</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Info Panel
// ============================================================================

interface InfoPanelProps {
  wordCount: number;
  charCount: number;
  hasUnsavedChanges: boolean;
  lastSavedAt: number | null;
  onSave: () => void;
  onExport: (format: string) => void;
}

function InfoPanel({ 
  wordCount, 
  charCount, 
  hasUnsavedChanges, 
  lastSavedAt, 
  onSave,
  onExport 
}: InfoPanelProps) {
  const readingTime = Math.ceil(wordCount / 200);
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  return (
    <div className="w-48 border-l border-abyss-cyan/20 p-3 overflow-y-auto flex-shrink-0">
      <h3 className="text-xs font-medium text-gray-500 mb-3">📊 Document Info</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Words</span>
          <span className="text-white">{wordCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Characters</span>
          <span className="text-white">{charCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Reading</span>
          <span className="text-white">{readingTime} min</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-abyss-cyan/20">
        <div className="flex items-center gap-2 text-sm">
          {hasUnsavedChanges ? (
            <span className="text-yellow-400">● Modified</span>
          ) : (
            <span className="text-green-400">✓ Saved</span>
          )}
        </div>
        {lastSavedAt && (
          <div className="text-xs text-gray-500 mt-1">
            Last: {formatTime(lastSavedAt)}
          </div>
        )}
        
        <button 
          onClick={onSave}
          className="w-full mt-3 px-4 py-2 bg-abyss-cyan text-abyss-dark font-medium rounded-lg
                   hover:bg-abyss-cyan/80 transition-colors text-sm"
        >
          Save
        </button>
      </div>
      
      <h3 className="text-xs font-medium text-gray-500 mt-4 mb-2">📤 Export</h3>
      <div className="space-y-1">
        {['pdf', 'docx', 'md', 'html', 'txt'].map((format) => (
          <button 
            key={format}
            onClick={() => onExport(format)} 
            className="w-full text-left text-sm text-gray-400 hover:text-white py-1"
          >
            • {format.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WrytApp() {
  const { identity } = useAbyssIDIdentity();
  
  // Store state
  const {
    currentView,
    setView,
    projects,
    documents,
    activeProjectId,
    activeDocumentId,
    editorSettings,
    panels,
    hasUnsavedChanges,
    lastSavedAt,
    createProject,
    setActiveProject,
    updateDocumentContent,
    markSaved,
    getActiveDocument,
    getActiveProject,
    togglePanel,
  } = useWrytStore();
  
  // Local state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  
  // Get active document and project
  const activeDocument = getActiveDocument();
  const activeProject = getActiveProject();
  
  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      CharacterCount,
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: activeDocument?.content || '',
    editable: true,
    onUpdate: ({ editor }) => {
      if (activeDocument) {
        const html = editor.getHTML();
        const text = editor.getText();
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const charCount = text.length;
        updateDocumentContent(activeDocument.id, html, wordCount, charCount);
      }
    },
  });
  
  // Update editor content when document changes
  useEffect(() => {
    if (editor && activeDocument) {
      const currentContent = editor.getHTML();
      if (activeDocument.content !== currentContent) {
        editor.commands.setContent(activeDocument.content || '');
      }
      setDocumentTitle(activeDocument.title);
    }
  }, [activeDocument?.id, editor]);
  
  // Save function
  const handleSave = useCallback(() => {
    if (activeDocument && editor) {
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      const charCount = text.length;
      updateDocumentContent(activeDocument.id, html, wordCount, charCount);
      markSaved();
      // TODO: Sync to AbyssID storage
    }
  }, [activeDocument, editor, updateDocumentContent, markSaved]);
  
  // Auto-save
  useAutoSave({
    content: activeDocument?.content || '',
    hasChanges: hasUnsavedChanges,
    enabled: editorSettings.autoSave,
    interval: editorSettings.autoSaveInterval * 1000,
    onSave: handleSave,
  });
  
  // Save shortcut
  useSaveShortcut(handleSave);
  
  // Export handler
  const handleExport = useCallback((format: string) => {
    alert(`Export to ${format.toUpperCase()} - Coming soon!`);
  }, []);
  
  // Handle new project
  const handleNewProject = () => {
    setShowTemplateSelector(true);
  };
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string, projectName: string) => {
    createProject(projectName, templateId);
    setShowTemplateSelector(false);
    setView('editor');
  };
  
  // Handle project open
  const handleOpenProject = (projectId: string) => {
    setActiveProject(projectId);
    setView('editor');
  };
  
  // Calculate word count from active document
  const wordCount = activeDocument?.wordCount || 0;
  const charCount = activeDocument?.characterCount || 0;
  
  // Render based on current view
  if (currentView === 'welcome' || projects.length === 0) {
    return (
      <div className="h-full flex flex-col bg-abyss-navy/30">
        <style>{editorStyles}</style>
        
        <WrytProjectManager
          username={identity?.username}
          onNewProject={handleNewProject}
          onOpenProject={handleOpenProject}
        />
        
        {showTemplateSelector && (
          <WrytTemplateSelector
            onSelect={handleTemplateSelect}
            onCancel={() => setShowTemplateSelector(false)}
          />
        )}
      </div>
    );
  }
  
  // Editor view
  return (
    <div className={`h-full flex flex-col bg-abyss-navy/30 ${focusMode ? 'focus-mode' : ''}`}>
      <style>{editorStyles}</style>
      
      {/* Menu Bar */}
      {!focusMode && (
        <div className="flex items-center gap-4 px-4 py-2 bg-abyss-dark/50 border-b border-abyss-cyan/20 text-sm">
          <button 
            onClick={() => setView('welcome')}
            className="text-gray-400 hover:text-white"
          >
            ← Projects
          </button>
          <div className="text-gray-600">|</div>
          <button className="text-gray-400 hover:text-white">File</button>
          <button className="text-gray-400 hover:text-white">Edit</button>
          <button className="text-gray-400 hover:text-white">View</button>
          <button className="text-gray-400 hover:text-white">Insert</button>
          <button className="text-gray-400 hover:text-white">Format</button>
          <button className="text-gray-400 hover:text-white">Tools</button>
          <button className="text-gray-400 hover:text-white">Help</button>
          
          <div className="flex-1" />
          
          {identity && (
            <span className="text-xs text-gray-500">
              Signed in as <span className="text-abyss-cyan">{identity.username}</span>
            </span>
          )}
        </div>
      )}
      
      {/* Toolbar */}
      {!focusMode && (
        <WrytToolbar 
          editor={editor} 
          onSave={handleSave}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      )}
      
      {/* Extra toolbar row for view toggles */}
      {!focusMode && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-abyss-dark/20 border-b border-abyss-cyan/10 text-xs">
          <button 
            onClick={() => togglePanel('navigator')}
            className={`px-2 py-1 rounded ${panels.navigator ? 'text-abyss-cyan bg-abyss-cyan/10' : 'text-gray-500 hover:text-white'}`}
          >
            📋 Outline
          </button>
          <button 
            onClick={() => togglePanel('info')}
            className={`px-2 py-1 rounded ${panels.info ? 'text-abyss-cyan bg-abyss-cyan/10' : 'text-gray-500 hover:text-white'}`}
          >
            ℹ️ Info
          </button>
          <div className="flex-1" />
          <button 
            onClick={() => setFocusMode(!focusMode)}
            className="px-2 py-1 rounded text-gray-500 hover:text-white"
          >
            🎯 Focus Mode
          </button>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Navigator Panel */}
        {panels.navigator && !focusMode && (
          <NavigatorPanel 
            title={documentTitle}
            content={activeDocument?.content || ''} 
          />
        )}
        
        {/* Editor Area */}
        <div className={`flex-1 flex flex-col min-w-0 ${focusMode ? 'max-w-3xl mx-auto' : ''}`}>
          {/* Title */}
          <div className="p-4 border-b border-abyss-cyan/10">
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full text-2xl font-bold bg-transparent text-white focus:outline-none placeholder-gray-600"
              placeholder="Document Title"
            />
            {activeProject && (
              <div className="text-xs text-gray-500 mt-1">
                {activeProject.name} • {getTemplateById(activeDocument?.template || '')?.name || 'Document'}
              </div>
            )}
          </div>
          
          {/* Content Editor */}
          <div className="flex-1 overflow-y-auto p-8">
            <div 
              className="prose prose-invert max-w-none min-h-[500px]"
              style={{ 
                lineHeight: editorSettings.lineHeight,
                fontSize: `${editorSettings.fontSize}px`,
                fontFamily: editorSettings.fontFamily,
              }}
            >
              <EditorContent editor={editor} className="h-full" />
            </div>
          </div>
        </div>
        
        {/* Info Panel */}
        {panels.info && !focusMode && (
          <InfoPanel
            wordCount={wordCount}
            charCount={charCount}
            hasUnsavedChanges={hasUnsavedChanges}
            lastSavedAt={lastSavedAt}
            onSave={handleSave}
            onExport={handleExport}
          />
        )}
      </div>
      
      {/* Status Bar */}
      {!focusMode && (
        <div className="flex items-center justify-between px-4 py-1 bg-abyss-dark/50 border-t border-abyss-cyan/20 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Page 1 of 1</span>
            <span>100%</span>
            {editorSettings.spellCheck && <span className="text-green-400">✓ Spell Check</span>}
          </div>
          <div className="flex items-center gap-4">
            <span>{wordCount.toLocaleString()} words</span>
            <span>{charCount.toLocaleString()} chars</span>
          </div>
        </div>
      )}
      
      {/* Focus mode exit hint */}
      {focusMode && (
        <button
          onClick={() => setFocusMode(false)}
          className="fixed bottom-4 right-4 text-xs text-gray-600 hover:text-white transition-colors"
        >
          Press Esc or click to exit focus mode
        </button>
      )}
      
      {/* Template selector modal */}
      {showTemplateSelector && (
        <WrytTemplateSelector
          onSelect={handleTemplateSelect}
          onCancel={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
}
