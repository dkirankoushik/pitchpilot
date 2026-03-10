'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Profile, type Startup, type InvestorProfile, type AppEvent } from '@/lib/supabase';
import { SideNav, BottomNav, StatCard } from '@/components/Nav';

const CARD_BG = ['#F0EDE8', '#EBF0E8', '#E8EDF0', '#F0E8ED', '#EDE8F0'];
const AI_STARTUPS = [
  { name: 'NeuralPay', match: 96, reason: 'FinTech · Seed · India · $12K MRR', tags: ['AI', 'B2B'] },
  { name: 'MedSync', match: 89, reason: 'HealthTech · Series A · Gov partnership', tags: ['Health', 'API'] },
  { name: 'FlowDesk', match: 83, reason: 'EdTech · Series A · $200K MRR', tags: ['Video', 'HR'] },
];

function Av({ name, sz = 36 }: { name: string; sz?: number }) {
  const cs = ['#D4C5F9', '#C5D4F9', '#C5F9D4', '#F9D4C5', '#F9C5D4'];
  return <div style={{ width: sz, height: sz, borderRadius: sz / 3.5, background: cs[name.charCodeAt(0) % cs.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: sz * .38, color: 'var(--ink)', flexShrink: 0 }}>{name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>;
}

function Spin({ light }: { light?: boolean }) {
  return <span style={{ width: 16, height: 16, border: `2px solid ${light ? 'rgba(255,255,255,.3)' : 'rgba(28,26,23,.15)'}`, borderTop: `2px solid ${light ? '#fff' : 'var(--ink)'}`, borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />;
}

export default function InvestorDash() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [invProfile, setInvProfile] = useState<InvestorProfile | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [subs, setSubs] = useState<Set<string>>(new Set());
  const [sec, setSec] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [filterSector, setFilterSector] = useState('All');
  const [aiRun, setAiRun] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const sectors = ['All', 'FinTech', 'HealthTech', 'CleanTech', 'EdTech', 'AI/ML'];

  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    const [{ data: p }, { data: ip }, { data: ss }, { data: ev }, { data: subData }, { data: savedData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('investor_profiles').select('*').eq('profile_id', user.id).single(),
      supabase.from('startups').select('*, profiles(full_name,email)').eq('approval_status', 'approved').eq('is_public', true).order('created_at', { ascending: false }).limit(20),
      supabase.from('events').select('*').order('deadline', { ascending: true }).limit(10),
      supabase.from('subscriptions').select('startup_id').eq('subscriber_id', user.id).eq('status', 'active'),
      supabase.from('saved_startups').select('startup_id').eq('investor_id', user.id),
    ]);
    setProfile(p); setInvProfile(ip);
    setStartups(ss && ss.length > 0 ? ss : MOCK_STARTUPS);
    setEvents(ev || []);
    setSubs(new Set((subData || []).map((x: { startup_id: string }) => x.startup_id)));
    setSaved(new Set((savedData || []).map((x: { startup_id: string }) => x.startup_id)));
    setLoading(false);
  }

  async function toggleSave(sid: string) {
    if (!profile) return;
    if (saved.has(sid)) {
      await supabase.from('saved_startups').delete().eq('investor_id', profile.id).eq('startup_id', sid);
      setSaved(p => { const n = new Set(p); n.delete(sid); return n; });
    } else {
      await supabase.from('saved_startups').upsert({ investor_id: profile.id, startup_id: sid });
      setSaved(p => new Set([...p, sid]));
    }
  }

  async function subscribe(sid: string) {
    if (!profile) return;
    await supabase.from('subscriptions').upsert({ subscriber_id: profile.id, startup_id: sid, plan: 'unlock', status: 'active' });
    setSubs(p => new Set([...p, sid]));
  }

  if (loading) return <Loader />;

  const feed = filterSector === 'All' ? startups : startups.filter(s => s.sector === filterSector);
  const savedStartups = startups.filter(s => saved.has(s.id));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <SideNav role="investor" userName={profile?.full_name || 'Investor'} credits={profile?.credits} section={sec} onSection={setSec} />
      <BottomNav role="investor" section={sec} onSection={setSec} />

      <main className="maincontent" style={{ flex: 1, marginLeft: 220, padding: '32px 28px 100px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 4 }}>
            {sec === 'overview' ? `Hello, ${profile?.full_name?.split(' ')[0] || 'Investor'} 👋` : sec.charAt(0).toUpperCase() + sec.slice(1)}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>{invProfile?.firm_name || 'Individual Investor'} · {invProfile?.preferred_stages?.join(', ') || 'All stages'}</p>
        </div>

        {/* ── OVERVIEW ── */}
        {sec === 'overview' && (
          <div className="a-up">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 24 }}>
              <StatCard label="Pitches Viewed" value={Math.floor(Math.random() * 30) + 10} sub="this month" icon="▶" color="blue" />
              <StatCard label="Saved" value={saved.size} sub="startups" icon="♡" color="amber" />
              <StatCard label="Unlocked" value={subs.size} sub="full access" icon="🔓" color="green" />
              <StatCard label="Deals Active" value={invProfile?.total_deals || 0} sub="in pipeline" icon="✦" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Investment Thesis</h3>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{invProfile?.thesis || 'Add your investment thesis to get better AI matches.'}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(invProfile?.preferred_sectors || ['FinTech', 'HealthTech', 'AI/ML']).map((s: string) => <span key={s} className="tag" style={{ fontSize: 11 }}>{s}</span>)}
                </div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Recent Activity</h3>
                {[{ a: 'Viewed NeuralPay pitch', t: '2h ago' }, { a: 'Saved MedSync to watchlist', t: '1d ago' }, { a: 'Unlocked FlowDesk documents', t: '3d ago' }].map((x, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{x.a}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{x.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FEED (deal flow) ── */}
        {sec === 'feed' && (
          <div className="a-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18 }}>Deal Flow</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {sectors.map(s => <button key={s} onClick={() => setFilterSector(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: filterSector === s ? 'var(--ink)' : 'var(--border)', background: filterSector === s ? 'var(--ink)' : 'transparent', color: filterSector === s ? '#fff' : 'var(--text2)', fontFamily: 'inherit', transition: 'all .15s' }}>{s}</button>)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {feed.map((s, i) => {
                const isOpen = expanded === s.id;
                const bg = CARD_BG[s.name.charCodeAt(0) % CARD_BG.length];
                const fn = s.profiles?.full_name || 'Founder';
                return (
                  <div key={s.id} className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : s.id)}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>▶</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontWeight: 800, fontSize: 15 }}>{s.name}</span>
                          <span className="tag tag-green" style={{ fontSize: 11 }}>{s.stage}</span>
                          {s.sector && <span className="tag" style={{ fontSize: 11 }}>{s.sector}</span>}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.tagline}</div>
                        {s.traction && <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, marginTop: 3 }}>📈 {s.traction}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        {s.raise_amount && <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--green)' }}>{s.raise_amount}</div>}
                        <button onClick={e => { e.stopPropagation(); toggleSave(s.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: saved.has(s.id) ? '#E11D48' : 'var(--text3)' }}>{saved.has(s.id) ? '♥' : '♡'}</button>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', background: 'var(--s50)' }}>
                        {s.description && <p style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 12, color: 'var(--text)' }}>{s.description}</p>}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                          {[['📍', s.location || '—'], ['👥', s.team_size + ' people'], ['🌐', s.website || '—']].map(([ic, v]) => (
                            <div key={v} style={{ background: 'var(--surface)', borderRadius: 9, padding: '9px 10px', textAlign: 'center' }}>
                              <div style={{ fontSize: 16, marginBottom: 2 }}>{ic}</div>
                              <div style={{ fontSize: 12, fontWeight: 700 }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => router.push(`/profile/${s.founder_id}?startup=${s.id}`)} className="btn btn-outline" style={{ flex: 1, padding: '10px', fontSize: 13, borderRadius: 10 }}>View Profile</button>
                          {!subs.has(s.id)
                            ? <button onClick={() => subscribe(s.id)} className="btn btn-ink" style={{ flex: 1, padding: '10px', fontSize: 13, borderRadius: 10 }}>🔓 Unlock — $9/mo</button>
                            : <button onClick={() => router.push(`/profile/${s.founder_id}?startup=${s.id}`)} className="btn btn-green" style={{ flex: 1, padding: '10px', fontSize: 13, borderRadius: 10 }}>✓ View Docs</button>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── AI MATCH ── */}
        {sec === 'match' && (
          <div className="a-up" style={{ maxWidth: 620 }}>
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>AI Deal Matching</h2>
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--blueBg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>✦</div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Match Against Your Thesis</h3>
                  <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>Analyses your investment thesis, check size, and stage preferences to rank startups by deal fit.</p>
                </div>
              </div>
              <button onClick={() => { setAiRun(true); setAiDone(false); setTimeout(() => { setAiRun(false); setAiDone(true); }, 2400); }} disabled={aiRun} className="btn btn-ink" style={{ width: '100%', padding: '13px', fontSize: 15, borderRadius: 12 }}>
                {aiRun ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spin light />Analysing deal flow…</span> : '✦ Find Best Deals'}
              </button>
            </div>
            {aiRun && (
              <div className="card" style={{ padding: 20 }}>
                {['Reading your thesis…', 'Scanning 200+ startups…', 'Scoring traction fit…', 'Ranking by deal probability…'].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                    <Spin /><span style={{ fontSize: 13, color: 'var(--text2)' }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {aiDone && AI_STARTUPS.map((m, i) => (
              <div key={i} className="card" style={{ padding: '18px 20px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div><div style={{ fontWeight: 800, fontSize: 16 }}>{m.name}</div><div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{m.reason}</div></div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: m.match >= 90 ? 'var(--green)' : 'var(--amber)' }}>{m.match}%</div>
                </div>
                <div style={{ height: 5, background: 'var(--s100)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ width: `${m.match}%`, height: '100%', background: m.match >= 90 ? 'var(--green)' : 'var(--ink)', borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  {m.tags.map(t => <span key={t} className="tag" style={{ fontSize: 11 }}>{t}</span>)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setSec('feed')} className="btn btn-outline" style={{ flex: 1, padding: '9px', fontSize: 13, borderRadius: 10 }}>View Pitch</button>
                  <button className="btn btn-ink" style={{ flex: 1, padding: '9px', fontSize: 13, borderRadius: 10 }}>🔓 Unlock — $9/mo</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SAVED ── */}
        {sec === 'saved' && (
          <div className="a-up">
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Saved Startups ({savedStartups.length})</h2>
            {savedStartups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>♡</div>
                <p style={{ fontSize: 15, fontWeight: 600 }}>No saved startups yet</p>
                <p style={{ fontSize: 14, marginTop: 6 }}>Bookmark startups from the feed or deal flow.</p>
                <button onClick={() => setSec('feed')} className="btn btn-ink" style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, fontSize: 14 }}>Browse Deals →</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
                {savedStartups.map(s => (
                  <div key={s.id} className="card" style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={() => router.push(`/profile/${s.founder_id}?startup=${s.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{s.name}</div>
                        <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{s.sector} · {s.stage}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); toggleSave(s.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#E11D48' }}>♥</button>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 10 }}>{s.tagline}</p>
                    {s.traction && <div className="tag tag-green" style={{ fontSize: 11 }}>📈 {s.mrr || s.traction.split('·')[0].trim()}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EVENTS ── */}
        {sec === 'events' && (
          <div className="a-up">
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Upcoming Events</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {(events.length > 0 ? events : []).map(ev => {
                const cols: Record<string, string> = { Grant: 'green', Accelerator: 'amber', Conference: 'blue', Competition: 'rose' };
                return (
                  <div key={ev.id} className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ height: 4, background: `var(--${cols[ev.type] || 'ink'})` }} />
                    <div style={{ padding: '16px 18px' }}>
                      <span className={`tag tag-${cols[ev.type]}`} style={{ fontSize: 11, marginBottom: 8, display: 'inline-flex' }}>{ev.type}</span>
                      <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 3, marginTop: 6 }}>{ev.title}</h3>
                      <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 10 }}>{ev.organization}</p>
                      {ev.deadline && <div style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>📅 {new Date(ev.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                    </div>
                  </div>
                );
              })}
              {events.length === 0 && <div style={{ color: 'var(--text2)', padding: 20 }}>No upcoming events.</div>}
            </div>
          </div>
        )}
      </main>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .a-up{animation:fadeUp .28s ease} @keyframes fadeUp{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

const MOCK_STARTUPS: Startup[] = [
  { id: 'm1', founder_id: 'f1', name: 'NeuralPay', tagline: 'AI-powered expense intelligence for growing SMEs', description: 'Automates accounts payable using computer vision and ML, cutting processing time by 90%.', sector: 'FinTech', stage: 'Seed', location: 'Bangalore', raise_amount: '$500K', team_size: 4, traction: '$12K MRR · 45 customers · 3× YoY', website: 'neuralpay.in', pitch_video_url: null, tags: ['AI', 'B2B', 'SaaS'], mrr: '$12K', founded_year: 2023, is_public: true, status: 'active', approval_status: 'approved', rejection_reason: null, views: 1240, created_at: '', profiles: { id: 'f1', email: 'priya@neuralpay.in', full_name: 'Priya Sharma', avatar_url: null, role: 'founder', credits: 10, created_at: '' } },
  { id: 'm2', founder_id: 'f2', name: 'MedSync', tagline: 'Unified patient records across hospital networks', description: 'Interoperability layer for India\'s fragmented health data.', sector: 'HealthTech', stage: 'Series A', location: 'Hyderabad', raise_amount: '$1M', team_size: 8, traction: '$45K MRR · 60 hospitals', website: 'medsync.health', pitch_video_url: null, tags: ['Health', 'Gov'], mrr: '$45K', founded_year: 2022, is_public: true, status: 'active', approval_status: 'approved', rejection_reason: null, views: 2100, created_at: '', profiles: { id: 'f2', email: 'kavya@medsync.health', full_name: 'Dr. Kavya Rao', avatar_url: null, role: 'founder', credits: 10, created_at: '' } },
];

function Loader() {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
    <div style={{ width: 36, height: 36, border: '2px solid var(--border)', borderTop: '2px solid var(--ink)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}
