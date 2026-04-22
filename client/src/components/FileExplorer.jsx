import { useState, useEffect, useRef } from 'react';
import { useIdeStore } from '../store/useIdeStore';
import { LANGUAGES, getLanguageByExtension } from '../config/languages';
import * as Y from 'yjs';
import {
  Files, Plus, Trash2, Edit2, Check, X,
  ChevronDown, ChevronRight, Folder,
} from 'lucide-react';

/* ── File-type icon colours matching VS Code ─────────────────────────── */
const EXT_META = {
  '.js':   { color: '#f7df1e', label: 'JS'  },
  '.jsx':  { color: '#61dafb', label: 'JSX' },
  '.ts':   { color: '#3178c6', label: 'TS'  },
  '.tsx':  { color: '#61dafb', label: 'TSX' },
  '.py':   { color: '#3572A5', label: 'PY'  },
  '.cpp':  { color: '#00599C', label: 'C++' },
  '.c':    { color: '#555555', label: 'C'   },
  '.java': { color: '#b07219', label: 'JAV' },
  '.rs':   { color: '#dea584', label: 'RS'  },
  '.go':   { color: '#00ADD8', label: 'GO'  },
  '.sh':   { color: '#4EAA25', label: 'SH'  },
  '.rb':   { color: '#701516', label: 'RB'  },
  '.html': { color: '#e34c26', label: 'HTM' },
  '.css':  { color: '#563d7c', label: 'CSS' },
  '.json': { color: '#cbcb41', label: 'JSN' },
  '.md':   { color: '#083fa1', label: 'MD'  },
};

function getExtMeta(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return { color: '#8b949e', label: 'TXT' };
  const ext = filename.slice(dot).toLowerCase();
  return EXT_META[ext] || { color: '#8b949e', label: ext.slice(1, 4).toUpperCase() };
}

function FileIcon({ filename, size = 15 }) {
  const { color, label } = getExtMeta(filename);
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size + 4,
      height: size + 4,
      borderRadius: 3,
      background: color + '22',
      border: `1px solid ${color}55`,
      color,
      fontSize: 7,
      fontWeight: 700,
      letterSpacing: '-0.5px',
      flexShrink: 0,
      fontFamily: 'monospace',
    }}>
      {label.slice(0, 3)}
    </span>
  );
}

