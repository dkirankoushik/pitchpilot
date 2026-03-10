'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Profile, type Startup, type Event } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { StatCard, Badge } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const REVENUE_DATA = [
  { month: 'Oct', revenue: 18, users: 120 },
  { month: 'Nov', revenue: 32, users: 210 },
  { month: 'Dec', revenue: 28, users: 280 },
  { month: 'Jan', revenue: 56, users: 390 },
  { month: 'Feb', revenue: 84, users: 520 },
  { month: 'Mar', revenue: 112, users: 680 },
];

const SECTOR_DATA = [
  { sector: 'FinTech', count: 34 },
  { sector: 'HealthTech', count: 22 },
  { sector: 'SaaS', count: 45 },
  { sector: 'CleanTech', count: 18 },
  { sector: 'EdTech', count: 29 },
  { sector: 'AI/ML', count: 38 },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', type: 'Grant', organization: '', prize: '', deadline: '', location: '', description: '' });
  const [savingEvent, setSavingEvent] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [startupSearch, setStartupSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  useEffect(() => {
    loadData();
    const hash = window.location.hash.replace('#', '');
    if (hash) setActiveSection(hash);
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.replace('#', '');
      if (h) setActiveSection(h);
    });
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    const [{ data: prof }, { data: usersData }, { data: startupsData }, { data: eventsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('startups').select('*, profiles(full_name, email)').order('created_at', { ascending: false }).limit(100),
      supabase.from('events').select('*').order('created_at', { ascending: false }),
    ]);
    setProfile(prof);
    setUsers(usersData || []);
    setStartups(startupsData || []);
    setEvents(eventsData || []);
    setLoading(false);
  }

  async function updateUserRole(userId: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as Profile['role'] } : u));
  }

  async function updateStartupStatus(startupId: string, status: string) {
    await supabase.from('startups').update({ status }).eq('id', startupId);
    setStartups(prev => prev.map(s => s.id === startupId ? { ...s, status: status as Startup['status'] } : s));
  }

  async function deleteStartup(startupId: string) {
    if (!confirm('Delete this startup? This cannot be undone.')) return;
    await supabase.from('startups').delete().eq('id', startupId);
    setStartups(prev => prev.filter(s => s.id !== startupId));
  }

  async function saveEvent() {
    setSavingEvent(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('events').insert({ ...eventForm, created_by: user.id, is_urgent: false, tags: [] });
    setShowEventForm(false);
    setSavingEvent(false);
    loadData();
  }

  async function deleteEvent(eventId: string) {
    if (!confirm('Delete this event?')) return;
    await supabase.from('events').delete().eq('id', eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }

  const founders = users.filter(u => u.role === 'founder');
  const investors = users.filter(u => u.role === 'investor');
  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredStartups = startups.filter(s => s.name.toLowerCase().includes(startupSearch.toLowerCase()));

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg,#060914,#0d0f1e)' }}>
      <Sidebar role="admin" userName={profile?.full_name || 'Admin'} />

      <main style={{ flex: 1, marginLeft: 240, padding: '28px 28px 80px' }} className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.7px' }}>Admin Control Center ⚙️</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 2 }}>Platform management · {users.length} users · {startups.length} startups</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['overview', 'users', 'startups', 'investors', 'events', 'analytics'].map(s => (
              <button key={s} onClick={() => setActiveSection(s)} style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid', textTransform: 'capitalize', borderColor: activeSection === s ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)', background: activeSection === s ? 'rgba(249,115,22,0.12)' : 'transparent', color: activeSection === s ? '#fdba74' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>{s}</button>
            ))}
          </div>
        </div>

        {/* OVERVIEW */}
        {activeSection === 'overview' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
              <StatCard label="Total Users" value={users.length} change="6 new today" icon="👥" color="violet" />
              <StatCard label="Founders" value={founders.length} change="active startups" icon="🚀" color="cyan" />
              <StatCard label="Investors" value={investors.length} change="active" icon="💼" color="emerald" />
              <StatCard label="Startups" value={startups.length} change="live pitches" icon="📊" color="amber" />
              <StatCard label="Events" value={events.length} change="upcoming" icon="📅" color="rose" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* Revenue Chart */}
              <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Monthly Revenue ($K)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={REVENUE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }} />
                    <Bar dataKey="revenue" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* User Growth Chart */}
              <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>User Growth</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={REVENUE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }} />
                    <Line type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#06b6d4', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Users */}
            <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700 }}>Recent Users</h3>
                <button onClick={() => setActiveSection('users')} style={{ fontSize: 13, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {users.slice(0, 5).map((u, i) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: u.role === 'admin' ? 'linear-gradient(135deg,#f97316,#ef4444)' : u.role === 'investor' ? 'linear-gradient(135deg,#0891b2,#7c3aed)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>
                      {u.full_name?.slice(0, 2).toUpperCase() || u.email.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name || u.email}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{u.email}</div>
                    </div>
                    <Badge text={u.role} color={u.role === 'admin' ? 'rose' : u.role === 'investor' ? 'cyan' : 'violet'} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeSection === 'users' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>All Users ({users.length})</h2>
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none', width: 220 }} />
            </div>
            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, background: 'rgba(255,255,255,0.02)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: u.role === 'investor' ? 'linear-gradient(135deg,#0891b2,#7c3aed)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff', flexShrink: 0 }}>
                            {u.full_name?.slice(0, 2).toUpperCase() || '??'}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{u.email}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value)}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 8px', color: '#fff', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
                          <option value="founder">Founder</option>
                          <option value="investor">Investor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => setSelectedUser(u)} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STARTUPS */}
        {activeSection === 'startups' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>All Startups ({startups.length})</h2>
              <input value={startupSearch} onChange={e => setStartupSearch(e.target.value)} placeholder="Search startups..." style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, outline: 'none', width: 220 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
              {filteredStartups.map(s => (
                <div key={s.id} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{s.sector} · {s.stage} · {s.location}</p>
                    </div>
                    <select value={s.status} onChange={e => updateStartupStatus(s.id, e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '4px 8px', color: '#fff', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="funded">Funded</option>
                    </select>
                  </div>
                  {s.tagline && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 12 }}>{s.tagline}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>👁 {s.views.toLocaleString()} views</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Badge text={s.status} color={s.status === 'active' ? 'emerald' : s.status === 'funded' ? 'cyan' : 'gray'} />
                      <button onClick={() => deleteStartup(s.id)} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INVESTORS */}
        {activeSection === 'investors' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Investor Accounts ({investors.length})</h2>
            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Investor', 'Email', 'Credits', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, background: 'rgba(255,255,255,0.02)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {investors.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < investors.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#0891b2,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff' }}>{u.full_name?.slice(0, 2).toUpperCase() || '??'}</div>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{u.email}</td>
                      <td style={{ padding: '14px 16px' }}><span style={{ color: '#a78bfa', fontWeight: 700 }}>{u.credits}</span></td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => setSelectedUser(u)} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', color: '#67e8f9', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EVENTS MANAGEMENT */}
        {activeSection === 'events' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Events & Grants ({events.length})</h2>
              <button onClick={() => setShowEventForm(true)} style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#ef4444)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 13 }}>+ Add Event</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map(ev => (
                <div key={ev.id} style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>{ev.title}</span>
                      <Badge text={ev.type} color={ev.type === 'Grant' ? 'emerald' : ev.type === 'Accelerator' ? 'amber' : ev.type === 'Conference' ? 'cyan' : 'violet'} />
                      {ev.is_urgent && <Badge text="Urgent" color="rose" />}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{ev.organization} · {ev.location} {ev.deadline && `· Deadline: ${new Date(ev.deadline).toLocaleDateString()}`}</div>
                  </div>
                  {ev.prize && <span style={{ color: '#34d399', fontWeight: 700 }}>{ev.prize}</span>}
                  <button onClick={() => deleteEvent(ev.id)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeSection === 'analytics' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Platform Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Startups by Sector</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={SECTOR_DATA} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="sector" type="category" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip contentStyle={{ background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }} />
                    <Bar dataKey="count" fill="url(#barGrad2)" radius={[0, 4, 4, 0]} />
                    <defs>
                      <linearGradient id="barGrad2" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Platform Revenue Forecast ($K)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={[...REVENUE_DATA, { month: 'Apr', revenue: 145, users: 820 }, { month: 'May', revenue: 190, users: 1050 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#a78bfa" strokeWidth={2.5} dot={{ fill: '#a78bfa', r: 4 }} strokeDasharray={`0 0`} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
              {[['Avg CAC', '$12', 'per user acquired', 'emerald'], ['Blended ARPU', '$34/mo', 'current average', 'violet'], ['Churn Rate', '9.2%', 'monthly', 'amber'], ['LTV', '$816', 'at 24mo retention', 'cyan'], ['Gross Margin', '68%', 'growing to 85%', 'rose']].map(([label, val, sub, color]) => (
                <div key={label} style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '18px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Add Event Modal */}
      {showEventForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 20 }}>Add Event / Grant</h2>
              <button onClick={() => setShowEventForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {[['title', 'Event Title', 'text'], ['organization', 'Organization', 'text'], ['prize', 'Prize / Benefit', 'text'], ['deadline', 'Application Deadline', 'date'], ['location', 'Location', 'text']].map(([key, label, type]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</label>
                  <input type={type} value={(eventForm as Record<string, string>)[key]} onChange={e => setEventForm(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Type</label>
                <select value={eventForm.type} onChange={e => setEventForm(p => ({ ...p, type: e.target.value }))} style={{ width: '100%', background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }}>
                  {['Competition', 'Grant', 'Accelerator', 'Conference'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowEventForm(false)} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={saveEvent} disabled={savingEvent} style={{ flex: 2, padding: 12, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#ef4444)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 15 }}>{savingEvent ? 'Saving...' : 'Create Event'}</button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: 20 }}>User Details</h2>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: '#fff' }}>{selectedUser.full_name?.slice(0, 2).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{selectedUser.full_name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{selectedUser.email}</div>
              </div>
            </div>
            {[['Role', selectedUser.role], ['Credits', String(selectedUser.credits)], ['Joined', new Date(selectedUser.created_at).toLocaleDateString()]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Change Role</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['founder', 'investor', 'admin'].map(r => (
                  <button key={r} onClick={() => { updateUserRole(selectedUser.id, r); setSelectedUser({ ...selectedUser, role: r as Profile['role'] }); }}
                    style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid', borderColor: selectedUser.role === r ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)', background: selectedUser.role === r ? 'rgba(124,58,237,0.15)' : 'transparent', color: selectedUser.role === r ? '#a78bfa' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{r}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 768px) { .main-content { margin-left: 0 !important; padding: 20px 16px 90px !important; } }
      `}</style>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060914' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(249,115,22,0.2)', borderTop: '3px solid #f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading admin panel...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
