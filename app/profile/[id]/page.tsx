'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, type Profile, type Startup, type StartupDocument } from '@/lib/supabase';

const CARD_BG = ['#F0EDE8', '#EBF0E8', '#E8EDF0', '#F0E8ED', '#EDE8F0'];

function Av({ name, sz = 48 }: { name: string; sz?: number }) {
  const cs = ['#D4C5F9', '#C5D4F9', '#C5F9D4', '#F9D4C5', '#F9C5D4'];
  return <div style={{ width: sz, height: sz, borderRadius: sz / 3.5, background: cs[name.charCodeAt(0) % cs.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: sz * .38, color: 'var(--ink)', flexShrink: 0, border: '2.5px solid var(--border)' }}>{name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>;
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const sp = useSearchParams();
  const startupId = sp.get('startup');
  const [viewer, setViewer] = useState<Profile | null>(null);
  const [founder, setFounder] = useState<Profile | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [subbed, setSubbed] = useState(false);
  const [docs, setDocs] = useState<StartupDocument[]>([]);
  const [tab, setTab] = useState<'about' | 'team' | 'docs'>('about');
  const [loading, setLoading] = useState(true);
  const [subbing, setSubbing] = useState(false);

  useEffect(() => { load(); }, [params.id, startupId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    const [{ data: v }, { data: f }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('profiles').select('*').eq('id', params.id).single(),
    ]);
    setViewer(v); setFounder(f || v);
    if (startupId) {
      const [{ data: s }, { data: sub }, { data: d }] = await Promise.all([
        supabase.from('startups').select('*').eq('id', startupId).single(),
        supabase.from('subscriptions').select('id').eq('subscriber_id', user.id).eq('startup_id', startupId).eq('status', 'active').single(),
        supabase.from('startup_documents').select('*').eq('startup_id', startupId).order('created_at'),
      ]);
      setStartup(s); setDocs(d || []);
      setSubbed(!!sub || v?.role === 'admin' || v?.id === params.id);
    }
    setLoading(false);
  }

  async function subscribe() {
    if (!viewer || !startup) return;
    setSubbing(true);
    await supabase.from('subscriptions').upsert({ subscriber_id: viewer.id, startup_id: startup.id, plan: 'unlock', status: 'active' });
    setSubbed(true); setSubbing(false);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 36, height: 36, border: '2px solid var(--border)', borderTop: '2px solid var(--ink)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const fp = founder;
  const bg = CARD_BG[(fp?.full_name || '').charCodeAt(0) % CARD_BG.length];
  const mockTeam = [
    { name: fp?.full_name || 'Founder', role: 'CEO & Co-Founder', badge: 'Founder' },
    { name: 'Co-Founder', role: 'CTO & Co-Founder', badge: '' },
    { name: 'Team Member', role: 'Head of Product', badge: '' },
  ];
  const mockDocs = [
    { title: 'Pitch Deck', type: 'pitch_deck' as const, locked: !subbed },
    { title: 'Financial Projections', type: 'financials' as const, locked: !subbed },
    { title: 'Product Roadmap', type: 'product' as const, locked: !subbed },
    { title: 'Cap Table & Legal', type: 'legal' as const, locked: !subbed },
  ];
  const displayDocs = docs.length > 0
    ? docs.map(d => ({ ...d, locked: !subbed && !d.is_public }))
    : mockDocs;
  const typeIcon: Record<string, string> = { pitch_deck: '📊', financials: '💰', legal: '⚖️', product: '🗺️', other: '📄' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sticky top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(247,246,243,.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: 'var(--text)' }}>‹</button>
        <div style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>{startup?.name || fp?.full_name}</div>
        {startup && (subbed
          ? <span className="tag tag-green" style={{ fontSize: 12 }}>✓ Unlocked</span>
          : <span className="tag tag-amber" style={{ fontSize: 12 }}>🔒 Locked</span>)}
      </div>

      {/* Cover */}
      <div style={{ height: 150, background: bg, position: 'relative' }}>
        {!subbed && startup && (
          <div style={{ position: 'absolute', top: 14, right: 14 }}>
            <button onClick={subscribe} disabled={subbing} className="btn btn-ink" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 9 }}>
              {subbing ? '…' : '🔓 Unlock · $9/mo'}
            </button>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: -36, left: 20 }}>
          <div style={{ border: '3px solid var(--surface)', borderRadius: 18, overflow: 'hidden', borderBottomLeftRadius: 18 }}>
            <Av name={fp?.full_name || 'F'} sz={72} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop: 52, padding: '52px 20px 100px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 3, letterSpacing: '-.3px' }}>{fp?.full_name}</h1>
        {startup && <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 2 }}>Founder of {startup.name}</div>}
        <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 18 }}>{fp?.email}</div>

        {/* Startup card */}
        {startup && (
          <div className="card" style={{ padding: 18, marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.3px' }}>{startup.name}</div>
                <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>{startup.tagline}</div>
              </div>
              <span className="tag tag-green" style={{ fontSize: 12 }}>{startup.stage}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[['📍', startup.location || '—'], ['💰', startup.raise_amount || '—'], ['📈', startup.mrr || '—']].map(([ic, v]) => (
                <div key={v} style={{ background: 'var(--surface2)', borderRadius: 9, padding: '9px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{ic}</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--s50)', borderRadius: 11, padding: 4 }}>
          {(['about', 'team', 'docs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: tab === t ? 'var(--surface)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', boxShadow: tab === t ? 'var(--shadow1)' : 'none', textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'about' && (
          <div className="a-up">
            {startup?.description && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: .9, marginBottom: 8 }}>About</div>
                <p style={{ fontSize: 15, lineHeight: 1.7 }}>{startup.description}</p>
              </div>
            )}
            {startup?.traction && (
              <div style={{ background: 'var(--greenBg)', border: '1px solid var(--greenBorder)', borderRadius: 12, padding: '13px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: .9, marginBottom: 5 }}>Traction</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{startup.traction}</div>
              </div>
            )}
            {startup && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Sector', startup.sector], ['Founded', startup.founded_year || '2023'], ['Team', startup.team_size + ' people'], ['Website', startup.website || '—']].map(([k, v]) => (
                  <div key={k} className="card" style={{ padding: '13px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'team' && (
          <div className="a-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mockTeam.map((m, i) => (
              <div key={i} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Av name={m.name} sz={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>{m.role}</div>
                </div>
                {m.badge && <span className="tag tag-green" style={{ fontSize: 11 }}>{m.badge}</span>}
              </div>
            ))}
          </div>
        )}

        {tab === 'docs' && (
          <div className="a-up">
            {!subbed && (
              <div style={{ background: 'var(--amberBg)', border: '1px solid var(--amberBorder)', borderRadius: 13, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--amber)', marginBottom: 4 }}>Documents are locked</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>Subscribe for $9/month to access pitch deck, financials, legal docs, and more.</div>
                  <button onClick={subscribe} disabled={subbing} className="btn btn-ink" style={{ marginTop: 10, fontSize: 13, padding: '8px 18px', borderRadius: 9 }}>
                    {subbing ? '…' : 'Unlock now — $9/mo'}
                  </button>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {displayDocs.map((doc, i) => {
                const locked = 'locked' in doc && doc.locked;
                return (
                  <div key={i} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: locked ? .65 : 1 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: locked ? 'var(--border)' : 'var(--greenBg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
                      {locked ? '🔒' : typeIcon[doc.type]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: locked ? 'var(--text3)' : 'var(--text)' }}>{doc.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'capitalize', marginTop: 1 }}>{doc.type.replace('_', ' ')}</div>
                    </div>
                    {!locked && (
                      <button className="btn btn-green" style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8 }}>View →</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky unlock bar */}
      {startup && !subbed && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px', background: 'rgba(247,246,243,.96)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(12px)', paddingBottom: 'max(12px,env(safe-area-inset-bottom))' }}>
          <button onClick={subscribe} disabled={subbing} className="btn btn-ink" style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12 }}>
            {subbing ? 'Processing…' : '🔓 Unlock full access — $9 / month'}
          </button>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .a-up{animation:fadeUp .28s ease forwards} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
