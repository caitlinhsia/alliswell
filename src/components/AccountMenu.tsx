import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { isCloudEnabled } from '../lib/supabase';
import { downloadBackup } from '../lib/sync';

export default function AccountMenu() {
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const signOut = useAuthStore((s) => s.signOut);
  const saveNow = useAuthStore((s) => s.saveNow);
  const startPasswordChange = useAuthStore((s) => s.startPasswordChange);
  const error = useAuthStore((s) => s.error);
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // a failed reset link leaves an error behind with no dialog open to show it
  useEffect(() => {
    if (error && !session) setAuthOpen(true);
  }, [error, session]);
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
            <p className="font-note text-[0.68rem] leading-relaxed text-[var(--color-ink-faint)] px-2 pb-2">
              Saved as you type — on this device, and in your account so it follows you to
              other devices.
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
              save a copy to this computer
            </button>
            <button
              onClick={() => {
                startPasswordChange();
                setOpen(false);
              }}
              className="w-full text-left font-note text-sm px-2 py-1.5 rounded-sm hover:bg-[var(--color-paper-deep)]"
            >
              change password
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
      <RecoveryDialog />
    </>
  );
}

function AuthDialog({ onClose }: { onClose: () => void }) {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const sendPasswordReset = useAuthStore((s) => s.sendPasswordReset);
  const error = useAuthStore((s) => s.error);
  const [mode, setMode] = useState<'in' | 'up' | 'forgot'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || (mode !== 'forgot' && !password)) return;
    setBusy(true);
    setNotice(null);
    try {
      if (mode === 'forgot') {
        await sendPasswordReset(email.trim());
        setNotice(
          `If ${email.trim()} has an account, a reset link is on its way. Click it promptly — it only works once, and some mail apps spend it by scanning it. If it keeps failing, sign in and use “change password” instead.`
        );
      } else if (mode === 'in') {
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--color-ink)]/25 backdrop-blur-[2px] p-4">
      <div
        className="w-full max-w-sm bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-sm shadow-[0_20px_60px_-24px_rgba(38,35,29,0.55)] p-7"
      >
        <h2 className="font-display text-2xl mb-1">
          {mode === 'in' ? 'Welcome back' : mode === 'up' ? 'Make an account' : 'Forgotten password'}
        </h2>
        <p className="font-note text-sm text-[var(--color-ink-soft)] mb-4">
          {mode === 'forgot'
            ? 'Type the email you signed up with and we will send you a link to set a new password.'
            : 'Keeps your notebook on every device you sign in from.'}
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
          {mode !== 'forgot' && (
            <label className="font-note text-xs text-[var(--color-ink-soft)]">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                className="mt-1 w-full font-note text-base border border-[var(--color-paper-line)] rounded-sm px-3 py-2 bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink-faint)]"
              />
            </label>
          )}
          {mode === 'in' && (
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setNotice(null);
              }}
              className="font-note text-xs underline text-[var(--color-ink-soft)] self-start -mt-1"
            >
              forgotten your password?
            </button>
          )}

          {error && <p className="font-note text-xs text-[var(--color-note-rust)]">{error}</p>}
          {notice && <p className="font-note text-xs text-[var(--color-note-moss)]">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary mt-1"
          >
            {busy
              ? 'one moment…'
              : mode === 'in'
              ? 'Sign in'
              : mode === 'up'
              ? 'Sign up'
              : 'Send the link'}
          </button>
        </form>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => {
              setMode(mode === 'in' ? 'up' : 'in');
              setNotice(null);
            }}
            className="font-note text-xs underline text-[var(--color-ink-soft)]"
          >
            {mode === 'in' ? 'no account yet?' : mode === 'up' ? 'already have one?' : 'back to signing in'}
          </button>
          <button onClick={onClose} className="font-note text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            keep using this device only
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shown when the app is opened through a reset link. Supabase has already
 * exchanged the token for a session by then, so all that is left is choosing
 * the new password.
 */
function RecoveryDialog() {
  const recovering = useAuthStore((s) => s.recovering);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const dismissRecovery = useAuthStore((s) => s.dismissRecovery);
  const error = useAuthStore((s) => s.error);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  if (!recovering) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return;
    if (password !== confirm) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setBusy(true);
    try {
      await updatePassword(password);
      // the link leaves a token in the address bar; do not leave it lying there
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      /* error surfaced from the store */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--color-ink)]/25 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-sm bg-[var(--color-paper)] border border-[var(--color-paper-line)] rounded-sm shadow-[0_20px_60px_-24px_rgba(38,35,29,0.55)] p-7">
        <h2 className="font-display text-2xl mb-1">Set a new password</h2>
        <p className="font-note text-sm text-[var(--color-ink-soft)] mb-4">
          Pick a password — it takes effect everywhere you are signed in.
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="font-note text-xs text-[var(--color-ink-soft)]">
            New password
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              className="mt-1 w-full font-note text-base border border-[var(--color-paper-line)] rounded-sm px-3 py-2 bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink-faint)]"
            />
          </label>
          <label className="font-note text-xs text-[var(--color-ink-soft)]">
            Again, to be sure
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              className="mt-1 w-full font-note text-base border border-[var(--color-paper-line)] rounded-sm px-3 py-2 bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink-faint)]"
            />
          </label>

          {mismatch && (
            <p className="font-note text-xs text-[var(--color-note-rust)]">
              Those two do not match.
            </p>
          )}
          {error && <p className="font-note text-xs text-[var(--color-note-rust)]">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary mt-1">
            {busy ? 'one moment…' : 'Save the new password'}
          </button>
        </form>

        <button
          onClick={() => {
            dismissRecovery();
            window.history.replaceState(null, '', window.location.pathname);
          }}
          className="font-note text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] mt-4"
        >
          cancel — keep the old password
        </button>
      </div>
    </div>
  );
}
