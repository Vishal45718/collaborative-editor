import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { yCollab } from 'y-codemirror.next';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { javascript } from '@codemirror/lang-javascript';

// CONFIG OBJECT
const LANGUAGES = {
  'cpp': {
    name: 'C++',
    extension: cpp(),
    pistonRuntime: { language: 'c++', version: '10.2.0' },
    defaultCode: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    cout << "You entered: " << x << endl;\n    return 0;\n}`
  },
  'python': {
    name: 'Python',
    extension: python(),
    pistonRuntime: { language: 'python', version: '3.10.0' },
    defaultCode: `x = input()\nprint(f"You entered: {x}")`
  },
  'java': {
    name: 'Java',
    extension: java(),
    pistonRuntime: { language: 'java', version: '15.0.2' },
    defaultCode: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        String x = scanner.nextLine();\n        System.out.println("You entered: " + x);\n    }\n}`
  },
  'javascript': {
    name: 'JavaScript',
    extension: javascript(),
    pistonRuntime: { language: 'javascript', version: '18.15.0' },
    defaultCode: `console.log("Hello from JS!");`
  }
};

export default function EditorPage() {
  const editorRef = useRef(null);
  const { roomId } = useParams();
  
  const [language, setLanguage] = useState('cpp'); 
  const [output, setOutput] = useState('Click "Run Code" to see output here...');
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState('');
  const [isError, setIsError] = useState(false);

  // 🟢 NEW STATE for Copy Button
  const [copyBtnText, setCopyBtnText] = useState('Copy Room ID');

  // We keep the Yjs objects in state so they persist across renders
  const [ytext, setYtext] = useState(null);
  const [provider, setProvider] = useState(null);

  // 🟢 COPY BUTTON FUNCTION
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyBtnText('Copied! ✅');
      setTimeout(() => setCopyBtnText('Copy Room ID'), 2000);
    } catch (err) {
      alert('Failed to copy URL');
    }
  };

  // EFFECT 1: Create Y doc + provider
  useEffect(() => {
    const ydoc = new Y.Doc();
    const newProvider = new WebsocketProvider(
      'ws://localhost:1234',
      roomId,
      ydoc
    );
    const newYtext = ydoc.getText('codemirror');
    
    setProvider(newProvider);
    setYtext(newYtext);

    return () => {
      newProvider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  // EFFECT 2: Setup editor when ready
  useEffect(() => {
    if (!ytext || !provider || !editorRef.current) return;

    if (ytext.toString() === '') {
        ytext.insert(0, LANGUAGES[language].defaultCode);
    }

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        LANGUAGES[language].extension,
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
    };
  }, [ytext, provider, language]);

  const runCode = async () => {
    if (!ytext) return;
    
    setIsRunning(true);
    setOutput('Compiling and Running...');
    setIsError(false);

    const sourceCode = ytext.toString();
    const runtime = LANGUAGES[language].pistonRuntime;

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: runtime.language,
          version: runtime.version,
          files: [{ content: sourceCode }],
          stdin: stdin,
          args: [] 
        })
      });

      const data = await response.json();
      
      if (data.run && data.run.stderr) {
         setIsError(true);
         setOutput(data.run.stderr);
      } else {
         setIsError(false);
         setOutput(data.run.output);
      }
    } catch (err) {
      setIsError(true);
      setOutput('Error: Could not connect to compiler API.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#282c34', color: 'white' }}>
      
      {/* HEADER BAR */}
      <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#21252b' }}>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          
          <h2 style={{ margin: 0 }}>
            Room: <span style={{color: '#61dafb'}}>{roomId}</span>
          </h2>
          
          {/* LANGUAGE SELECT */}
          <select 
            value={language} 
            onChange={(e) => {
                const newLang = e.target.value;
                if (window.confirm(`Switching to ${LANGUAGES[newLang].name} will CLEAR the current code. Are you sure?`)) {
                    setLanguage(newLang);
                    if (ytext) {
                        ytext.delete(0, ytext.length);
                        ytext.insert(0, LANGUAGES[newLang].defaultCode);
                    }
                }
            }}
            style={{ padding: '5px', borderRadius: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555', cursor: 'pointer' }}
          >
            {Object.keys(LANGUAGES).map(lang => (
              <option key={lang} value={lang}>{LANGUAGES[lang].name}</option>
            ))}
          </select>

          {/* 🟢 COPY BUTTON ADDED HERE */}
          <button
            onClick={copyRoomId}
            style={{
              marginLeft: '10px',
              padding: '5px 10px',
              backgroundColor: '#444',
              color: 'white',
              border: '1px solid #666',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {copyBtnText}
          </button>

        </div>

        {/* RUN BUTTON */}
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

      <div ref={editorRef} style={{ flex: 1, overflow: 'auto', fontSize: '16px' }} />

      <div style={{ height: '250px', display: 'flex', borderTop: '2px solid #333', backgroundColor: '#1e1e1e' }}>
        
        <div style={{ width: '30%', borderRight: '2px solid #333', display: 'flex', flexDirection: 'column' }}>
          <strong style={{ padding: '10px', color: '#888', backgroundColor: '#252526' }}>INPUT (stdin):</strong>
          
          <textarea 
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input here..."
            style={{ flex: 1, backgroundColor: '#1e1e1e', color: 'white', border: 'none', padding: '10px', resize: 'none', outline: 'none', fontFamily: 'monospace' }}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <strong style={{ padding: '10px', color: '#888', backgroundColor: '#252526' }}>TERMINAL OUTPUT:</strong>
          
          <pre style={{ margin: 0, padding: '10px', fontFamily: 'monospace', color: isError ? '#ff6b6b' : '#ddd', overflow: 'auto', flex: 1 }}>
            {output}
          </pre>
        </div>

      </div>

    </div>
  );
}
