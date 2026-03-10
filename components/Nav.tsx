'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export type NavRole = 'founder' | 'investor' | 'admin';

const NAV: Record<NavRole, { icon: string; label: string; section: string }[]> = {
  founder: [
    { icon: '◎', label: 'Overview', section: 'overview' },
    { icon: '▶', label: 'Feed', section: 'feed' },
    { icon: '✦', label: 'AI Match', section: 'match' },
    { icon: '📨', label: 'Invites', section: 'invites' },
    { icon: '📅', label: 'Events', section: 'events' },
  ],
  investor: [
    { icon: '◎', label: 'Overview', section: 'overview' },
    { icon: '▶', label: 'Feed', section: 'feed' },
    { icon: '✦', label: 'AI Match', section: 'match' },
    { icon: '♡', label: 'Saved', section: 'saved' },
    { icon: '📅', label: 'Events', section: 'events' },
  ],
  admin: [
    { icon: '◎', label: 'Overview', section: 'overview' },
    { icon: '⏳', label: 'Approvals', section: 'approvals' },
    { icon: '👥', label: 'Users', section: 'users' },
    { icon: '📅', label: 'Events', section: 'events' },
    { icon: '📊', label: 'Analytics', section: 'analytics' },
  ],
};

const ROLE_COLOR: Record<NavRole, string> = {
  founder: 'var(--ink)',
  investor: 'var(--blue)',
  admin: 'var(--rose)',
};

function Av({ name, sz = 32 }: { name: string; sz?: number }) {
  const cs = ['#D4C5F9', '#C5D4F9', '#C5F9D4', '#F9D4C5', '#F9C5D4'];
  return <div style={{ width: sz, height: sz, borderRadius: sz / 3, background: cs[name.charCodeAt(0) % cs.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: sz * .38, color: 'var(--ink)', flexShrink: 0 }}>{name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</div>;
}

interface Props {
  role: NavRole;
  userName: string;
  credits?: number;
  section: string;
  onSection(s: string): void;
}

export function SideNav({ role, userName, credits, section, onSection }: Props) {
  const router = useRouter();
  const accent = ROLE_COLOR[role];

  return (
    <aside className="sidebar" style={{ width: 220, minHeight: '100vh', background: 'var(--surface)', borderRight: '1px solid var(--border)', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40, padding: '22px 0' }}>
      {/* Logo */}
      <div style={{ padding: '0 18px', marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>▶</span>
          PitchPilot
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', letterSpacing: .7, background: role === 'admin' ? 'var(--roseBg)' : role === 'investor' ? 'var(--blueBg)' : 'var(--s50)', color: accent, border: `1px solid ${role === 'admin' ? 'var(--roseBorder)' : role === 'investor' ? 'var(--blueBorder)' : 'var(--border)'}` }}>
          {role}
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 8px' }}>
        {NAV[role].map(item => {
          const active = section === item.section;
          return (
            <button key={item.section}
              onClick={() => item.section === 'feed' ? router.push('/feed') : onSection(item.section)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 9, marginBottom: 2, background: active ? 'var(--s50)' : 'transparent', color: active ? 'var(--text)' : 'var(--text2)', cursor: 'pointer', border: 'none', fontSize: 14, fontWeight: active ? 700 : 500, transition: 'all .15s', fontFamily: 'inherit', textAlign: 'left' }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
              {active && <span style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: accent, flexShrink: 0 }} />}
            </button>
          );
        })}
      </nav>

      {/* Credits */}
      {credits !== undefined && role !== 'admin' && (
        <div style={{ margin: '0 14px 14px', padding: '12px 14px', borderRadius: 11, background: 'var(--s50)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .8, marginBottom: 4 }}>Pitch Credits</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 24, fontWeight: 800 }}>{credits}</span>
            <button style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--ink)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>+ Buy</button>
          </div>
        </div>
      )}

      {/* User */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <Av name={userName} sz={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
          </div>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>Sign out</button>
      </div>
    </aside>
  );
}

export function BottomNav({ role, section, onSection }: { role: NavRole; section: string; onSection(s: string): void }) {
  const router = useRouter();
  return (
    <div className="bottomnav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(247,246,243,.96)', borderTop: '1px solid var(--border)', justifyContent: 'space-around', padding: '10px 0', paddingBottom: 'max(10px,env(safe-area-inset-bottom))', backdropFilter: 'blur(12px)', zIndex: 60 }}>
      {NAV[role].map(item => {
        const active = section === item.section;
        return (
          <button key={item.section} onClick={() => item.section === 'feed' ? router.push('/feed') : onSection(item.section)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '2px 10px', border: 'none', background: 'transparent', cursor: 'pointer', color: active ? 'var(--text)' : 'var(--text3)', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, color = '' }: { label: string; value: string | number; sub?: string; icon?: string; color?: string }) {
  const bgs: Record<string, string> = { green: 'var(--greenBg)', amber: 'var(--amberBg)', blue: 'var(--blueBg)', rose: 'var(--roseBg)' };
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: .8 }}>{label}</span>
        {icon && <div style={{ width: 32, height: 32, borderRadius: 9, background: bgs[color] || 'var(--s50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
