'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Profile, type Startup, type PitchInvite, type Event } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { StatCard, MatchBar, Badge } from '@/components/ui';

const SECTORS = ['FinTech', 'HealthTech', 'EdTech', 'CleanTech', 'SaaS', 'AI/ML', 'E-Commerce', 'DeepTech', 'Other'];
const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C'];
const AI_MATCHES_DEMO = [
  { investor: 'Sequoia Surge', score: 94, reasons: ['FinTech thesis match', 'Seed stage', 'India focus', 'Strong traction'] },
  { investor: 'Accel India', score: 88, reasons: ['B2B SaaS', 'Seed-Series A', 'Tech enabled', 'Team credentials'] },
  { investor: 'Blume Ventures', score: 81, reasons: ['Early stage', 'India-first', 'Check size match', 'AI/ML angle'] },
];

export default function FounderDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [startup, setStartup] = useState<Startup | null>(null);
  const [invites, setInvites] = useState<PitchInvite[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showStartupForm, setShowStartupForm] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [form, setForm] = useState({ name: '', tagline: '', description: '', sector: '', stage: '', location: '', raise_amount: '', traction: '', website: '' });
  const [saving, setSaving] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());

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

    const [{ data: prof }, { data: startupData }, { data: inviteData }, { data: eventData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('startups').select('*').eq('founder_id', user.id).single(),
      supabase.from('pitch_invites').select('*, profiles(full_name, email)').eq('founder_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('events').select('*').order('deadline', { ascending: true }).limit(10),
    ]);

    setProfile(prof);
    setStartup(startupData);
    setInvites(inviteData || []);
    setEvents(eventData || []);
    if (startupData) setForm({ name: startupData.name, tagline: startupData.tagline || '', description: startupData.description || '', sector: startupData.sector || '', stage: startupData.stage || '', location: startupData.location || '', raise_amount: startupData.raise_amount || '', traction: startupData.traction || '', website: startupData.website || '' });
    setLoading(false);
  }

  async function saveStartup() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { ...form, founder_id: user.id, is_public: true, status: 'active' as const };
    if (startup) {
      await supabase.from('startups').update(payload).eq('id', startup.id);
    } else {
      await supabase.from('startups').insert(payload);
    }
    setShowStartupForm(false);
    setSaving(false);
    loadData();
  }

  async function registerEvent(eventId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('event_registrations').upsert({ event_id: eventId, user_id: user.id });
    setRegisteredEvents(prev => new Set([...prev, eventId]));
  }

  const runAI = () => {
    setAiRunning(true);
    setAiDone(false);
    setTimeout(() => { setAiRunning(false); setAiDone(true); }, 2500);
  };

  const inviteStats = { pending: invites.filter(i => i.status === 'pending').length, viewed: invites.filter(i => i.status === 'viewed').length, interested: invites.filter(i => i.status === 'interested').length, connected: invites.filter(i => i.status === 'connected').length };

  const STATUS_COLORS: Record<string, string> = { pending: 'gray', viewed: 'cyan', interested: 'amber', passed: 'rose', connected: 'emerald' };

  if (loading) return <LoadingScreen />;

  const sidebarWidth = 240;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg,#060914,#0d0f1e)' }}>
      <Sidebar role="founder" userName={profile?.full_name || 'Founder'} credits={profile?.credits} />

      <main style={{ flex: 1, marginLeft: sidebarWidth, padding: '28px 28px 80px', transition: 'margin 0.3s' }} className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.7px' }}>
              Hey {profile?.full_name?.split(' ')[0] || 'Founder'} 👋
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 2 }}>
              {startup ? `${startup.name} · ${startup.stage} · ${startup.sector}` : 'Create your startup profile to start pitching'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['overview', 'pitches', 'match', 'invites', 'events'].map(s => (
              <button key={s} onClick={() => setActiveSection(s)} style={{ padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid', textTransform: 'capitalize', borderColor: activeSection === s ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)', background: activeSection === s ? 'rgba(124,58,237,0.15)' : 'transparent', color: activeSection === s ? '#a78bfa' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>{s}</button>
            ))}
          </div>
        </div>

        {/* OVERVIEW */}
        {activeSection === 'overview' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
              <StatCard label="Pitch Views" value={startup?.views || 0} change="12% this week" icon="👁" color="violet" />
              <StatCard label="Invites Sent" value={invites.length} change={`${inviteStats.interested} interested`} icon="📨" color="cyan" />
              <StatCard label="Connections" value={inviteStats.connected} change="from outreach" icon="🤝" color="emerald" />
              <StatCard label="Credits Left" value={profile?.credits || 0} icon="⚡" color="amber" />
            </div>

            {!startup ? (
              <div style={{ borderRadius: 20, border: '2px dashed rgba(124,58,237,0.3)', padding: '48px 32px', textAlign: 'center', background: 'rgba(124,58,237,0.04)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Create Your Startup Profile</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontSize: 14 }}>Set up your pitch, upload a video, and start connecting with investors</p>
                <button onClick={() => setShowStartupForm(true)} style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 15 }}>Create Startup Profile</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <StartupCard startup={startup} onEdit={() => setShowStartupForm(true)} />
                <InviteStatusCard stats={inviteStats} />
              </div>
            )}
          </div>
        )}

        {/* PITCHES */}
        {activeSection === 'pitches' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>My Pitch Videos</h2>
              <button onClick={() => setShowStartupForm(true)} style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 13 }}>+ Add Video</button>
            </div>
            {startup ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {[{ title: 'Main Elevator Pitch', dur: '2:47', views: startup.views, status: 'live' }, { title: 'Product Demo', dur: '4:12', views: Math.floor(startup.views * 0.3), status: 'live' }, { title: 'Team Introduction', dur: '1:55', views: Math.floor(startup.views * 0.5), status: 'draft' }].map((v, i) => (
                  <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ height: 140, background: `linear-gradient(135deg, hsl(${260 + i * 30},60%,15%), hsl(${200 + i * 20},70%,12%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                      <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>▶</div>
                      <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>{v.dur}</span>
                      <Badge text={v.status === 'live' ? '● Live' : '○ Draft'} color={v.status === 'live' ? 'emerald' : 'gray'} />
                    </div>
                    <div style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{v.title}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{v.views.toLocaleString()} views</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                        <button style={{ flex: 1, padding: '7px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer' }}>Analytics</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div onClick={() => setShowStartupForm(true)} style={{ borderRadius: 16, border: '2px dashed rgba(255,255,255,0.1)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', gap: 8, transition: 'all 0.2s', minHeight: 220 }}>
                  <span style={{ fontSize: 32 }}>+</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Upload Video</span>
                </div>
              </div>
            ) : <EmptyState message="Create your startup profile first" />}
          </div>
        )}

        {/* AI MATCH */}
        {activeSection === 'match' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 700 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>AI Matchmaking</h2>
            <div style={{ borderRadius: 20, border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.06)', padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>✦</div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 17 }}>AI-Powered Investor Matching</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>Analyzes your startup profile, sector, stage, traction, and 30+ signals to surface the 5 most likely investors to respond.</p>
                </div>
              </div>
              <button onClick={runAI} disabled={aiRunning} style={{ width: '100%', padding: 14, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', fontWeight: 700, border: 'none', cursor: aiRunning ? 'not-allowed' : 'pointer', fontSize: 15, opacity: aiRunning ? 0.8 : 1 }}>
                {aiRunning ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Analyzing {startup?.name || 'your startup'}...</span> : '🚀 Run AI Match'}
              </button>
            </div>
            {aiRunning && (
              <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 20, marginBottom: 16 }}>
                {['Reading pitch video transcript...', 'Mapping sector & stage alignment...', 'Scoring traction signals...', 'Cross-referencing investor thesis...', 'Ranking by response probability...'].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(124,58,237,0.3)', borderTop: '2px solid #a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', animationDelay: `${i * 0.15}s`, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{step}</span>
                  </div>
                ))}
              </div>
            )}
            {aiDone && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>✓ Top 3 matches found</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>for {startup?.name || 'your startup'}</span>
                </div>
                {AI_MATCHES_DEMO.map((m, i) => (
                  <div key={i} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 20, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{m.investor}</span>
                      <span style={{ fontWeight: 800, fontSize: 20, color: m.score >= 90 ? '#34d399' : '#fbbf24' }}>{m.score}%</span>
                    </div>
                    <MatchBar score={m.score} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                      {m.reasons.map((r, j) => <div key={j} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', display: 'flex', gap: 6 }}><span style={{ color: '#34d399' }}>✓</span>{r}</div>)}
                    </div>
                    <button style={{ marginTop: 14, width: '100%', padding: '9px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 13 }}>Send Pitch Invite (1 credit)</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INVITES */}
        {activeSection === 'invites' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Pitch Invites</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(inviteStats).map(([k, v]) => <Badge key={k} text={`${k}: ${v}`} color={STATUS_COLORS[k] || 'gray'} />)}
              </div>
            </div>
            {invites.length === 0 ? (
              <EmptyState message="No invites yet. Run AI Match to find investors and send your first pitch." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {invites.map(inv => (
                  <div key={inv.id} style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{(inv.profiles as unknown as Profile)?.full_name || 'Investor'}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 }}>{new Date(inv.created_at).toLocaleDateString()}</div>
                    </div>
                    <Badge text={inv.status} color={STATUS_COLORS[inv.status] || 'gray'} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EVENTS */}
        {activeSection === 'events' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Events & Grants Hub</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {events.map(ev => <EventCard key={ev.id} event={ev} registered={registeredEvents.has(ev.id)} onRegister={() => registerEvent(ev.id)} />)}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeSection === 'settings' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 600 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Profile Settings</h2>
            <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 28 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#fff' }}>{profile?.full_name?.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.full_name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{profile?.email}</div>
                  <Badge text="Founder" color="violet" />
                </div>
              </div>
              {[['Full Name', profile?.full_name || ''], ['Email', profile?.email || '']].map(([label, value]) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</label>
                  <input defaultValue={value} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
                </div>
              ))}
              <button style={{ marginTop: 8, padding: '11px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 14 }}>Save Changes</button>
            </div>
          </div>
        )}
      </main>

      {/* Startup Form Modal */}
      {showStartupForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 20 }}>{startup ? 'Edit Startup' : 'Create Startup Profile'}</h2>
              <button onClick={() => setShowStartupForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {[['name', 'Startup Name', 'text'], ['tagline', 'Tagline (one line)', 'text'], ['location', 'Location', 'text'], ['raise_amount', 'Raising Amount (e.g. $500K)', 'text'], ['website', 'Website URL', 'url'], ['traction', 'Traction (e.g. $12K MRR · 45 customers)', 'text']].map(([key, label, type]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</label>
                  <input type={type} value={(form as Record<string, string>)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Sector</label>
                  <select value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} style={{ width: '100%', background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }}>
                    <option value="">Select sector</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Stage</label>
                  <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))} style={{ width: '100%', background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }}>
                    <option value="">Select stage</option>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowStartupForm(false)} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={saveStartup} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 15 }}>{saving ? 'Saving...' : 'Save Profile'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 768px) { .main-content { margin-left: 0 !important; padding: 20px 16px 90px !important; } }
      `}</style>
    </div>
  );
}

function StartupCard({ startup, onEdit }: { startup: Startup; onEdit: () => void }) {
  return (
    <div style={{ borderRadius: 20, border: '1px solid rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.04)', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 22, fontWeight: 800 }}>{startup.name}</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 3 }}>{startup.tagline}</p>
        </div>
        <button onClick={onEdit} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[['Sector', startup.sector], ['Stage', startup.stage], ['Location', startup.location], ['Raising', startup.raise_amount]].map(([k, v]) => (
          <div key={k} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3 }}>{k}</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{v || '—'}</div>
          </div>
        ))}
      </div>
      {startup.traction && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: 13 }}>📈 {startup.traction}</div>}
    </div>
  );
}

