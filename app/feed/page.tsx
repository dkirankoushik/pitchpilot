'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getSession, type Startup, type Profile } from '@/lib/supabase';

const CARD_BG = ['#F0EDE8', '#EBF0E8', '#E8EDF0', '#F0E8ED', '#EDE8F0', '#F0F0E8'];

const MOCK: Startup[] = [
  { id: 'm1', founder_id: 'f1', name: 'NeuralPay', tagline: 'AI-powered expense intelligence for growing SMEs', description: 'We automate accounts payable using computer vision and ML, cutting finance team workload by 90%. 45 enterprise customers, $12K MRR, growing 3× YoY.', sector: 'FinTech', stage: 'Seed', location: 'Bangalore', raise_amount: '$500K', team_size: 4, traction: '$12K MRR · 45 customers · 3× YoY growth', website: 'neuralpay.in', pitch_video_url: null, tags: ['AI', 'B2B', 'SaaS'], mrr: '$12K', founded_year: 2023, is_public: true, status: 'active', approval_status: 'approved', rejection_reason: null, views: 1240, created_at: '', profiles: { id: 'f1', email: 'priya@neuralpay.in', full_name: 'Priya Sharma', avatar_url: null, role: 'founder', credits: 10, created_at: '' } },
  { id: 'm2', founder_id: 'f2', name: 'MedSync', tagline: 'Unified patient records across hospital networks', description: 'Interoperability layer for India\'s fragmented health data. 60 hospitals live in 18 months, Ministry of Health partnership signed.', sector: 'HealthTech', stage: 'Series A', location: 'Hyderabad', raise_amount: '$1M', team_size: 8, traction: '$45K MRR · 60 hospitals · MoH partner', website: 'medsync.health', pitch_video_url: null, tags: ['Health', 'Gov', 'API'], mrr: '$45K', founded_year: 2022, is_public: true, status: 'active', approval_status: 'approved', rejection_reason: null, views: 2100, created_at: '', profiles: { id: 'f2', email: 'kavya@medsync.health', full_name: 'Dr. Kavya Rao', avatar_url: null, role: 'founder', credits: 10, created_at: '' } },
  { id: 'm3', founder_id: 'f3', name: 'GreenTrace', tagline: 'Real-time carbon accounting for supply chains', description: 'Enterprise carbon platform helping Fortune 500 companies hit net-zero targets. Live API used by 3 pilots, YC application in final round.', sector: 'CleanTech', stage: 'Pre-Seed', location: 'Mumbai', raise_amount: '$250K', team_size: 3, traction: '3 paying pilots · $8K MRR', website: 'greentrace.io', pitch_video_url: null, tags: ['ESG', 'Enterprise', 'API'], mrr: '$8K', founded_year: 2024, is_public: true, status: 'active', approval_status: 'approved', rejection_reason: null, views: 892, created_at: '', profiles: { id: 'f3', email: 'arjun@greentrace.io', full_name: 'Arjun Mehta', avatar_url: null, role: 'founder', credits: 10, created_at: '' } },
  { id: 'm4', founder_id: 'f4', name: 'FlowDesk', tagline: 'Async video learning replacing enterprise slide decks', description: 'L&D platform achieving 10× employee engagement vs traditional LMS. 80 enterprise clients, $200K MRR and growing.', sector: 'EdTech', stage: 'Series A', location: 'Delhi', raise_amount: '$3M', team_size: 18, traction: '$200K MRR · 80 enterprise clients', website: 'flowdesk.app', pitch_video_url: null, tags: ['B2B', 'Video', 'HR'], mrr: '$200K', founded_year: 2021, is_public: true, status: 'active', approval_status: 'approved', rejection_reason: null, views: 3400, created_at: '', profiles: { id: 'f4', email: 'rohan@flowdesk.app', full_name: 'Rohan Kapoor', avatar_url: null, role: 'founder', credits: 10, created_at: '' } },
];

