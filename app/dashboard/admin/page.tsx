'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getSession, type Profile, type Startup, type AppEvent } from '@/lib/supabase';
import { SideNav, BottomNav, StatCard } from '@/components/Nav';

function Av({ name, sz = 34 }: { name: string; sz?: number }) {
  const cs = ['#D4C5F9', '#C5D4F9', '#C5F9D4', '#F9D4C5', '#F9C5D4'];
  return <div style={{ width: sz, height: sz, borderRadius: sz / 3, background: cs[name.charCodeAt(0) % cs.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: sz * .38, color: 'var(--ink)', flexShrink: 0 }}>{(name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>;
}

export default function AdminDash() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [sec, setSec] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [evForm, setEvForm] = useState({ title: '', type: 'Competition', organization: '', prize: '', deadline: '', location: '', description: '' });
  const [savingEv, setSavingEv] = useState(false);

  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function init() {
    const session = await getSession(); const user = session?.user ?? null;
    if (!user) { router.push('/'); return; }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (p?.role !== 'admin') { router.push('/'); return; }
    setProfile(p);
    const [{ data: us }, { data: ss }, { data: ev }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('startups').select('*, profiles(full_name,email)').order('created_at', { ascending: false }).limit(50),
      supabase.from('events').select('*').order('deadline', { ascending: true }),
    ]);
    setUsers(us || []); setStartups(ss || []); setEvents(ev || []);
    setLoading(false);
  }

  async function approveStartup(id: string) {
    await supabase.from('startups').update({ approval_status: 'approved', approved_at: new Date().toISOString() }).eq('id', id);
    setStartups(p => p.map(s => s.id === id ? { ...s, approval_status: 'approved' } : s));
    flash('✓ Startup approved — now live in feed');
  }

  async function rejectStartup(id: string, reason: string) {
    await supabase.from('startups').update({ approval_status: 'rejected', rejection_reason: reason }).eq('id', id);
    setStartups(p => p.map(s => s.id === id ? { ...s, approval_status: 'rejected', rejection_reason: reason } : s));
    setRejectId(null); setRejectReason('');
    flash('✗ Startup rejected with reason');
  }

  async function changeRole(uid: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', uid);
    setUsers(p => p.map(u => u.id === uid ? { ...u, role: role as Profile['role'] } : u));
    flash(`Role updated to ${role}`);
  }

  async function deleteStartup(id: string) {
    if (!confirm('Delete this startup? This cannot be undone.')) return;
    await supabase.from('startups').delete().eq('id', id);
    setStartups(p => p.filter(s => s.id !== id));
    flash('Startup deleted');
  }

  async function saveEvent() {
    setSavingEv(true);
    await supabase.from('events').insert([{ ...evForm, tags: [], is_urgent: false }]);
    setSavingEv(false); setShowEventForm(false);
    setEvForm({ title: '', type: 'Competition', organization: '', prize: '', deadline: '', location: '', description: '' });
    init();
  }

  function flash(msg: string) { setActionMsg(msg); setTimeout(() => setActionMsg(''), 2800); }

  if (loading) return <Loader />;

  const pending = startups.filter(s => s.approval_status === 'pending');
  const approved = startups.filter(s => s.approval_status === 'approved');
  const founders = users.filter(u => u.role === 'founder');
  const investors = users.filter(u => u.role === 'investor');

  const statusCfg = {
    pending: { label: '⏳ Pending', cls: 'tag-amber' },
    approved: { label: '✓ Approved', cls: 'tag-green' },
    rejected: { label: '✗ Rejected', cls: 'tag-rose' },
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <SideNav role="admin" userName={profile?.full_name || 'Admin'} section={sec} onSection={setSec} />
      <BottomNav role="admin" section={sec} onSection={setSec} />

      <main className="maincontent" style={{ flex: 1, marginLeft: 220, padding: '32px 28px 100px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.5px', marginBottom: 4 }}>
            {sec === 'overview' ? 'Admin Dashboard' : sec.charAt(0).toUpperCase() + sec.slice(1)}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>PitchPilot Platform Management</p>
        </div>

        {/* Toast */}
        {actionMsg && (
          <div style={{ position: 'fixed', top: 20, right: 20, background: 'var(--ink)', color: '#fff', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, zIndex: 999, boxShadow: 'var(--shadow3)', animation: 'fadeUp .25s ease' }}>
            {actionMsg}
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {sec === 'overview' && (
          <div className="a-up">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 24 }}>
              <StatCard label="Total Users" value={users.length} sub={`${founders.length} founders · ${investors.length} investors`} icon="👥" color="blue" />
              <StatCard label="Startups" value={startups.length} sub={`${approved.length} approved`} icon="🚀" color="green" />
              <StatCard label="Pending Review" value={pending.length} sub="need approval" icon="⏳" color="amber" />
              <StatCard label="Events" value={events.length} sub="in hub" icon="📅" />
            </div>
            {pending.length > 0 && (
              <div style={{ background: 'var(--amberBg)', border: '1px solid var(--amberBorder)', borderRadius: 13, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--amber)', marginBottom: 6 }}>⏳ {pending.length} startup{pending.length > 1 ? 's' : ''} awaiting approval</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Review each startup before it appears in the investor feed.</div>
                <button onClick={() => setSec('approvals')} className="btn btn-ink" style={{ fontSize: 13, padding: '8px 20px', borderRadius: 9 }}>Review now →</button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Recent Signups</h3>
                {users.slice(0, 5).map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <Av name={u.full_name || 'U'} sz={30} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{u.full_name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email}</div>
                    </div>
                    <span className={`tag tag-${u.role === 'admin' ? 'rose' : u.role === 'investor' ? 'blue' : ''}`} style={{ fontSize: 10 }}>{u.role}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Platform Stats</h3>
                {[['Approval rate', `${approved.length}/${startups.length}`, 'var(--green)'], ['Avg team size', '5.2', 'var(--blue)'], ['Active investors', String(investors.length), 'var(--amber)'], ['Events live', String(events.length), 'var(--ink)']].map(([k, v, col]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{k}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: col }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── APPROVALS ── */}
        {sec === 'approvals' && (
          <div className="a-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18 }}>Startup Approvals</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="tag tag-amber" style={{ fontSize: 12 }}>⏳ {pending.length} pending</span>
                <span className="tag tag-green" style={{ fontSize: 12 }}>✓ {approved.length} approved</span>
              </div>
            </div>

            {startups.map(s => {
              const cfg = statusCfg[s.approval_status];
              const fn = s.profiles?.full_name || '—';
              return (
                <div key={s.id} className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: 16 }}>{s.name}</span>
                        <span className={`tag ${cfg.cls}`} style={{ fontSize: 11 }}>{cfg.label}</span>
                        {s.stage && <span className="tag" style={{ fontSize: 11 }}>{s.stage}</span>}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 8 }}>{s.tagline}</p>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>👤 {fn}</span>
                        {s.sector && <span style={{ fontSize: 12, color: 'var(--text3)' }}>🏷 {s.sector}</span>}
                        {s.raise_amount && <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>💰 {s.raise_amount}</span>}
                        {s.traction && <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>📈 {s.traction}</span>}
                      </div>
                      {s.rejection_reason && (
                        <div style={{ marginTop: 8, padding: '7px 10px', background: 'var(--roseBg)', borderRadius: 7, fontSize: 12, color: 'var(--rose)' }}>
                          Rejection reason: {s.rejection_reason}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                      <button onClick={() => router.push(`/profile/${s.founder_id}?startup=${s.id}`)} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8 }}>View Profile</button>
                      {s.approval_status !== 'approved' && (
                        <button onClick={() => approveStartup(s.id)} className="btn btn-green" style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8 }}>✓ Approve</button>
                      )}
                      {s.approval_status !== 'rejected' && (
                        <button onClick={() => setRejectId(s.id)} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8, color: 'var(--rose)', borderColor: 'var(--roseBorder)' }}>✗ Reject</button>
                      )}
                      <button onClick={() => deleteStartup(s.id)} style={{ padding: '7px 14px', fontSize: 11, borderRadius: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {startups.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <p style={{ fontSize: 15, fontWeight: 600 }}>All caught up!</p>
                <p style={{ fontSize: 14, marginTop: 6 }}>No startups to review.</p>
              </div>
            )}
          </div>
        )}

        {/* ── USERS ── */}
        {sec === 'users' && (
          <div className="a-up">
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Users ({users.length})</h2>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="tbl">
                <thead>
                  <tr><th>User</th><th>Email</th><th>Role</th><th>Credits</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Av name={u.full_name || 'U'} sz={30} /><span style={{ fontWeight: 600 }}>{u.full_name || '—'}</span></div></td>
                      <td style={{ color: 'var(--text2)' }}>{u.email}</td>
                      <td>
                        <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', color: 'var(--text)' }}>
                          {['founder', 'investor', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td style={{ fontWeight: 700 }}>{u.credits}</td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => router.push(`/profile/${u.id}`)} style={{ padding: '5px 12px', borderRadius: 7, background: 'var(--s50)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── EVENTS ── */}
        {sec === 'events' && (
          <div className="a-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18 }}>Events Hub ({events.length})</h2>
              <button onClick={() => setShowEventForm(true)} className="btn btn-ink" style={{ fontSize: 13, padding: '8px 18px', borderRadius: 9 }}>+ Add Event</button>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="tbl">
                <thead><tr><th>Event</th><th>Type</th><th>Organization</th><th>Prize</th><th>Deadline</th><th>Actions</th></tr></thead>
                <tbody>
                  {events.map(ev => {
                    const cols: Record<string, string> = { Grant: 'green', Accelerator: 'amber', Conference: 'blue', Competition: 'rose' };
                    return (
                      <tr key={ev.id}>
                        <td><span style={{ fontWeight: 700 }}>{ev.title}</span></td>
                        <td><span className={`tag tag-${cols[ev.type]}`} style={{ fontSize: 11 }}>{ev.type}</span></td>
                        <td style={{ color: 'var(--text2)' }}>{ev.organization || '—'}</td>
                        <td style={{ color: 'var(--green)', fontWeight: 700 }}>{ev.prize || '—'}</td>
                        <td style={{ color: 'var(--amber)', fontSize: 12 }}>{ev.deadline ? new Date(ev.deadline).toLocaleDateString() : '—'}</td>
                        <td>
                          <button onClick={async () => { await supabase.from('events').delete().eq('id', ev.id); setEvents(p => p.filter(e => e.id !== ev.id)); flash('Event deleted'); }} style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--roseBg)', border: '1px solid var(--roseBorder)', color: 'var(--rose)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {events.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>No events yet. Add your first event.</div>}
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {sec === 'analytics' && (
          <div className="a-up">
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Platform Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 24 }}>
              <StatCard label="Total Revenue" value="$0" sub="MRR (pre-launch)" icon="💰" color="green" />
              <StatCard label="CAC" value="$12" sub="target" icon="🎯" color="blue" />
              <StatCard label="LTV" value="$1,440" sub="$60 ARPU × 24mo" icon="📈" />
              <StatCard label="LTV:CAC" value="120:1" sub="exceptional" icon="✦" color="amber" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>5-Year Revenue Forecast</h3>
                {[['Year 1', '$350K', 35], ['Year 2', '$2.0M', 50], ['Year 3', '$7.6M', 65], ['Year 4', '$18.5M', 80], ['Year 5', '$36M', 100]].map(([y, v, pct]) => (
                  <div key={String(y)} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text2)' }}>{y}</span>
                      <span style={{ fontWeight: 800, color: 'var(--green)' }}>{v}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--s100)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>User Distribution</h3>
                {[['Founders', founders.length, 'var(--ink)'], ['Investors', investors.length, 'var(--blue)'], ['Admins', users.filter(u => u.role === 'admin').length, 'var(--rose)']].map(([k, v, col]) => (
                  <div key={String(k)} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text2)' }}>{k}</span>
                      <span style={{ fontWeight: 800, color: col as string }}>{v}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--s100)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min((Number(v) / Math.max(users.length, 1)) * 100, 100)}%`, height: '100%', background: col as string, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Reject modal */}
      {rejectId && (
        <div className="modal-bg" onClick={() => setRejectId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 14 }}>Reject Startup</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>Please provide a reason so the founder can improve and resubmit.</p>
            <textarea className="input" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Missing traction metrics, incomplete team info…" rows={3} style={{ resize: 'vertical', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRejectId(null)} className="btn btn-ghost" style={{ flex: 1, padding: '12px' }}>Cancel</button>
              <button onClick={() => rejectStartup(rejectId, rejectReason)} className="btn btn-ink" style={{ flex: 2, padding: '12px', fontSize: 14 }} disabled={!rejectReason.trim()}>Send Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event modal */}
      {showEventForm && (
        <div className="modal-bg" onClick={() => setShowEventForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: 18 }}>Add Event</h3>
              <button onClick={() => setShowEventForm(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text2)' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 13 }}>
              {[['title', 'Event Title *'], ['organization', 'Organisation'], ['prize', 'Prize / Grant Amount'], ['deadline', 'Deadline'], ['location', 'Location']].map(([k, l]) => (
                <div key={k}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .7 }}>{l}</label>
                  <input className="input" type={k === 'deadline' ? 'date' : 'text'} value={(evForm as Record<string, string>)[k]} onChange={e => setEvForm(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .7 }}>Type</label>
                <select className="input" value={evForm.type} onChange={e => setEvForm(p => ({ ...p, type: e.target.value }))} style={{ background: 'var(--surface)' }}>
                  {['Competition', 'Grant', 'Accelerator', 'Conference'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowEventForm(false)} className="btn btn-ghost" style={{ flex: 1, padding: '12px' }}>Cancel</button>
              <button onClick={saveEvent} disabled={savingEv || !evForm.title} className="btn btn-ink" style={{ flex: 2, padding: '12px', fontSize: 15 }}>
                {savingEv ? 'Saving…' : 'Add Event →'}
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
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
    <div style={{ width: 36, height: 36, border: '2px solid var(--border)', borderTop: '2px solid var(--ink)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}
