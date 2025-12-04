import { useState, useRef } from 'react';
import { useAbyssID } from '../../../hooks/useAbyssID';
import { Button } from '../../shared/Button';

interface PublishedFile {
  fileId: string;
  title: string;
  description: string;
  priceCgt: number;
  ownerPubKey: string;
  timestamp: number;
}

const STORAGE_KEY_PUBLISHED = 'abyssos_published_files';

function getPublishedFiles(): PublishedFile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PUBLISHED);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function savePublishedFile(file: PublishedFile) {
  const files = getPublishedFiles();
  files.push(file);
  localStorage.setItem(STORAGE_KEY_PUBLISHED, JSON.stringify(files));
}

async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function uploadFile(_file: File): Promise<string> {
  // TODO: Implement actual file upload endpoint
  // For now, return placeholder URL
  return 'https://example.com/not-implemented-yet';
}

export function AbyssTorrentApp() {
  const { session, login } = useAbyssID();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCgt, setPriceCgt] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedFiles, setPublishedFiles] = useState<PublishedFile[]>(getPublishedFiles());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name);
      }
    }
  };

  const handlePublish = async () => {
    if (!session) {
      await login();
      return;
    }

    if (!selectedFile || !title.trim()) {
      return;
    }

    setIsPublishing(true);
    try {
      // Compute file hash
      const fileId = await computeFileHash(selectedFile);

      // Upload file (placeholder for now)
      await uploadFile(selectedFile);

      // Create published file record
      const publishedFile: PublishedFile = {
        fileId,
        title: title.trim(),
        description: description.trim(),
        priceCgt,
        ownerPubKey: session.publicKey,
        timestamp: Date.now(),
      };

      // Save locally
      savePublishedFile(publishedFile);
      setPublishedFiles(getPublishedFiles());

      // TODO: Send FilePublished transaction to Demiurge chain via RPC
      console.log('FilePublished payload:', publishedFile);

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setPriceCgt(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to publish file:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 h-full overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-abyss-cyan mb-2">Share a file to the Demiurge Network</h2>
        <p className="text-gray-300 text-sm">Publish files and earn CGT from downloads</p>
      </div>

      {!session && (
        <div className="bg-abyss-navy/50 border border-abyss-cyan/20 rounded-lg p-4">
          <p className="text-gray-300 mb-3">You need to be logged in to publish files.</p>
          <Button onClick={() => login()}>Login with AbyssID</Button>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">File</label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="w-full px-4 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded-lg text-white text-sm focus:outline-none focus:border-abyss-cyan"
            disabled={!session || isPublishing}
          />
          {selectedFile && (
            <div className="mt-2 text-xs text-gray-400">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded-lg text-white focus:outline-none focus:border-abyss-cyan"
            placeholder="File title"
            disabled={!session || isPublishing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded-lg text-white focus:outline-none focus:border-abyss-cyan"
            rows={3}
            placeholder="File description"
            disabled={!session || isPublishing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Price (CGT)</label>
          <input
            type="number"
            value={priceCgt}
            onChange={(e) => setPriceCgt(Number(e.target.value))}
            className="w-full px-4 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded-lg text-white focus:outline-none focus:border-abyss-cyan"
            placeholder="0"
            min="0"
            step="0.01"
            disabled={!session || isPublishing}
          />
        </div>

        <Button
          onClick={handlePublish}
          disabled={!session || !selectedFile || !title.trim() || isPublishing}
          className="w-full"
        >
          {isPublishing ? 'Publishing...' : 'Publish File'}
        </Button>
      </div>

      {publishedFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-abyss-cyan mb-4">Your published files (local)</h3>
          <div className="space-y-2">
            {publishedFiles
              .filter((f) => session && f.ownerPubKey === session.publicKey)
              .map((file) => (
                <div
                  key={file.fileId}
                  className="bg-abyss-navy/50 border border-abyss-cyan/20 rounded-lg p-3"
                >
                  <div className="font-medium text-abyss-cyan">{file.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{file.description || 'No description'}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Price: {file.priceCgt} CGT · ID: {file.fileId.slice(0, 16)}...
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

