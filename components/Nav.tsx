'use client';
import { usePathname, useRouter } from 'next/navigation';
import { supabase, getSession } from '@/lib/supabase';
import { useEffect, useState } from 'react';

interface NavUser { name: string; role: string; email: string; }

export default function Nav({ user }: { user?: NavUser }) {
  const path = usePathname();
  const router = useRouter();
  const [u, setU] = useState<NavUser | null>(user || null);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    if (user) { setU(user); return; }
    getSession().then(s => {
      if (!s) return;
      supabase.from('profiles').select('full_name,role,email').eq('id', s.user.id).single()
        .then(({ data }) => data && setU({ name: data.full_name || data.email, role: data.role, email: data.email }));
    });
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const role = u?.role || 'founder';
  const navItems = [
    { href: '/feed', label: 'Feed', icon: '⊞', mIcon: '⊞', mLabel: 'Home' },
    { href: '/discover', label: 'Discover', icon: '◎', mIcon: '◎', mLabel: 'Discover' },
    { href: role === 'admin' ? '/dashboard/admin' : role === 'investor' ? '/dashboard/investor' : '/dashboard/founder', label: 'Dashboard', icon: '▤', mIcon: null, mLabel: null },
    { href: '/activity', label: 'Activity', icon: '♡', mIcon: '♡', mLabel: 'Activity' },
    { href: '/profile/me', label: 'Profile', icon: '◉', mIcon: '◉', mLabel: 'Profile' },
  ];

  const initials = u?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <nav className="sidebar" style={{ padding: 0 }}>
        <div className="nav-logo">
          <div className="nav-logo-ic">▶</div>
          PitchPilot
        </div>
        <div style={{ flex: 1 }}>
          {navItems.map(item => (
            <a key={item.href} href={item.href} className={`nav-item${path === item.href || path.startsWith(item.href + '/') ? ' active' : ''}`}>
              <span className="nav-ic">{item.icon}</span>
              <span style={{ fontSize: 14 }}>{item.label}</span>
            </a>
          ))}
          {role === 'founder' && (
            <a href="/pitch/new" className={`nav-item${path === '/pitch/new' ? ' active' : ''}`}>
              <span className="nav-ic">＋</span>
              <span style={{ fontSize: 14 }}>New Pitch</span>
            </a>
          )}
        </div>
        <div className="nav-bot">
          <div className="nav-profile" onClick={() => setShowLogout(!showLogout)} style={{ cursor: 'pointer', borderRadius: 10, transition: 'background .12s' }}>
            <div className="nav-profile-av" style={{ background: '#1C1A17', color: '#fff', fontWeight: 700, fontSize: 12 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="nav-profile-name">{u?.name || 'User'}</div>
              <div className="nav-profile-role">{role}</div>
            </div>
            <span style={{ color: 'var(--text3)', fontSize: 16 }}>⋯</span>
          </div>
          {showLogout && (
            <div style={{ padding: '0 12px 12px' }}>
              <button onClick={logout} className="btn btn-danger btn-sm btn-full">Sign out</button>
            </div>
          )}
        </div>
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <nav className="bottom-nav">
        <a href="/feed" className={`bnav-item${path === '/feed' ? ' active' : ''}`}>
          <span className="bnav-ic">⊞</span>
          <span className="bnav-label">Home</span>
        </a>
        <a href="/discover" className={`bnav-item${path === '/discover' ? ' active' : ''}`}>
          <span className="bnav-ic">◎</span>
          <span className="bnav-label">Discover</span>
        </a>
        {role === 'founder' && (
          <a href="/pitch/new" className="bnav-item">
            <div className="bnav-add">＋</div>
          </a>
        )}
        {role !== 'founder' && (
          <a href={role === 'admin' ? '/dashboard/admin' : '/dashboard/investor'} className={`bnav-item${path.includes('/dashboard') ? ' active' : ''}`}>
            <span className="bnav-ic">▤</span>
            <span className="bnav-label">Deals</span>
          </a>
        )}
        <a href="/activity" className={`bnav-item${path === '/activity' ? ' active' : ''}`}>
          <span className="bnav-ic">♡</span>
          <span className="bnav-label">Activity</span>
        </a>
        <a href="/profile/me" className={`bnav-item${path === '/profile/me' ? ' active' : ''}`}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: path === '/profile/me' ? 'var(--ink)' : 'var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: path === '/profile/me' ? '#fff' : 'var(--text2)', fontWeight: 700, fontSize: 11 }}>
            {initials}
          </div>
          <span className="bnav-label">Profile</span>
        </a>
      </nav>
    </>
  );
}
