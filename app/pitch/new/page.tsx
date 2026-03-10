'use client';
import { useRouter } from 'next/navigation';

export default function NewPitch() {
  const router = useRouter();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🎬</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Coming Soon</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Video upload launching soon!</p>
        <button className="btn btn-ink" onClick={() => router.push('/dashboard/founder')}>Go to Dashboard</button>
      </div>
    </div>
  );
}
