// Language preference (per device — a personal choice, not synced via Firebase).
import { createContext, useContext, useCallback, useState } from 'react';
import { translate } from '../i18n/strings';

const LS_LANG = 'dr_lang';
const LangCtx = createContext(null);
export const useLang = () => useContext(LangCtx);

function initialLang() {
  try { const saved = localStorage.getItem(LS_LANG); if (saved === 'en' || saved === 'es') return saved; } catch (e) {}
  try { if ((navigator.language || '').toLowerCase().startsWith('es')) return 'es'; } catch (e) {}
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  const setLang = useCallback((next) => {
    setLangState(next);
    try { localStorage.setItem(LS_LANG, next); } catch (e) {}
  }, []);
  const t = useCallback((key, vars) => translate(key, lang, vars), [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}
