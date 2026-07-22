// The lock screen, shown while the journal is sealed with a passcode. A
// steel-blue lock tile with a breathing glow that brightens on focus, a
// passcode field, and an unlock animation — lockOpen → smiley → gold ripple
// → fade — that plays before the app is revealed. Markup, copy and timing
// are ported from the Oscar.dc.html prototype; it drives the real store
// (verify to play the animation while still sealed, then unlock for real).

import { useEffect, useRef, useState } from 'react';
import { getStore } from '../data/store';
import { useStoreState } from '../data/useStore';
import { PixelTile } from '../components/PixelTile';

const DANGER = 'var(--danger)';

export function Locked({ onUnlocked }: { onUnlocked: () => void }) {
  const store = getStore();
  const state = useStoreState();
  const [input, setInput] = useState('');
  const [deny, setDeny] = useState({ at: 0, n: 0 });
  const [unlockAt, setUnlockAt] = useState(0);
  const [fade, setFade] = useState(false);
  const [focus, setFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  // Keep the lock screen themed before AppInner mounts.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.body.style.background = state.theme === 'dark' ? '#111113' : '#F5F5F3';
  }, [state.theme]);

  const denyOn = deny.at !== 0 && Date.now() - deny.at < 1200;
  const name = (state.name || '').trim();

  const tryUnlock = async () => {
    if (unlockAt) return;
    const pass = input;
    const ok = await store.verify(pass);
    if (!ok) {
      setDeny((d) => ({ at: Date.now(), n: d.n + 1 }));
      setInput('');
      // Clear the danger state once the 1.2s window lapses.
      timers.current.push(setTimeout(() => setDeny((d) => (Date.now() - d.at >= 1200 ? { at: 0, n: d.n } : d)), 1250));
      return;
    }
    // Correct: play the unlock timeline while still sealed, then unlock for
    // real and hand back to the app (ripple fires from PixelTile at +500ms).
    setUnlockAt(Date.now());
    setDeny((d) => ({ at: 0, n: d.n }));
    timers.current.push(setTimeout(() => setFade(true), 1500));
    timers.current.push(setTimeout(() => void store.unlock(pass).then(onUnlocked), 2100));
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 640,
        minHeight: '100vh',
        boxSizing: 'border-box',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fade ? 0 : 1,
        transition: 'opacity .5s ease-in',
        animation: 'db-fade .35s ease-out',
      }}
    >
      <PixelTile
        wordCount={0}
        progress={0}
        glyphEvent={null}
        lastType={0}
        theme={state.theme}
        locked={{ denyAt: deny.at, denyN: deny.n, unlockAt, focus }}
      />
      <div className="t-page-title" style={{ marginTop: 24 }}>
        {name ? 'Welcome back, ' + name : 'Welcome back'}
      </div>
      <div
        className="t-body"
        style={{ color: 'var(--muted)', marginTop: 8, textAlign: 'center', maxWidth: 380, textWrap: 'pretty' }}
      >
        Oscar sealed your pages before you left. Your passcode opens the book.
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 32 }}>
        <input
          ref={inputRef}
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tryUnlock();
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder="Your passcode"
          style={{
            boxSizing: 'content-box',
            height: 36,
            width: '22ch',
            padding: '0 12px',
            background: 'var(--surface)',
            border: `1px solid ${denyOn ? DANGER : 'var(--border)'}`,
            borderRadius: 8,
            outline: 'none',
            color: 'var(--fg)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 400,
            transition: 'border-color .2s ease-out',
          }}
        />
        <button
          onClick={tryUnlock}
          style={{
            boxSizing: 'border-box',
            height: 38,
            border: 'none',
            borderRadius: 8,
            padding: '0 16px',
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {unlockAt ? 'There you are' : 'Unlock'}
        </button>
      </div>
      <div
        className="t-body"
        style={{ fontSize: 13, color: denyOn ? DANGER : 'var(--muted)', marginTop: 14, minHeight: 18, textAlign: 'center' }}
      >
        {denyOn
          ? 'That’s not it — Oscar doesn’t recognize that passcode.'
          : unlockAt
            ? 'Opening the book…'
            : ' '}
      </div>
      <div
        className="t-mono"
        style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 8, maxWidth: 380, textAlign: 'center', textWrap: 'pretty' }}
      >
        {'Encrypted on this device — Oscar can’t recover a lost passcode.'}
      </div>
    </div>
  );
}
