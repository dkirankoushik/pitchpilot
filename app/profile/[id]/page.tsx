'use client';
import { useState, useEffect, Suspense } from 'react';
import { supabase, getSession } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Nav from '@/components/Nav';

const PITCH_VIDEOS = [
  { id: 'pVPfy5lV7oA', sector: 'FinTech', icon: '💳' },
  { id: 'Wd5KxIUBqrE', sector: 'HealthTech', icon: '🏥' },
  { id: 'eTR7KGf7kKc', sector: 'SaaS', icon: '⚡' },
  { id: 'WumFiUlwQ7g', sector: 'AgriTech', icon: '🌾' },
  { id: 'L1kbrlZRDvU', sector: 'EdTech', icon: '📚' },
  { id: 'nKIu9yen5nc', sector: 'CleanTech', icon: '☀️' },
];

interface Profile { id: string; full_name: string | null; email: string; role: string; credits: number; }

function ProfileContent() {
  const router = useRouter();
  const params = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSelf, setIsSelf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'grid' | 'tagged'>('grid');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const load = async () => {
      const session = await getSession();
      if (!session) { router.replace('/'); return; }
      const selfId = session.user.id;
      const targetId = params.id === 'me' ? selfId : String(params.id);
      setIsSelf(targetId === selfId);

      const { data } = await supabase.from('profiles').select('*').eq('id', targetId).single();
      if (data) { setProfile(data); setEditName(data.full_name || ''); }
      setLoading(false);
    };
    load();
  }, [params.id, router]);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: editName }).eq('id', profile.id);
    setProfile(p => p ? { ...p, full_name: editName } : p);
    setEditing(false); setSaving(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (loading) return (
    <div className="app-shell">
      <div className="page-loader"><div className="spin" /></div>
    </div>
  );

  if (!profile) return <div className="app-shell"><div className="page-loader"><p style={{ color: 'var(--text2)' }}>Profile not found</p></div></div>;

  const initials = profile.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || profile.email[0].toUpperCase();
  const displayName = profile.full_name || profile.email.split('@')[0];
  const roleIcon = profile.role === 'investor' ? '💼' : profile.role === 'admin' ? '⚙️' : '🚀';

  return (
    <div className="app-shell">
      <Nav user={{ name: displayName, role: profile.role, email: profile.email }} />
      <main className="main-content">
        {/* Mobile top bar */}
        <div className="top-bar">
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)', padding: '0 8px 0 0' }}>←</button>
          <span className="top-logo" style={{ fontSize: 17 }}>{displayName}</span>
          {isSelf && (
            <button onClick={() => setShowLogout(!showLogout)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text)' }}>☰</button>
          )}
        </div>

        {/* Logout dropdown (mobile) */}
        {showLogout && isSelf && (
          <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
            <button onClick={logout} className="btn btn-danger btn-full btn-sm">Sign out of PitchPilot</button>
          </div>
        )}

        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {/* Profile header */}
          <div className="prof-header">
            <div className="prof-av" style={{ background: 'var(--ink)', color: '#F7F6F3', fontWeight: 800, fontSize: 28 }}>{initials}</div>
            <div className="prof-stats">
              {[['12', 'Pitches'], ['3.4K', 'Reach'], ['284', 'Likes']].map(([n, l]) => (
                <div key={l}>
                  <span className="prof-stat-n">{n}</span>
                  <span className="prof-stat-l">{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bio */}
          {!editing ? (
            <div className="prof-bio">
              <div className="prof-name">{displayName}</div>
              <div className="prof-role-badge">{roleIcon} {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</div>
              <div className="prof-desc" style={{ color: 'var(--text2)' }}>
                {editBio || 'Building the future one pitch at a time. 🚀'}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text3)' }}>📍 India · {profile.credits} credits remaining</div>
            </div>
          ) : (
            <div style={{ padding: '0 16px 14px' }}>
              <div className="form-group">
                <label className="label">Display Name</label>
                <input className="input" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Bio</label>
                <textarea className="input textarea" value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell your story..." />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ink btn-sm" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="prof-actions">
            {isSelf ? (
              <>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setEditing(!editing)}>Edit Profile</button>
                <button className="btn btn-outline btn-sm" onClick={() => router.push('/pitch/new')}>+ New Pitch</button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={logout} title="Sign out">⏻</button>
              </>
            ) : (
              <>
                <button className="btn btn-ink btn-sm" style={{ flex: 1 }}>Follow</button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>Message</button>
              </>
            )}
          </div>

          {/* Tab bar */}
          <div className="prof-tabs">
            <button className={`prof-tab${tab === 'grid' ? ' active' : ''}`} onClick={() => setTab('grid')}>⊞</button>
            <button className={`prof-tab${tab === 'tagged' ? ' active' : ''}`} onClick={() => setTab('tagged')}>🔖</button>
          </div>

          {/* Grid of pitch thumbnails */}
          {tab === 'grid' && (
            <div className="prof-grid">
              {PITCH_VIDEOS.map((v, i) => (
                <a key={i} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="prof-grid-item">
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, background: `hsl(${i * 40},20%,93%)` }}>
                    <span style={{ fontSize: 28 }}>{v.icon}</span>
                    <span style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600 }}>{v.sector}</span>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,26,23,.35)', opacity: 0, transition: 'opacity .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                    <span style={{ color: '#fff', fontSize: 24 }}>▶</span>
                  </div>
                </a>
              ))}
            </div>
          )}
          {tab === 'tagged' && (
            <div className="empty">
              <div className="empty-ic">🔖</div>
              <div className="empty-title">No saved pitches yet</div>
              <div style={{ color: 'var(--text3)', fontSize: 14 }}>Bookmark pitches you want to revisit</div>
            </div>
          )}

          {/* Bottom padding */}
          <div style={{ height: 32 }} />
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="page-loader"><div className="spin" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
