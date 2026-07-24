import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, busy, error } = useAuth();
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const nameRef = useRef(null);
  useEffect(() => { if (nameRef.current) nameRef.current.focus(); }, []);

  const onSubmit = (e) => { e.preventDefault(); login(name, pass); };

  return (
    <div className="loginwrap">
      <form className="logincard" onSubmit={onSubmit}>
        <div className="loginemoji">🌴</div>
        <h2>Dominican Republic</h2>
        <div className="loginsub">Sign in to view &amp; edit the shared itinerary</div>
        <label>Name
          <input ref={nameRef} type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false"
            value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label>Password
          <input type="password" autoComplete="current-password" placeholder="Password"
            value={pass} onChange={e => setPass(e.target.value)} />
        </label>
        <div className="loginerr">{error}</div>
        <button type="submit" className="loginbtn" disabled={busy}>{busy ? 'Signing in…' : 'Enter →'}</button>
      </form>
    </div>
  );
}
