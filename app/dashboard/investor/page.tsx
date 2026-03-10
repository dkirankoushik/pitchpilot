'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Profile, type Startup, type InvestorProfile, type Event } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { StatCard, MatchBar, Badge } from '@/components/ui';

const SECTORS = ['All', 'FinTech', 'HealthTech', 'EdTech', 'CleanTech', 'SaaS', 'AI/ML', 'DeepTech'];
const STAGES = ['All', 'Pre-Seed', 'Seed', 'Series A', 'Series B'];

const STATUS_COLORS: Record<string, string> = { pending: 'gray', viewed: 'cyan', interested: 'amber', passed: 'rose', connected: 'emerald' };

export default function InvestorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [invites, setInvites] = useState<{id: string; status: string; startup_id: string; created_at: string; startups?: Startup}[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [filterSector, setFilterSector] = useState('All');
  const [filterStage, setFilterStage] = useState('All');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [invForm, setInvForm] = useState({ firm_name: '', title: '', thesis: '', check_size_min: '', check_size_max: '' });
  const [aiRunning, setAiRunning] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const AI_DEMO = [
    { name: 'NeuralPay', sector: 'FinTech', score: 94, reasons: ['Matches your FinTech thesis', 'Seed stage preference', 'India market', '$12K MRR traction'] },
    { name: 'MedSync', sector: 'HealthTech', score: 88, reasons: ['HealthTech focus', 'B2B revenue model', 'Govt partnership', 'Experienced team'] },
    { name: 'GreenTrace', sector: 'CleanTech', score: 79, reasons: ['Climate tech emerging', 'Pre-seed check size', 'India-first', 'Unique positioning'] },
  ];

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
    const [{ data: prof }, { data: invProf }, { data: startupsData }, { data: savedData }, { data: invitesData }, { data: eventsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('investor_profiles').select('*').eq('profile_id', user.id).single(),
      supabase.from('startups').select('*, profiles(full_name)').eq('is_public', true).order('views', { ascending: false }).limit(30),
      supabase.from('saved_startups').select('startup_id').eq('investor_id', user.id),
      supabase.from('pitch_invites').select('*, startups(name, sector, stage)').eq('investor_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('events').select('*').order('deadline', { ascending: true }).limit(12),
    ]);
    setProfile(prof);
    setInvestorProfile(invProf);
    setStartups(startupsData || []);
    setSavedIds(new Set((savedData || []).map((s: {startup_id: string}) => s.startup_id)));
    setInvites(invitesData || []);
    setEvents(eventsData || []);
    if (invProf) setInvForm({ firm_name: invProf.firm_name || '', title: invProf.title || '', thesis: invProf.thesis || '', check_size_min: String(invProf.check_size_min || ''), check_size_max: String(invProf.check_size_max || '') });
    setLoading(false);
  }

  async function toggleSave(startupId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (savedIds.has(startupId)) {
      await supabase.from('saved_startups').delete().eq('investor_id', user.id).eq('startup_id', startupId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(startupId); return n; });
    } else {
      await supabase.from('saved_startups').insert({ investor_id: user.id, startup_id: startupId });
      setSavedIds(prev => new Set([...prev, startupId]));
    }
  }

  async function updateInviteStatus(inviteId: string, status: string) {
    await supabase.from('pitch_invites').update({ status }).eq('id', inviteId);
    setInvites(prev => prev.map(i => i.id === inviteId ? { ...i, status } : i));
  }

  async function saveInvestorProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { profile_id: user.id, ...invForm, check_size_min: parseInt(invForm.check_size_min) || null, check_size_max: parseInt(invForm.check_size_max) || null };
    if (investorProfile) await supabase.from('investor_profiles').update(payload).eq('profile_id', user.id);
    else await supabase.from('investor_profiles').insert(payload);
    setShowProfileForm(false);
    loadData();
  }

  async function registerEvent(eventId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('event_registrations').upsert({ event_id: eventId, user_id: user.id });
    setRegisteredEvents(prev => new Set([...prev, eventId]));
  }

  const filtered = startups.filter(s => (filterSector === 'All' || s.sector === filterSector) && (filterStage === 'All' || s.stage === filterStage));
  const savedStartups = startups.filter(s => savedIds.has(s.id));
  const pendingInvites = invites.filter(i => i.status === 'pending').length;

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg,#060914,#0d0f1e)' }}>
      <Sidebar role="investor" userName={profile?.full_name || 'Investor'} credits={profile?.credits} notifications={pendingInvites} />

      <main style={{ flex: 1, marginLeft: 240, padding: '28px 28px 80px', transition: 'margin 0.3s' }} className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.7px' }}>
              Deal Flow 💼
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 2 }}>
              {investorProfile ? `${investorProfile.firm_name || profile?.full_name} · ${investorProfile.check_size_min ? `$${(investorProfile.check_size_min/1000).toFixed(0)}K–$${(investorProfile.check_size_max!/1000).toFixed(0)}K` : 'Set check size'}` : 'Complete your investor profile'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['overview', 'feed', 'match', 'saved', 'events', 'settings'].map(s => (
              <button key={s} onClick={() => setActiveSection(s)} style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid', textTransform: 'capitalize', borderColor: activeSection === s ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.08)', background: activeSection === s ? 'rgba(6,182,212,0.12)' : 'transparent', color: activeSection === s ? '#67e8f9' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>{s}</button>
            ))}
          </div>
        </div>

        {/* OVERVIEW */}
        {activeSection === 'overview' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
              <StatCard label="Deals Reviewed" value={filtered.length} change="in feed" icon="📊" color="cyan" />
              <StatCard label="Saved Startups" value={savedIds.size} change="bookmarked" icon="♡" color="violet" />
              <StatCard label="Invites Received" value={invites.length} change={`${pendingInvites} pending`} icon="📨" color="amber" />
              <StatCard label="Connected" value={invites.filter(i => i.status === 'connected').length} change="deals" icon="🤝" color="emerald" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Recent Pitches */}
              <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 22 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Recent Pitches</h3>
                {filtered.slice(0, 4).map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff', flexShrink: 0 }}>{s.name.slice(0, 2).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{s.sector} · {s.stage}</div>
                    </div>
                    <button onClick={() => toggleSave(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: savedIds.has(s.id) ? '#ec4899' : 'rgba(255,255,255,0.3)' }}>{savedIds.has(s.id) ? '♥' : '♡'}</button>
                  </div>
                ))}
                <button onClick={() => setActiveSection('feed')} style={{ marginTop: 14, width: '100%', padding: 10, borderRadius: 10, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#67e8f9', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>View All Pitches →</button>
              </div>
              {/* Pending Invites */}
              <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 22 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Incoming Pitches {pendingInvites > 0 && <span style={{ background: '#7c3aed', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 11, marginLeft: 6 }}>{pendingInvites}</span>}</h3>
                {invites.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No pitches received yet</div>
                ) : (
                  invites.slice(0, 4).map(inv => (
                    <div key={inv.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.startups?.name || 'Startup'}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{new Date(inv.created_at).toLocaleDateString()}</div>
                      </div>
                      <Badge text={inv.status} color={STATUS_COLORS[inv.status] || 'gray'} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PITCH FEED */}
        {activeSection === 'feed' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {SECTORS.map(s => <button key={s} onClick={() => setFilterSector(s)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: filterSector === s ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.08)', background: filterSector === s ? 'rgba(6,182,212,0.12)' : 'transparent', color: filterSector === s ? '#67e8f9' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>{s}</button>)}
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
              {STAGES.map(s => <button key={s} onClick={() => setFilterStage(s)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: filterStage === s ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)', background: filterStage === s ? 'rgba(124,58,237,0.12)' : 'transparent', color: filterStage === s ? '#a78bfa' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>{s}</button>)}
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p>No startups match your filters yet. Founders are joining daily!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                {filtered.map(s => <StartupPitchCard key={s.id} startup={s} saved={savedIds.has(s.id)} expanded={expandedCard === s.id} onSave={() => toggleSave(s.id)} onExpand={() => setExpandedCard(expandedCard === s.id ? null : s.id)} />)}
              </div>
            )}
          </div>
        )}

        {/* AI MATCH */}
        {activeSection === 'match' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 700 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>AI Deal Matching</h2>
            <div style={{ borderRadius: 20, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.04)', padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#0891b2,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>✦</div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 17 }}>AI-Curated Deal Flow</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>We analyze your investment thesis, sector focus, check size, and past behavior to surface the startups most aligned with your portfolio strategy.</p>
                </div>
              </div>
              <button onClick={() => { setAiRunning(true); setAiDone(false); setTimeout(() => { setAiRunning(false); setAiDone(true); }, 2200); }} disabled={aiRunning}
                style={{ width: '100%', padding: 14, borderRadius: 12, background: 'linear-gradient(135deg,#0891b2,#7c3aed)', color: '#fff', fontWeight: 700, border: 'none', cursor: aiRunning ? 'not-allowed' : 'pointer', fontSize: 15, opacity: aiRunning ? 0.8 : 1 }}>
                {aiRunning ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Analyzing deal flow...</span> : '🔍 Find My Best Deals'}
              </button>
            </div>
            {aiRunning && <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 20, marginBottom: 16 }}>
              {['Loading startup database...', 'Parsing your investment thesis...', 'Matching sector preferences...', 'Scoring traction signals...', 'Ranking by portfolio fit...'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(6,182,212,0.3)', borderTop: '2px solid #06b6d4', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{step}</span>
                </div>
              ))}
            </div>}
            {aiDone && <div>
              <div style={{ color: '#34d399', fontWeight: 700, marginBottom: 16 }}>✓ Top 3 deals for your portfolio</div>
              {AI_DEMO.map((m, i) => (
                <div key={i} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 20, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div><span style={{ fontWeight: 700, fontSize: 16 }}>{m.name}</span> <Badge text={m.sector} color="cyan" /></div>
                    <span style={{ fontWeight: 800, fontSize: 20, color: m.score >= 90 ? '#34d399' : '#fbbf24' }}>{m.score}%</span>
                  </div>
                  <MatchBar score={m.score} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                    {m.reasons.map((r, j) => <div key={j} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', display: 'flex', gap: 6 }}><span style={{ color: '#34d399' }}>✓</span>{r}</div>)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>View Pitch</button>
                    <button style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'linear-gradient(135deg,#0891b2,#7c3aed)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, border: 'none' }}>Express Interest</button>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )}

        {/* SAVED */}
        {activeSection === 'saved' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Saved Startups ({savedStartups.length})</h2>
            {savedStartups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>♡</div>
                <p>Save startups from the feed to track them here</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                {savedStartups.map(s => <StartupPitchCard key={s.id} startup={s} saved={true} expanded={expandedCard === s.id} onSave={() => toggleSave(s.id)} onExpand={() => setExpandedCard(expandedCard === s.id ? null : s.id)} />)}
              </div>
            )}
          </div>
        )}

        {/* EVENTS */}
        {activeSection === 'events' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Events & Conferences</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {events.map(ev => (
                <div key={ev.id} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                  <div style={{ height: 4, background: ev.type === 'Competition' ? 'linear-gradient(90deg,#7c3aed,#a78bfa)' : ev.type === 'Grant' ? 'linear-gradient(90deg,#10b981,#34d399)' : ev.type === 'Accelerator' ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#06b6d4,#67e8f9)' }} />
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Badge text={ev.type} color={ev.type === 'Grant' ? 'emerald' : ev.type === 'Accelerator' ? 'amber' : ev.type === 'Conference' ? 'cyan' : 'violet'} />
                      {ev.is_urgent && <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>⚡ Closing soon</span>}
                    </div>
                    <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{ev.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>{ev.organization} · {ev.location}</p>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                      {ev.prize && <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>PRIZE</div><div style={{ color: '#34d399', fontWeight: 700, marginTop: 2 }}>{ev.prize}</div></div>}
                      {ev.deadline && <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>DEADLINE</div><div style={{ color: '#fbbf24', fontWeight: 700, marginTop: 2 }}>{new Date(ev.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div></div>}
                    </div>
                    <button onClick={() => registerEvent(ev.id)} style={{ width: '100%', padding: 10, borderRadius: 10, background: registeredEvents.has(ev.id) ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg,rgba(6,182,212,0.8),rgba(124,58,237,0.8))', border: registeredEvents.has(ev.id) ? '1px solid rgba(16,185,129,0.3)' : 'none', color: registeredEvents.has(ev.id) ? '#6ee7b7' : '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                      {registeredEvents.has(ev.id) ? '✓ Registered' : 'Register / Apply'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeSection === 'settings' && (
          <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Investor Profile</h2>
              <button onClick={() => setShowProfileForm(true)} style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#0891b2,#7c3aed)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 13 }}>Edit Profile</button>
            </div>
            <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: 28 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg,#0891b2,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#fff' }}>{profile?.full_name?.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.full_name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{investorProfile?.firm_name || 'Set your firm name'}</div>
                  <Badge text="Investor" color="cyan" />
                </div>
              </div>
              {investorProfile ? (
                <div style={{ display: 'grid', gap: 14 }}>
                  {[['Firm', investorProfile.firm_name || '—'], ['Title', investorProfile.title || '—'], ['Check Size', investorProfile.check_size_min ? `$${(investorProfile.check_size_min/1000).toFixed(0)}K – $${(investorProfile.check_size_max!/1000).toFixed(0)}K` : '—']].map(([k, v]) => (
                    <div key={k} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                      <div style={{ fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                  {investorProfile.thesis && <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 12, padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Investment Thesis</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{investorProfile.thesis}</div>
                  </div>}
                </div>
              ) : <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.4)' }}>Complete your investor profile to improve deal matching</div>}
            </div>
          </div>
        )}
      </main>

      {/* Investor Profile Modal */}
      {showProfileForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#0d0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 20 }}>Edit Investor Profile</h2>
              <button onClick={() => setShowProfileForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {[['firm_name', 'Firm Name'], ['title', 'Your Title'], ['check_size_min', 'Min Check Size ($)'], ['check_size_max', 'Max Check Size ($)']].map(([key, label]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</label>
                  <input value={(invForm as Record<string, string>)[key]} onChange={e => setInvForm(p => ({ ...p, [key]: e.target.value }))} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Investment Thesis</label>
                <textarea value={invForm.thesis} onChange={e => setInvForm(p => ({ ...p, thesis: e.target.value }))} rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowProfileForm(false)} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={saveInvestorProfile} style={{ flex: 2, padding: 12, borderRadius: 10, background: 'linear-gradient(135deg,#0891b2,#7c3aed)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 15 }}>Save Profile</button>
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

function StartupPitchCard({ startup, saved, expanded, onSave, onExpand }: { startup: Startup; saved: boolean; expanded: boolean; onSave: () => void; onExpand: () => void }) {
  const gradients = ['from-violet-900 to-cyan-900', 'from-emerald-900 to-teal-900', 'from-pink-900 to-rose-900', 'from-amber-900 to-orange-900'];
  const grad = gradients[startup.name.charCodeAt(0) % gradients.length];
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', transition: 'border-color 0.2s' }}>
      <div className={`bg-gradient-to-br ${grad}`} style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontFamily: 'monospace' }}>2:47</div>
        <button onClick={onSave} style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: saved ? '#f472b6' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {saved ? '♥' : '♡'}
        </button>
        <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 4 }}>
          {(startup.sector || startup.stage) && [startup.sector, startup.stage].filter(Boolean).slice(0, 2).map(t => <span key={t} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 8px', fontSize: 11 }}>{t}</span>)}
        </div>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>{startup.name}</h3>
          {startup.raise_amount && <span style={{ color: '#34d399', fontWeight: 700, fontSize: 13 }}>{startup.raise_amount}</span>}
        </div>
        {startup.tagline && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.4, marginBottom: 10 }}>{startup.tagline}</p>}
        {startup.traction && <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#6ee7b7', marginBottom: 12 }}>📈 {startup.traction}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onExpand} style={{ flex: 1, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{expanded ? '↑ Less' : '↓ More'}</button>
          <button style={{ flex: 2, padding: 8, borderRadius: 8, background: 'linear-gradient(135deg,#0891b2,#7c3aed)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Express Interest</button>
        </div>
        {expanded && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', animation: 'fadeIn 0.2s ease' }}>
            {startup.description && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{startup.description}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['Team', `${startup.team_size} members`], ['Location', startup.location || '—'], ['Status', startup.status], ['Views', startup.views.toLocaleString()]].map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060914' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(6,182,212,0.2)', borderTop: '3px solid #06b6d4', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading deal flow...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
