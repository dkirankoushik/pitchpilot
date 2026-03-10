'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'founder' | 'investor'>('founder');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name, role } },
        });
        if (error) throw error;
        setSuccess('Check your email to confirm your account!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        const userRole = profile?.role || 'founder';
        if (userRole === 'admin') router.push('/dashboard/admin');
        else if (userRole === 'investor') router.push('/dashboard/investor');
        else router.push('/dashboard/founder');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (demoRole: 'founder' | 'investor' | 'admin') => {
    setLoading(true);
    const demoEmails: Record<string, string> = {
      founder: 'demo.founder@pitchflow.app',
      investor: 'demo.investor@pitchflow.app',
      admin: 'demo.admin@pitchflow.app',
    };
    try {
      // Try sign in first, if fails, sign up
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmails[demoRole], password: 'Demo@12345',
      });
      if (error) {
        await supabase.auth.signUp({
          email: demoEmails[demoRole], password: 'Demo@12345',
          options: { data: { full_name: `Demo ${demoRole.charAt(0).toUpperCase() + demoRole.slice(1)}`, role: demoRole } },
        });
        // Update role manually if needed
        await new Promise(r => setTimeout(r, 800));
        router.push(`/dashboard/${demoRole}`);
        return;
      }
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, email: demoEmails[demoRole], full_name: `Demo ${demoRole}`, role: demoRole }, { onConflict: 'id' });
        router.push(`/dashboard/${demoRole}`);
      }
    } catch {
      router.push(`/dashboard/${demoRole}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060914 0%, #0d0f1e 50%, #060914 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)' }} />
      </div>

      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 10, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>▶</div>
          <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#a78bfa' }}>Pitch</span><span style={{ color: '#67e8f9' }}>Flow</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setMode('login')} style={{ padding: '8px 20px', borderRadius: 10, background: mode === 'login' ? 'rgba(124,58,237,0.2)' : 'transparent', border: '1px solid', borderColor: mode === 'login' ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)', color: mode === 'login' ? '#a78bfa' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Sign In</button>
          <button onClick={() => setMode('signup')} style={{ padding: '8px 20px', borderRadius: 10, background: mode === 'signup' ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'transparent', border: '1px solid', borderColor: mode === 'signup' ? 'transparent' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Sign Up</button>
        </div>
      </nav>

      {/* Hero + Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* Hero Text */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>✦ India&apos;s #1 Video Pitch Platform</span>
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>
              <span style={{ background: 'linear-gradient(135deg,#a78bfa,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Instagram + LinkedIn</span>
              <br /><span style={{ color: '#fff' }}>for Startups & VCs</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.6 }}>
              The unified platform where founders pitch with video, investors discover deals, and ecosystems connect.
            </p>
          </div>

          {/* Auth Form */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
              {mode === 'login' ? 'Welcome back' : 'Join PitchFlow'}
            </h2>

            {mode === 'signup' && (
              <>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, marginBottom: 16, outline: 'none' }} />
                
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>I am a...</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {(['founder', 'investor'] as const).map(r => (
                    <button key={r} onClick={() => setRole(r)} style={{ padding: '12px', borderRadius: 10, border: '1px solid', borderColor: role === r ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)', background: role === r ? 'rgba(124,58,237,0.15)' : 'transparent', color: role === r ? '#a78bfa' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{r === 'founder' ? '🚀 Founder' : '💼 Investor'}</button>
                  ))}
                </div>
              </>
            )}

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, marginBottom: 16, outline: 'none' }} />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, marginBottom: 20, outline: 'none' }} />

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>{error}</div>}
            {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', color: '#6ee7b7', fontSize: 13, marginBottom: 16 }}>{success}</div>}

            <button onClick={handleAuth} disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <span style={{ color: '#a78bfa', fontWeight: 600 }}>{mode === 'login' ? 'Sign Up' : 'Sign In'}</span>
              </button>
            </div>
          </div>

          {/* Demo Buttons */}
          <div style={{ marginTop: 24 }}>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Try Demo Dashboards</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['🚀', 'Founder', 'founder'], ['💼', 'Investor', 'investor'], ['⚙️', 'Admin', 'admin']].map(([icon, label, r]) => (
                <button key={r} onClick={() => handleDemo(r as 'founder' | 'investor' | 'admin')} disabled={loading}
                  style={{ padding: '10px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 40, textAlign: 'center' }}>
            {[['209K+', 'Startups in India'], ['$11.6B', 'Raised in 2025'], ['$20B+', 'Market Size']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg,#a78bfa,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{val}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
