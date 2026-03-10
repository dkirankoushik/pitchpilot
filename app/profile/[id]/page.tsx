'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, type Profile, type Startup, type StartupDocument } from '@/lib/supabase';

const CARD_BG = ['#F0EDE8', '#EBF0E8', '#E8EDF0', '#F0E8ED', '#EDE8F0'];

function Av({ name, sz = 48 }: { name: string; sz?: number }) {
  const cs = ['#D4C5F9', '#C5D4F9', '#C5F9D4', '#F9D4C5', '#F9C5D4'];
  return (
    <div style={{ width: sz, height: sz, borderRadius: sz / 3.5, background: cs[name.charCodeAt(0) % cs.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: sz * .38, color: 'var(--ink)', flexShrink: 0, border: '2.5px solid var(--border)' }}>
      {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
    </div>
  );
}

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 36, height: 36, border: '2px solid var(--border)', borderTop: '2px solid var(--ink)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// Inner component — useSearchParams MUST live inside a <Suspense> boundary
function ProfileContent({ id }: { id: string }) {
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      const [{ data: v }, { data: f }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('profiles').select('*').eq('id', id).single(),
      ]);
      if (cancelled) return;
      setViewer(v);
      setFounder(f || v);
      if (startupId) {
        const [{ data: s }, { data: sub }, { data: d }] = await Promise.all([
          supabase.from('startups').select('*').eq('id', startupId).single(),
          supabase.from('subscriptions').select('id').eq('subscriber_id', user.id).eq('startup_id', startupId).eq('status', 'active').single(),
          supabase.from('startup_documents').select('*').eq('startup_id', startupId).order('created_at'),
        ]);
        if (cancelled) return;
        setStartup(s);
        setDocs(d || []);
        setSubbed(!!sub || v?.role === 'admin' || v?.id === id);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id, startupId, router]);

  async function subscribe() {
    if (!viewer || !startup) return;
    setSubbing(true);
    await supabase.from('subscriptions').upsert({
      subscriber_id: viewer.id,
      startup_id: startup.id,
      plan: 'unlock',
      status: 'active',
    });
    setSubbed(true);
    setSubbing(false);
  }

  if (loading) return <PageLoader />;

  const bg = CARD_BG[(founder?.full_name || '').charCodeAt(0) % CARD_BG.length];
  const fn = founder?.full_name || 'Founder';

  const mockTeam = [
    { name: fn, role: 'CEO & Co-Founder', badge: 'Founder' },
    { name: 'Co-Founder', role: 'CTO & Co-Founder', badge: '' },
    { name: 'Team Member', role: 'Head of Product', badge: '' },
  ];

  const mockDocs: { title: string; type: 'pitch_deck' | 'financials' | 'legal' | 'product'; locked: boolean }[] = [
    { title: 'Pitch Deck', type: 'pitch_deck', locked: !subbed },
    { title: 'Financial Projections', type: 'financials', locked: !subbed },
    { title: 'Product Roadmap', type: 'product', locked: !subbed },
    { title: 'Cap Table & Legal', type: 'legal', locked: !subbed },
  ];

  type DisplayDoc = (StartupDocument & { locked: boolean }) | typeof mockDocs[0];
  const displayDocs: DisplayDoc[] = docs.length > 0
    ? docs.map(d => ({ ...d, locked: !subbed && !d.is_public }))
    : mockDocs;

  const typeIcon: Record<string, string> = {
    pitch_deck: '📊',
    financials: '💰',
    legal: '⚖️',
    product: '🗺️',
    other: '📄',
  };

  const stats: [string, string][] = [
    ['📍', startup?.location || '—'],
    ['💰', startup?.raise_amount || '—'],
    ['📈', startup?.mrr || '—'],
  ];

  const details: [string, string][] = [
    ['Sector', startup?.sector || '—'],
    ['Founded', String(startup?.founded_year || '2023')],
    ['Team', (startup?.team_size ?? 0) + ' people'],
    ['Website', startup?.website || '—'],
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(247,246,243,.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: 'var(--text)' }}>
          ‹
        </button>
        <div style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>{startup?.name || fn}</div>
        {startup && (
          subbed
            ? <span className="tag tag-green" style={{ fontSize: 12 }}>✓ Unlocked</span>
            : <span className="tag tag-amber" style={{ fontSize: 12 }}>🔒 Locked</span>
        )}
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
          <div style={{ border: '3px solid var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
            <Av name={fn} sz={72} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop: 52, padding: '52px 20px 100px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 3, letterSpacing: '-.3px' }}>{fn}</h1>
        {startup && <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 2 }}>Founder of {startup.name}</div>}
        <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 18 }}>{founder?.email}</div>

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
              {stats.map(([ic, v]) => (
                <div key={ic} style={{ background: 'var(--surface2)', borderRadius: 9, padding: '9px 10px', textAlign: 'center' }}>
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
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: tab === t ? 'var(--surface)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', boxShadow: tab === t ? 'var(--shadow1)' : 'none', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {/* About */}
        {tab === 'about' && (
          <div>
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
                {details.map(([k, v]) => (
                  <div key={k} className="card" style={{ padding: '13px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team */}
        {tab === 'team' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

        {/* Docs */}
        {tab === 'docs' && (
          <div>
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
              {displayDocs.map((doc, i) => (
                <div key={i} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: doc.locked ? .65 : 1 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: doc.locked ? 'var(--border)' : 'var(--greenBg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
                    {doc.locked ? '🔒' : typeIcon[doc.type]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: doc.locked ? 'var(--text3)' : 'var(--text)' }}>{doc.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'capitalize', marginTop: 1 }}>{doc.type.replace('_', ' ')}</div>
                  </div>
                  {!doc.locked && <button className="btn btn-green" style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8 }}>View →</button>}
                </div>
              ))}
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

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// Page export — Suspense boundary required for useSearchParams in Next.js 14
export default function ProfilePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProfileContent id={params.id} />
    </Suspense>
  );
}
