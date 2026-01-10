import { useState, useRef, useEffect } from 'react';
import { useQorID } from '../../../hooks/useAbyssID';
import { Button } from '../../shared/Button';
import { abyssIdSDK } from '../../../services/qorid/sdk';

interface PublishedFile {
  fileId: string;
  title: string;
  description: string;
  priceCgt: number;
  ownerPubKey: string;
  timestamp: number;
}

// Legacy storage key - now using centralized SDK (abyssIdSDK.drc369)
// All file operations go through abyssIdSDK.drc369.publishNative()

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
  const { session, login } = useQorID();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCgt, setPriceCgt] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedFiles, setPublishedFiles] = useState<PublishedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load published files from SDK on mount and when session changes
  useEffect(() => {
    async function loadFiles() {
      if (!session) {
        setPublishedFiles([]);
        return;
      }
      try {
        const owned = await abyssIdSDK.drc369.getOwned({ owner: session.publicKey });
        const publishedFilesList = owned
          .filter((a) => a.attributes?.fileId)
          .map((a) => ({
            fileId: a.attributes?.fileId as string,
            title: a.name || (a.attributes?.name as string) || 'Untitled',
            description: a.description || (a.attributes?.description as string) || '',
            priceCgt: a.priceCgt || 0,
            ownerPubKey: a.owner,
            timestamp: a.createdAt ? new Date(a.createdAt).getTime() : Date.now(),
          }));
        setPublishedFiles(publishedFilesList);
      } catch (error) {
        console.error('Failed to load published files:', error);
      }
    }
    loadFiles();
  }, [session]);

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

      // Create DRC-369 asset using centralized SDK
      await abyssIdSDK.drc369.publishNative({
        uri: await uploadFile(selectedFile), // Placeholder URL for now
        contentType: 'binary', // Default for uploaded files
        owner: session.publicKey,
        name: title.trim(),
        description: description.trim(),
        priceCgt,
        attributes: {
          fileId,
          originalFileName: selectedFile.name,
          fileSize: selectedFile.size,
        },
      });

      // Reload published files from SDK
      const owned = await abyssIdSDK.drc369.getOwned({ owner: session.publicKey });
      // Convert DRC369 to PublishedFile format for display compatibility
      const publishedFilesList = owned
        .filter((a) => a.attributes?.fileId)
        .map((a) => ({
          fileId: a.attributes?.fileId as string,
          title: a.name || (a.attributes?.name as string) || 'Untitled',
          description: a.description || (a.attributes?.description as string) || '',
          priceCgt: a.priceCgt || 0,
          ownerPubKey: a.owner,
          timestamp: a.createdAt ? new Date(a.createdAt).getTime() : Date.now(),
        }));
      setPublishedFiles(publishedFilesList);

      // TODO: Send FilePublished transaction to Demiurge chain via RPC
      console.log('FilePublished via SDK - DRC-369 asset created:', { fileId, title: title.trim() });

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
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">Share a file to the Demiurge Network</h2>
        <p className="text-genesis-text-secondary text-sm">Publish files and earn CGT from downloads</p>
      </div>

      {!session && (
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <p className="text-genesis-text-secondary mb-3">You need to be logged in to publish files.</p>
          <Button onClick={() => login()}>Login with QorID</Button>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-genesis-text-secondary">File</label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="w-full px-4 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded-lg text-white text-sm focus:outline-none focus:border-genesis-border-default"
            disabled={!session || isPublishing}
          />
          {selectedFile && (
            <div className="mt-2 text-xs text-genesis-text-tertiary">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-genesis-text-secondary">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded-lg text-white focus:outline-none focus:border-genesis-border-default"
            placeholder="File title"
            disabled={!session || isPublishing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-genesis-text-secondary">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded-lg text-white focus:outline-none focus:border-genesis-border-default"
            rows={3}
            placeholder="File description"
            disabled={!session || isPublishing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-genesis-text-secondary">Price (CGT)</label>
          <input
            type="number"
            value={priceCgt}
            onChange={(e) => setPriceCgt(Number(e.target.value))}
            className="w-full px-4 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded-lg text-white focus:outline-none focus:border-genesis-border-default"
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
          <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Your published files (local)</h3>
          <div className="space-y-2">
            {publishedFiles
              .filter((f) => session && f.ownerPubKey === session.publicKey)
              .map((file) => (
                <div
                  key={file.fileId}
                  className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-3"
                >
                  <div className="font-medium text-genesis-cipher-cyan">{file.title}</div>
                  <div className="text-xs text-genesis-text-tertiary mt-1">{file.description || 'No description'}</div>
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

