'use client';
import { useState, useEffect } from 'react';
import { supabase, getSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const SECTORS = ['All', 'FinTech', 'HealthTech', 'SaaS', 'EdTech', 'AgriTech', 'CleanTech', 'AI/ML', 'D2C'];
const STARTUPS = [
  { name: 'NeuralPay', sector: 'FinTech', stage: 'Seed', loc: 'Mumbai', icon: '🤖', mrr: '₹10L', desc: 'AI-powered UPI lending for 200M Indians' },
  { name: 'MedSync', sector: 'HealthTech', stage: 'Pre-Seed', loc: 'Bangalore', icon: '🏥', mrr: '₹3.3L', desc: 'Telemedicine for tier-2 cities' },
  { name: 'FlowDesk', sector: 'SaaS', stage: 'Series A', loc: 'Hyderabad', icon: '⚡', mrr: '₹70L', desc: 'No-code workflow automation for SMBs' },
  { name: 'AgriChain', sector: 'AgriTech', stage: 'Seed', loc: 'Pune', icon: '🌾', mrr: '₹23L', desc: 'Farm-to-fork supply chain platform' },
  { name: 'EduVerse', sector: 'EdTech', stage: 'Pre-Seed', loc: 'Delhi', icon: '📚', mrr: '₹5.8L', desc: 'Personalized AI learning in regional languages' },
  { name: 'GreenGrid', sector: 'CleanTech', stage: 'Seed', loc: 'Chennai', icon: '☀️', mrr: '₹29L', desc: 'P2P solar energy trading marketplace' },
  { name: 'TalentAI', sector: 'AI/ML', stage: 'Pre-Seed', loc: 'Bangalore', icon: '🧠', mrr: '₹8L', desc: 'AI hiring copilot for Indian enterprises' },
  { name: 'QuickKart', sector: 'D2C', stage: 'Seed', loc: 'Mumbai', icon: '🛒', mrr: '₹45L', desc: '15-minute grocery delivery for tier-2' },
];

const stageColor: Record<string, string> = { 'Seed': 'tag-green', 'Pre-Seed': 'tag-amber', 'Series A': 'tag-blue' };

export default function DiscoverPage() {
  const router = useRouter();
  const [sector, setSector] = useState('All');
  const [search, setSearch] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('founder');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(s => {
      if (!s) { router.replace('/'); return; }
      supabase.from('profiles').select('full_name,role').eq('id', s.user.id).single().then(({ data }) => {
        if (data) { setUserName(data.full_name || ''); setUserRole(data.role); }
        setLoading(false);
      });
    });
  }, [router]);

  const filtered = STARTUPS.filter(s =>
    (sector === 'All' || s.sector === sector) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spin" /></div>;

  return (
    <div className="app-shell">
      <Nav user={{ name: userName, role: userRole, email: '' }} />
      <main className="main-content">
        <div className="top-bar">
          <span className="top-logo">Discover</span>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Search */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10, background: 'rgba(247,246,243,.95)', backdropFilter: 'blur(12px)' }}>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 16 }}>🔍</span>
              <input className="input" style={{ paddingLeft: 38 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search startups, sectors..." />
            </div>
            {/* Sector pills */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
              {SECTORS.map(s => (
                <button key={s} onClick={() => setSector(s)}
                  style={{ flexShrink: 0, padding: '5px 13px', borderRadius: 20, border: '1.5px solid', borderColor: sector === s ? 'var(--ink)' : 'var(--border)', background: sector === s ? 'var(--ink)' : 'transparent', color: sector === s ? '#fff' : 'var(--text2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all .12s', whiteSpace: 'nowrap' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, padding: 16 }}>
            {filtered.map((s, i) => (
              <div key={i} className="disc-card" onClick={() => router.push('/feed')} style={{ cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}>
                <div style={{ aspectRatio: '4/3', background: `hsl(${i * 47},22%,91%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                  {s.icon}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 7 }}>{s.loc} · {s.mrr} MRR</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <span className={`tag ${stageColor[s.stage] || 'tag'}`} style={{ fontSize: 10 }}>{s.stage}</span>
                    <span className="tag" style={{ fontSize: 10 }}>{s.sector}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>No results found</div>
                <div style={{ fontSize: 13 }}>Try a different search or sector</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
