'use client';
import { useState, useEffect } from 'react';
import { supabase, getSession, type Startup } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [pending, setPending] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'queue' | 'analytics' | 'events'>('queue');
  const [rejReason, setRejReason] = useState('');
  const [rejId, setRejId] = useState('');

  useEffect(() => {
    const init = async () => {
      const s = await getSession();
      if (!s) { router.replace('/'); return; }
      const { data: p } = await supabase.from('profiles').select('full_name,email,role').eq('id', s.user.id).single();
      if (p?.role !== 'admin') { router.replace('/feed'); return; }
      setUser({ id: s.user.id, name: p.full_name || '', email: p.email });
      const { data } = await supabase.from('startups').select('*').eq('approval_status', 'pending').order('created_at', { ascending: false });
      setPending(data || []);
      setLoading(false);
    };
    init();
  }, [router]);

  const approve = async (id: string) => {
    await supabase.from('startups').update({ approval_status: 'approved', approved_at: new Date().toISOString(), approved_by: user?.id }).eq('id', id);
    setPending(p => p.filter(x => x.id !== id));
  };

  const reject = async (id: string) => {
    await supabase.from('startups').update({ approval_status: 'rejected', rejection_reason: rejReason }).eq('id', id);
    setPending(p => p.filter(x => x.id !== id));
    setRejId(''); setRejReason('');
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spin" /></div>;

  return (
    <div className="app-shell">
      <Nav user={{ name: user?.name || '', role: 'admin', email: user?.email || '' }} />
      <main className="main-content">
        <div className="top-bar"><span className="top-logo">Admin ⚙️</span></div>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(247,246,243,.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 9 }}>
            {(['queue', 'analytics', 'events'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', color: tab === t ? 'var(--ink)' : 'var(--text2)', borderBottom: '2px solid', borderBottomColor: tab === t ? 'var(--ink)' : 'transparent', textTransform: 'capitalize' }}>
                {t === 'queue' ? `Queue ${pending.length > 0 ? `(${pending.length})` : ''}` : t}
              </button>
            ))}
          </div>

          {tab === 'queue' && (
            <div>
              {pending.length === 0 ? (
                <div className="empty">
                  <div style={{ fontSize: 44, marginBottom: 12 }}>✓</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>All caught up!</div>
                  <div style={{ color: 'var(--text3)', fontSize: 14 }}>No pending approvals</div>
                </div>
              ) : pending.map(s => (
                <div key={s.id} style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{s.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{s.sector} · {s.stage} · {s.location}</div>
                      {s.raise_amount && <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>Raising {s.raise_amount}</div>}
                    </div>
                    <span className="tag tag-amber">Pending</span>
                  </div>
                  {s.description && <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 12 }}>{s.description}</p>}
                  {rejId === s.id ? (
                    <div>
                      <textarea className="input" style={{ minHeight: 70, marginBottom: 8, resize: 'none' }} value={rejReason} onChange={e => setRejReason(e.target.value)} placeholder="Reason for rejection..." />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-danger btn-sm btn-full" onClick={() => reject(s.id)}>Confirm Reject</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setRejId('')}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-green btn-sm" style={{ flex: 1 }} onClick={() => approve(s.id)}>✓ Approve</button>
                      <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => setRejId(s.id)}>✕ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'analytics' && (
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {[['Total Startups', '247', '🚀'], ['Active Investors', '89', '💼'], ['Pitches This Month', '34', '🎬'], ['Connections Made', '156', '🤝']].map(([lb, val, ic]) => (
                  <div key={lb} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{ic}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>{val}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{lb}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'events' && (
            <div style={{ padding: 16 }}>
              <EventManager />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EventManager() {
  const [events, setEvents] = useState<{ id: string; title: string; type: string; organization: string | null; prize: string | null; deadline: string | null }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'Competition', organization: '', prize: '', deadline: '' });

  useEffect(() => {
    supabase.from('events').select('id,title,type,organization,prize,deadline').order('created_at', { ascending: false }).limit(10).then(({ data }) => setEvents(data || []));
  }, []);

  const addEvent = async () => {
    const { data } = await supabase.from('events').insert([{ ...form, tags: [] }]).select().single();
    if (data) { setEvents(e => [data, ...e]); setShowForm(false); setForm({ title: '', type: 'Competition', organization: '', prize: '', deadline: '' }); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Events & Programs</div>
        <button className="btn btn-ink btn-sm" onClick={() => setShowForm(!showForm)}>+ Add</button>
      </div>
      {showForm && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          {[['Title', 'title', 'text'], ['Organization', 'organization', 'text'], ['Prize', 'prize', 'text']].map(([lb, k]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <label className="label">{lb}</label>
              <input className="input" value={(form as Record<string, string>)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div style={{ marginBottom: 10 }}>
            <label className="label">Type</label>
            <select className="input select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {['Competition', 'Grant', 'Accelerator', 'Conference'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ink btn-sm btn-full" onClick={addEvent}>Add Event</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      {events.map(ev => (
        <div key={ev.id} style={{ display: 'flex', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>{ev.type === 'Competition' ? '🏆' : ev.type === 'Grant' ? '💰' : ev.type === 'Accelerator' ? '🚀' : '🎤'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{ev.organization} · {ev.type}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
