import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 🔴 CRITICAL FIX: Ensure all these icons are imported
import { ArrowRight, Terminal, Zap, Shield, Cpu, Globe, CheckCircle, Users } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!roomId.trim() || !username.trim()) {
      toast.error('Please enter both Room ID and Username');
      return;
    }
    toast.success('Joining room...');
    navigate(`/editor/${roomId}`, { state: { username } });
  };

  const createRandomRoom = () => {
    if (!username.trim()) {
      toast.error('Please enter your username first');
      return;
    }
    const randomId = Math.random().toString(36).substring(7);
    toast.success('Room created!');
    navigate(`/editor/${randomId}`, { state: { username } });
  };

  // Internal Component for the Feature Cards
  const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="glass" style={{
      padding: '20px',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'all 0.3s ease',
      cursor: 'default',
      border: '1px solid rgba(34, 211, 238, 0.1)',
      backgroundColor: 'rgba(15, 23, 42, 0.4)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.borderColor = 'var(--primary)';
      e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(34, 211, 238, 0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.1)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{
        display: 'inline-flex',
        padding: '10px',
        borderRadius: '10px',
        background: 'rgba(34, 211, 238, 0.1)',
        color: 'var(--primary)',
        width: 'fit-content'
      }}>
        <Icon size={24} />
      </div>
      <div>
        <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: '600', color: '#e2e8f0' }}>{title}</h3>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5' }}>{description}</p>
      </div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
      
      <div style={{ 
        display: 'flex', 
        gap: '60px', 
        maxWidth: '1200px', 
        width: '100%', 
        alignItems: 'center', // Aligns items vertically center
        zIndex: 10,
        flexWrap: 'wrap', // Allow wrapping on small screens
        justifyContent: 'center'
      }}>
        
        {/* Left Column: Input Form */}
        <div style={{ flex: '1 1 500px', maxWidth: '550px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '8px 16px', 
            borderRadius: '20px', 
            background: 'rgba(34, 211, 238, 0.1)', 
            color: 'var(--primary)',
            fontWeight: '600',
            fontSize: '0.9rem',
            marginBottom: '25px',
            border: '1px solid rgba(34, 211, 238, 0.2)'
          }}>
            <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
              <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', backgroundColor: 'var(--primary)', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
              <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '10px', width: '10px', backgroundColor: 'var(--primary)' }}></span>
            </span>
            LIVE COLLABORATION
          </div>
          
          <h1 style={{ 
            fontSize: 'clamp(3rem, 5vw, 4.5rem)', 
            fontWeight: '800', 
            lineHeight: '1.1', 
            marginBottom: '20px',
            letterSpacing: '-1px'
          }}>
            Building <span className="text-gradient">Real-Time</span> Digital Reality.
          </h1>
          
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '500px', lineHeight: '1.6' }}>
            Code, collaborate, and ship together. An immersive environment for developers to build software in real-time.
          </p>

          {/* Form Box */}
          <div className="glass" style={{ padding: '30px', borderRadius: '24px', backdropFilter: 'blur(20px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <Users size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Choose your username" 
                  className="input-field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '15px 15px 15px 50px', borderRadius: '12px', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                  <Terminal size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    type="text" 
                    placeholder="Enter Room ID" 
                    className="input-field"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    style={{ width: '100%', padding: '15px 15px 15px 50px', borderRadius: '12px', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </div>
                <button 
                  onClick={handleJoin}
                  className="btn"
                  style={{ 
                    background: 'var(--primary)', 
                    color: '#020617',
                    border: 'none', 
                    borderRadius: '12px', 
                    padding: '0 30px', 
                    fontWeight: '700', 
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flex: '0 0 auto'
                  }}
                >
                  Join <ArrowRight size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-secondary)' }}>
                <div style={{ height: '1px', background: 'var(--border)', flex: 1 }}></div>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>OR</span>
                <div style={{ height: '1px', background: 'var(--border)', flex: 1 }}></div>
              </div>

              <button 
                onClick={createRandomRoom}
                className="btn"
                style={{ 
                  background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                  color: '#020617',
                  padding: '18px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  fontWeight: '800', 
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  width: '100%',
                  boxShadow: '0 4px 20px -5px rgba(74, 222, 128, 0.4)'
                }}
              >
                <Zap size={24} fill="#020617" /> Generate Unique Room
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: About Section & Features */}
        <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '15px', color: '#fff' }}>
              About CodeSync
              <span style={{ display: 'block', height: '4px', width: '60px', background: 'var(--primary)', marginTop: '10px', borderRadius: '2px' }}></span>
            </h2>
            <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '1.05rem', marginBottom: '20px' }}>
              A powerful real-time environment designed for speed. Experience sub-millisecond collaboration with secure sandboxed execution.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
                 <CheckCircle size={18} color="var(--secondary)" /> <span>Sub-millisecond latency sync</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
                 <CheckCircle size={18} color="var(--secondary)" /> <span>Supports C++, Python, Java</span>
               </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <FeatureCard 
              icon={Zap} 
              title="Real-Time" 
              description="Zero delay typing." 
            />
            <FeatureCard 
              icon={Shield} 
              title="Secure" 
              description="Sandboxed API." 
            />
            <FeatureCard 
              icon={Cpu} 
              title="Fast" 
              description="Optimized core." 
            />
            <FeatureCard 
              icon={Globe} 
              title="Global" 
              description="Multi-language." 
            />
          </div>

        </div>

      </div>
      
      <style>
        {`@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }`}
      </style>
    </div>
  );
}