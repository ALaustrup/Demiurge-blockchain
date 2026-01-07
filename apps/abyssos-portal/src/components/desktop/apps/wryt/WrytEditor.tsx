/**
 * WRYT Editor
 * 
 * TipTap-based rich text editor component
 */

import { useEffect, useCallback } from 'react';
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

// ============================================================================
// Types
// ============================================================================

interface WrytEditorProps {
  content: string;
  onChange: (content: string, wordCount: number, charCount: number) => void;
  placeholder?: string;
  editable?: boolean;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  autofocus?: boolean;
}

// ============================================================================
// Custom Extensions Configuration
// ============================================================================

const createExtensions = (placeholder: string) => [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
    },
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
  }),
  Underline,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Placeholder.configure({
    placeholder,
    emptyEditorClass: 'is-editor-empty',
  }),
  CharacterCount,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-abyss-cyan hover:underline cursor-pointer',
    },
  }),
  Image.configure({
    HTMLAttributes: {
      class: 'max-w-full h-auto rounded-lg',
    },
  }),
  TextStyle,
  FontFamily,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
];

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
  
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    color: #6b7280;
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

// ============================================================================
// Main Component
// ============================================================================

export function WrytEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  fontSize = 16,
  fontFamily = 'Georgia, serif',
  lineHeight = 1.8,
  autofocus = false,
}: WrytEditorProps) {
  
  const editor = useEditor({
    extensions: createExtensions(placeholder),
    content,
    editable,
    autofocus,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      const charCount = text.length;
      onChange(html, wordCount, charCount);
    },
  });
  
  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);
  
  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);
  
  return (
    <>
      <style>{editorStyles}</style>
      <div 
        className="prose prose-invert max-w-none h-full"
        style={{ 
          fontSize: `${fontSize}px`,
          fontFamily,
          lineHeight,
        }}
      >
        <EditorContent editor={editor} className="h-full" />
      </div>
    </>
  );
}

// ============================================================================
// Editor Hook for Toolbar Commands
// ============================================================================

export function useWrytEditorCommands(editor: ReturnType<typeof useEditor>) {
  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleUnderline = useCallback(() => editor?.chain().focus().toggleUnderline().run(), [editor]);
  const toggleStrike = useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]);
  const toggleCode = useCallback(() => editor?.chain().focus().toggleCode().run(), [editor]);
  const toggleBlockquote = useCallback(() => editor?.chain().focus().toggleBlockquote().run(), [editor]);
  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);
  
  const setHeading = useCallback((level: 1 | 2 | 3 | 4 | 5 | 6) => 
    editor?.chain().focus().toggleHeading({ level }).run(), [editor]);
  const setParagraph = useCallback(() => 
    editor?.chain().focus().setParagraph().run(), [editor]);
  
  const setTextAlign = useCallback((align: 'left' | 'center' | 'right' | 'justify') =>
    editor?.chain().focus().setTextAlign(align).run(), [editor]);
  
  const setLink = useCallback((url: string) => {
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    } else {
      editor?.chain().focus().unsetLink().run();
    }
  }, [editor]);
  
  const insertImage = useCallback((url: string) => {
    editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);
  
  const setFontFamily = useCallback((font: string) =>
    editor?.chain().focus().setFontFamily(font).run(), [editor]);
  
  const setColor = useCallback((color: string) =>
    editor?.chain().focus().setColor(color).run(), [editor]);
  
  const setHighlight = useCallback((color?: string) => {
    if (color) {
      editor?.chain().focus().setHighlight({ color }).run();
    } else {
      editor?.chain().focus().unsetHighlight().run();
    }
  }, [editor]);
  
  const undo = useCallback(() => editor?.chain().focus().undo().run(), [editor]);
  const redo = useCallback(() => editor?.chain().focus().redo().run(), [editor]);
  
  const isActive = useCallback((name: string, attributes?: Record<string, unknown>) => 
    editor?.isActive(name, attributes) ?? false, [editor]);
  
  return {
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrike,
    toggleCode,
    toggleBlockquote,
    toggleBulletList,
    toggleOrderedList,
    setHeading,
    setParagraph,
    setTextAlign,
    setLink,
    insertImage,
    setFontFamily,
    setColor,
    setHighlight,
    undo,
    redo,
    isActive,
  };
}
