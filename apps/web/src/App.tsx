import { useState } from 'react';
import './App.css';
import type { User } from '@repo/common';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [user, setUser] = useState<User|null>(null);

  const login = () => {
    window.location.href = `${API_URL}/auth/login/google?redirect=${window.location.origin}`;
  }

  const checkUser = async () => {
    try {
      const res = await fetch(`${API_URL}/user/me`, {
        method: 'GET',
        credentials: 'include'
      });

      if (res.ok) {
        setUser(await res.json());
      } else {
        alert('Not logged in');
      }
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <>
      <div style={{ padding: '2rem' }}>
        <h1>OAuth Test</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={login}>Log in with Google</button>
          <button onClick={checkUser}>Check auth (/user/me)</button>
        </div>

        {user && (
          <pre style={{ marginTop: '1rem', background: '#f0f0f0', padding: '1rem', color: '#111111', textAlign: 'left' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        )}
      </div>
    </>
  );
}

export default App;
