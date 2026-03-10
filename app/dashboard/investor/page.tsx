'use client';
import { useState, useEffect } from 'react';
import { supabase, getSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const MOCK_STARTUPS = [
  { name: 'NeuralPay', sector: 'FinTech', stage: 'Seed', raise: '$500K', mrr: '$12K', icon: '🤖', match: 94 },
  { name: 'MedSync', sector: 'HealthTech', stage: 'Pre-Seed', raise: '$250K', mrr: '$4K', icon: '🏥', match: 88 },
  { name: 'FlowDesk', sector: 'SaaS', stage: 'Series A', raise: '$2M', mrr: '$85K', icon: '⚡', match: 82 },
  { name: 'AgriChain', sector: 'AgriTech', stage: 'Seed', raise: '$750K', mrr: '$28K', icon: '🌾', match: 79 },
];

export default function InvestorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'feed' | 'matches' | 'saved'>('feed');

  useEffect(() => {
    getSession().then(s => {
      if (!s) { router.replace('/'); return; }
      supabase.from('profiles').select('full_name,email,role').eq('id', s.user.id).single().then(({ data }) => {
        if (data?.role === 'founder') { router.replace('/dashboard/founder'); return; }
        if (data?.role === 'admin') { router.replace('/dashboard/admin'); return; }
        setUser({ id: s.user.id, name: data?.full_name || '', email: data?.email || s.user.email || '' });
        setLoading(false);
      });
    });
  }, [router]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spin" /></div>;

  return (
    <div className="app-shell">
      <Nav user={{ name: user?.name || '', role: 'investor', email: user?.email || '' }} />
      <main className="main-content">
        <div className="top-bar">
          <span className="top-logo">Deal Flow</span>
          <button onClick={() => router.push('/discover')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}>🔍</button>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(247,246,243,.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 9 }}>
            {(['feed', 'matches', 'saved'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', color: tab === t ? 'var(--ink)' : 'var(--text2)', borderBottom: '2px solid', borderBottomColor: tab === t ? 'var(--ink)' : 'transparent', textTransform: 'capitalize' }}>
                {t === 'matches' ? '✦ AI Matches' : t === 'saved' ? '🔖 Saved' : '⊞ Feed'}
              </button>
            ))}
          </div>

          {tab === 'feed' && (
            <div style={{ padding: 16 }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>Hey, {user?.name?.split(' ')[0] || 'Investor'} 👋</h2>
                <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>4 new pitches match your thesis today</p>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
                {[['👀', 'Viewed', '47'], ['✦', 'Matches', '12'], ['🔖', 'Saved', '8'], ['✉', 'Connected', '3']].map(([ic, lb, val]) => (
                  <div key={lb} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 24 }}>{ic}</span>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800 }}>{val}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{lb}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-ink btn-full" onClick={() => router.push('/feed')} style={{ marginBottom: 16, padding: 13, fontSize: 15 }}>Browse Pitch Feed →</button>
              <button className="btn btn-outline btn-full" onClick={() => router.push('/discover')}>Discover Startups →</button>
            </div>
          )}

          {tab === 'matches' && (
            <div>
              <div style={{ padding: '12px 16px', background: 'var(--greenBg)', borderBottom: '1px solid var(--greenBorder)' }}>
                <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>✦ AI has analyzed 209K+ startups to find your best matches</div>
              </div>
              {MOCK_STARTUPS.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => router.push('/feed')}>
                  <div style={{ width: 50, height: 50, borderRadius: 12, background: `hsl(${i * 60},22%,90%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                      <span style={{ fontSize: 12, background: 'var(--greenBg)', color: 'var(--green)', border: '1px solid var(--greenBorder)', borderRadius: 12, padding: '2px 8px', fontWeight: 700 }}>{s.match}%</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.sector} · {s.stage} · Raising {s.raise}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>MRR {s.mrr}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'saved' && (
            <div className="empty" style={{ padding: '48px 20px' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🔖</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No saved startups yet</div>
              <div style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 16 }}>Bookmark pitches you want to revisit</div>
              <button className="btn btn-ink btn-sm" onClick={() => router.push('/feed')}>Browse pitches</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
