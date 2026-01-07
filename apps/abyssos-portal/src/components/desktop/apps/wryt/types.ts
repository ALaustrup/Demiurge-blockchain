/**
 * WRYT Types
 * 
 * TypeScript definitions for the WRYT document editor
 */

// ============================================================================
// Template Types
// ============================================================================

export type TemplateCategory = 
  | 'writing'
  | 'publishing'
  | 'digital'
  | 'professional'
  | 'creative'
  | 'academic'
  | 'technical';

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  pageSize: PageSize;
  margins: Margins;
  defaultFont: string;
  defaultFontSize: number;
  lineHeight: number;
  features: TemplateFeature[];
}

export interface TemplateFeature {
  id: string;
  name: string;
  enabled: boolean;
}

export interface PageSize {
  name: string;
  width: string;  // e.g., "8.5in"
  height: string; // e.g., "11in"
}

export interface Margins {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

// ============================================================================
// Document Types
// ============================================================================

export interface WrytDocument {
  id: string;
  projectId: string;
  title: string;
  content: string; // JSON content from TipTap
  template: string; // Template ID
  createdAt: number;
  updatedAt: number;
  wordCount: number;
  characterCount: number;
  tags: string[];
}

export interface WrytProject {
  id: string;
  name: string;
  description: string;
  template: string;
  documents: string[]; // Document IDs
  createdAt: number;
  updatedAt: number;
  wordCount: number;
  progress: number; // 0-100%
  coverImage?: string;
}

// ============================================================================
// Editor Types
// ============================================================================

export interface EditorSettings {
  theme: 'dark' | 'light' | 'sepia' | 'custom';
  customTheme?: CustomTheme;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  showLineNumbers: boolean;
  showWordCount: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  spellCheck: boolean;
  focusModeEnabled: boolean;
}

export interface CustomTheme {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  paperTexture: 'none' | 'subtle' | 'parchment' | 'grid' | 'lined';
}

export interface ToolbarConfig {
  position: 'top' | 'bottom' | 'left' | 'right';
  size: 'compact' | 'standard' | 'large';
  items: ToolbarItem[];
}

export interface ToolbarItem {
  id: string;
  type: 'button' | 'dropdown' | 'separator';
  visible: boolean;
  order: number;
}

// ============================================================================
// Layout Types
// ============================================================================

export type LayoutPreset = 
  | 'writing'    // Editor only
  | 'editing'    // Navigator + Editor
  | 'reviewing'  // Navigator + Editor + Comments
  | 'publishing' // Navigator + Editor + Preview
  | 'webdev'     // Code + Preview
  | 'custom';

export interface PanelState {
  navigator: boolean;
  info: boolean;
  comments: boolean;
  preview: boolean;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 
  | 'pdf'
  | 'docx'
  | 'odt'
  | 'rtf'
  | 'txt'
  | 'md'
  | 'html'
  | 'epub'
  | 'wryt';

export interface ExportOptions {
  format: ExportFormat;
  pageSize?: PageSize;
  includeTableOfContents?: boolean;
  includeComments?: boolean;
  embedFonts?: boolean;
  compressImages?: boolean;
  quality?: 'draft' | 'standard' | 'print';
}

// ============================================================================
// View Types
// ============================================================================

export type WrytView = 
  | 'welcome'       // Welcome/project list screen
  | 'templates'     // Template selection
  | 'editor'        // Main editor view
  | 'settings';     // Settings view
