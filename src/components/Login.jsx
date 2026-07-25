import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLang } from '../hooks/useLang';

const ERR_KEY = { not_configured: 'err_not_configured', empty: 'err_empty', mismatch: 'err_mismatch' };

export default function Login() {
  const { login, busy, error } = useAuth();
  const { lang, setLang, t } = useLang();
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const nameRef = useRef(null);
  useEffect(() => { if (nameRef.current) nameRef.current.focus(); }, []);

  const onSubmit = (e) => { e.preventDefault(); login(name, pass); };
  const errText = error ? t(ERR_KEY[error] || 'err_mismatch') : '';

  return (
    <div className="loginwrap">
      <div className="langtoggle langtoggle-login" role="group" aria-label="Language">
        <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
        <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')} aria-pressed={lang === 'es'}>ES</button>
      </div>
      <form className="logincard" onSubmit={onSubmit}>
        <div className="loginemoji">🌴</div>
        <h2>Dominican Republic</h2>
        <div className="loginsub">{t('login_sub')}</div>
        <label>{t('login_name')}
          <input ref={nameRef} type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false"
            value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label>{t('login_password')}
          <input type="password" autoComplete="current-password" placeholder={t('login_password')}
            value={pass} onChange={e => setPass(e.target.value)} />
        </label>
        <div className="loginerr">{errText}</div>
        <button type="submit" className="loginbtn" disabled={busy}>{busy ? t('login_signing') : t('login_enter')}</button>
      </form>
    </div>
  );
}
