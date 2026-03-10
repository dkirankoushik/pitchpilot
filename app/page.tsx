'use client';
import { useState, useEffect } from 'react';
import { supabase, getSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const DEMO = { founder: 'demo.founder@pitchpilot.app', investor: 'demo.investor@pitchpilot.app', admin: 'demo.admin@pitchpilot.app' };

function Spin({ light }: { light?: boolean }) {
  return <span style={{ width: 16, height: 16, border: `2px solid ${light ? 'rgba(255,255,255,.3)' : 'rgba(28,26,23,.12)'}`, borderTop: `2px solid ${light ? '#fff' : 'var(--ink)'}`, borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />;
}

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<'land' | 'login' | 'signup'>('land');
  const [role, setRole] = useState<'founder' | 'investor'>('founder');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // If already logged in, redirect immediately
  useEffect(() => {
    getSession().then(session => {
      if (!session) return;
      supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data }) => {
        const r = data?.role || 'founder';
        router.replace(r === 'admin' ? '/dashboard/admin' : r === 'investor' ? '/feed' : '/dashboard/founder');
      });
    });
  }, [router]);

  const go = (r: string) => router.replace(r === 'admin' ? '/dashboard/admin' : r === 'investor' ? '/feed' : '/dashboard/founder');

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
        go(p?.role || 'founder');
      }
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Invalid email or password'); }
    finally { setBusy(false); }
  };

  const demo = async (r: 'founder' | 'investor' | 'admin') => {
    setBusy(true); setErr('');
    try {
      let res = await supabase.auth.signInWithPassword({ email: DEMO[r], password: 'Demo@12345' });
      if (res.error) {
        await supabase.auth.signUp({ email: DEMO[r], password: 'Demo@12345', options: { data: { full_name: `Demo ${r.charAt(0).toUpperCase() + r.slice(1)}`, role: r } } });
        await new Promise(x => setTimeout(x, 1200));
        res = await supabase.auth.signInWithPassword({ email: DEMO[r], password: 'Demo@12345' });
        if (res.error) { go(r); return; }
      }
      go(r);
    } catch { go(r); }
    finally { setBusy(false); }
  };

  // ── AUTH FORM ──
  if (view !== 'land') return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'rgba(247,246,243,.94)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => setView('land')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>▶</span>
          PitchPilot
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => { setView('login'); setErr(''); }}>Sign in</button>
          <button className="btn btn-ink" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => { setView('signup'); setErr(''); }}>Join free</button>
        </div>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 'calc(100vh - 65px)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 6, textAlign: 'center', letterSpacing: '-0.5px' }}>
            {view === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {view === 'login' ? 'Sign in to your PitchPilot account' : 'Get started for free'}
          </p>
          <div className="card" style={{ padding: 24 }}>
            {view === 'signup' && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>Full Name</label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: .5 }}>I am a</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(['founder', 'investor'] as const).map(r => (
                      <button key={r} onClick={() => setRole(r)} style={{ padding: '10px', borderRadius: 9, border: '1.5px solid', borderColor: role === r ? 'var(--ink)' : 'var(--border)', background: role === r ? 'var(--ink)' : 'transparent', color: role === r ? '#fff' : 'var(--text2)', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', transition: 'all .15s' }}>
                        {r === 'founder' ? '🚀 ' : '💼 '}{r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e => e.key === 'Enter' && auth()} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && auth()} />
            </div>
            {err && <div style={{ background: 'var(--roseBg)', border: '1px solid var(--roseBorder)', borderRadius: 8, padding: '10px 14px', color: 'var(--rose)', fontSize: 13, marginBottom: 14 }}>{err}</div>}
            {ok && <div style={{ background: 'var(--greenBg)', border: '1px solid var(--greenBorder)', borderRadius: 8, padding: '10px 14px', color: 'var(--green)', fontSize: 13, marginBottom: 14 }}>{ok}</div>}
            <button className="btn btn-ink" style={{ width: '100%', padding: '13px', fontSize: 15 }} onClick={auth} disabled={busy}>
              {busy ? <Spin light /> : view === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setErr(''); }} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
                {view === 'login' ? "No account? " : "Have an account? "}
                <span style={{ color: 'var(--text)', fontWeight: 700, textDecoration: 'underline' }}>{view === 'login' ? 'Sign up' : 'Sign in'}</span>
              </button>
            </div>
          </div>
          <div style={{ marginTop: 22 }}>
            <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>Try demo accounts</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['🚀', 'Founder', 'founder' as const], ['💼', 'Investor', 'investor' as const], ['⚙', 'Admin', 'admin' as const]].map(([icon, label, r]) => (
                <button key={String(r)} onClick={() => demo(r as 'founder' | 'investor' | 'admin')} disabled={busy} className="btn btn-ghost" style={{ padding: '10px 8px', fontSize: 13 }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── LANDING PAGE (renders instantly, no async) ──
  const features = [
    { icon: '▶', title: 'Video-First Pitching', desc: 'Under 3-min elevator videos that let investors truly feel your passion — far beyond any PDF.' },
    { icon: '✦', title: 'AI-Powered Matching', desc: 'Our engine analyses 30+ signals to surface the 5 investors most likely to respond to your pitch.' },
    { icon: '🔒', title: 'Subscription Paywall', desc: 'Investors subscribe to unlock pitch decks, financials, and direct contact — built for trust.' },
    { icon: '◎', title: 'Ecosystem Hub', desc: 'Grants, accelerators, events, and mentors — all in one place. Never miss an opportunity.' },
  ];
  const mockCards = [['NeuralPay','FinTech · Seed','$12K MRR','#F0EDE8'],['MedSync','HealthTech · A','$45K MRR','#EBF0E8'],['FlowDesk','EdTech · A','$200K MRR','#E8EDF0']];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'rgba(247,246,243,.94)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 20 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15 }}>▶</span>
          PitchPilot
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ padding: '8px 20px' }} onClick={() => setView('login')}>Sign in</button>
          <button className="btn btn-ink" style={{ padding: '8px 20px' }} onClick={() => setView('signup')}>Get started →</button>
        </div>
      </nav>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '80px 32px 64px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '5px 15px', marginBottom: 28, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1A5C3A', display: 'inline-block' }} /> Now live · India&apos;s first video pitch platform
        </div>
        <h1 style={{ fontSize: 'clamp(36px,7vw,72px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1.5px' }}>
          Where founders pitch.<br /><em style={{ color: 'var(--text2)', fontWeight: 400, fontStyle: 'italic' }}>Investors discover.</em>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 36px', fontWeight: 400 }}>
          The premium video-first platform connecting startup founders with top investors — smarter than cold email, faster than pitch events.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
          <button className="btn btn-ink" style={{ fontSize: 16, padding: '14px 32px', borderRadius: 12 }} onClick={() => setView('signup')}>Start pitching free</button>
          <button className="btn btn-outline" style={{ fontSize: 16, padding: '14px 32px', borderRadius: 12 }} onClick={() => setView('login')}>Discover startups →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {mockCards.map(([n,s,t,bg]) => (
            <div key={n} className="card" style={{ overflow: 'hidden', textAlign: 'left' }}>
              <div style={{ height: 150, background: bg as string, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>
                <span style={{ position: 'absolute', bottom: 10, left: 12, background: 'rgba(255,255,255,.88)', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{s.split('·')[0].trim()}</span>
                <span style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,.5)', color: '#fff', borderRadius: 5, padding: '2px 7px', fontSize: 11, fontFamily: 'monospace' }}>2:47</span>
              </div>
              <div style={{ padding: '13px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{n}</div>
                <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{s} · {t}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '40px 32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32, textAlign: 'center' }}>
          {[['209K+','Registered startups in India'],['$11.6B','Raised by Indian startups in 2025'],['$20B+','Global fundraising market']].map(([v,l]) => (
            <div key={v}><div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', marginBottom: 6 }}>{v}</div><div style={{ fontSize: 13, color: 'var(--text2)' }}>{l}</div></div>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '64px 32px' }}>
        <h2 style={{ fontSize: 34, fontWeight: 800, textAlign: 'center', letterSpacing: '-0.5px', marginBottom: 40 }}>Everything you need to raise</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
          {features.map(f => (
            <div key={f.title} className="card" style={{ padding: '20px' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--s50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '48px 32px 72px', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.5px' }}>Ready to get funded?</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 15 }}>Join founders who have already pitched on PitchPilot.</p>
        <button className="btn btn-ink" style={{ fontSize: 16, padding: '14px 40px', borderRadius: 12 }} onClick={() => setView('signup')}>Create your free profile →</button>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 48px', display: 'flex', justifyContent: 'space-between', color: 'var(--text3)', fontSize: 13 }}>
        <span>© 2025 PitchPilot</span><span>Built for founders, by founders</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
