'use client';
import { useState, useEffect } from 'react';
import { supabase, getSession, type Startup, type AppEvent } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const EMPTY_FORM = { name: '', tagline: '', description: '', sector: '', stage: '', location: '', raise_amount: '', website: '', traction: '', mrr: '', team_size: 1, founded_year: '' };

export default function FounderDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reg, setReg] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'pitch' | 'events'>('overview');

  useEffect(() => {
    const init = async () => {
      const session = await getSession();
      if (!session) { router.replace('/'); return; }
      const { data: p } = await supabase.from('profiles').select('full_name,email,role').eq('id', session.user.id).single();
      if (p?.role === 'investor') { router.replace('/dashboard/investor'); return; }
      if (p?.role === 'admin') { router.replace('/dashboard/admin'); return; }
      setUser({ id: session.user.id, name: p?.full_name || '', email: p?.email || session.user.email || '' });
      const [{ data: s }, { data: ev }] = await Promise.all([
        supabase.from('startups').select('*').eq('founder_id', session.user.id).single(),
        supabase.from('events').select('*').order('created_at', { ascending: false }).limit(5)
      ]);
      if (s) { setStartup(s); setForm({ ...EMPTY_FORM, ...s, founded_year: s.founded_year?.toString() || '' }); }
      setEvents(ev || []);
      setLoading(false);
    };
    init();
  }, [router]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = { ...form, founder_id: user.id, is_public: true, status: 'active' as const, approval_status: 'pending' as const, founded_year: form.founded_year ? parseInt(form.founded_year) : null };
    if (startup?.id) await supabase.from('startups').update(payload).eq('id', startup.id);
    else await supabase.from('startups').insert([payload]);
    const { data } = await supabase.from('startups').select('*').eq('founder_id', user.id).single();
    if (data) setStartup(data);
    setShowForm(false); setSaving(false);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spin" /></div>;

  const statusColor: Record<string, string> = { approved: 'tag-green', pending: 'tag-amber', rejected: 'tag-rose' };

  return (
    <div className="app-shell">
      <Nav user={{ name: user?.name || '', role: 'founder', email: user?.email || '' }} />
      <main className="main-content">
        <div className="top-bar">
          <span className="top-logo">Dashboard</span>
          <button className="btn btn-ink btn-sm" onClick={() => setShowForm(true)} style={{ padding: '7px 14px', fontSize: 13 }}>+ Pitch</button>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 9, background: 'rgba(247,246,243,.95)', backdropFilter: 'blur(12px)' }}>
            {(['overview', 'pitch', 'events'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ flex: 1, padding: '12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', color: activeTab === t ? 'var(--ink)' : 'var(--text2)', borderBottom: '2px solid', borderBottomColor: activeTab === t ? 'var(--ink)' : 'transparent', transition: 'all .12s', textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div style={{ padding: 16 }}>
              {/* Greeting */}
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>Hey, {user?.name?.split(' ')[0] || 'Founder'} 👋</h2>
                <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>{startup ? `${startup.name} · ${startup.approval_status}` : 'Submit your first pitch to get started'}</p>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
                {[['👀', 'Views', '1,284'], ['♥', 'Likes', '284'], ['💬', 'Comments', '47'], ['✉', 'Invites', '12']].map(([ic, lb, val]) => (
                  <div key={lb} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 24 }}>{ic}</span>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{val}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{lb}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Startup status */}
              {startup ? (
                <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{startup.name}</div>
                      <div style={{ color: 'var(--text2)', fontSize: 13 }}>{startup.sector} · {startup.stage}</div>
                    </div>
                    <span className={`tag ${statusColor[startup.approval_status] || 'tag'}`}>{startup.approval_status}</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 12 }}>{startup.tagline}</div>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowForm(true)}>Edit pitch</button>
                </div>
              ) : (
                <div style={{ background: 'var(--greenBg)', border: '1px solid var(--greenBorder)', borderRadius: 14, padding: 18, marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🚀</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Submit Your First Pitch</div>
                  <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 14 }}>Create your startup profile and start connecting with investors</div>
                  <button className="btn btn-green btn-sm" onClick={() => setShowForm(true)}>Create pitch →</button>
                </div>
              )}
            </div>
          )}

          {/* PITCH TAB */}
          {activeTab === 'pitch' && (
            <div style={{ padding: 16 }}>
              {startup ? (
                <>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ aspectRatio: '16/9', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff' }}>▶</div>
                      <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>Upload pitch video</span>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{startup.name}</div>
                      <div style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.5 }}>{startup.description || startup.tagline}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        <span className="tag tag-green">{startup.stage}</span>
                        <span className="tag">{startup.sector}</span>
                        {startup.raise_amount && <span className="tag">Raising {startup.raise_amount}</span>}
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-outline btn-full" onClick={() => setShowForm(true)}>✏️ Edit pitch details</button>
                </>
              ) : (
                <div className="empty">
                  <div className="empty-ic">🎬</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No pitch yet</div>
                  <div style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 16 }}>Create your startup pitch to appear in the feed</div>
                  <button className="btn btn-ink" onClick={() => setShowForm(true)}>Create pitch</button>
                </div>
              )}
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div>
              {events.length === 0 ? (
                <div className="empty"><div className="empty-ic">📅</div><div style={{ fontWeight: 700 }}>No events yet</div></div>
              ) : events.map(ev => (
                <div key={ev.id} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--s50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {ev.type === 'Competition' ? '🏆' : ev.type === 'Grant' ? '💰' : ev.type === 'Accelerator' ? '🚀' : '🎤'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{ev.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{ev.organization} · {ev.type}</div>
                    {ev.prize && <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 2, fontWeight: 600 }}>{ev.prize}</div>}
                    {ev.deadline && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Deadline: {new Date(ev.deadline).toLocaleDateString()}</div>}
                  </div>
                  <button onClick={async () => {
                    const session = await getSession();
                    const u = session?.user;
                    if (!u) return;
                    await supabase.from('event_registrations').upsert({ event_id: ev.id, user_id: u.id });
                    setReg(p => new Set([...p, ev.id]));
                  }} className={`btn btn-sm ${reg.has(ev.id) ? 'btn-outline' : 'btn-ink'}`} style={{ flexShrink: 0, alignSelf: 'center' }}>
                    {reg.has(ev.id) ? '✓' : 'Apply'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Pitch Form Modal */}
      {showForm && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <div className="modal-handle" />
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>{startup ? 'Edit Pitch' : 'New Pitch'}</h2>
            {[['Company Name *', 'name', 'text', 'e.g. NeuralPay'], ['Tagline *', 'tagline', 'text', 'One line summary'], ['Description', 'description', 'textarea', 'Tell your story...'], ['Sector', 'sector', 'text', 'e.g. FinTech, SaaS'], ['Stage', 'stage', 'text', 'Pre-Seed / Seed / Series A'], ['Location', 'location', 'text', 'e.g. Mumbai, India'], ['Raising', 'raise_amount', 'text', 'e.g. $500K'], ['MRR', 'mrr', 'text', 'e.g. $12K'], ['Website', 'website', 'url', 'https://'], ['Founded Year', 'founded_year', 'number', '2023']].map(([lb, key, type, ph]) => (
              <div key={key} style={{ marginBottom: 13 }}>
                <label className="label">{lb}</label>
                {type === 'textarea' ? (
                  <textarea className="input" style={{ minHeight: 80, resize: 'vertical' }} value={(form as Record<string, string>)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} />
                ) : (
                  <input className="input" type={type} value={(form as Record<string, string>)[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button className="btn btn-ink btn-full" onClick={save} disabled={saving} style={{ padding: '13px' }}>{saving ? 'Saving...' : startup ? 'Update Pitch' : 'Submit Pitch'}</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
