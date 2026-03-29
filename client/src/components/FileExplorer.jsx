import { useState, useEffect } from 'react';
import { Folder, File, Plus, X, ChevronRight, ChevronDown } from 'lucide-react';

export default function FileExplorer({ ydoc, provider, roomId }) {
  const [files, setFiles] = useState([
    { name: 'main.cpp', type: 'file', content: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World!" << endl;\n    return 0;\n}' },
    { name: 'utils.h', type: 'file', content: '#ifndef UTILS_H\n#define UTILS_H\n\n// Utility functions\n\n#endif' },
    { name: 'src', type: 'folder', children: [
      { name: 'helper.cpp', type: 'file', content: '#include "helper.h"\n\n// Helper implementations' },
      { name: 'helper.h', type: 'file', content: '#ifndef HELPER_H\n#define HELPER_H\n\nvoid helper();\n\n#endif' }
    ]}
  ]);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['src']));
  const [selectedFile, setSelectedFile] = useState('main.cpp');

  const toggleFolder = (folderName) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const selectFile = (fileName) => {
    setSelectedFile(fileName);
    // Here you would update the editor content
  };

  const renderFileTree = (items, level = 0) => {
    return items.map((item, index) => (
      <div key={index} style={{ marginLeft: level * 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 8px',
            cursor: 'pointer',
            borderRadius: '4px',
            backgroundColor: selectedFile === item.name ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
            color: selectedFile === item.name ? '#22d3ee' : '#e6edf3'
          }}
          onClick={() => item.type === 'folder' ? toggleFolder(item.name) : selectFile(item.name)}
        >
          {item.type === 'folder' ? (
            <>
              {expandedFolders.has(item.name) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Folder size={16} style={{ marginRight: '8px', color: '#74b816' }} />
            </>
          ) : (
            <>
              <File size={16} style={{ marginRight: '8px', marginLeft: '18px', color: '#61dafb' }} />
            </>
          )}
          <span style={{ fontSize: '14px' }}>{item.name}</span>
        </div>
        {item.type === 'folder' && expandedFolders.has(item.name) && item.children && (
          <div>{renderFileTree(item.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div style={{
      width: '250px',
      backgroundColor: '#161b22',
      borderRight: '1px solid #30363d',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #30363d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#e6edf3' }}>EXPLORER</span>
        <button style={{
          background: 'none',
          border: 'none',
          color: '#8b949e',
          cursor: 'pointer',
          padding: '4px'
        }}>
          <Plus size={16} />
        </button>
      </div>

      {/* File Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {renderFileTree(files)}
      </div>

      {/* Footer with room stats */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #30363d',
        fontSize: '12px',
        color: '#8b949e'
      }}>
        <div>Room: {roomId}</div>
        <div>Files: {files.length}</div>
      </div>
    </div>
  );
}