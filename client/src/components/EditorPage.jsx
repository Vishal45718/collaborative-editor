import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { cpp } from '@codemirror/lang-cpp'; // 🟢 Switch to C++
import { oneDark } from '@codemirror/theme-one-dark';
import { yCollab } from 'y-codemirror.next';

export default function EditorPage() {
  const editorRef = useRef(null);
  const { roomId } = useParams();
  const [output, setOutput] = useState('Click "Run Code" to see output here...');
  const [isRunning, setIsRunning] = useState(false);
  
  // We need a way to read the current code for the "Run" button
  // We'll use a ref to store the Y.Text object
  const ytextRef = useRef(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      roomId,
      ydoc
    );

    const ytext = ydoc.getText('codemirror');
    ytextRef.current = ytext; // Store ref so we can access it outside useEffect

    // Set default C++ Hello World if empty
    if (ytext.toString() === '') {
      ytext.insert(0, `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++ Collaborative Editor!" << endl;
    return 0;
}`);
    }

    const state = EditorState.create({
      doc: ytext.toString(), // Initialize with current Yjs text
      extensions: [
        basicSetup,
        cpp(), // 🟢 C++ Syntax Highlighting
        oneDark,
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
  }, [roomId]);

  // 🟢 FUNCTION TO RUN C++ CODE
  const runCode = async () => {
    if (!ytextRef.current) return;
    
    setIsRunning(true);
    setOutput('Compiling and Running...');
    
    const sourceCode = ytextRef.current.toString();

    try {
      // We use the Piston API to execute C++ safely
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'c++',
          version: '10.2.0', // GCC Version
          files: [{ content: sourceCode }]
        })
      });

      const data = await response.json();
      
      // Handle the result
      if (data.run) {
        setOutput(data.run.output); // Show stdout or stderr
      } else {
        setOutput('Error: Failed to execute code.');
      }
    } catch (err) {
      setOutput('Error: Could not connect to compiler API.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#282c34', color: 'white' }}>
      {/* HEADER */}
      <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#21252b' }}>
        <h2 style={{ margin: 0 }}>C++ Editor Room: <span style={{color: '#61dafb'}}>{roomId}</span></h2>
        
        <button 
          onClick={runCode} 
          disabled={isRunning}
          style={{
            backgroundColor: isRunning ? '#666' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          {isRunning ? 'Running...' : '▶ Run Code'}
        </button>
      </div>

      {/* EDITOR AREA */}
      <div 
        ref={editorRef} 
        style={{ flex: 1, overflow: 'auto', fontSize: '16px' }} 
      />

      {/* TERMINAL AREA */}
      <div style={{ height: '200px', backgroundColor: '#1e1e1e', borderTop: '2px solid #333', padding: '10px', overflow: 'auto' }}>
        <strong style={{ display: 'block', marginBottom: '5px', color: '#888' }}>TERMINAL OUTPUT:</strong>
        <pre style={{ margin: 0, fontFamily: 'monospace', color: '#ddd' }}>
          {output}
        </pre>
      </div>
    </div>
  );
}