function InviteStatusCard({ stats }: { stats: Record<string, number> }) {
  const items = [['pending', '⏳', '#a78bfa'], ['viewed', '👁', '#67e8f9'], ['interested', '⭐', '#fbbf24'], ['connected', '🤝', '#34d399']];
  return (
    <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 24 }}>
      <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Invite Pipeline</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(([key, icon, color]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{key}</span>
                <span style={{ fontWeight: 700, color: color as string }}>{stats[key] || 0}</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(((stats[key] || 0) / Math.max(...Object.values(stats), 1)) * 100, 100)}%`, height: '100%', background: color as string, borderRadius: 3 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventCard({ event, registered, onRegister }: { event: Event; registered: boolean; onRegister: () => void }) {
  const typeColors: Record<string, string> = { Competition: 'violet', Grant: 'emerald', Accelerator: 'amber', Conference: 'cyan' };
  return (
    <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
      <div style={{ height: 4, background: event.type === 'Competition' ? 'linear-gradient(90deg,#7c3aed,#a78bfa)' : event.type === 'Grant' ? 'linear-gradient(90deg,#10b981,#34d399)' : event.type === 'Accelerator' ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#06b6d4,#67e8f9)' }} />
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <Badge text={event.type} color={typeColors[event.type] || 'gray'} />
          {event.is_urgent && <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>⚡ Urgent</span>}
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{event.title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>{event.organization}</p>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>PRIZE</div><div style={{ color: '#34d399', fontWeight: 700, fontSize: 15, marginTop: 2 }}>{event.prize || '—'}</div></div>
          <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>DEADLINE</div><div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 15, marginTop: 2 }}>{event.deadline ? new Date(event.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</div></div>
        </div>
        <button onClick={onRegister} style={{ width: '100%', padding: '10px', borderRadius: 10, background: registered ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,rgba(124,58,237,0.8),rgba(6,182,212,0.8))', border: registered ? '1px solid rgba(16,185,129,0.3)' : 'none', color: registered ? '#6ee7b7' : '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          {registered ? '✓ Registered' : 'Apply / Register'}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
      <p style={{ fontSize: 15 }}>{message}</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060914' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(124,58,237,0.2)', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading dashboard...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
