/**
 * WRYT Template Selector
 * 
 * Modal for selecting document template when creating a new project
 */

import { useState } from 'react';
import { DEFAULT_TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory } from './utils/templates';
import type { TemplateConfig, TemplateCategory } from './types';

// ============================================================================
// Template Card Component
// ============================================================================

interface TemplateCardProps {
  template: TemplateConfig;
  selected: boolean;
  onClick: () => void;
}

function TemplateCard({ template, selected, onClick }: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        text-left p-4 rounded-lg border-2 transition-all
        ${selected 
          ? 'border-abyss-cyan bg-abyss-cyan/10' 
          : 'border-abyss-cyan/20 hover:border-abyss-cyan/40 hover:bg-abyss-dark/40'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white">{template.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
        </div>
        {selected && (
          <span className="text-abyss-cyan">✓</span>
        )}
      </div>
    </button>
  );
}

// ============================================================================
// Category Tab Component
// ============================================================================

interface CategoryTabProps {
  category: { id: TemplateCategory; name: string; icon: string };
  active: boolean;
  onClick: () => void;
}

function CategoryTab({ category, active, onClick }: CategoryTabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
        ${active 
          ? 'bg-abyss-cyan text-abyss-dark' 
          : 'text-gray-400 hover:text-white hover:bg-abyss-dark/40'
        }
      `}
    >
      <span className="mr-1.5">{category.icon}</span>
      {category.name}
    </button>
  );
}

// ============================================================================
// Configuration Panel
// ============================================================================

interface ConfigPanelProps {
  template: TemplateConfig;
  projectName: string;
  setProjectName: (name: string) => void;
}

function ConfigPanel({ template, projectName, setProjectName }: ConfigPanelProps) {
  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Project Name
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="My New Project"
          className="w-full px-4 py-3 bg-abyss-dark border border-abyss-cyan/30 rounded-lg
                   text-white placeholder-gray-600 focus:outline-none focus:border-abyss-cyan"
        />
      </div>
      
      {/* Template Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Template Settings
        </label>
        <div className="bg-abyss-dark/40 border border-abyss-cyan/20 rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Page Size</span>
            <span className="text-white">{template.pageSize.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Default Font</span>
            <span className="text-white">{template.defaultFont}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Font Size</span>
            <span className="text-white">{template.defaultFontSize}pt</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Line Height</span>
            <span className="text-white">{template.lineHeight}</span>
          </div>
        </div>
      </div>
      
      {/* Features */}
      {template.features.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Included Features
          </label>
          <div className="space-y-2">
            {template.features.map((feature) => (
              <label 
                key={feature.id} 
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input 
                  type="checkbox" 
                  checked={feature.enabled}
                  className="rounded border-abyss-cyan/30 bg-abyss-dark text-abyss-cyan focus:ring-abyss-cyan"
                  readOnly
                />
                <span className="text-gray-300">{feature.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface WrytTemplateSelectorProps {
  onSelect: (templateId: string, projectName: string) => void;
  onCancel: () => void;
}

export function WrytTemplateSelector({ onSelect, onCancel }: WrytTemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('writing');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('basic');
  const [projectName, setProjectName] = useState('');
  
  const templates = getTemplatesByCategory(activeCategory);
  const selectedTemplate = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplateId) || DEFAULT_TEMPLATES[0];
  
  const handleCreate = () => {
    const name = projectName.trim() || 'Untitled Project';
    onSelect(selectedTemplateId, name);
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-abyss-navy border border-abyss-cyan/30 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-abyss-cyan/20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Create New Project</h2>
            <button 
              onClick={onCancel}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-1">Choose a template to get started</p>
        </div>
        
        {/* Category tabs */}
        <div className="px-6 py-3 border-b border-abyss-cyan/10 overflow-x-auto">
          <div className="flex gap-2">
            {TEMPLATE_CATEGORIES.map((category) => (
              <CategoryTab
                key={category.id}
                category={category}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              />
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Template list */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-abyss-cyan/10">
            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedTemplateId === template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                />
              ))}
            </div>
          </div>
          
          {/* Configuration panel */}
          <div className="w-80 p-6 overflow-y-auto bg-abyss-dark/20">
            <div className="mb-4">
              <span className="text-3xl">{selectedTemplate.icon}</span>
              <h3 className="text-lg font-bold text-white mt-2">{selectedTemplate.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedTemplate.description}</p>
            </div>
            
            <ConfigPanel 
              template={selectedTemplate}
              projectName={projectName}
              setProjectName={setProjectName}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-abyss-cyan/20 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-abyss-cyan text-abyss-dark font-medium rounded-lg
                     hover:bg-abyss-cyan/80 transition-colors"
          >
            Start Writing →
          </button>
        </div>
      </div>
    </div>
  );
}
