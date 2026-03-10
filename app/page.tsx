'use client';
import { useState, useEffect } from 'react';
import { supabase, getSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

function Spin() {
  return <span className="spin spin-sm" style={{ display: 'inline-block' }} />;
}

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'founder' | 'investor'>('founder');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    getSession().then(s => {
      if (!s) { setChecking(false); return; }
      supabase.from('profiles').select('role').eq('id', s.user.id).single().then(({ data }) => {
        const r = data?.role || 'founder';
        router.replace(r === 'admin' ? '/dashboard/admin' : r === 'investor' ? '/feed' : '/feed');
      });
    });
  }, [router]);

  if (checking) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spin" />
    </div>
  );

  const auth = async () => {
    setErr(''); setOk(''); setBusy(true);
    try {
      if (view === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, role } } });
        if (error) throw error;
        setOk('Account created! Check your email to verify, then sign in.');
        setView('login');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        const r = p?.role || 'founder';
        router.replace(r === 'admin' ? '/dashboard/admin' : '/feed');
      }
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Invalid credentials'); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Hero header */}
      <div style={{ textAlign: 'center', padding: '56px 24px 32px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, margin: '0 auto 16px', fontWeight: 800 }}>▶</div>
        <h1 style={{ fontSize: 'clamp(28px,7vw,40px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>PitchPilot</h1>
        <p style={{ color: 'var(--text2)', fontSize: 15, maxWidth: 300, margin: '0 auto' }}>Where founders pitch. Investors discover.</p>
      </div>

      {/* Auth card */}
      <div style={{ maxWidth: 400, width: '100%', margin: '0 auto', padding: '0 20px 48px' }}>
        {/* Toggle */}
        <div style={{ display: 'flex', gap: 0, background: 'var(--border)', borderRadius: 12, padding: 3, marginBottom: 20 }}>
          {(['login', 'signup'] as const).map(v => (
            <button key={v} onClick={() => { setView(v); setErr(''); setOk(''); }}
              style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, transition: 'all .15s', background: view === v ? 'var(--surface)' : 'transparent', color: view === v ? 'var(--text)' : 'var(--text2)', boxShadow: view === v ? '0 1px 4px rgba(28,26,23,.1)' : 'none' }}>
              {v === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: '24px 20px' }}>
          {view === 'signup' && (
            <>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label className="label">I am a</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {([['founder', '🚀', 'Founder'], ['investor', '💼', 'Investor']] as const).map(([r, ic, lb]) => (
                    <button key={r} onClick={() => setRole(r)}
                      style={{ padding: '11px', borderRadius: 10, border: '1.5px solid', borderColor: role === r ? 'var(--ink)' : 'var(--border)', background: role === r ? 'var(--ink)' : 'transparent', color: role === r ? '#fff' : 'var(--text2)', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', transition: 'all .15s' }}>
                      {ic} {lb}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e => e.key === 'Enter' && auth()} />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && auth()} />
          </div>
          {err && <div style={{ background: 'var(--roseBg)', border: '1px solid var(--roseBorder)', borderRadius: 9, padding: '10px 14px', color: 'var(--rose)', fontSize: 13, marginBottom: 14 }}>{err}</div>}
          {ok && <div style={{ background: 'var(--greenBg)', border: '1px solid var(--greenBorder)', borderRadius: 9, padding: '10px 14px', color: 'var(--green)', fontSize: 13, marginBottom: 14 }}>{ok}</div>}
          <button className="btn btn-ink btn-full" style={{ padding: '13px', fontSize: 15, borderRadius: 11 }} onClick={auth} disabled={busy}>
            {busy ? <Spin /> : view === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </div>

        {view === 'login' && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text2)' }}>
            No account?{' '}
            <button onClick={() => setView('signup')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' }}>
              Sign up free
            </button>
          </p>
        )}

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>The platform</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[['▶', 'Video pitches'], ['✦', 'AI matching'], ['◎', 'Ecosystem']].map(([ic, lb]) => (
              <div key={lb} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{ic}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{lb}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{border-radius:50%;animation:spin .7s linear infinite}`}</style>
    </div>
  );
}
