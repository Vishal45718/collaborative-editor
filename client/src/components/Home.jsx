// client/src/components/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [roomName, setRoomName] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (roomName.trim()) {
      navigate(`/editor/${roomName}`);
    }
  };

  const createRandomRoom = () => {
    // Generate a random ID like "uuid-1234"
    const randomId = Math.random().toString(36).substring(7);
    navigate(`/editor/${randomId}`);
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>Collaborative Code Editor</h1>
      <p>Create a room to start coding with friends.</p>
      
      <div style={{ margin: '20px' }}>
        <input 
          type="text" 
          placeholder="Enter Room Name..." 
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <button 
          onClick={handleJoin}
          style={{ padding: '10px 20px', marginLeft: '10px', fontSize: '16px', cursor: 'pointer' }}
        >
          Join Room
        </button>
      </div>

      <button 
        onClick={createRandomRoom}
        style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Create New Room &rarr;
      </button>
    </div>
  );
}
