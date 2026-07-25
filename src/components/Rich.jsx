// Renders a trusted translation string that may contain <b>…</b> and <br>
// as real JSX (no dangerouslySetInnerHTML). Strings come from our own i18n table.
export default function Rich({ text }) {
  const parts = String(text).split(/(<b>.*?<\/b>|<br\s*\/?>)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^<br\s*\/?>$/.test(p)) return <br key={i} />;
        const m = p.match(/^<b>([\s\S]*)<\/b>$/);
        if (m) return <b key={i}>{m[1]}</b>;
        return p ? <span key={i}>{p}</span> : null;
      })}
    </>
  );
}
