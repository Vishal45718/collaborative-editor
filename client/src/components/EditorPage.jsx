import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { yCollab } from 'y-codemirror.next';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Play, Copy, ChevronDown, Users, X, Terminal, Clock, Cpu } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import Chat from './Chat';
import FileExplorer from './FileExplorer';
import { useYjsProvider } from '../hooks/useYjsProvider';
import { useIdeStore } from '../store/useIdeStore';
import { LANGUAGES } from '../config/languages';

export default function EditorPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || 'Anonymous';

  const { provider, filesMap, clients } = useYjsProvider(roomId, username);
  const { 
    activeFile, activeLanguage, setActiveLanguage,
    executionOutput, executionError, setExecutionOutput,
    isRunning, setIsRunning,
    stdin, setStdin,
    timeout, memoryLimit, setTimeout, setMemoryLimit
  } = useIdeStore();

  const [showUserList, setShowUserList] = useState(false);
  const [execMetrics, setExecMetrics] = useState(null);

  useEffect(() => {
    if (!location.state?.username) {
        navigate('/');
    }
  }, [location.state, navigate]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success('Room ID copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const runCode = async () => {
    if (!activeFile || !filesMap || !filesMap.has(activeFile)) {
      toast.error('No valid file to execute');
      return;
    }
    
    setIsRunning(true);
    setExecutionOutput('⏳ Compiling and running...', false);
    setExecMetrics(null);

    const sourceCode = filesMap.get(activeFile).toString();
    const runtime = LANGUAGES[activeLanguage]?.pistonRuntime;

    if (!runtime) {
      setExecutionOutput(`Language execution not configured for ${activeLanguage}`, true);
      setIsRunning(false);
      return;
    }

    try {
      const requestBody = {
        language: runtime.language,
        version: runtime.version,
        code: sourceCode,
        stdin: stdin,
        timeout,
        memoryLimit
      };
      
      const response = await fetch('http://localhost:1234/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      setExecMetrics({ time: data.executionTimeMs });

      if (data.run) {
        const output = data.run.stdout || data.run.output || '';
        const stderr = data.run.stderr || '';
        
        if (data.run.code !== 0) {
           setExecutionOutput((stderr || output) + `\\n\\n[Exited with code ${data.run.code}]`, true);
           toast.error('Execution finished with errors');
        } else if (stderr && stderr.trim()) {
          setExecutionOutput(stderr, true);
          toast.error('Execution error');
        } else if (output.trim()) {
          setExecutionOutput(output, false);
          toast.success('Code executed!');
        } else {
          setExecutionOutput('✅ Success (no output)', false);
          toast.success('Code executed!');
        }
      } else if (data.compile) {
        setExecutionOutput(data.compile.stderr || 'Compilation error', true);
        toast.error('Compilation failed');
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      setExecutionOutput(`❌ Error: ${err.message}`, true);
      toast.error('Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#020617', color: '#e6edf3', overflow: 'hidden' }}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }}/>
      
      {/* TOP NAVIGATION BAR */}
      <div style={{ 
        padding: '0 20px', height: '55px', display: 'flex', justifyContent: 'space-between', 
        alignItems: 'center', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a', zIndex: 100, width: '100%', maxWidth: '1600px', margin: '0 auto' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'linear-gradient(135deg, #22d3ee, #4ade80)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', color: '#020617'
            }}>C</div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#f8fafc' }}>CodeSync</h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '4px 12px', borderRadius: '6px' }}>
             <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Room:</span>
             <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#f8fafc' }}>{roomId}</span>
             <button onClick={copyRoomId} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}><Copy size={14}/></button>
          </div>
        </div>

        {/* CENTER CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* USER AVATARS */}
          <div style={{ position: 'relative' }}>
            <div onClick={() => setShowUserList(!showUserList)}
              style={{ 
                display: 'flex', alignItems: 'center', background: '#1e293b', padding: '4px 10px', 
                borderRadius: '20px', border: '1px solid #334155', cursor: 'pointer'
              }}
            >
              <Users size={14} color="#94a3b8" style={{ marginRight: '8px' }}/>
              <div style={{ display: 'flex' }}>
                {clients.slice(0, 3).map((c, i) => (
                  <div key={i} style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: c.color, border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', marginLeft: i === 0 ? 0 : '-8px' }}>
                    {c.name[0].toUpperCase()}
                  </div>
                ))}
                {clients.length > 3 && (
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#334155', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f8fafc', fontSize: '10px', fontWeight: 'bold', marginLeft: '-8px' }}>
                    +{clients.length - 3}
                  </div>
                )}
              </div>
              <ChevronDown size={12} color="#94a3b8" style={{ marginLeft: '6px' }}/>
            </div>
            {/* User Dropdown omitted for brevity but should be here */}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#1e293b', padding: '4px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
             <Clock size={14} color="#94a3b8"/>
             <input type="number" min="100" max="10000" value={timeout} onChange={e => setTimeout(e.target.value)} style={{ width: '50px', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '12px', outline: 'none'}} />
             <span style={{ fontSize: '10px', color: '#94a3b8'}}>ms</span>
             
             <div style={{ width: '1px', height: '14px', background: '#334155', margin: '0 4px'}} />
             
             <Cpu size={14} color="#94a3b8"/>
             <input type="number" min="10" max="1024" value={memoryLimit} onChange={e => setMemoryLimit(e.target.value)} style={{ width: '40px', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '12px', outline: 'none'}} />
             <span style={{ fontSize: '10px', color: '#94a3b8'}}>MB</span>
          </div>

          <button onClick={runCode} disabled={isRunning} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: isRunning ? '#334155' : '#22d3ee', color: isRunning ? '#94a3b8' : '#020617', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: isRunning ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.2s' }}>
            {isRunning ? <><Terminal size={14} /> Running...</> : <><Play size={14} fill="#020617" /> Run</>}
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '1rem 20px', gap: '16px' }}>
        <PanelGroup orientation="horizontal" style={{ flex: 1, minHeight: 0 }}>
          <Panel defaultSize={18} minSize={15} maxSize={26}>
            <div style={{ height: '100%', minHeight: 0, display: 'flex' }}>
              <FileExplorer filesMap={filesMap} />
            </div>
          </Panel>
          <PanelResizeHandle style={{ width: '8px', marginLeft: '-2px', marginRight: '-2px', zIndex: 10, cursor: 'col-resize', display: 'flex', justifyContent: 'center', alignItems: 'center', outline: 'none' }}>
            <div style={{ width: '2px', height: '100%', background: '#1e293b', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#3b82f6'} onMouseOut={e => e.target.style.background = '#1e293b'} />
          </PanelResizeHandle>
          <Panel defaultSize={56} minSize={45}>
            <PanelGroup orientation="vertical" style={{ height: '100%', minHeight: 0 }}>
              <Panel>
                <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                 {activeFile ? <CodeEditorView filesMap={filesMap} activeFile={activeFile} activeLanguage={activeLanguage} provider={provider} /> : <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#475569'}}>Select a file to start coding</div>}
                </div>
              </Panel>
              <PanelResizeHandle style={{ height: '8px', marginTop: '-2px', marginBottom: '-2px', zIndex: 10, cursor: 'row-resize', display: 'flex', justifyContent: 'center', alignItems: 'center', outline: 'none' }}>
                <div style={{ height: '2px', width: '100%', background: '#1e293b', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#3b82f6'} onMouseOut={e => e.target.style.background = '#1e293b'} />
              </PanelResizeHandle>
              <Panel defaultSize={30} minSize={16}>
                 <div style={{ display: 'flex', height: '100%', minHeight: 0, backgroundColor: '#0f172a', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(148, 163, 184, 0.08)' }}>
                    <div style={{ flex: '0 0 34%', minWidth: '180px', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '10px 14px', backgroundColor: '#161b22', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700' }}>STDIN (Input)</div>
                      <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} placeholder="Provide input here..." style={{ flex: 1, background: 'transparent', color: '#e2e8f0', border: 'none', padding: '14px', resize: 'none', fontFamily: 'monospace', outline: 'none', minHeight: 0 }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                      <div style={{ padding: '10px 14px', backgroundColor: '#161b22', borderBottom: '1px solid #1e293b', display:'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700' }}>
                          <span>CONSOLE OUTPUT</span>
                          {execMetrics && <span style={{ color: '#4ade80', fontSize: '0.8rem' }}>Wait/Exec Time: {execMetrics.time}ms</span>}
                      </div>
                      <pre style={{ margin: 0, padding: '16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: executionError ? '#ef4444' : '#e2e8f0', overflow: 'auto', flex: 1, whiteSpace: 'pre-wrap', minHeight: 0 }}>
                          {executionOutput}
                      </pre>
                    </div>
                 </div>
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle style={{ width: '8px', marginLeft: '-2px', marginRight: '-2px', zIndex: 10, cursor: 'col-resize', display: 'flex', justifyContent: 'center', alignItems: 'center', outline: 'none' }}>
            <div style={{ width: '2px', height: '100%', background: '#1e293b', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#3b82f6'} onMouseOut={e => e.target.style.background = '#1e293b'} />
          </PanelResizeHandle>
          <Panel defaultSize={26} minSize={18} maxSize={34}>
            <div style={{ height: '100%', minHeight: 0, display: 'flex' }}>
              <Chat provider={provider} username={username} />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

// Separate component to handle CodeMirror lifecycle explicitly for the active file
function CodeEditorView({ filesMap, activeFile, activeLanguage, provider }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!filesMap || !activeFile || !provider || !editorRef.current) return;

    // filesMap stores Y.Text for each activeFile
    const ytext = filesMap.get(activeFile);
    if (!ytext) return; // Wait for it to be created

    const langExt = LANGUAGES[activeLanguage]?.cmExtension;

    const extensions = [
      basicSetup,
      oneDark,
      yCollab(ytext, provider.awareness)
    ];

    if (langExt) extensions.push(langExt());

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    return () => {
      view.destroy();
    };
  }, [filesMap, activeFile, activeLanguage, provider]);

  return <div ref={editorRef} style={{ height: '100%', overflow: 'auto', backgroundColor: '#020617' }} />;
}