export default function FileExplorer({ filesMap }) {
  const [files, setFiles]               = useState([]);
  const [sectionOpen, setSectionOpen]   = useState(true);
  const [renamingFile, setRenamingFile] = useState(null);   // filename being renamed
  const [renameValue, setRenameValue]   = useState('');
  const [hoveredFile, setHoveredFile]   = useState(null);
  const renameInputRef                  = useRef(null);

  const { activeFile, setActiveFile, setActiveLanguage } = useIdeStore();

  /* ── Sync file list from Y.Map ─────────────────────────────────────── */
  useEffect(() => {
    if (!filesMap) return;
    const update = () => {
      const keys = Array.from(filesMap.keys()).sort();
      setFiles(keys);
      if (!activeFile && keys.length > 0) selectFile(keys[0]);
    };
    update();
    filesMap.observe(update);
    return () => filesMap.unobserve(update);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesMap]);

  /* ── Focus rename input when it appears ────────────────────────────── */
  useEffect(() => {
    if (renamingFile && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingFile]);

  const selectFile = (fileName) => {
    setActiveFile(fileName);
    setActiveLanguage(getLanguageByExtension(fileName));
  };

  /* ── Add new file ───────────────────────────────────────────────────── */
  const addFile = () => {
    const fileName = prompt('New file name (e.g. app.py):');
    if (!fileName || !fileName.trim()) return;
    const name = fileName.trim();
    if (filesMap.has(name)) { alert('File already exists!'); return; }
    const langId = getLanguageByExtension(name);
    filesMap.set(name, new Y.Text(LANGUAGES[langId]?.defaultCode || ''));
    selectFile(name);
  };

  /* ── Delete file ────────────────────────────────────────────────────── */
  const deleteFile = (fileName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${fileName}"?`)) return;
    filesMap.delete(fileName);
    if (activeFile === fileName) setActiveFile(null);
  };

  /* ── Rename file ────────────────────────────────────────────────────── */
  const startRename = (fileName, e) => {
    e.stopPropagation();
    setRenamingFile(fileName);
    setRenameValue(fileName);
  };

  const commitRename = (e) => {
    e?.stopPropagation?.();
    const newName = renameValue.trim();
    if (!newName || newName === renamingFile) { setRenamingFile(null); return; }
    if (filesMap.has(newName)) { alert('A file with that name already exists.'); return; }

    const content = filesMap.get(renamingFile)?.toString() || '';
    const langId  = getLanguageByExtension(newName);
    filesMap.set(newName, new Y.Text(content));
    filesMap.delete(renamingFile);

    if (activeFile === renamingFile) selectFile(newName);
    setRenamingFile(null);
  };

  const cancelRename = (e) => { e?.stopPropagation?.(); setRenamingFile(null); };

  return (
    <div className="fe-root">
      {/* ── Section header ─────────────────────────────────────── */}
      <div className="fe-section-header" onClick={() => setSectionOpen(p => !p)}>
        <div className="fe-section-left">
          {sectionOpen
            ? <ChevronDown size={12} className="fe-chevron" />
            : <ChevronRight size={12} className="fe-chevron" />}
          <span className="fe-section-title">EXPLORER</span>
        </div>
        <button
          className="fe-icon-btn"
          title="New File"
          onClick={(e) => { e.stopPropagation(); addFile(); }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* ── Workspace label ────────────────────────────────────── */}
      {sectionOpen && (
        <div className="fe-workspace-label">
          <Folder size={13} style={{ flexShrink: 0 }} />
          <span>WORKSPACE</span>
        </div>
      )}

      {/* ── File list ──────────────────────────────────────────── */}
      {sectionOpen && (
        <div className="fe-file-list">
          {files.length === 0 && (
            <div className="fe-empty">
              <Files size={28} />
              <span>No files yet</span>
              <button className="fe-empty-btn" onClick={addFile}>+ New File</button>
            </div>
          )}

          {files.map((fileName) => {
            const isActive   = activeFile === fileName;
            const isRenaming = renamingFile === fileName;
            const isHovered  = hoveredFile === fileName;

            return (
              <div
                key={fileName}
                className={`fe-file-row ${isActive ? 'fe-file-row--active' : ''}`}
                onClick={() => !isRenaming && selectFile(fileName)}
                onMouseEnter={() => setHoveredFile(fileName)}
                onMouseLeave={() => setHoveredFile(null)}
                title={fileName}
              >
                {/* indent + icon */}
                <span className="fe-file-indent" />
                <FileIcon filename={fileName} />

                {/* name or rename input */}
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    className="fe-rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')  commitRename(e);
                      if (e.key === 'Escape') cancelRename(e);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="fe-file-name">{fileName}</span>
                )}

                {/* action buttons */}
                <div className={`fe-file-actions ${(isHovered || isActive) && !isRenaming ? 'fe-file-actions--visible' : ''}`}>
                  {isRenaming ? (
                    <>
                      <button className="fe-action-btn fe-action-btn--ok"  onClick={commitRename} title="Confirm rename"><Check size={11}/></button>
                      <button className="fe-action-btn fe-action-btn--del" onClick={cancelRename} title="Cancel"><X size={11}/></button>
                    </>
                  ) : (
                    <>
                      <button className="fe-action-btn" onClick={(e) => startRename(fileName, e)} title="Rename"><Edit2 size={11}/></button>
                      <button className="fe-action-btn fe-action-btn--del" onClick={(e) => deleteFile(fileName, e)} title="Delete"><Trash2 size={11}/></button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}