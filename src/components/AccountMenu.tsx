import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { isCloudEnabled } from '../lib/supabase';
import { downloadBackup } from '../lib/sync';

export default function AccountMenu() {
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const signOut = useAuthStore((s) => s.signOut);
  const saveNow = useAuthStore((s) => s.saveNow);
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const statusLabel =
    status === 'syncing' ? 'saving…' : status === 'saved' ? 'saved' : status === 'error' ? 'not saved' : '';

  return (
    <>
      <div ref={wrapRef} className="relative">
        <button
          onClick={() => (session ? setOpen((o) => !o) : setAuthOpen(true))}
          className="font-note text-sm px-3 py-1.5 rounded-full border border-[var(--color-paper-line)] bg-[var(--color-paper)]/90 backdrop-blur-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-soft)] transition-colors flex items-center gap-2"
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background:
                status === 'error'
                  ? 'var(--color-note-rust)'
                  : session
                  ? 'var(--color-note-sage)'
                  : 'var(--color-ink-soft)',
              opacity: session || status === 'error' ? 1 : 0.4,
            }}
          />
          {session ? session.user.email?.split('@')[0] : isCloudEnabled ? 'sign in' : 'this device'}
        </button>

        {open && session && (
          <div className="absolute right-0 top-full mt-1.5 z-50 w-60 bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-sm shadow-xl p-2">
            <p className="font-note text-xs text-[var(--color-ink-soft)] px-2 pt-1 pb-2 break-all">
              {session.user.email}
              {statusLabel && <span className="block mt-0.5">{statusLabel}</span>}
            </p>
            <button
              onClick={() => {
                void saveNow();
                setOpen(false);
              }}
              className="w-full text-left font-note text-sm px-2 py-1.5 rounded-sm hover:bg-[var(--color-paper-deep)]"
            >
              save now
            </button>
            <button
              onClick={() => {
                downloadBackup();
                setOpen(false);
              }}
              className="w-full text-left font-note text-sm px-2 py-1.5 rounded-sm hover:bg-[var(--color-paper-deep)]"
            >
              download a backup
            </button>
            <button
              onClick={() => {
                void signOut();
                setOpen(false);
              }}
              className="w-full text-left font-note text-sm px-2 py-1.5 rounded-sm hover:bg-[var(--color-paper-deep)] text-[var(--color-note-rust)]"
            >
              sign out
            </button>
          </div>
        )}

        {open && !session && null}
      </div>

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </>
  );
}

function AuthDialog({ onClose }: { onClose: () => void }) {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const error = useAuthStore((s) => s.error);
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setNotice(null);
    try {
      if (mode === 'in') {
        await signIn(email.trim(), password);
        onClose();
      } else {
        await signUp(email.trim(), password);
        setNotice('Account made. Check your email if a confirmation is required, then sign in.');
        setMode('in');
      }
    } catch {
      /* error surfaced from the store */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4">
      <div
        className="w-full max-w-sm bg-[#fffdf8] border-[3px] border-[var(--color-ink)] shadow-2xl p-6"
        style={{ borderRadius: '4px 22px 6px 20px / 14px 5px 18px 6px' }}
      >
        <h2 className="font-hand text-3xl mb-1">
          {mode === 'in' ? 'Welcome back' : 'Make an account'}
        </h2>
        <p className="font-note text-sm text-[var(--color-ink-soft)] mb-4">
          Keeps your notebook on every device you sign in from.
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="font-note text-xs text-[var(--color-ink-soft)]">
            Email
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full font-note text-base border border-[var(--color-paper-line)] rounded-sm px-3 py-2 bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink-faint)]"
            />
          </label>
          <label className="font-note text-xs text-[var(--color-ink-soft)]">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="mt-1 w-full font-note text-base border border-[var(--color-paper-line)] rounded-sm px-3 py-2 bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink-faint)]"
            />
          </label>

          {error && <p className="font-note text-xs text-[var(--color-note-rust)]">{error}</p>}
          {notice && <p className="font-note text-xs text-[var(--color-note-moss)]">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="font-note bg-[var(--color-ink)] text-[var(--color-paper)] px-4 py-2 rounded-sm hover:bg-[var(--color-accent)] transition-colors disabled:opacity-50"
          >
            {busy ? 'one moment…' : mode === 'in' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setMode(mode === 'in' ? 'up' : 'in')}
            className="font-note text-xs underline text-[var(--color-ink-soft)]"
          >
            {mode === 'in' ? 'no account yet?' : 'already have one?'}
          </button>
          <button onClick={onClose} className="font-note text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            keep using this device only
          </button>
        </div>
      </div>
    </div>
  );
}
