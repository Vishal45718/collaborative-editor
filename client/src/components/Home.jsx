// client/src/components/Home.jsx
//
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!roomId.trim() || !username.trim()) {
        alert('Please enter both Room ID and Username');
        return;
    }
    // Save username to state/local storage to pass it to the editor
    // (For simplicity, we will pass it via the 'state' prop of navigate)
    navigate(`/editor/${roomId}`, { state: { username } });
  };

  const createRandomRoom = () => {
    if (!username.trim()) {
        alert('Please enter your username first');
        return;
    }
    const randomId = Math.random().toString(36).substring(7);
    navigate(`/editor/${randomId}`, { state: { username } });
  };

  return (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#1e1e1e', 
        color: 'white',
        fontFamily: 'sans-serif'
    }}>
      <div style={{ 
          backgroundColor: '#282c34', 
          padding: '40px', 
          borderRadius: '10px', 
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          textAlign: 'center',
          width: '300px'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#61dafb' }}>CodeSync</h2>
        
        <input 
          type="text" 
          placeholder="Enter Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: 'none' }}
        />

        <input 
          type="text" 
          placeholder="Enter Room ID" 
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '5px', border: 'none' }}
        />

        <button 
          onClick={handleJoin}
          style={{ width: '100%', padding: '10px', backgroundColor: '#61dafb', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
        >
          Join Room
        </button>
        
        <span style={{ display: 'block', margin: '10px 0', color: '#888' }}>OR</span>

        <button 
          onClick={createRandomRoom}
          style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Generate Unique Room &rarr;
        </button>
      </div>
    </div>
  );
}
