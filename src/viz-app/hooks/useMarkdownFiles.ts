import { useState, useEffect, useCallback } from 'react';
import { MarkdownFile, FileSystemAdapter } from '../types';
import { parseMarkdownFile, updateMarkdownFile } from '../markdown/parser';

// Default file system adapter (can be overridden)
const defaultFileSystemAdapter: FileSystemAdapter = {
  async readFiles(pattern: string | string[]): Promise<MarkdownFile[]> {
    // This would be implemented with actual file system access
    // For now, return empty array - implementation depends on environment
    console.warn('Default file system adapter not implemented');
    return [];
  },
  
  async writeFile(file: MarkdownFile): Promise<void> {
    console.warn('Default file system adapter not implemented');
  },
  
  watchFiles(pattern: string | string[], callback: (files: MarkdownFile[]) => void): () => void {
    console.warn('Default file system adapter not implemented');
    return () => {};
  }
};

export function useMarkdownFiles(
  filePattern: string | string[],
  watchFiles: boolean = false,
  fileSystemAdapter: FileSystemAdapter = defaultFileSystemAdapter
) {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const fileContents = await fileSystemAdapter.readFiles(filePattern);
      setFiles(fileContents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load files'));
    } finally {
      setLoading(false);
    }
  }, [filePattern, fileSystemAdapter]);

  const updateFile = useCallback(async (
    filePath: string,
    updates: Record<string, any>
  ) => {
    const file = files.find(f => f.path === filePath);
    if (!file) throw new Error(`File not found: ${filePath}`);
    
    const updatedFile = updateMarkdownFile(file, updates);
    
    await fileSystemAdapter.writeFile(updatedFile);
    
    // Update local state
    setFiles(prev => prev.map(f => 
      f.path === filePath ? updatedFile : f
    ));
    
    return updatedFile;
  }, [files, fileSystemAdapter]);

  useEffect(() => {
    loadFiles();
    
    if (watchFiles) {
      const unwatch = fileSystemAdapter.watchFiles(filePattern, (newFiles) => {
        setFiles(newFiles);
      });
      
      return unwatch;
    }
  }, [filePattern, watchFiles, fileSystemAdapter, loadFiles]);

  return {
    files,
    loading,
    error,
    reload: loadFiles,
    updateFile
  };
}
