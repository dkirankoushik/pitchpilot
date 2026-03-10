'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type NavItem = { icon: string; label: string; href: string; badge?: number };

interface SidebarProps {
  role: 'founder' | 'investor' | 'admin';
  userName: string;
  credits?: number;
  notifications?: number;
}

const NAV: Record<string, NavItem[]> = {
  founder: [
    { icon: '◎', label: 'Dashboard', href: '/dashboard/founder' },
    { icon: '▶', label: 'My Pitches', href: '/dashboard/founder#pitches' },
    { icon: '✦', label: 'AI Match', href: '/dashboard/founder#match' },
    { icon: '◈', label: 'Invites Sent', href: '/dashboard/founder#invites' },
    { icon: '⬡', label: 'Events Hub', href: '/dashboard/founder#events' },
    { icon: '⚙', label: 'Settings', href: '/dashboard/founder#settings' },
  ],
  investor: [
    { icon: '◎', label: 'Dashboard', href: '/dashboard/investor' },
    { icon: '▶', label: 'Pitch Feed', href: '/dashboard/investor#feed' },
    { icon: '✦', label: 'AI Match', href: '/dashboard/investor#match' },
    { icon: '♡', label: 'Saved', href: '/dashboard/investor#saved' },
    { icon: '◈', label: 'Events', href: '/dashboard/investor#events' },
    { icon: '⚙', label: 'Settings', href: '/dashboard/investor#settings' },
  ],
  admin: [
    { icon: '◎', label: 'Overview', href: '/dashboard/admin' },
    { icon: '👥', label: 'Users', href: '/dashboard/admin#users' },
    { icon: '🚀', label: 'Startups', href: '/dashboard/admin#startups' },
    { icon: '💼', label: 'Investors', href: '/dashboard/admin#investors' },
    { icon: '◈', label: 'Events', href: '/dashboard/admin#events' },
    { icon: '📊', label: 'Analytics', href: '/dashboard/admin#analytics' },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  founder: 'from-violet-600 to-cyan-500',
  investor: 'from-cyan-600 to-blue-500',
  admin: 'from-rose-600 to-orange-500',
};

export default function Sidebar({ role, userName, credits, notifications = 0 }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const initials = userName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside style={{
        width: collapsed ? 70 : 240,
        minHeight: '100vh',
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        transition: 'width 0.3s ease',
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        zIndex: 40,
        backdropFilter: 'blur(20px)',
      }} className="hidden-mobile">
        {/* Logo */}
        <div style={{ padding: '0 16px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>▶</div>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
                <span style={{ color: '#a78bfa' }}>Pitch</span><span style={{ color: '#67e8f9' }}>Flow</span>
              </span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Role Badge */}
        {!collapsed && (
          <div style={{ margin: '0 16px 20px', padding: '8px 12px', borderRadius: 10, background: `linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))`, border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: role === 'admin' ? '#f97316' : role === 'investor' ? '#06b6d4' : '#a78bfa', boxShadow: `0 0 6px ${role === 'admin' ? '#f97316' : role === 'investor' ? '#06b6d4' : '#a78bfa'}` }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>{role}</span>
          </div>
        )}

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {NAV[role].map((item) => {
            const active = pathname === item.href.split('#')[0];
            return (
              <button key={item.href} onClick={() => router.push(item.href)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '10px' : '10px 12px', borderRadius: 10, marginBottom: 2,
                background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                border: active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>}
                {!collapsed && item.badge && <span style={{ marginLeft: 'auto', background: '#7c3aed', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Credits (founder/investor) */}
        {!collapsed && credits !== undefined && role !== 'admin' && (
          <div style={{ margin: '0 16px 16px', padding: '12px', borderRadius: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Credits</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa', fontFamily: 'Space Mono, monospace' }}>{credits}</span>
              <button style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}>+ Buy</button>
            </div>
          </div>
        )}

        {/* User + Sign out */}
        <div style={{ padding: '0 16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${ROLE_COLORS[role].replace('from-', '').split(' ')[0].replace('from-', '')}, ${ROLE_COLORS[role].split('to-')[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>{initials}</div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', padding: 0 }}>Sign out →</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(6,9,20,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', justifyContent: 'space-around', padding: '10px 0 max(14px, env(safe-area-inset-bottom))',
        zIndex: 50, backdropFilter: 'blur(20px)',
      }} className="mobile-nav">
        {NAV[role].slice(0, 5).map((item) => {
          const active = pathname === item.href.split('#')[0];
          return (
            <button key={item.href} onClick={() => router.push(item.href)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 12px',
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: active ? '#a78bfa' : 'rgba(255,255,255,0.35)',
            }}>
              <span style={{ fontSize: 17 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </>
  );
}
