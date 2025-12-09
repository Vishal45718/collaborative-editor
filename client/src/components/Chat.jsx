import { useState, useEffect, useRef } from 'react';

export default function Chat({ provider, username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false); // Collapsible sidebar
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  // Ref to the shared chat array
  const yChatArrayRef = useRef(null);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (!provider) return;

    // 1. Get the shared Chat Array from the document
    const ydoc = provider.doc;
    const yChatArray = ydoc.getArray('chat-messages');
    yChatArrayRef.current = yChatArray;

    // 2. Observer: When the array changes (someone sent a msg), update React state
    const updateMessages = () => {
      setMessages(yChatArray.toArray());
      
      // Notification badge logic
      if (!isOpen) setHasNewMessage(true);
    };

    yChatArray.observe(updateMessages);

    // Initial load
    updateMessages();

    return () => {
      yChatArray.unobserve(updateMessages);
    };
  }, [provider, isOpen]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !yChatArrayRef.current) return;

    // 3. Push message to shared array
    const newMessage = {
      user: username,
      text: input,
      timestamp: new Date().toLocaleTimeString(),
      color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color for name
    };

    yChatArrayRef.current.push([newMessage]);
    setInput('');
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* 🟢 TOGGLE BUTTON */}
      <button 
        onClick={() => { setIsOpen(!isOpen); setHasNewMessage(false); }}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '15px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#61dafb',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          fontWeight: 'bold'
        }}
      >
        💬 {hasNewMessage && <span style={{position:'absolute', top:0, right:0, width:'10px', height:'10px', background:'red', borderRadius:'50%'}}></span>}
      </button>

      {/* 🟢 CHAT SIDEBAR */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : '-350px', // Slide in/out animation
        width: '320px',
        height: '100vh',
        backgroundColor: '#1e1e1e',
        borderLeft: '2px solid #333',
        transition: 'right 0.3s ease',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '15px', backgroundColor: '#252526', borderBottom: '1px solid #333', color: '#fff', fontWeight: 'bold' }}>
          Room Chat ({messages.length})
          <button onClick={() => setIsOpen(false)} style={{float:'right', background:'none', border:'none', color:'#888', cursor:'pointer'}}>✕</button>
        </div>

        {/* Messages Area */}
        <div ref={chatBoxRef} style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.user === username ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              backgroundColor: msg.user === username ? '#007acc' : '#333',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '14px'
            }}>
              <div style={{ fontSize: '10px', color: '#ccc', marginBottom: '2px' }}>{msg.user} • {msg.timestamp}</div>
              {msg.text}
            </div>
          ))}
          {messages.length === 0 && <div style={{color:'#666', textAlign:'center', marginTop:'20px'}}>No messages yet. Say hi! 👋</div>}
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} style={{ padding: '15px', borderTop: '1px solid #333', display: 'flex' }}>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#333', color: 'white', outline: 'none' }}
          />
          <button type="submit" style={{ marginLeft: '10px', backgroundColor: '#61dafb', border: 'none', borderRadius: '5px', padding: '0 15px', cursor: 'pointer' }}>➤</button>
        </form>
      </div>
    </>
  );
}
