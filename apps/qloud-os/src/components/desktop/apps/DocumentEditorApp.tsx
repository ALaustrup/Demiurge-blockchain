import { useState, useEffect, useRef } from 'react';
import { useQorID } from '../../../hooks/useAbyssID';
import { Button } from '../../shared/Button';

interface DocumentEditorAppProps {
  fileId?: string;
  fileUrl?: string;
  fileName?: string;
}

export function DocumentEditorApp({ fileId, fileUrl, fileName }: DocumentEditorAppProps) {
  const { session } = useQorID();
  const [documentType, setDocumentType] = useState<'pdf' | 'text' | 'image' | 'other'>('other');
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);
  const textEditorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (fileUrl) {
      loadDocument(fileUrl);
    }
  }, [fileUrl]);

  const loadDocument = async (url: string) => {
    setIsLoading(true);
    try {
      const fileExtension = url.split('.').pop()?.toLowerCase() || '';
      
      if (fileExtension === 'pdf') {
        setDocumentType('pdf');
        // Load PDF in iframe
        if (pdfViewerRef.current) {
          pdfViewerRef.current.src = url;
        }
      } else if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(fileExtension)) {
        setDocumentType('text');
        const response = await fetch(url);
        const text = await response.text();
        setContent(text);
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
        setDocumentType('image');
        // Image will be displayed via img tag
      } else {
        setDocumentType('other');
      }
    } catch (error) {
      console.error('Failed to load document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!session || !fileId) {
      alert('Please log in and select a file to save');
      return;
    }

    setIsSaving(true);
    try {
      const sessionToken = typeof window !== 'undefined' 
        ? localStorage.getItem('abyssos.abyssid.sessionId')
        : null;
      
      if (!sessionToken) {
        throw new Error('No session token available');
      }

      // For text files, save the content
      if (documentType === 'text') {
        const blob = new Blob([content], { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', blob, fileName || 'document.txt');

        const response = await fetch(
          `${import.meta.env.VITE_QORID_API_URL || 'http://localhost:8082'}/api/storage/upload`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionToken}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to save document');
        }

        alert('Document saved successfully');
      } else {
        alert('Save functionality for this file type coming soon');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-genesis-text-tertiary mb-4">Please log in with QorID to use the document editor</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-genesis-cipher-cyan text-4xl mb-4">⏳</div>
          <p className="text-genesis-text-tertiary">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="bg-abyss-navy/50 border-b border-genesis-border-default/20 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-genesis-text-tertiary">{fileName || 'Untitled Document'}</span>
          <span className="px-2 py-1 bg-abyss-purple/20 text-abyss-purple border border-abyss-purple/30 rounded text-xs">
            {documentType.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSave} disabled={isSaving} className="text-xs px-3 py-1">
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Document Viewer/Editor */}
      <div className="flex-1 overflow-auto bg-genesis-glass-light">
        {documentType === 'pdf' && (
          <iframe
            ref={pdfViewerRef}
            src={fileUrl}
            className="w-full h-full border-0"
            title="PDF Viewer"
          />
        )}

        {documentType === 'text' && (
          <textarea
            ref={textEditorRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 bg-genesis-glass-light text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-abyss-cyan/50"
            placeholder="Document content..."
            spellCheck={false}
          />
        )}

        {documentType === 'image' && fileUrl && (
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={fileUrl}
              alt={fileName || 'Image'}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {documentType === 'other' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-genesis-text-tertiary">
              <p className="text-lg mb-2">Unsupported file type</p>
              <p className="text-sm">This file type cannot be edited in the document editor</p>
              {fileUrl && (
                <a
                  href={fileUrl}
                  download={fileName}
                  className="mt-4 inline-block px-4 py-2 bg-abyss-cyan/20 text-genesis-cipher-cyan border border-genesis-border-default/30 rounded hover:bg-abyss-cyan/30 transition-colors"
                >
                  Download File
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

