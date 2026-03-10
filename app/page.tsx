'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const DEMO = { founder: 'demo.founder@pitchpilot.app', investor: 'demo.investor@pitchpilot.app', admin: 'demo.admin@pitchpilot.app' };

function Spin() {
  return <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />;
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

  const go = (r: string) => router.push(r === 'admin' ? '/dashboard/admin' : r === 'investor' ? '/feed' : '/dashboard/founder');

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
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Something went wrong'); }
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
      }
      go(r);
    } catch { go(r); }
    finally { setBusy(false); }
  };

  // ── AUTH FORM ──────────────────────────────────────────────
  if (view !== 'land') return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'rgba(247,246,243,.92)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => setView('land')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff' }}>▶</span>
          PitchPilot
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => setView('login')}>Sign in</button>
          <button className="btn btn-ink" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => setView('signup')}>Join free</button>
        </div>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6, textAlign: 'center', letterSpacing: '-0.5px' }}>
            {view === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 15, textAlign: 'center', marginBottom: 28 }}>
            {view === 'login' ? 'Sign in to your PitchPilot account' : 'Get started in seconds'}
          </p>
          <div className="card" style={{ padding: 28 }}>
            {view === 'signup' && <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>Full Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.5px' }}>I am a</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['founder', 'investor'] as const).map(r => (
                    <button key={r} onClick={() => setRole(r)} style={{ padding: '10px', borderRadius: 9, border: '1.5px solid', borderColor: role === r ? 'var(--ink)' : 'var(--border)', background: role === r ? 'var(--ink)' : 'transparent', color: role === r ? '#fff' : 'var(--text2)', cursor: 'pointer', fontSize: 14, fontWeight: 600, textTransform: 'capitalize', fontFamily: 'inherit', transition: 'all .15s' }}>
                      {r === 'founder' ? '🚀 ' : '💼 '}{r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e => e.key === 'Enter' && auth()} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }}>Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && auth()} />
            </div>
            {err && <div style={{ background: 'var(--roseBg)', border: '1px solid var(--roseBorder)', borderRadius: 8, padding: '10px 14px', color: 'var(--rose)', fontSize: 13, marginBottom: 14 }}>{err}</div>}
            {ok && <div style={{ background: 'var(--greenBg)', border: '1px solid var(--greenBorder)', borderRadius: 8, padding: '10px 14px', color: 'var(--green)', fontSize: 13, marginBottom: 14 }}>{ok}</div>}
            <button className="btn btn-ink" style={{ width: '100%', padding: '13px', fontSize: 15 }} onClick={auth} disabled={busy}>
              {busy ? <Spin /> : view === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>
                {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                <span style={{ color: 'var(--text)', fontWeight: 700, textDecoration: 'underline' }}>{view === 'login' ? 'Sign up' : 'Sign in'}</span>
              </button>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>Try a demo</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['🚀', 'Founder', 'founder'], ['💼', 'Investor', 'investor'], ['⚙', 'Admin', 'admin']].map(([icon, label, r]) => (
                <button key={r} onClick={() => demo(r as 'founder' | 'investor' | 'admin')} disabled={busy} className="btn btn-ghost" style={{ padding: '10px 8px', fontSize: 13 }}>
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

  // ── LANDING ────────────────────────────────────────────────
  const features = [
    { icon: '▶', title: 'Video-First Pitching', desc: 'Under 3-minute elevator videos that let investors truly feel your passion and vision — far beyond any PDF.' },
    { icon: '✦', title: 'AI-Powered Matching', desc: 'Our engine analyzes 30+ signals to surface the 5 investors most likely to respond to your specific startup.' },
    { icon: '🔒', title: 'Unlock Full Access', desc: 'Investors subscribe to unlock pitch decks, financials, and direct contact — a subscription model built for trust.' },
    { icon: '◎', title: 'Ecosystem Hub', desc: 'Grants, accelerators, pitch events, and mentors — all in one place. Never miss a funding opportunity again.' },
  ];
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'rgba(247,246,243,.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 20 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15 }}>▶</span>
          PitchPilot
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ padding: '8px 20px' }} onClick={() => setView('login')}>Sign in</button>
          <button className="btn btn-ink" style={{ padding: '8px 20px' }} onClick={() => setView('signup')}>Get started →</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '90px 32px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 16px', marginBottom: 32, fontSize: 13, color: 'var(--text2)', fontWeight: 500, boxShadow: 'var(--shadow1)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          Now live · India&apos;s first video pitch platform
        </div>
        <h1 style={{ fontSize: 'clamp(40px,7.5vw,76px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 22, letterSpacing: '-1.5px', color: 'var(--text)' }}>
          Where founders pitch.<br />
          <span style={{ color: 'var(--text2)', fontWeight: 400 }} className="serif">Investors discover.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 540, margin: '0 auto 40px', fontWeight: 400 }}>
          The premium video-first platform where startup founders showcase their vision and the world&apos;s top investors find their next deal.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-ink" style={{ fontSize: 16, padding: '14px 32px', borderRadius: 12 }} onClick={() => setView('signup')}>Start pitching free</button>
          <button className="btn btn-outline" style={{ fontSize: 16, padding: '14px 32px', borderRadius: 12 }} onClick={() => setView('login')}>Discover startups →</button>
        </div>
      </div>

      {/* Mock feed cards */}
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 32px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[['NeuralPay', 'FinTech · Seed', '$12K MRR', '#F0EDE8'], ['MedSync', 'HealthTech · Series A', '$45K MRR', '#EBF0E8'], ['GreenTrace', 'CleanTech · Pre-Seed', '3 pilots', '#E8EDF0']].map(([n, s, t, bg]) => (
            <div key={n} className="card" style={{ overflow: 'hidden', transition: 'box-shadow .2s', cursor: 'pointer' }}>
              <div style={{ height: 170, background: bg as string, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: 'var(--shadow2)' }}>▶</div>
                <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="tag" style={{ fontSize: 11, background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(4px)' }}>{s.split(' · ')[0]}</span>
                  <span style={{ background: 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 5, padding: '2px 7px', fontSize: 11, fontFamily: 'monospace' }}>2:47</span>
                </div>
              </div>
              <div style={{ padding: '13px 16px' }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 3 }}>{n}</div>
                <div style={{ color: 'var(--text3)', fontSize: 12 }}>{s} · {t}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '48px 32px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32, textAlign: 'center' }}>
          {[['209K+', 'Registered startups in India'], ['$11.6B', 'Raised by Indian startups in 2025'], ['$20B+', 'Global fundraising market size']].map(([v, l]) => (
            <div key={l}><div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', marginBottom: 6 }}>{v}</div><div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.4 }}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '72px 32px' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: 'center', letterSpacing: '-0.5px', marginBottom: 48 }}>Everything you need to raise</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
          {features.map(f => (
            <div key={f.title} className="card" style={{ padding: '22px 20px' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--s50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 7 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '64px 32px 80px', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 14, letterSpacing: '-0.5px' }}>Ready to get funded?</h2>
        <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 32 }}>Join thousands of founders who have already pitched on PitchPilot.</p>
        <button className="btn btn-ink" style={{ fontSize: 16, padding: '14px 40px', borderRadius: 12 }} onClick={() => setView('signup')}>Create your free profile →</button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '24px 48px', display: 'flex', justifyContent: 'space-between', color: 'var(--text3)', fontSize: 13 }}>
        <span>© 2025 PitchPilot</span><span>Built for founders, by founders</span>
      </div>
    </div>
  );
}
