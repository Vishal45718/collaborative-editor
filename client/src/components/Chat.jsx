import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';

export default function Chat({ provider, username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  
  const yChatArrayRef = useRef(null);
  const chatBoxRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!provider) return;

    const ydoc = provider.doc;
    const yChatArray = ydoc.getArray('chat-messages');
    yChatArrayRef.current = yChatArray;

    const updateMessages = () => {
      setMessages(yChatArray.toArray());
    };

    yChatArray.observe(updateMessages);
    updateMessages(); // initial load

    // Setup awareness for typing indicators
    const awareness = provider.awareness;
    const updateTyping = () => {
       const states = awareness.getStates();
       const typing = [];
       states.forEach((state) => {
         if (state.user && state.user.name !== username && state.typing) {
           typing.push(state.user.name);
         }
       });
       setTypingUsers(typing);
    };

    awareness.on('change', updateTyping);

    return () => {
      yChatArray.unobserve(updateMessages);
      awareness.off('change', updateTyping);
    };
  }, [provider, username]);

  const setTyping = (isTyping) => {
    if (!provider) return;
    provider.awareness.setLocalStateField('typing', isTyping);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setTyping(true);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1500);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !yChatArrayRef.current) return;

    const newMessage = {
      user: username,
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: provider.awareness.getLocalState()?.user?.color || '#22d3ee'
    };

    yChatArrayRef.current.push([newMessage]);
    setInput('');
    setTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      borderLeft: '1px solid #1e293b'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <MessageSquare size={16} color="#94a3b8" />
        <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.04em' }}>TEAM CHAT ({messages.length})</span>
      </div>

      {/* Messages */}
      <div ref={chatBoxRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '108px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
        {messages.map((msg, i) => {
          const isMe = msg.user === username;
          return (
            <div key={i} style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {!isMe && <span style={{ fontSize: '10px', color: msg.color, alignSelf: 'flex-start', marginLeft: '2px', fontWeight: 'bold' }}>{msg.user}</span>}
              <div style={{ 
                backgroundColor: isMe ? '#22d3ee' : '#1e293b',
                color: isMe ? '#020617' : '#f8fafc',
                padding: '8px 12px',
                borderRadius: '12px',
                borderBottomRightRadius: isMe ? '2px' : '12px',
                borderBottomLeftRadius: !isMe ? '2px' : '12px',
                fontSize: '13px',
                lineHeight: '1.4'
              }}>
                {msg.text}
              </div>
              <span style={{ fontSize: '9px', color: '#64748b', alignSelf: isMe ? 'flex-end' : 'flex-start', marginRight: '2px' }}>{msg.timestamp}</span>
            </div>
          );
        })}
        {messages.length === 0 && <div style={{color:'#64748b', textAlign:'center', marginTop:'20px', fontSize: '13px'}}>No messages yet. Say hi! 👋</div>}
        
        {typingUsers.length > 0 && (
          <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', alignSelf: 'flex-start' }}>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, zIndex: 1, padding: '12px 16px', borderTop: '1px solid #1e293b', backgroundColor: '#0f172a' }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            style={{ 
              flex: 1, 
              padding: '12px 14px', 
              borderRadius: '10px', 
              border: '1px solid #334155', 
              backgroundColor: '#1e293b', 
              color: 'white', 
              outline: 'none',
              fontSize: '13px'
            }}
          />
          <button type="submit" disabled={!input.trim()} style={{ 
            backgroundColor: input.trim() ? '#22d3ee' : 'transparent', 
            color: input.trim() ? '#020617' : '#64748b', 
            border: 'none', 
            borderRadius: '10px', 
            height: '42px',
            minWidth: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default',
            transition: 'all 0.2s'
          }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
