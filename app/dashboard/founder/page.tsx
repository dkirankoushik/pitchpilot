'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Profile, type Startup, type AppEvent } from '@/lib/supabase';
import { SideNav, BottomNav, StatCard } from '@/components/Nav';

const SECTORS = ['FinTech', 'HealthTech', 'EdTech', 'CleanTech', 'SaaS', 'AI/ML', 'E-Commerce', 'DeepTech'];
const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B'];
const AI_RESULTS = [
  { firm: 'Sequoia Surge', score: 94, focus: 'FinTech · Seed · India', match: ['FinTech thesis', 'Seed stage', 'India-first', 'Traction match'] },
  { firm: 'Accel India', score: 88, focus: 'B2B SaaS · Seed–A', match: ['B2B model', 'Seed-Series A', 'Tech-enabled', 'Team credentials'] },
  { firm: 'Blume Ventures', score: 81, focus: 'Early Stage · India', match: ['Early stage', 'India-first', 'Check size', 'Market fit'] },
];

function Spin({ light }: { light?: boolean }) {
  return <span style={{ width: 16, height: 16, border: `2px solid ${light ? 'rgba(255,255,255,.3)' : 'rgba(28,26,23,.15)'}`, borderTop: `2px solid ${light ? '#fff' : 'var(--ink)'}`, borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />;
}

export default function FounderDash() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [invites, setInvites] = useState<{ id: string; status: string; created_at: string; profiles?: { full_name: string | null } }[]>([]);
  const [sec, setSec] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiRun, setAiRun] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [reg, setReg] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: '', tagline: '', description: '', sector: '', stage: '', location: '', raise_amount: '', traction: '', website: '', mrr: '', founded_year: '' });

  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    const [{ data: p }, { data: s }, { data: ev }, { data: inv }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('startups').select('*').eq('founder_id', user.id).single(),
      supabase.from('events').select('*').order('deadline', { ascending: true }).limit(12),
      supabase.from('pitch_invites').select('*, profiles(full_name)').eq('founder_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    setProfile(p); setStartup(s); setEvents(ev || []); setInvites(inv || []);
    if (s) setForm({ name: s.name || '', tagline: s.tagline || '', description: s.description || '', sector: s.sector || '', stage: s.stage || '', location: s.location || '', raise_amount: s.raise_amount || '', traction: s.traction || '', website: s.website || '', mrr: s.mrr || '', founded_year: String(s.founded_year || '') });
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { ...form, founder_id: user.id, is_public: true, status: 'active' as const, approval_status: 'pending' as const, founded_year: form.founded_year ? parseInt(form.founded_year) : null };
    if (startup?.id) await supabase.from('startups').update(payload).eq('id', startup.id);
    else await supabase.from('startups').insert([payload]);
    setShowForm(false); setSaving(false); init();
  }

  if (loading) return <Loader />;

  const pending = invites.filter(i => i.status === 'pending').length;
  const interested = invites.filter(i => i.status === 'interested').length;
  const connected = invites.filter(i => i.status === 'connected').length;
  const statusColor: Record<string, string> = { pending: '', viewed: 'blue', interested: 'amber', passed: 'rose', connected: 'green' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <SideNav role="founder" userName={profile?.full_name || 'Founder'} credits={profile?.credits} section={sec} onSection={setSec} />
      <BottomNav role="founder" section={sec} onSection={setSec} />

      <main className="maincontent" style={{ flex: 1, marginLeft: 220, padding: '32px 28px 100px', maxWidth: '100%' }}>
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 4 }}>
            {sec === 'overview' ? `Hello, ${profile?.full_name?.split(' ')[0] || 'Founder'} 👋` : sec.charAt(0).toUpperCase() + sec.slice(1)}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            {startup ? `${startup.name} · ${startup.stage} · ${startup.sector} · ${startup.approval_status === 'pending' ? '⏳ Under Review' : startup.approval_status === 'approved' ? '✓ Live' : '✗ Rejected'}` : 'Create your startup profile to start pitching'}
          </p>
        </div>

        {/* ── OVERVIEW ── */}
        {sec === 'overview' && (
          <div className="a-up">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 24 }}>
              <StatCard label="Pitch Views" value={startup?.views || 0} sub="total" icon="👁" color="blue" />
              <StatCard label="Invites Sent" value={invites.length} sub={`${interested} interested`} icon="📨" />
              <StatCard label="Connected" value={connected} sub="via outreach" icon="🤝" color="green" />
              <StatCard label="Subscribers" value={0} sub="paying" icon="🔓" color="amber" />
            </div>

            {startup?.approval_status === 'pending' && (
              <div style={{ background: 'var(--amberBg)', border: '1px solid var(--amberBorder)', borderRadius: 13, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>⏳</span>
                <div><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--amber)' }}>Profile under review</div><div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2, lineHeight: 1.5 }}>Our team is reviewing your startup. You will be notified once approved to appear in the investor feed.</div></div>
              </div>
            )}
            {startup?.approval_status === 'rejected' && (
              <div style={{ background: 'var(--roseBg)', border: '1px solid var(--roseBorder)', borderRadius: 13, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--rose)', marginBottom: 4 }}>Profile needs updates</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{startup.rejection_reason || 'Please review our guidelines and resubmit.'}</div>
                <button onClick={() => setShowForm(true)} className="btn btn-ink" style={{ marginTop: 10, fontSize: 13, padding: '7px 18px', borderRadius: 9 }}>Edit & Resubmit</button>
              </div>
            )}

            {!startup ? (
              <div style={{ background: 'var(--surface)', border: '2px dashed var(--borderStrong)', borderRadius: 18, padding: '56px 32px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>🚀</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, letterSpacing: '-.3px' }}>Create Your Startup Profile</h3>
                <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>Set up your profile, submit for admin review, then get discovered by top investors in the feed.</p>
                <button onClick={() => setShowForm(true)} className="btn btn-ink" style={{ padding: '12px 32px', fontSize: 15, borderRadius: 12 }}>Create profile →</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 17 }}>{startup.name}</h3>
                    <button onClick={() => setShowForm(true)} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7 }}>Edit</button>
                  </div>
                  <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>{startup.tagline}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {([['Sector', startup.sector || ''], ['Stage', startup.stage || ''], ['Location', startup.location || ''], ['Raising', startup.raise_amount || '']] as [string, string][]).map(([k, v]) => (
                      <div key={k} style={{ background: 'var(--surface2)', borderRadius: 9, padding: '9px 11px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .7, marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{v || '—'}</div>
                      </div>
                    ))}
                  </div>
                  {startup.traction && <div style={{ marginTop: 12, background: 'var(--greenBg)', borderRadius: 9, padding: '8px 12px', fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>📈 {startup.traction}</div>}
                </div>

                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Invite Pipeline</h3>
                  {[['Sent', invites.length, '#B8B4AA'], ['Viewed', invites.filter(i => i.status === 'viewed').length, 'var(--blue)'], ['Interested', interested, 'var(--amber)'], ['Connected', connected, 'var(--green)']].map(([k, v, col]) => (
                    <div key={String(k)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text2)', fontWeight: 500 }}>{k}</span>
                          <span style={{ fontWeight: 800 }}>{v}</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--s100)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min((Number(v) / Math.max(invites.length, 1)) * 100, 100)}%`, height: '100%', background: col as string, borderRadius: 2, transition: 'width .8s ease' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PITCHES (feed view) ── */}
        {sec === 'pitches' && (
          <div className="a-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18 }}>Pitch Videos</h2>
              <button onClick={() => router.push('/feed')} className="btn btn-ink" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 9 }}>View in Feed →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
              {[{ t: 'Main Elevator Pitch', d: '2:47', v: startup?.views || 0, bg: '#F0EDE8' }, { t: 'Product Demo', d: '4:12', v: Math.floor((startup?.views || 0) * .3), bg: '#EBF0E8' }, { t: 'Team Introduction', d: '1:55', v: Math.floor((startup?.views || 0) * .5), bg: '#E8EDF0' }].map((vid, i) => (
                <div key={i} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ height: 130, background: vid.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, boxShadow: 'var(--shadow2)' }}>▶</div>
                    <span style={{ position: 'absolute', top: 9, right: 9, background: 'rgba(0,0,0,.5)', color: '#fff', borderRadius: 5, padding: '2px 7px', fontSize: 11, fontFamily: 'monospace' }}>{vid.d}</span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{vid.t}</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12 }}>{vid.v.toLocaleString()} views</div>
                  </div>
                </div>
              ))}
              <div onClick={() => setShowForm(true)} className="card" style={{ minHeight: 190, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)', gap: 8, border: '2px dashed var(--borderStrong)' }}>
                <span style={{ fontSize: 28 }}>+</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Add Video</span>
              </div>
            </div>
          </div>
        )}

        {/* ── AI MATCH ── */}
        {sec === 'match' && (
          <div className="a-up" style={{ maxWidth: 620 }}>
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>AI Investor Matching</h2>
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--s50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>✦</div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Find Your Best Investors</h3>
                  <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>Analyzes sector, stage, traction, and 30+ signals to surface investors most likely to respond to your pitch.</p>
                </div>
              </div>
              <button onClick={() => { setAiRun(true); setAiDone(false); setTimeout(() => { setAiRun(false); setAiDone(true); }, 2600); }} disabled={aiRun} className="btn btn-ink" style={{ width: '100%', padding: '13px', fontSize: 15, borderRadius: 12 }}>
                {aiRun ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spin light /> Analysing {startup?.name || 'your startup'}…</span> : '✦ Run AI Match'}
              </button>
            </div>
            {aiRun && (
              <div className="card" style={{ padding: 20 }}>
                {['Reading pitch content…', 'Mapping sector alignment…', 'Scoring traction signals…', 'Ranking by response probability…'].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                    <Spin /><span style={{ fontSize: 13, color: 'var(--text2)' }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {aiDone && AI_RESULTS.map((m, i) => (
              <div key={i} className="card" style={{ padding: '18px 20px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div><div style={{ fontWeight: 800, fontSize: 16 }}>{m.firm}</div><div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{m.focus}</div></div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: m.score >= 90 ? 'var(--green)' : m.score >= 80 ? 'var(--amber)' : 'var(--text)' }}>{m.score}%</div>
                </div>
                <div style={{ height: 5, background: 'var(--s100)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ width: `${m.score}%`, height: '100%', background: m.score >= 90 ? 'var(--green)' : 'var(--ink)', borderRadius: 3, transition: 'width .8s ease' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
                  {m.match.map(r => <div key={r} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 5 }}><span style={{ color: 'var(--green)' }}>✓</span>{r}</div>)}
                </div>
                <button className="btn btn-ink" style={{ width: '100%', padding: '10px', fontSize: 13, borderRadius: 10 }}>Send Pitch Invite (1 credit)</button>
              </div>
            ))}
          </div>
        )}

        {/* ── INVITES ── */}
        {sec === 'invites' && (
          <div className="a-up">
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Pitch Invites ({invites.length})</h2>
            {invites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <p style={{ fontSize: 15, fontWeight: 600 }}>No invites yet</p>
                <p style={{ fontSize: 14, marginTop: 6 }}>Run AI Match to find and reach investors.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {invites.map(inv => (
                  <div key={inv.id} className="card" style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div><div style={{ fontWeight: 700 }}>{inv.profiles?.full_name || 'Investor'}</div><div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{new Date(inv.created_at).toLocaleDateString()}</div></div>
                    <span className={`tag tag-${statusColor[inv.status]}`} style={{ fontSize: 12, textTransform: 'capitalize' }}>{inv.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EVENTS ── */}
        {sec === 'events' && (
          <div className="a-up">
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Events & Grants Hub</h2>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}><div style={{ fontSize: 48, marginBottom: 12 }}>📅</div><p>No events yet.</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                {events.map(ev => {
                  const cols: Record<string, string> = { Grant: 'green', Accelerator: 'amber', Conference: 'blue', Competition: 'rose' };
                  return (
                    <div key={ev.id} className="card" style={{ overflow: 'hidden' }}>
                      <div style={{ height: 4, background: `var(--${cols[ev.type] || 'ink'})` }} />
                      <div style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span className={`tag tag-${cols[ev.type]}`} style={{ fontSize: 11 }}>{ev.type}</span>
                          {ev.is_urgent && <span className="tag tag-rose" style={{ fontSize: 11 }}>⚡ Urgent</span>}
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 3, lineHeight: 1.3 }}>{ev.title}</h3>
                        <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 12 }}>{ev.organization} · {ev.location}</p>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                          {ev.prize && <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .7 }}>Prize</div><div style={{ fontWeight: 800, fontSize: 14, color: 'var(--green)', marginTop: 2 }}>{ev.prize}</div></div>}
                          {ev.deadline && <div><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .7 }}>Deadline</div><div style={{ fontWeight: 800, fontSize: 14, color: 'var(--amber)', marginTop: 2 }}>{new Date(ev.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div></div>}
                        </div>
                        <button onClick={async () => { const { data: { user } } = await supabase.auth.getUser(); if (user) { await supabase.from('event_registrations').upsert({ event_id: ev.id, user_id: user.id }); setReg(p => new Set([...p, ev.id])); } }} className={reg.has(ev.id) ? 'btn btn-outline' : 'btn btn-ink'} style={{ width: '100%', padding: '10px', fontSize: 13, borderRadius: 10 }}>
                          {reg.has(ev.id) ? '✓ Registered' : 'Apply / Register'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit/Create form modal */}
      {showForm && (
        <div className="modal-bg" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontWeight: 800, fontSize: 19 }}>{startup ? 'Edit Startup' : 'Create Startup Profile'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text2)', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 13 }}>
              {[['name', 'Startup Name *'], ['tagline', 'Tagline (one line)'], ['location', 'Location'], ['raise_amount', 'Raising (e.g. $500K)'], ['mrr', 'Current MRR (e.g. $12K)'], ['founded_year', 'Founded Year'], ['website', 'Website URL'], ['traction', 'Traction (e.g. $12K MRR · 45 customers)']].map(([k, l]) => (
                <div key={k}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .7 }}>{l}</label>
                  <input className="input" value={(form as Record<string, string>)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {([['sector', 'Sector', SECTORS], ['stage', 'Stage', STAGES]] as [string, string, string[]][]).map(([k, l, opts]) => (
                  <div key={k}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .7 }}>{l}</label>
                    <select className="input" value={(form as Record<string, string>)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={{ background: 'var(--surface)' }}>
                      <option value="">Select {l}</option>
                      {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .7 }}>Description</label>
                <textarea className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ background: 'var(--amberBg)', border: '1px solid var(--amberBorder)', borderRadius: 9, padding: '10px 14px', marginTop: 14, fontSize: 13, color: 'var(--amber)' }}>
              ⏳ Your profile will be reviewed by the PitchPilot team before going live in the investor feed.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost" style={{ flex: 1, padding: '12px' }}>Cancel</button>
              <button onClick={save} disabled={saving} className="btn btn-ink" style={{ flex: 2, padding: '12px', fontSize: 15 }}>
                {saving ? <Spin light /> : startup ? 'Save Changes' : 'Submit for Review →'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .a-up{animation:fadeUp .28s ease} @keyframes fadeUp{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

function Loader() {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 14 }}>
    <div style={{ width: 36, height: 36, border: '2px solid var(--border)', borderTop: '2px solid var(--ink)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}
