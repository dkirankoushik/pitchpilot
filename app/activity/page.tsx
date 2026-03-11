'use client';
import { useState, useEffect } from 'react';
import { supabase, getSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

const NOTIFS = [
  { ic: '♥', msg: 'NeuralPay liked your comment', time: '2m', unread: true, color: 'var(--rose)' },
  { ic: '👤', msg: 'Sequoia Capital started following you', time: '1h', unread: true, color: 'var(--blue)' },
  { ic: '💬', msg: 'MedSync replied to your question', time: '3h', unread: true, color: 'var(--green)' },
  { ic: '✦', msg: 'AI matched you with 3 new investors', time: '5h', unread: false, color: 'var(--amber)' },
  { ic: '🔖', msg: 'An investor saved your pitch video', time: '1d', unread: false, color: 'var(--ink)' },
  { ic: '♥', msg: 'FlowDesk liked your comment on their pitch', time: '2d', unread: false, color: 'var(--rose)' },
  { ic: '📣', msg: 'New pitch competition deadline approaching', time: '3d', unread: false, color: 'var(--amber)' },
];

export default function ActivityPage() {
  const router = useRouter();
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

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spin" /></div>;

  return (
    <div className="app-shell">
      <Nav user={{ name: userName, role: userRole, email: '' }} />
      <main className="main-content">
        <div className="top-bar"><span className="top-logo">Activity</span></div>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'rgba(247,246,243,.95)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 800, display: 'none' }}>Activity</div>
          </div>
          {/* Sections */}
          {['This week', 'Earlier'].map((section, si) => (
            <div key={section}>
              <div style={{ padding: '14px 16px 6px', fontSize: 14, fontWeight: 700, color: 'var(--text2)' }}>{section}</div>
              {NOTIFS.slice(si === 0 ? 0 : 4, si === 0 ? 4 : 7).map((n, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: n.unread ? 'rgba(26,92,58,.04)' : 'transparent', cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: n.unread ? 'var(--surface)' : 'var(--s50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0, border: '1px solid var(--border)' }}>{n.ic}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.4, color: 'var(--text)' }}>{n.msg}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{n.time} ago</div>
                  </div>
                  {n.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