function Av({ name, sz = 38 }: { name: string; sz?: number }) {
  const cs = ['#D4C5F9', '#C5D4F9', '#C5F9D4', '#F9D4C5', '#F9C5D4'];
  return <div style={{ width: sz, height: sz, borderRadius: sz / 3.5, background: cs[name.charCodeAt(0) % cs.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: sz * .38, color: 'var(--ink)', flexShrink: 0, border: '2px solid rgba(255,255,255,.6)' }}>{name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>;
}

function FeedCard({ s, subbed, onSub, onProfile }: { s: Startup; subbed: boolean; onSub(): void; onProfile(): void }) {
  const [liked, setLiked] = useState(false);
  const [lc, setLc] = useState(Math.floor(Math.random() * 200) + 40);
  const [playing, setPlaying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const bg = CARD_BG[s.name.charCodeAt(0) % CARD_BG.length];
  const fn = s.profiles?.full_name || 'Founder';

  return (
    <div className="snap-item" style={{ background: 'var(--bg)' }}>
      {/* ── Video area ── */}
      <div style={{ flex: '0 0 62dvh', background: bg, position: 'relative', cursor: 'pointer', overflow: 'hidden' }} onClick={() => setPlaying(p => !p)}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 80%, rgba(0,0,0,.04) 0%, transparent 60%)' }} />

        {/* top row */}
        <div style={{ position: 'absolute', top: 52, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 14px' }}>
          <span className="tag" style={{ background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(6px)', fontWeight: 600, fontSize: 12 }}>{s.sector}</span>
          <span style={{ background: 'rgba(0,0,0,.5)', color: '#fff', borderRadius: 5, padding: '2px 8px', fontSize: 12, fontFamily: 'monospace', backdropFilter: 'blur(3px)' }}>2:47</span>
        </div>

        {/* Play/Pause */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: '0 4px 20px rgba(0,0,0,.12)', transition: 'transform .2s', transform: playing ? 'scale(1.05)' : 'scale(1)' }}>
            {playing ? '⏸' : '▶'}
          </div>
        </div>

        {/* Raise badge */}
        {s.raise_amount && (
          <div style={{ position: 'absolute', bottom: 16, right: 14, background: 'rgba(255,255,255,.94)', borderRadius: 10, padding: '6px 12px', backdropFilter: 'blur(8px)', boxShadow: 'var(--shadow2)' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }}>Raising</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)', letterSpacing: '-.3px' }}>{s.raise_amount}</div>
          </div>
        )}

        {/* Scroll dots */}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: i === 0 ? 18 : 6, height: 4, borderRadius: 2, background: i === 0 ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,.18)', transition: 'width .3s' }} />)}
        </div>
      </div>

      {/* ── Info panel ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '14px 16px 0' }}>
          {/* Founder row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
            <button onClick={onProfile} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Av name={fn} sz={40} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{fn} · {s.location}</div>
              </div>
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => { setLiked(l => !l); setLc(c => liked ? c - 1 : c + 1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: liked ? '#E11D48' : 'var(--text2)', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 19 }}>{liked ? '♥' : '♡'}</span>{lc}
              </button>
            </div>
          </div>

          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55, marginBottom: 10 }}>{s.tagline}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 11 }}>
            {(s.tags || []).map(t => <span key={t} className="tag" style={{ fontSize: 11 }}>{t}</span>)}
            <span className="tag" style={{ fontSize: 11 }}>{s.stage}</span>
            {s.team_size && <span className="tag" style={{ fontSize: 11 }}>👥 {s.team_size}</span>}
          </div>

          {s.traction && (
            <div style={{ background: 'var(--greenBg)', border: '1px solid var(--greenBorder)', borderRadius: 9, padding: '8px 12px', fontSize: 13, color: 'var(--green)', fontWeight: 600, marginBottom: 11 }}>
              📈 {s.traction}
            </div>
          )}
        </div>

        {/* CTA row */}
        {!subbed ? (
          <div style={{ margin: '0 14px 16px', background: 'var(--s50)', border: '1px solid var(--border)', borderRadius: 13, padding: '13px 15px' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>Unlock the full story</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>Pitch deck, financials, cap table, and direct founder contact — all in one tap.</div>
              </div>
            </div>
            <button onClick={() => setShowModal(true)} className="btn btn-ink" style={{ width: '100%', padding: '11px', fontSize: 14, borderRadius: 10 }}>
              Unlock for $9 / month →
            </button>
          </div>
        ) : (
          <div style={{ margin: '0 14px 16px' }}>
            <button onClick={onProfile} className="btn btn-outline" style={{ width: '100%', padding: '11px', fontSize: 14, borderRadius: 10 }}>
              View full profile & documents →
            </button>
          </div>
        )}
      </div>

      {/* Unlock modal */}
      {showModal && (
        <div className="modal-bg" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 24px' }} />
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🚀</div>
              <h3 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: '-.5px' }}>Unlock {s.name}</h3>
              <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.6 }}>Get exclusive investor-grade access to everything behind the pitch.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 22 }}>
              {[['📄', 'Full pitch deck (PDF)'], ['💰', 'Financial statements & projections'], ['📊', 'Traction metrics & growth charts'], ['👥', 'Team bios & LinkedIn profiles'], ['⚖️', 'Cap table & legal documents'], ['📞', 'Direct founder contact & intro']].map(([ic, tx]) => (
                <div key={tx} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 14, color: 'var(--text)' }}>
                  <span style={{ fontSize: 17 }}>{ic}</span>{tx}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px' }}>$9 <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text2)' }}>/ month per startup</span></div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Cancel anytime · No contracts</div>
            </div>
            <button className="btn btn-ink" style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12 }} onClick={() => { onSub(); setShowModal(false); }}>
              Unlock Now — $9 / month
            </button>
            <button onClick={() => setShowModal(false)} style={{ width: '100%', padding: '12px', marginTop: 8, background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>Not now</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [subs, setSubs] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const sectors = ['All', 'FinTech', 'HealthTech', 'CleanTech', 'EdTech', 'AI/ML'];

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const session = await getSession(); const u = session?.user ?? null;
    if (!u) { router.push('/'); return; }
    const [{ data: prof }, { data: real }, { data: subData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', u.id).single(),
      supabase.from('startups').select('*, profiles(full_name,email)').eq('approval_status', 'approved').eq('is_public', true).order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('startup_id').eq('subscriber_id', u.id).eq('status', 'active'),
    ]);
    setUser(prof);
    setSubs(new Set((subData || []).map((x: { startup_id: string }) => x.startup_id)));
    setStartups((real && real.length > 0) ? real : MOCK);
    setLoading(false);
  }

  const subscribe = useCallback(async (sid: string) => {
    if (!user) return;
    await supabase.from('subscriptions').upsert({ subscriber_id: user.id, startup_id: sid, plan: 'unlock', status: 'active' });
    setSubs(p => new Set([...p, sid]));
  }, [user]);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    const fn = () => setActiveIdx(Math.round(el.scrollTop / el.clientHeight));
    el.addEventListener('scroll', fn, { passive: true });
    return () => el.removeEventListener('scroll', fn);
  }, []);

  const list = filter === 'All' ? startups : startups.filter(s => s.sector === filter);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 14 }}>
      <div style={{ width: 38, height: 38, border: '2.5px solid var(--border)', borderTop: '2.5px solid var(--ink)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <div style={{ color: 'var(--text2)', fontSize: 14 }}>Loading pitches…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Top nav */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, background: 'rgba(247,246,243,.94)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
          <div style={{ fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>▶</span>
            PitchPilot
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 4px' }}>
            {sectors.map(sec => (
              <button key={sec} onClick={() => setFilter(sec)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: filter === sec ? 'var(--ink)' : 'var(--border)', background: filter === sec ? 'var(--ink)' : 'transparent', color: filter === sec ? '#fff' : 'var(--text2)', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all .15s', flexShrink: 0 }}>{sec}</button>
            ))}
          </div>
          <button onClick={() => router.push(user?.role === 'investor' ? '/dashboard/investor' : user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/founder')} style={{ background: 'none', border: '1.5px solid var(--border)', borderRadius: 10, cursor: 'pointer', padding: 3 }}>
            <Av name={user?.full_name || 'U'} sz={28} />
          </button>
        </div>
      </div>

      {/* Feed */}
      <div ref={feedRef} className="snap-feed" style={{ marginTop: 56, paddingBottom: 60 }}>
        {list.map((s, i) => (
          <FeedCard key={s.id} s={s} subbed={subs.has(s.id)} onSub={() => subscribe(s.id)} onProfile={() => router.push(`/profile/${s.founder_id}?startup=${s.id}`)} />
        ))}
        {list.length === 0 && (
          <div className="snap-item" style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--text2)' }}>
            <div style={{ fontSize: 52 }}>🔭</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>No pitches in {filter}</div>
            <div style={{ fontSize: 14 }}>Founders join daily — check back soon</div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="bottomnav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(247,246,243,.96)', borderTop: '1px solid var(--border)', justifyContent: 'space-around', padding: '10px 0', paddingBottom: 'max(10px,env(safe-area-inset-bottom))', backdropFilter: 'blur(12px)', zIndex: 60 }}>
        {[['▶', 'Feed', '/feed'], ['◎', user?.role === 'investor' ? 'Deals' : 'Home', user?.role === 'investor' ? '/dashboard/investor' : '/dashboard/founder'], ['👤', 'Profile', `/profile/${user?.id}`]].map(([ic, lb, href]) => (
          <button key={lb} onClick={() => router.push(href)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '3px 20px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text2)', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 19 }}>{ic}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{lb}</span>
          </button>
        ))}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
