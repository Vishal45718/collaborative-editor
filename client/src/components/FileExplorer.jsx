import { useState, useEffect } from 'react';
import { useIdeStore } from '../store/useIdeStore';
import { LANGUAGES, getLanguageByExtension } from '../config/languages';
import * as Y from 'yjs';
import { Folder, File, Plus, X, ChevronRight, ChevronDown, Trash2, Edit2 } from 'lucide-react';

export default function FileExplorer({ filesMap }) {
  const [files, setFiles] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['/']));
  
  const { activeFile, setActiveFile, setActiveLanguage } = useIdeStore();

  useEffect(() => {
    if (!filesMap) return;

    const updateFiles = () => {
      const currentFiles = Array.from(filesMap.keys());
      setFiles(currentFiles);
      if (!activeFile && currentFiles.length > 0) {
        selectFile(currentFiles[0]);
      }
    };

    updateFiles();
    filesMap.observe(updateFiles);

    return () => {
      filesMap.unobserve(updateFiles);
    };
  }, [filesMap]);

  const selectFile = (fileName) => {
    setActiveFile(fileName);
    const langId = getLanguageByExtension(fileName);
    setActiveLanguage(langId);
  };

  const addFile = () => {
    const fileName = prompt('Enter new file name with extension (e.g., app.py):');
    if (!fileName) return;

    if (filesMap.has(fileName)) {
      alert('File already exists!');
      return;
    }

    const langId = getLanguageByExtension(fileName);
    const defaultCode = LANGUAGES[langId]?.defaultCode || '';
    filesMap.set(fileName, new Y.Text(defaultCode));
    selectFile(fileName);
  };

  const deleteFile = (fileName, e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      filesMap.delete(fileName);
      if (activeFile === fileName) {
        setActiveFile(null);
      }
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#161b22',
      display: 'flex',
      flexDirection: 'column',
      color: '#e6edf3'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.04em' }}>EXPLORER</span>
        <button onClick={addFile} style={{
          background: 'none',
          border: 'none',
          color: '#8b949e',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px'
        }} className="hover-bg-30363d">
          <Plus size={16} />
        </button>
      </div>

      {/* File List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {files.map((fileName) => {
          const isSelected = activeFile === fileName;
          return (
            <div
              key={fileName}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 16px',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                color: isSelected ? '#22d3ee' : '#e6edf3',
                fontSize: '13px'
              }}
              onClick={() => selectFile(fileName)}
              className="file-item-hover"
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <File size={16} style={{ marginRight: '8px', opacity: 0.8 }} />
                <span>{fileName}</span>
              </div>
              <button 
                onClick={(e) => deleteFile(fileName, e)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8b949e',
                  cursor: 'pointer',
                  padding: '2px',
                  display: isSelected ? 'block' : 'none'
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
        {files.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8b949e', fontSize: '12px' }}>
            No files in workspace
          </div>
        )}
      </div>
      <style>{`
        .hover-bg-30363d:hover { background-color: #30363d; color: #fff; }
        .file-item-hover:hover { background-color: rgba(255,255,255,0.05); }
        .file-item-hover:hover button { display: block !important; }
      `}</style>
    </div>
  );
}