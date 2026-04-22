import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, ChevronDown } from 'lucide-react';

export default function Chat({ provider, username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const yChatArrayRef = useRef(null);
  const chatBoxRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  useEffect(() => {
    if (!provider) return;

    const ydoc = provider.doc;
    const yChatArray = ydoc.getArray('chat-messages');
    yChatArrayRef.current = yChatArray;

    const updateMessages = () => {
      const arr = yChatArray.toArray();
      setMessages(arr);
      // Track unread when panel is closed
      if (!isOpen) {
        const newCount = arr.length - prevMsgCountRef.current;
        if (newCount > 0) setUnreadCount((prev) => prev + newCount);
      }
      prevMsgCountRef.current = arr.length;
    };

    yChatArray.observe(updateMessages);
    updateMessages();

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, username]);

  // When chat opens, clear unread
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      prevMsgCountRef.current = messages.length;
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatBoxRef.current && isOpen) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, typingUsers, isOpen]);

  const setTyping = (val) => {
    if (!provider) return;
    provider.awareness.setLocalStateField('typing', val);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 1500);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !yChatArrayRef.current) return;

    const newMessage = {
      user: username,
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: provider?.awareness.getLocalState()?.user?.color || '#22d3ee',
    };

    yChatArrayRef.current.push([newMessage]);
    setInput('');
    setTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  return (
    <div className="chat-widget-container">
      {/* Floating Chat Panel */}
      <div className={`chat-panel ${isOpen ? 'chat-panel--open' : ''}`}>
        {/* Panel Header */}
        <div className="chat-panel-header">
          <div className="chat-panel-header-left">
            <div className="chat-panel-dot" />
            <span className="chat-panel-title">Team Chat</span>
            <span className="chat-panel-count">({messages.length})</span>
          </div>
          <button className="chat-panel-close-btn" onClick={() => setIsOpen(false)} title="Close chat">
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Messages */}
        <div ref={chatBoxRef} className="chat-panel-messages">
          {messages.length === 0 && (
            <div className="chat-empty-state">
              <MessageSquare size={28} color="#334155" />
              <p>No messages yet.</p>
              <p>Say hi to your team! 👋</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.user === username;
            return (
              <div key={i} className={`chat-message ${isMe ? 'chat-message--me' : 'chat-message--other'}`}>
                {!isMe && (
                  <span className="chat-message-author" style={{ color: msg.color }}>
                    {msg.user}
                  </span>
                )}
                <div className={`chat-bubble ${isMe ? 'chat-bubble--me' : 'chat-bubble--other'}`}>
                  {msg.text}
                </div>
                <span className={`chat-message-time ${isMe ? 'chat-message-time--me' : ''}`}>
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {typingUsers.length > 0 && (
            <div className="chat-typing-indicator">
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
              <span className="chat-typing-dot" />
              <span className="chat-typing-text">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
              </span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="chat-panel-input-area">
          <form onSubmit={sendMessage} className="chat-input-form">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="chat-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
            />
            <button type="submit" disabled={!input.trim()} className="chat-send-btn">
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        className="chat-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        title={isOpen ? 'Close chat' : 'Open team chat'}
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
        {!isOpen && unreadCount > 0 && (
          <span className="chat-fab-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
    </div>
  );
}
