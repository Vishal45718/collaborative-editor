import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { yCollab } from 'y-codemirror.next';

// 1. Random User Generator (For demo purposes)
const usercolors = [
  { color: '#30bced', light: '#30bced33' },
  { color: '#6eeb83', light: '#6eeb8333' },
  { color: '#ffbc42', light: '#ffbc4233' },
  { color: '#ecd444', light: '#ecd44433' },
  { color: '#ee6352', light: '#ee635233' },
  { color: '#9ac2c9', light: '#9ac2c933' },
  { color: '#8acb88', light: '#8acb8833' },
  { color: '#1be7ff', light: '#1be7ff33' }
];

// Pick a random color/name for the current user
const randomColor = usercolors[Math.floor(Math.random() * usercolors.length)];
const randomName = 'User ' + Math.floor(Math.random() * 100);

export default function CollaborativeEditor() {
  const editorRef = useRef(null);
  // We track connection status just for UI feedback
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    const ydoc = new Y.Doc();

    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      'my-roomname',
      ydoc
    );

    // 2. AWARENESS CONFIGURATION
    // This tells other users "Here is my name and color"
    provider.awareness.setLocalStateField('user', {
      name: randomName,
      color: randomColor.color,
      colorLight: randomColor.light
    });

    provider.on('status', event => {
      setStatus(event.status); // 'connected' or 'disconnected'
    });

    const ytext = ydoc.getText('codemirror');
    
    // 3. EDITOR SETUP WITH CURSORS
    const state = EditorState.create({
      doc: '',
      extensions: [
        basicSetup,
        javascript(),
        oneDark,
        // The yCollab extension automatically syncs cursors using provider.awareness
        yCollab(ytext, provider.awareness) 
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    return () => {
      view.destroy();
      provider.destroy();
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Code With Friends</h2>
        <span style={{ 
          padding: '5px 10px', 
          borderRadius: '20px', 
          backgroundColor: status === 'connected' ? '#4caf50' : '#f44336',
          color: 'white',
          fontSize: '0.8rem'
        }}>
          {status.toUpperCase()}
        </span>
      </div>
      
      <p>You are: <strong style={{color: randomColor.color}}>{randomName}</strong></p>
      
      <div 
        ref={editorRef} 
        style={{ border: '2px solid #333', borderRadius: '8px', overflow: 'hidden', height: '500px' }} 
      />
      
      <div style={{marginTop: '20px', fontSize: '0.9rem', color: '#666'}}>
        <strong>Instructions:</strong> Open this URL in a new tab. You will be assigned a different name/color. 
        Move your mouse and type to see the cursor sync!
      </div>
    </div>
  );
}
