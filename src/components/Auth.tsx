import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Handle new user registration
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) setMessage(error.message);
    else setMessage('Check your email for the confirmation link!');
    
    setLoading(false);
  };

  // Handle returning user login
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) setMessage(error.message);
    else setMessage('Successfully logged in!');

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white' }}>
      <h2>Log in or Sign up</h2>
      <p>Save your favorite workspaces.</p>
      
      <form>
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
        
        <div style={{ display: 'flex', gap: '10px' }}>
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
