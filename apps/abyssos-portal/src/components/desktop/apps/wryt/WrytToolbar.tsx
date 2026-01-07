/**
 * WRYT Toolbar
 * 
 * Customizable toolbar for the WRYT editor
 */

import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

// ============================================================================
// Types
// ============================================================================

interface WrytToolbarProps {
  editor: Editor | null;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
}

// ============================================================================
// Toolbar Button Component
// ============================================================================

interface ToolbarButtonProps {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolbarButton({ icon, title, active, disabled, onClick }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center
        ${disabled 
          ? 'text-gray-600 cursor-not-allowed' 
          : active 
            ? 'bg-abyss-cyan/20 text-abyss-cyan' 
            : 'text-gray-400 hover:text-white hover:bg-abyss-dark/50'
        }
      `}
    >
      {icon}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-6 bg-abyss-cyan/20 mx-1" />;
}

// ============================================================================
// Dropdown Components
// ============================================================================

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Dropdown({ trigger, children, open, onOpenChange }: DropdownProps) {
  return (
    <div className="relative">
      <div onClick={() => onOpenChange(!open)}>
        {trigger}
      </div>
      {open && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-abyss-dark border border-abyss-cyan/30 rounded-lg shadow-lg py-1 z-50 min-w-[150px]">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}

function DropdownItem({ children, active, onClick }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full px-3 py-1.5 text-left text-sm transition-colors
        ${active 
          ? 'bg-abyss-cyan/20 text-abyss-cyan' 
          : 'text-gray-300 hover:bg-abyss-cyan/10'
        }
      `}
    >
      {children}
    </button>
  );
}

// ============================================================================
// Icons
// ============================================================================

const BoldIcon = () => <span className="font-bold text-sm">B</span>;
const ItalicIcon = () => <span className="italic text-sm">I</span>;
const UnderlineIcon = () => <span className="underline text-sm">U</span>;
const StrikeIcon = () => <span className="line-through text-sm">S</span>;
const CodeIcon = () => <span className="font-mono text-xs">{`</>`}</span>;
const QuoteIcon = () => <span className="text-sm">"</span>;
const BulletListIcon = () => <span className="text-sm">•≡</span>;
const OrderedListIcon = () => <span className="text-sm">1.</span>;
const AlignLeftIcon = () => <span className="text-xs">≡</span>;
const AlignCenterIcon = () => <span className="text-xs">≣</span>;
const AlignRightIcon = () => <span className="text-xs">≡</span>;
const AlignJustifyIcon = () => <span className="text-xs">☰</span>;
const LinkIcon = () => <span className="text-sm">🔗</span>;
const ImageIcon = () => <span className="text-sm">📷</span>;
const UndoIcon = () => <span className="text-sm">↩</span>;
const RedoIcon = () => <span className="text-sm">↪</span>;

// ============================================================================
// Main Component
// ============================================================================

