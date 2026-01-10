import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useQorID } from '../../hooks/useAbyssID';
import { abyssIdSDK } from '../../services/qorid/sdk';

interface FileDropZoneProps {
  onUploadComplete?: (fileId: string, assetId: string) => void;
  onUploadError?: (error: string) => void;
}

export function FileDropZone({ onUploadComplete, onUploadError }: FileDropZoneProps) {
  const { session } = useQorID();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!session) {
      onUploadError?.('Please log in to upload files');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    await uploadFiles(files);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await uploadFiles(Array.from(files));
  };

  const uploadFiles = async (files: File[]) => {
    if (!session) {
      onUploadError?.('Please log in to upload files');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();

        // Get session token from localStorage
        const sessionToken = typeof window !== 'undefined' 
          ? localStorage.getItem('abyssos.abyssid.sessionId')
          : null;
        if (!sessionToken) {
          throw new Error('No session token available. Please log in.');
        }

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(percentComplete);
          }
        });

        const result = await new Promise<{
          fileId: string;
          drc369AssetId: string | null;
          txHash?: string;
        }>((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error('Invalid response from server'));
              }
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.error?.message || 'Upload failed'));
              } catch {
                reject(new Error(`Upload failed: ${xhr.statusText}`));
              }
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.open('POST', `${import.meta.env.VITE_QORID_API_URL || 'http://localhost:8082'}/api/storage/upload`);
          xhr.setRequestHeader('Authorization', `Bearer ${sessionToken}`);
          xhr.send(formData);
        });

        if (result.drc369AssetId) {
          onUploadComplete?.(result.fileId, result.drc369AssetId);
        } else {
          onUploadError?.('File uploaded but minting failed');
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      onUploadError?.(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 pointer-events-none ${
          isDragging ? 'pointer-events-auto' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-abyss-cyan/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-genesis-border-default">
            <div className="text-center">
              <div className="text-6xl mb-4">📁</div>
              <div className="text-2xl font-bold text-genesis-cipher-cyan mb-2">Drop files here</div>
              <div className="text-genesis-text-secondary">Files will be uploaded and minted as DRC-369 NFTs</div>
            </div>
          </div>
        )}
      </div>

      {uploading && (
        <div className="fixed bottom-20 right-4 z-50 bg-abyss-navy/95 border border-genesis-border-default/30 rounded-lg p-4 shadow-xl min-w-[300px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="animate-spin text-genesis-cipher-cyan">⏳</div>
            <div className="text-genesis-cipher-cyan font-medium">Uploading...</div>
          </div>
          <div className="w-full bg-genesis-glass-light rounded-full h-2 mb-2">
            <div
              className="bg-abyss-cyan h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="text-xs text-genesis-text-tertiary">{Math.round(uploadProgress)}%</div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}

