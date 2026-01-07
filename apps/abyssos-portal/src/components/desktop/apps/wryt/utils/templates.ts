/**
 * WRYT Template Configurations
 * 
 * Predefined templates for various document types
 */

import type { TemplateConfig, TemplateCategory } from '../types';

// ============================================================================
// Template Definitions
// ============================================================================

export const DEFAULT_TEMPLATES: TemplateConfig[] = [
  // Writing
  {
    id: 'basic',
    name: 'Basic Document',
    description: 'A simple document for general writing',
    category: 'writing',
    icon: '📄',
    pageSize: { name: 'Letter', width: '8.5in', height: '11in' },
    margins: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
    defaultFont: 'Georgia',
    defaultFontSize: 12,
    lineHeight: 1.5,
    features: [
      { id: 'spellcheck', name: 'Spell Check', enabled: true },
      { id: 'wordcount', name: 'Word Count', enabled: true },
    ],
  },
  {
    id: 'journal',
    name: 'Journal / Diary',
    description: 'Personal journal with date headers',
    category: 'writing',
    icon: '📔',
    pageSize: { name: 'A5', width: '5.83in', height: '8.27in' },
    margins: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' },
    defaultFont: 'Palatino',
    defaultFontSize: 14,
    lineHeight: 1.6,
    features: [
      { id: 'dateHeader', name: 'Auto Date Headers', enabled: true },
      { id: 'moodTags', name: 'Mood Tags', enabled: true },
    ],
  },
  {
    id: 'notes',
    name: 'Notes',
    description: 'Quick notes and ideas',
    category: 'writing',
    icon: '📝',
    pageSize: { name: 'Letter', width: '8.5in', height: '11in' },
    margins: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    defaultFont: 'Arial',
    defaultFontSize: 11,
    lineHeight: 1.4,
    features: [
      { id: 'tags', name: 'Tags', enabled: true },
      { id: 'search', name: 'Full-text Search', enabled: true },
    ],
  },
  
  // Publishing
  {
    id: 'novel',
    name: 'Novel',
    description: 'Long-form fiction with chapters',
    category: 'publishing',
    icon: '📖',
    pageSize: { name: 'Trade', width: '6in', height: '9in' },
    margins: { top: '1in', right: '1in', bottom: '1in', left: '1.25in' },
    defaultFont: 'Garamond',
    defaultFontSize: 12,
    lineHeight: 1.5,
    features: [
      { id: 'chapters', name: 'Chapter Management', enabled: true },
      { id: 'wordGoals', name: 'Word Count Goals', enabled: true },
      { id: 'toc', name: 'Table of Contents', enabled: true },
    ],
  },
  {
    id: 'shortStory',
    name: 'Short Story',
    description: 'Short fiction format',
    category: 'publishing',
    icon: '📜',
    pageSize: { name: 'Letter', width: '8.5in', height: '11in' },
    margins: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
    defaultFont: 'Times New Roman',
    defaultFontSize: 12,
    lineHeight: 2.0,
    features: [
      { id: 'sceneBreaks', name: 'Scene Breaks', enabled: true },
      { id: 'submissionFormat', name: 'Submission Formatting', enabled: true },
    ],
  },
  {
    id: 'ebook',
    name: 'E-Book',
    description: 'Digital book format for e-readers',
    category: 'publishing',
    icon: '📱',
    pageSize: { name: 'Flexible', width: 'auto', height: 'auto' },
    margins: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    defaultFont: 'Georgia',
    defaultFontSize: 16,
    lineHeight: 1.6,
    features: [
      { id: 'reflowable', name: 'Reflowable Content', enabled: true },
      { id: 'devicePreview', name: 'Device Preview', enabled: true },
      { id: 'epubExport', name: 'EPUB Export', enabled: true },
    ],
  },
  {
    id: 'childrensBook',
    name: "Children's Book",
    description: 'Illustrated books for young readers',
    category: 'publishing',
    icon: '🧸',
    pageSize: { name: 'Square', width: '8.5in', height: '8.5in' },
    margins: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    defaultFont: 'Comic Sans MS',
    defaultFontSize: 18,
    lineHeight: 1.8,
    features: [
      { id: 'imagePlacement', name: 'Image Placement', enabled: true },
      { id: 'largeText', name: 'Large Text Mode', enabled: true },
    ],
  },
  {
    id: 'artbook',
    name: 'Artbook',
    description: 'Visual portfolio and art collections',
    category: 'publishing',
    icon: '🎨',
    pageSize: { name: 'Large', width: '11in', height: '8.5in' },
    margins: { top: '0.25in', right: '0.25in', bottom: '0.25in', left: '0.25in' },
    defaultFont: 'Helvetica',
    defaultFontSize: 10,
    lineHeight: 1.4,
    features: [
      { id: 'fullBleed', name: 'Full Bleed Images', enabled: true },
      { id: 'galleries', name: 'Image Galleries', enabled: true },
    ],
  },
  
  // Digital Media
  {
    id: 'blog',
    name: 'Blog Post',
    description: 'Web article format with SEO tools',
    category: 'digital',
    icon: '📰',
    pageSize: { name: 'Web', width: '100%', height: 'auto' },
    margins: { top: '2rem', right: '2rem', bottom: '2rem', left: '2rem' },
    defaultFont: 'Open Sans',
    defaultFontSize: 16,
    lineHeight: 1.7,
    features: [
      { id: 'seo', name: 'SEO Tools', enabled: true },
      { id: 'preview', name: 'Live Preview', enabled: true },
      { id: 'markdown', name: 'Markdown Export', enabled: true },
    ],
  },
  {
    id: 'ezine',
    name: 'E-Zine / Magazine',
    description: 'Digital magazine with multi-column layouts',
    category: 'digital',
    icon: '📰',
    pageSize: { name: 'Tabloid', width: '11in', height: '17in' },
    margins: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    defaultFont: 'Helvetica',
    defaultFontSize: 10,
    lineHeight: 1.4,
    features: [
      { id: 'multiColumn', name: 'Multi-column Layout', enabled: true },
      { id: 'pullQuotes', name: 'Pull Quotes', enabled: true },
      { id: 'spreads', name: 'Page Spreads', enabled: true },
    ],
  },
  {
    id: 'website',
    name: 'Website',
    description: 'HTML/CSS web pages with live preview',
    category: 'digital',
    icon: '🌐',
    pageSize: { name: 'Web', width: '100%', height: 'auto' },
    margins: { top: '0', right: '0', bottom: '0', left: '0' },
    defaultFont: 'system-ui',
    defaultFontSize: 16,
    lineHeight: 1.5,
    features: [
      { id: 'codeView', name: 'Code View', enabled: true },
      { id: 'livePreview', name: 'Live Preview', enabled: true },
      { id: 'responsiveTest', name: 'Responsive Testing', enabled: true },
    ],
  },
  {
    id: 'landingPage',
    name: 'Landing Page',
    description: 'Marketing page with sections',
    category: 'digital',
    icon: '🚀',
    pageSize: { name: 'Web', width: '100%', height: 'auto' },
    margins: { top: '0', right: '0', bottom: '0', left: '0' },
    defaultFont: 'Inter',
    defaultFontSize: 18,
    lineHeight: 1.6,
    features: [
      { id: 'sections', name: 'Page Sections', enabled: true },
      { id: 'cta', name: 'Call-to-Action Blocks', enabled: true },
    ],
  },
  
  // Professional
  {
    id: 'businessLetter',
    name: 'Business Letter',
    description: 'Formal business correspondence',
    category: 'professional',
    icon: '✉️',
    pageSize: { name: 'Letter', width: '8.5in', height: '11in' },
    margins: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
    defaultFont: 'Times New Roman',
    defaultFontSize: 12,
    lineHeight: 1.5,
    features: [
      { id: 'letterhead', name: 'Letterhead', enabled: true },
      { id: 'signature', name: 'Signature Block', enabled: true },
    ],
  },
  {
    id: 'resume',
    name: 'Resume / CV',
    description: 'Professional resume with multiple layouts',
    category: 'professional',
    icon: '📋',
    pageSize: { name: 'Letter', width: '8.5in', height: '11in' },
    margins: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    defaultFont: 'Calibri',
    defaultFontSize: 11,
    lineHeight: 1.3,
    features: [
      { id: 'layouts', name: 'Multiple Layouts', enabled: true },
      { id: 'atsFriendly', name: 'ATS-Friendly', enabled: true },
    ],
  },
  {
    id: 'report',
    name: 'Report',
    description: 'Business report with sections and charts',
    category: 'professional',
    icon: '📊',
    pageSize: { name: 'Letter', width: '8.5in', height: '11in' },
    margins: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
    defaultFont: 'Arial',
    defaultFontSize: 11,
    lineHeight: 1.5,
    features: [
      { id: 'charts', name: 'Charts & Graphs', enabled: true },
      { id: 'tables', name: 'Data Tables', enabled: true },
      { id: 'toc', name: 'Table of Contents', enabled: true },
    ],
  },
  {
    id: 'proposal',
    name: 'Proposal',
    description: 'Project proposal with budget tables',
    category: 'professional',
    icon: '📑',
    pageSize: { name: 'Letter', width: '8.5in', height: '11in' },
    margins: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
    defaultFont: 'Calibri',
    defaultFontSize: 11,
    lineHeight: 1.5,
    features: [
      { id: 'budgetTables', name: 'Budget Tables', enabled: true },
      { id: 'timelines', name: 'Project Timelines', enabled: true },
    ],
  },
  
  // Academic
  {
    id: 'essay',
    name: 'Essay',
    description: 'Academic essay with citations',
    category: 'academic',
    icon: '🎓',
    pageSize: { name: 'Letter', width: '8.5in', height: '11in' },
    margins: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
    defaultFont: 'Times New Roman',
    defaultFontSize: 12,
    lineHeight: 2.0,
    features: [
      { id: 'citations', name: 'Citation Manager', enabled: true },
      { id: 'bibliography', name: 'Bibliography', enabled: true },
    ],
  },
  {
    id: 'thesis',
    name: 'Thesis / Dissertation',
    description: 'Graduate-level academic work',
    category: 'academic',
    icon: '📚',
    pageSize: { name: 'Letter', width: '8.5in', height: '11in' },
    margins: { top: '1in', right: '1in', bottom: '1in', left: '1.5in' },
    defaultFont: 'Times New Roman',
    defaultFontSize: 12,
    lineHeight: 2.0,
    features: [
      { id: 'chapters', name: 'Chapters', enabled: true },
      { id: 'footnotes', name: 'Footnotes', enabled: true },
      { id: 'appendices', name: 'Appendices', enabled: true },
    ],
  },
  
  // Technical
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Software documentation with code blocks',
    category: 'technical',
    icon: '📘',
    pageSize: { name: 'Web', width: '100%', height: 'auto' },
    margins: { top: '2rem', right: '2rem', bottom: '2rem', left: '2rem' },
    defaultFont: 'Inter',
    defaultFontSize: 15,
    lineHeight: 1.6,
    features: [
      { id: 'codeBlocks', name: 'Code Blocks', enabled: true },
      { id: 'versioning', name: 'Version Control', enabled: true },
    ],
  },
  {
    id: 'readme',
    name: 'README',
    description: 'GitHub-style README file',
    category: 'technical',
    icon: '📄',
    pageSize: { name: 'Web', width: '100%', height: 'auto' },
    margins: { top: '2rem', right: '2rem', bottom: '2rem', left: '2rem' },
    defaultFont: 'system-ui',
    defaultFontSize: 16,
    lineHeight: 1.6,
    features: [
      { id: 'markdown', name: 'GitHub Flavored Markdown', enabled: true },
      { id: 'badges', name: 'Status Badges', enabled: true },
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getTemplatesByCategory(category: TemplateCategory): TemplateConfig[] {
  return DEFAULT_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): TemplateConfig | undefined {
  return DEFAULT_TEMPLATES.find(t => t.id === id);
}

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; name: string; icon: string }[] = [
  { id: 'writing', name: 'Writing', icon: '📝' },
  { id: 'publishing', name: 'Publishing', icon: '📚' },
  { id: 'digital', name: 'Digital Media', icon: '📱' },
  { id: 'professional', name: 'Professional', icon: '💼' },
  { id: 'academic', name: 'Academic', icon: '🎓' },
  { id: 'technical', name: 'Technical', icon: '🔧' },
];
