import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthProps {
  onClose?: () => void;
}

export default function Auth({ onClose }: AuthProps) {
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  // const [password, setPassword] = useState<string>(''); // Paused for now
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Handle new user registration
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setMessage('Username is required for sign up');
      return;
    }
    setLoading(true);
    setMessage('');
    
    // Using a placeholder password while the feature is paused
    const { error } = await supabase.auth.signUp({ 
      email, 
      password: 'placeholder-password-123',
      options: {
        data: {
          username: username.trim()
        }
      }
    });
    
    if (error) setMessage(error.message);
    else setMessage('Check your email for the confirmation link!');
    
    setLoading(false);
  };

  // Handle returning user login
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Using a placeholder password while the feature is paused
    const { error } = await supabase.auth.signInWithPassword({ email, password: 'placeholder-password-123' });

    if (error) setMessage(error.message);
    else setMessage('Successfully logged in!');

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white', position: 'relative' }}>
      {onClose && (
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}
          aria-label="Close"
        >
          ✕
        </button>
      )}
      <h2>Log in or Sign up</h2>
      <p>Save your favorite workspaces.</p>
      
      <form>
        <div style={{ marginBottom: '10px' }}>
          <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Username is required for new accounts</p>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>
        {/* Password feature paused for now
        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>
        */}
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button 
            onClick={handleLogin} 
            disabled={loading}
            style={{ flex: 1, padding: '10px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {loading ? 'Loading...' : 'Log In'}
          </button>
          
          <button 
            onClick={handleSignUp} 
            disabled={loading}
            style={{ flex: 1, padding: '10px', backgroundColor: '#eee', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Sign Up
          </button>
        </div>
      </form>

      {/* Displays success or error messages to the user */}
      {message && <p style={{ marginTop: '15px', color: message.includes('error') || message.includes('failed') || message.includes('Invalid') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
}
