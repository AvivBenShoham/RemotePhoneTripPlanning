// Sign-in gate backed by real Firebase Authentication.
// Passwords are NOT in the source — they live in Firebase. The database rules
// require a signed-in user, so nobody can read/write without a valid account.
// A typed name maps to <name>@EMAIL_DOMAIN; name & password are lowercased.
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { auth, authReady } from '../firebase/client';
import { EMAIL_DOMAIN, AVIV_EMAIL } from '../firebase/config';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // entered === true when signed in, OR when auth isn't configured (offline /
  // chat preview) so the itinerary is still viewable locally.
  const [entered, setEntered] = useState(!authReady);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const enteredNameRef = useRef('');

  useEffect(() => {
    if (!authReady) { setEntered(true); return; }
    // Firebase persists the session, so returning users skip the form.
    const unsub = auth.onAuthStateChanged(u => {
      if (u) {
        setUser(u);
        enteredNameRef.current = (u.email || '').split('@')[0];
        setEntered(true);
        setBusy(false);
      } else {
        setUser(null);
        setEntered(false);
        setBusy(false);
      }
    });
    return unsub;
  }, []);

  const login = useCallback((rawName, rawPass) => {
    const n = (rawName || '').trim().toLowerCase();
    const p = (rawPass || '').trim().toLowerCase();
    if (!authReady) { setError("Sign-in isn't configured yet — see README."); return; }
    if (!n || !p) { setError('Enter your name and password.'); return; }
    setError(''); setBusy(true);
    auth.signInWithEmailAndPassword(n + '@' + EMAIL_DOMAIN, p)
      .then(cred => {
        // Enter directly on success; onAuthStateChanged normally drives this,
        // but on some devices (Safari/iOS ITP, private mode) the auth-state
        // write can stall so the observer never fires.
        const u = (cred && cred.user) || (auth && auth.currentUser);
        if (u) { setUser(u); enteredNameRef.current = (u.email || '').split('@')[0] || n; }
        else { enteredNameRef.current = n; }
        setEntered(true); setBusy(false);
      })
      .catch(() => {
        setBusy(false);
        setError("That name and password don't match.");
      });
  }, []);

  const logout = useCallback(() => {
    if (authReady && auth) { auth.signOut().catch(() => {}); }
    else { location.reload(); }
  }, []);

  const currentName = () => (user ? (user.email || '').split('@')[0] : enteredNameRef.current);
  const isAviv = () => !!user && (user.email || '').toLowerCase() === AVIV_EMAIL;

  const value = {
    user, entered, busy, error, authReady,
    login, logout, currentName, isAviv,
    enteredName: enteredNameRef.current,
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