export function WrytToolbar({ editor, onSave, hasUnsavedChanges }: WrytToolbarProps) {
  const [headingDropdown, setHeadingDropdown] = useState(false);
  const [fontDropdown, setFontDropdown] = useState(false);
  const [colorDropdown, setColorDropdown] = useState(false);
  
  const handleLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href || '';
    const url = prompt('Enter URL:', previousUrl);
    
    if (url === null) return;
    
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);
  
  const handleImage = useCallback(() => {
    if (!editor) return;
    
    const url = prompt('Enter image URL:');
    
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);
  
  if (!editor) return null;
  
  const getHeadingLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    if (editor.isActive('heading', { level: 4 })) return 'Heading 4';
    return 'Normal';
  };
  
  const fonts = [
    { name: 'Default', value: '' },
    { name: 'Georgia', value: 'Georgia' },
    { name: 'Times New Roman', value: 'Times New Roman' },
    { name: 'Arial', value: 'Arial' },
    { name: 'Helvetica', value: 'Helvetica' },
    { name: 'Verdana', value: 'Verdana' },
    { name: 'Courier New', value: 'Courier New' },
  ];
  
  const colors = [
    { name: 'Default', value: '' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Cyan', value: '#00d4ff' },
  ];
  
  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-abyss-dark/30 border-b border-abyss-cyan/20 flex-wrap">
      {/* Undo/Redo */}
      <ToolbarButton 
        icon={<UndoIcon />} 
        title="Undo (Ctrl+Z)" 
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()} 
      />
      <ToolbarButton 
        icon={<RedoIcon />} 
        title="Redo (Ctrl+Y)" 
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()} 
      />
      
      <ToolbarSeparator />
      
      {/* Text formatting */}
      <ToolbarButton 
        icon={<BoldIcon />} 
        title="Bold (Ctrl+B)" 
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()} 
      />
      <ToolbarButton 
        icon={<ItalicIcon />} 
        title="Italic (Ctrl+I)" 
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()} 
      />
      <ToolbarButton 
        icon={<UnderlineIcon />} 
        title="Underline (Ctrl+U)" 
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()} 
      />
      <ToolbarButton 
        icon={<StrikeIcon />} 
        title="Strikethrough" 
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()} 
      />
      
      <ToolbarSeparator />
      
      {/* Heading selector */}
      <Dropdown
        open={headingDropdown}
        onOpenChange={setHeadingDropdown}
        trigger={
          <button className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-300 hover:bg-abyss-dark/50 min-w-[100px]">
            {getHeadingLabel()}
            <span className="text-xs">▾</span>
          </button>
        }
      >
        <DropdownItem 
          active={editor.isActive('paragraph')} 
          onClick={() => { editor.chain().focus().setParagraph().run(); setHeadingDropdown(false); }}
        >
          Normal
        </DropdownItem>
        <DropdownItem 
          active={editor.isActive('heading', { level: 1 })} 
          onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setHeadingDropdown(false); }}
        >
          <span className="text-xl font-bold">Heading 1</span>
        </DropdownItem>
        <DropdownItem 
          active={editor.isActive('heading', { level: 2 })} 
          onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setHeadingDropdown(false); }}
        >
          <span className="text-lg font-bold">Heading 2</span>
        </DropdownItem>
        <DropdownItem 
          active={editor.isActive('heading', { level: 3 })} 
          onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setHeadingDropdown(false); }}
        >
          <span className="font-bold">Heading 3</span>
        </DropdownItem>
        <DropdownItem 
          active={editor.isActive('heading', { level: 4 })} 
          onClick={() => { editor.chain().focus().toggleHeading({ level: 4 }).run(); setHeadingDropdown(false); }}
        >
          <span className="text-sm font-bold">Heading 4</span>
        </DropdownItem>
      </Dropdown>
      
      {/* Font selector */}
      <Dropdown
        open={fontDropdown}
        onOpenChange={setFontDropdown}
        trigger={
          <button className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-300 hover:bg-abyss-dark/50 min-w-[100px]">
            Font
            <span className="text-xs">▾</span>
          </button>
        }
      >
        {fonts.map((font) => (
          <DropdownItem 
            key={font.name}
            onClick={() => { 
              if (font.value) {
                editor.chain().focus().setFontFamily(font.value).run();
              } else {
                editor.chain().focus().unsetFontFamily().run();
              }
              setFontDropdown(false); 
            }}
          >
            <span style={{ fontFamily: font.value || 'inherit' }}>{font.name}</span>
          </DropdownItem>
        ))}
      </Dropdown>
      
      <ToolbarSeparator />
      
      {/* Alignment */}
      <ToolbarButton 
        icon={<AlignLeftIcon />} 
        title="Align Left" 
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()} 
      />
      <ToolbarButton 
        icon={<AlignCenterIcon />} 
        title="Align Center" 
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()} 
      />
      <ToolbarButton 
        icon={<AlignRightIcon />} 
        title="Align Right" 
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()} 
      />
      <ToolbarButton 
        icon={<AlignJustifyIcon />} 
        title="Justify" 
        active={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
      />
      
      <ToolbarSeparator />
      
      {/* Lists */}
      <ToolbarButton 
        icon={<BulletListIcon />} 
        title="Bullet List" 
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()} 
      />
      <ToolbarButton 
        icon={<OrderedListIcon />} 
        title="Numbered List" 
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
      />
      
      <ToolbarSeparator />
      
      {/* Quote & Code */}
      <ToolbarButton 
        icon={<QuoteIcon />} 
        title="Blockquote" 
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
      />
      <ToolbarButton 
        icon={<CodeIcon />} 
        title="Code" 
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()} 
      />
      
      <ToolbarSeparator />
      
      {/* Insert */}
      <ToolbarButton 
        icon={<LinkIcon />} 
        title="Insert Link" 
        active={editor.isActive('link')}
        onClick={handleLink} 
      />
      <ToolbarButton 
        icon={<ImageIcon />} 
        title="Insert Image" 
        onClick={handleImage} 
      />
      
      {/* Color selector */}
      <Dropdown
        open={colorDropdown}
        onOpenChange={setColorDropdown}
        trigger={
          <button className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-300 hover:bg-abyss-dark/50">
            🎨
            <span className="text-xs">▾</span>
          </button>
        }
      >
        {colors.map((color) => (
          <DropdownItem 
            key={color.name}
            onClick={() => { 
              if (color.value) {
                editor.chain().focus().setColor(color.value).run();
              } else {
                editor.chain().focus().unsetColor().run();
              }
              setColorDropdown(false); 
            }}
          >
            <span className="flex items-center gap-2">
              <span 
                className="w-4 h-4 rounded border border-white/20"
                style={{ backgroundColor: color.value || 'transparent' }}
              />
              {color.name}
            </span>
          </DropdownItem>
        ))}
      </Dropdown>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Save button */}
      {onSave && (
        <button
          onClick={onSave}
          className={`
            px-3 py-1 rounded text-sm font-medium transition-colors
            ${hasUnsavedChanges 
              ? 'bg-abyss-cyan text-abyss-dark hover:bg-abyss-cyan/80' 
              : 'text-gray-500'
            }
          `}
        >
          {hasUnsavedChanges ? '💾 Save' : '✓ Saved'}
        </button>
      )}
    </div>
  );
}
