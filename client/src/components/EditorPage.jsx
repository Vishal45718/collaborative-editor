import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { yCollab } from 'y-codemirror.next';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Play, Copy, ChevronDown, Users, Terminal, Code2, RotateCcw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import * as Y from 'yjs';

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
    activeOutputTab, setActiveOutputTab,
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

  // ─── Language Switch: update Y.Text with default code for that language ───
  const handleLanguageChange = useCallback((langId) => {
    if (!filesMap || !activeFile) {
      setActiveLanguage(langId);
      setShowLanguageDropdown(false);
      toast.success(`Language changed to ${LANGUAGES[langId]?.name}`);
      return;
    }

    const defaultCode = LANGUAGES[langId]?.defaultCode || '';
    const ytext = filesMap.get(activeFile);

    if (ytext) {
      // Replace Y.Text content with the new language's starter template
      ytext.delete(0, ytext.length);
      ytext.insert(0, defaultCode);
    }

    setActiveLanguage(langId);
    setShowLanguageDropdown(false);
    toast.success(`Switched to ${LANGUAGES[langId]?.name}`);
  }, [filesMap, activeFile, setActiveLanguage]);

  // ─── Code Execution ───────────────────────────────────────────────────────
  const runCode = async () => {
    if (!activeFile || !filesMap || !filesMap.has(activeFile)) {
      toast.error('No valid file to execute');
      return;
    }

    setIsRunning(true);
    setActiveOutputTab('run');
    setExecutionOutput('⏳ Compiling and running…', false);
    setExecMetrics(null);

    const sourceCode = filesMap.get(activeFile).toString();
    const runtime = LANGUAGES[activeLanguage]?.pistonRuntime;

    if (!runtime) {
      setExecutionOutput(`Language execution not configured for "${activeLanguage}"`, true);
      setIsRunning(false);
      return;
    }

    try {
      const requestBody = {
        language: runtime.language,
        version: runtime.version,
        code: sourceCode,
        stdin: stdin,
      };

      const response = await fetch('http://localhost:1234/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setExecMetrics({ time: data.executionTimeMs });

      if (data.run) {
        const stdout = data.run.stdout || data.run.output || '';
        const stderr = data.run.stderr || '';
        const exitCode = data.run.code;

        if (exitCode !== 0) {
          const errText = (stderr || stdout) + `\n\n[Process exited with code ${exitCode}]`;
          setExecutionOutput(errText, true);
          toast.error('Execution finished with errors');
        } else if (stderr && stderr.trim()) {
          setExecutionOutput(stderr, true);
          toast.error('Execution produced stderr output');
        } else if (stdout.trim()) {
          setExecutionOutput(stdout, false);
          toast.success('Code executed successfully!');
        } else {
          setExecutionOutput('✅ Process finished with no output.', false);
          toast.success('Code executed!');
        }
      } else if (data.compile) {
        setExecutionOutput(
          `Compilation failed:\n\n${data.compile.stderr || data.compile.output || 'Unknown compilation error'}`,
          true
        );
        toast.error('Compilation failed');
      } else {
        throw new Error('Unexpected API response structure');
      }
    } catch (err) {
      setExecutionOutput(`❌ Error: ${err.message}\n\nMake sure the Piston execution engine is running.\nRun: docker-compose up -d`, true);
      toast.error('Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setExecutionOutput('Ready to run. Press ▶ Run to execute your code.', false);
    setExecMetrics(null);
  };

  const languageList = Object.values(LANGUAGES);

  return (
    <div className="editor-container">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />

      {/* TOP NAVIGATION BAR */}
      <nav className="navbar">
        {/* LEFT — Brand & Room */}
        <div className="navbar-section">
          <div className="navbar-brand">
            <div className="navbar-brand-icon">C</div>
            <h2 className="navbar-brand-title">CodeSync</h2>
          </div>

          <div className="badge">
            <span className="badge-label">Room:</span>
            <span>{roomId}</span>
            <button onClick={copyRoomId} className="badge-button">
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* CENTER — Controls */}
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
                    onClick={() => handleLanguageChange(lang.id)}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Online Users */}
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

          {/* Run Button */}
          <button onClick={runCode} disabled={isRunning} className="run-button">
            {isRunning ? (
              <>
                <span className="run-spinner" />
                Running…
              </>
            ) : (
              <>
                <Play size={14} fill="#020617" />
                Run
              </>
            )}
          </button>
        </div>
      </nav>

      {/* MAIN WORKSPACE */}
      <div className="workspace">
        <PanelGroup orientation="horizontal" style={{ flex: 1, height: '100%', minHeight: 0 }}>
          {/* LEFT — File Explorer */}
          <Panel defaultSize={18} minSize={14} maxSize={28}>
            <div className="editor-panel">
              <FileExplorer filesMap={filesMap} />
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle-vertical">
            <div />
          </PanelResizeHandle>

          {/* CENTER — Editor + Output */}
          <Panel defaultSize={82} minSize={55}>
            <PanelGroup orientation="vertical" style={{ height: '100%', minHeight: 0 }}>
              {/* Code Editor */}
              <Panel>
                <div className="editor-panel">
                  {activeFile ? (
                    <CodeEditorView
                      filesMap={filesMap}
                      activeFile={activeFile}
                      activeLanguage={activeLanguage}
                      provider={provider}
                    />
                  ) : (
                    <div className="editor-empty-state">
                      <Code2 size={40} color="#334155" />
                      <p>Select or create a file to start coding</p>
                    </div>
                  )}
                </div>
              </Panel>

              <PanelResizeHandle className="resize-handle-horizontal">
                <div />
              </PanelResizeHandle>

              {/* VS Code-like Bottom Panel */}
              <Panel defaultSize={30} minSize={16}>
                <div className="vscode-bottom-panel">
                  {/* Tab bar */}
                  <div className="vscode-tab-bar">
                    <button
                      className={`vscode-tab ${activeOutputTab === 'run' ? 'vscode-tab--active' : ''}`}
                      onClick={() => setActiveOutputTab('run')}
                    >
                      <Play size={12} />
                      Run
                    </button>
                    <button
                      className={`vscode-tab ${activeOutputTab === 'terminal' ? 'vscode-tab--active' : ''}`}
                      onClick={() => setActiveOutputTab('terminal')}
                    >
                      <Terminal size={12} />
                      Terminal
                    </button>

                    <div className="vscode-tab-spacer" />

                    {/* Right-side actions */}
                    {activeOutputTab === 'run' && execMetrics && (
                      <span className="vscode-exec-time">
                        ⏱ {execMetrics.time}ms
                      </span>
                    )}
                    <button className="vscode-action-btn" onClick={clearOutput} title="Clear output">
                      <RotateCcw size={13} />
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="vscode-panel-content">
                    {activeOutputTab === 'run' && (
                      <pre className={`vscode-output ${executionError ? 'vscode-output--error' : ''}`}>
                        {executionOutput}
                      </pre>
                    )}

                    {activeOutputTab === 'terminal' && (
                      <div className="vscode-terminal">
                        <div className="vscode-terminal-header">
                          <span className="vscode-terminal-label">STDIN (Standard Input)</span>
                        </div>
                        <textarea
                          value={stdin}
                          onChange={(e) => setStdin(e.target.value)}
                          placeholder="Provide program input here. Each line is a separate input."
                          className="vscode-stdin"
                          spellCheck={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* FLOATING CHAT WIDGET */}
      <Chat provider={provider} username={username} />
    </div>
  );
}

// ─── CodeMirror editor tied to a Y.Text document ─────────────────────────────
function CodeEditorView({ filesMap, activeFile, activeLanguage, provider }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!filesMap || !activeFile || !provider || !editorRef.current) return;

    const ytext = filesMap.get(activeFile);
    if (!ytext) return;

    const langExt = LANGUAGES[activeLanguage]?.cmExtension;

    const extensions = [
      basicSetup,
      oneDark,
      yCollab(ytext, provider.awareness),
    ];

    if (langExt) extensions.push(langExt());

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    return () => {
      view.destroy();
    };
  }, [filesMap, activeFile, activeLanguage, provider]);

  return <div ref={editorRef} className="editor-panel" />;
}