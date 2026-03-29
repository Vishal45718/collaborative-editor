import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
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
import { Play, Copy, ChevronDown, Users, X, Settings, Zap, Terminal } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Chat from './Chat';
import FileExplorer from './FileExplorer'; 

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
  const location = useLocation();
  const navigate = useNavigate();
  
  const [language, setLanguage] = useState('cpp'); 
  const [output, setOutput] = useState('Click "Run Code" to see output here...');
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [ytext, setYtext] = useState(null);
  const [provider, setProvider] = useState(null);
  
  // User List State
  const [clients, setClients] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  
  const username = location.state?.username || 'Anonymous';

  // 1. CONNECTION
  useEffect(() => {
    if (!location.state?.username) {
        navigate('/');
        return;
    }

    const ydoc = new Y.Doc();
    const newProvider = new WebsocketProvider(
      'ws://localhost:1234', // Local development server
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
  }, [roomId, location.state, navigate]);

  // 2. EDITOR SETUP
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

  // 3. USER AWARENESS (Identity Logic)
  useEffect(() => {
    if (!provider) return;

    // 🟢 Fix 1: Persist Color so refresh doesn't look like a new person
    const storedColor = sessionStorage.getItem(`userColor-${roomId}`);
    const colors = ['#f783ac', '#d9480f', '#74b816', '#1098ad', '#5c7cfa'];
    const myColor = storedColor || colors[Math.floor(Math.random() * colors.length)];
    
    if (!storedColor) {
        sessionStorage.setItem(`userColor-${roomId}`, myColor);
    }

    // Set my user data
    provider.awareness.setLocalStateField('user', {
        name: username,
        color: myColor,
        colorLight: myColor + '33' 
    });

    // 🟢 Fix 2: Instant Cleanup on Refresh (Removes Ghost Users)
    const handleUnload = () => {
        provider.awareness.setLocalState(null); // Tell everyone I left immediately
        provider.destroy();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
        window.removeEventListener('beforeunload', handleUnload);
    }
  }, [provider, username, roomId]);

  // 4. CLIENT LISTENER
  const clientCache = useRef(new Map()); 
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!provider) return;

    // Reset cache when provider changes (room switch)
    clientCache.current.clear();
    hasJoinedRef.current = false;

    const awareness = provider.awareness;

    const updateClients = () => {
       const states = awareness.getStates(); // Get ALL users (me + others)
       
       // 1. Detect Joins
       states.forEach((state, clientId) => {
         if (state.user && state.user.name) {
           if (!clientCache.current.has(clientId)) {
             clientCache.current.set(clientId, state.user);
             
             if (hasJoinedRef.current) {
               toast.success(`${state.user.name} joined!`);
             }
           }
         }
       });

       // 2. Detect Leaves
       clientCache.current.forEach((user, clientId) => {
         if (!states.has(clientId)) {
           toast(`${user.name} left`, { icon: '👋' });
           clientCache.current.delete(clientId);
         }
       });

       // Mark initial load as done so we don't toast for existing users
       if (!hasJoinedRef.current && states.size > 0) {
         hasJoinedRef.current = true;
       }

       const clientList = Array.from(states.values())
        .map(s => s.user)
        .filter(u => u && u.name); // Filter out empty states
       
       // Deduplicate by Name (Optional: In case of fast-refresh race conditions)
       const uniqueClients = Array.from(new Map(clientList.map(item => [item.name, item])).values());

       setClients(uniqueClients);
    };

    // 🟢 Fix 3: Run immediately to see existing users
    updateClients();

    awareness.on('change', updateClients);
    return () => awareness.off('change', updateClients);
  }, [provider]);


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
         toast.success("Run complete!");
      }
    } catch (err) {
      setIsError(true);
      setOutput('Error: Could not connect to compiler API.');
      toast.error("Compilation failed");
    } finally {
      setIsRunning(false);
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success('Room ID copied!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0f1117', color: '#e6edf3' }}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }}/>
      
      {/* 🟢 TOP BAR */}
      <div style={{ 
        padding: '0 20px', 
        height: '60px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid #30363d',
        backgroundColor: '#161b22',
        zIndex: 100 
      }}>
        
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #22d3ee, #4ade80)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#020617'
            }}>
              C
            </div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#61dafb' }}>CodeSync</h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0d1117', padding: '5px 15px', borderRadius: '6px', border: '1px solid #30363d' }}>
             <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Room:</span>
             <span style={{ fontWeight: 'bold', letterSpacing: '1px' }}>{roomId}</span>
             <button onClick={copyRoomId} className="btn" style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex' }}><Copy size={14}/></button>
          </div>
        </div>

        {/* 🟢 CENTER: USERS DROPDOWN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          
          <div style={{ position: 'relative' }}>
            {/* The Clickable Stack */}
            <div 
              onClick={() => setShowUserList(!showUserList)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: '#0d1117', 
                padding: '6px 12px', 
                borderRadius: '20px', 
                border: '1px solid #30363d',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="View all users"
            >
              <Users size={16} color="#8b949e" style={{ marginRight: '10px' }}/>
              <div style={{ display: 'flex', marginLeft: '-5px' }}>
                {clients.slice(0, 3).map((client, index) => (
                  <div key={index} style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: client.color,
                    border: '2px solid #161b22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    marginLeft: index === 0 ? 0 : '-10px'
                  }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {clients.length > 3 && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#30363d',
                    border: '2px solid #161b22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#e6edf3',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    marginLeft: '-10px'
                  }}>
                    +{clients.length - 3}
                  </div>
                )}
              </div>
              <ChevronDown size={12} color="#8b949e" style={{ marginLeft: '8px', transform: showUserList ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}/>
            </div>

            {/* The Dropdown Panel */}
            {showUserList && (
              <div style={{
                position: 'absolute',
                top: '120%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '220px',
                backgroundColor: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '12px',
                padding: '10px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: 200,
                animation: 'fadeIn 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #30363d' }}>
                   <span style={{ fontSize: '12px', color: '#8b949e', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Users ({clients.length})</span>
                   <X size={14} color="#8b949e" style={{ cursor: 'pointer' }} onClick={() => setShowUserList(false)}/>
                </div>
                
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {clients.map((client, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px', borderRadius: '6px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: client.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <span style={{ fontSize: '14px', color: '#e6edf3' }}>{client.name} {client.name === username && <span style={{color: '#8b949e'}}>(You)</span>}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <select 
              value={language} 
              onChange={(e) => {
                  const newLang = e.target.value;
                  if (window.confirm(`Switching to ${LANGUAGES[newLang].name} will reset your code. Continue?`)) {
                      setLanguage(newLang);
                      if (ytext) {
                          ytext.delete(0, ytext.length);
                          ytext.insert(0, LANGUAGES[newLang].defaultCode);
                          toast.success(`Switched to ${LANGUAGES[newLang].name}`);
                      }
                  }
              }}
              style={{ padding: '8px 30px 8px 15px', borderRadius: '6px', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', appearance: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {Object.keys(LANGUAGES).map(lang => <option key={lang} value={lang}>{LANGUAGES[lang].name}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8b949e' }} />
          </div>
        </div>
        
        <button onClick={runCode} disabled={isRunning} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: isRunning ? '#30363d' : '#238636', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '6px', cursor: isRunning ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
          {isRunning ? <><Terminal size={16} /> Running...</> : <><Play size={16} fill="white" /> Run Code</>}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* File Explorer */}
        <FileExplorer ydoc={provider?.doc} provider={provider} roomId={roomId} />

        {/* Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div ref={editorRef} style={{ flex: 1, overflow: 'auto' }} />
        </div>
      </div>

      <div style={{ height: '250px', display: 'flex', borderTop: '1px solid #30363d', backgroundColor: '#0d1117' }}>
        <div style={{ width: '30%', borderRight: '1px solid #30363d', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 15px', backgroundColor: '#161b22', borderBottom: '1px solid #30363d', color: '#8b949e', fontSize: '0.8rem', fontWeight: 'bold' }}>STDIN (Input)</div>
          <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} style={{ flex: 1, background: '#0d1117', color: '#e6edf3', border: 'none', padding: '10px', resize: 'none', fontFamily: 'monospace', outline: 'none' }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 15px', backgroundColor: '#161b22', borderBottom: '1px solid #30363d', color: '#8b949e', fontSize: '0.8rem', fontWeight: 'bold' }}>CONSOLE OUTPUT</div>
          <pre style={{ margin: 0, padding: '15px', fontFamily: "'JetBrains Mono', monospace", color: isError ? '#f85149' : '#e6edf3', overflow: 'auto', flex: 1 }}>{output}</pre>
        </div>
      </div>

      <Chat provider={provider} username={username} />
      
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
    </div>
  );
}