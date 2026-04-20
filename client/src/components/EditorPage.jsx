import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { yCollab } from 'y-codemirror.next';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Play, Copy, ChevronDown, Users, X, Terminal, Clock, Cpu, Code2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import Chat from './Chat';
import FileExplorer from './FileExplorer';
import { useYjsProvider } from '../hooks/useYjsProvider';
import { useIdeStore } from '../store/useIdeStore';
import { LANGUAGES } from '../config/languages';
import '../App.css';


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
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [execMetrics, setExecMetrics] = useState(null);
  const languageDropdownRef = useRef(null);

  useEffect(() => {
    if (!location.state?.username) {
        navigate('/');
    }
  }, [location.state, navigate]);

  // Close language dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const languageList = Object.values(LANGUAGES);

  return (
    <div className="editor-container">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }}/>
      
      {/* TOP NAVIGATION BAR */}
      <nav className="navbar">
        {/* LEFT SECTION - Brand & Room */}
        <div className="navbar-section">
          <div className="navbar-brand">
            <div className="navbar-brand-icon">C</div>
            <h2 className="navbar-brand-title">CodeSync</h2>
          </div>
          
          <div className="badge">
            <span className="badge-label">Room:</span>
            <span>{roomId}</span>
            <button onClick={copyRoomId} className="badge-button">
              <Copy size={14}/>
            </button>
          </div>
        </div>

        {/* CENTER SECTION - Controls */}
        <div className="center-controls">
          {/* Language Selector */}
          <div className="language-selector" ref={languageDropdownRef}>
            <button 
              className="language-selector-button"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              title="Select programming language"
            >
              <Code2 size={16} />
              {LANGUAGES[activeLanguage]?.name || 'Select Language'}
              <ChevronDown size={14} />
            </button>
            
            {showLanguageDropdown && (
              <div className="language-dropdown">
                {languageList.map((lang) => (
                  <button
                    key={lang.id}
                    className={`language-option ${lang.id === activeLanguage ? 'active' : ''}`}
                    onClick={() => {
                      setActiveLanguage(lang.id);
                      setShowLanguageDropdown(false);
                      toast.success(`Language changed to ${lang.name}`);
                    }}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Avatars */}
          <div>
            <button 
              className="badge"
              onClick={() => setShowUserList(!showUserList)}
              style={{ cursor: 'pointer' }}
            >
              <Users size={14} />
              <div className="avatar-group">
                {clients.slice(0, 3).map((c, i) => (
                  <div key={i} className="avatar" style={{ backgroundColor: c.color }}>
                    {c.name[0].toUpperCase()}
                  </div>
                ))}
                {clients.length > 3 && (
                  <div className="avatar" style={{ backgroundColor: '#334155' }}>
                    +{clients.length - 3}
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Execution Config */}
          <div className="exec-config">
            <Clock size={14} color="#94a3b8"/>
            <input 
              type="number" 
              min="100" 
              max="10000" 
              value={timeout} 
              onChange={e => setTimeout(e.target.value)} 
              className="exec-config-input"
              title="Timeout in milliseconds"
            />
            <span className="exec-config-label">ms</span>
            
            <div className="divider" />
            
            <Cpu size={14} color="#94a3b8"/>
            <input 
              type="number" 
              min="10" 
              max="1024" 
              value={memoryLimit} 
              onChange={e => setMemoryLimit(e.target.value)} 
              className="exec-config-input"
              title="Memory limit in MB"
            />
            <span className="exec-config-label">MB</span>
          </div>

          {/* Run Button */}
          <button onClick={runCode} disabled={isRunning} className="run-button">
            {isRunning ? <><Terminal size={14} /> Running...</> : <><Play size={14} fill="#020617" /> Run</>}
          </button>
        </div>
      </nav>

      {/* MAIN WORKSPACE */}
      <div className="workspace">
        <PanelGroup orientation="horizontal" style={{ flex: 1, height: '100%', minHeight: 0 }}>
          <Panel defaultSize={26} minSize={18} maxSize={34}>
            <div className="editor-panel">
              <Chat provider={provider} username={username} />
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle-vertical">
            <div />
          </PanelResizeHandle>

          <Panel defaultSize={56} minSize={45}>
            <PanelGroup orientation="vertical" style={{ height: '100%', minHeight: 0 }}>
              <Panel>
                <div className="editor-panel">
                  {activeFile ? (
                    <CodeEditorView filesMap={filesMap} activeFile={activeFile} activeLanguage={activeLanguage} provider={provider} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}>
                      Select a file to start coding
                    </div>
                  )}
                </div>
              </Panel>

              <PanelResizeHandle className="resize-handle-horizontal">
                <div />
              </PanelResizeHandle>

              <Panel defaultSize={30} minSize={16}>
                <div className="bottom-panels">
                  {/* STDIN Input Panel */}
                  <div className="panel-tab" style={{ flex: '0 0 34%', minWidth: '180px', borderRight: '1px solid #1e293b' }}>
                    <div className="panel-tab-header panel-tab-header.right-border">STDIN (Input)</div>
                    <textarea 
                      value={stdin} 
                      onChange={(e) => setStdin(e.target.value)} 
                      placeholder="Provide input here..."
                      className="panel-tab-content stdin-input"
                    />
                  </div>

                  {/* Console Output Panel */}
                  <div className="panel-tab" style={{ flex: 1 }}>
                    <div className="panel-tab-header">
                      <div className="panel-tab-header-content">
                        <span>CONSOLE OUTPUT</span>
                        {execMetrics && <span style={{ color: '#4ade80', fontSize: '0.8rem' }}>Exec Time: {execMetrics.time}ms</span>}
                      </div>
                    </div>
                    <pre className={`panel-tab-content console-output ${executionError ? 'error' : 'success'}`}>
                      {executionOutput}
                    </pre>
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="resize-handle-vertical">
            <div />
          </PanelResizeHandle>

          <Panel defaultSize={18} minSize={15} maxSize={26}>
            <div className="editor-panel">
              <FileExplorer filesMap={filesMap} />
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

  return <div ref={editorRef} className="editor-panel" />;
}