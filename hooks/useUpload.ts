import { useState } from 'react';

export interface UploadFileItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

export function useUpload() {
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = (newFiles: File[]) => {
    const items: UploadFileItem[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'uploading',
    }));

    setFiles((prev) => [...prev, ...items]);
    simulateUpload(items);
  };

  const simulateUpload = (items: UploadFileItem[]) => {
    setIsUploading(true);
    items.forEach((item) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 20;
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, progress: Math.min(100, currentProgress) } : f
          )
        );

        if (currentProgress >= 100) {
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, status: 'success' } : f))
          );
          setIsUploading(false);
        }
      }, 300);
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => setFiles([]);

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    clearAll,
  };
}
