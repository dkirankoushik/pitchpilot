'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon?: string;
  color?: string;
}

export function StatCard({ label, value, change, positive = true, icon, color = 'violet' }: StatCardProps) {
  const colors: Record<string, string> = {
    violet: 'rgba(124,58,237,0.15)',
    cyan: 'rgba(6,182,212,0.15)',
    emerald: 'rgba(16,185,129,0.15)',
    amber: 'rgba(245,158,11,0.15)',
    rose: 'rgba(244,63,94,0.15)',
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px', transition: 'border-color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</span>
        {icon && (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: colors[color] || colors.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', color: '#fff', marginBottom: 6 }}>{value}</div>
      {change && (
        <div style={{ fontSize: 12, color: positive ? '#34d399' : '#f87171', fontWeight: 600 }}>
          {positive ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  );
}

interface MatchBarProps {
  score: number;
  showLabel?: boolean;
}

export function MatchBar({ score, showLabel = false }: MatchBarProps) {
  const color = score >= 90 ? 'from-emerald-400 to-cyan-400' : score >= 80 ? 'from-amber-400 to-orange-400' : 'from-violet-400 to-pink-400';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', borderRadius: 3, background: score >= 90 ? 'linear-gradient(90deg,#34d399,#22d3ee)' : score >= 80 ? 'linear-gradient(90deg,#fbbf24,#f97316)' : 'linear-gradient(90deg,#a78bfa,#ec4899)', transition: 'width 1s ease' }} />
      </div>
      {showLabel && <span style={{ fontSize: 13, fontWeight: 700, color: score >= 90 ? '#34d399' : score >= 80 ? '#fbbf24' : '#a78bfa', minWidth: 36, textAlign: 'right' }}>{score}%</span>}
    </div>
  );
}

export function Badge({ text, color = 'violet' }: { text: string; color?: string }) {
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    violet: { bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.35)', text: '#a78bfa' },
    cyan: { bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.35)', text: '#67e8f9' },
    emerald: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', text: '#6ee7b7' },
    amber: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', text: '#fcd34d' },
    rose: { bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.35)', text: '#fda4af' },
    gray: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.6)' },
  };
  const s = styles[color] || styles.violet;
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{text}</span>
  );
}
