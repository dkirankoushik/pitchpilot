'use client';
import { useState, useEffect } from 'react';
import { supabase, getSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

// Startup pitch YouTube video IDs (real startup/pitch related content)
const PITCH_VIDEOS = [
  { id: 'pVPfy5lV7oA', company: 'NeuralPay', founder: 'Arjun Mehta', sector: 'FinTech', stage: 'Seed', raise: '$500K', mrr: '$12K', location: 'Mumbai', desc: 'Revolutionizing UPI-based lending with AI credit scoring. We help 200M Indians access credit in 90 seconds.', likes: 284, comments: 47, time: '2h ago', avatar: '👨‍💻' },
  { id: 'Wd5KxIUBqrE', company: 'MedSync', founder: 'Priya Sharma', sector: 'HealthTech', stage: 'Pre-Seed', raise: '$250K', mrr: '$4K', location: 'Bangalore', desc: 'Connecting patients to specialists in tier-2 cities via telemedicine. 10K consultations in 3 months.', likes: 189, comments: 32, time: '5h ago', avatar: '👩‍⚕️' },
  { id: 'eTR7KGf7kKc', company: 'FlowDesk', founder: 'Rahul Verma', sector: 'SaaS', stage: 'Series A', raise: '$2M', mrr: '$85K', location: 'Hyderabad', desc: 'No-code workflow automation for SMBs. Think Zapier but built for India — vernacular support, UPI billing.', likes: 456, comments: 89, time: '8h ago', avatar: '👨‍🔧' },
  { id: 'WumFiUlwQ7g', company: 'AgriChain', founder: 'Sneha Patel', sector: 'AgriTech', stage: 'Seed', raise: '$750K', mrr: '$28K', location: 'Pune', desc: 'Farm-to-fork supply chain platform eliminating 3 layers of middlemen. Working with 2,400 farmers.', likes: 312, comments: 54, time: '1d ago', avatar: '👩‍🌾' },
  { id: 'L1kbrlZRDvU', company: 'EduVerse', founder: 'Karan Singh', sector: 'EdTech', stage: 'Pre-Seed', raise: '$300K', mrr: '$7K', location: 'Delhi', desc: 'AI-powered personalized learning in regional languages. 40% better outcomes vs traditional coaching.', likes: 221, comments: 38, time: '1d ago', avatar: '👨‍🏫' },
  { id: 'nKIu9yen5nc', company: 'GreenGrid', founder: 'Ananya Roy', sector: 'CleanTech', stage: 'Seed', raise: '$1M', mrr: '$35K', location: 'Chennai', desc: 'Peer-to-peer solar energy trading marketplace. Households sell surplus power directly to neighbors.', likes: 547, comments: 112, time: '2d ago', avatar: '👩‍🔬' },
];

interface FeedPost { id: string; company: string; founder: string; sector: string; stage: string; raise: string; mrr: string; location: string; desc: string; likes: number; comments: number; time: string; avatar: string; }

function VideoCard({ post, currentUser }: { post: FeedPost & { id: string }; currentUser: string }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showMenu, setShowMenu] = useState(false);

  const stageColor: Record<string, string> = { 'Seed': 'tag-green', 'Pre-Seed': 'tag-amber', 'Series A': 'tag-blue', 'Series B': 'tag-ink' };

  return (
    <article className="feed-card fade-in">
      {/* Header */}
      <div className="fc-header">
        <div className="fc-av" style={{ background: '#1C1A17', color: '#F7F6F3', fontWeight: 700, fontSize: 14 }}>{post.avatar}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="fc-name">{post.company}</div>
          <div className="fc-sub">{post.founder} · {post.location}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="fc-more" onClick={() => setShowMenu(!showMenu)}>⋯</button>
          {showMenu && (
            <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '4px 0', minWidth: 160, zIndex: 50, boxShadow: '0 8px 24px rgba(28,26,23,.12)' }}>
              {[['Share', '↗'], ['Save', '🔖'], ['Report', '⚑']].map(([lb, ic]) => (
                <button key={lb} onClick={() => setShowMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', color: 'var(--text)' }}>
                  <span>{ic}</span>{lb}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tags row */}
      <div style={{ padding: '0 16px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className={`tag ${stageColor[post.stage] || 'tag'}`}>{post.stage}</span>
        <span className="tag">{post.sector}</span>
        <span className="tag">Raising {post.raise}</span>
        {post.mrr && <span className="tag tag-green">MRR {post.mrr}</span>}
      </div>

      {/* YouTube Video */}
      <div className="video-wrap">
        <iframe
          src={`https://www.youtube.com/embed/${post.id}?rel=0&modestbranding=1`}
          title={`${post.company} pitch`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>

      {/* Actions */}
      <div className="fc-actions">
        <button className={`fc-btn${liked ? ' liked' : ''}`} onClick={() => { setLiked(!liked); setLikeCount(c => liked ? c - 1 : c + 1); }}>
          {liked ? '♥' : '♡'}
        </button>
        <button className="fc-btn">💬</button>
        <button className="fc-btn">↗</button>
        <button className={`fc-btn${saved ? ' saved' : ''} fc-share`} onClick={() => setSaved(!saved)}>
          {saved ? '🔖' : '⊹'}
        </button>
      </div>

      {/* Likes */}
      <div className="fc-likes">{likeCount.toLocaleString()} likes</div>

      {/* Caption */}
      <div className="fc-caption">
        <strong>{post.company}</strong>{post.desc}
      </div>

      {/* Comment hint */}
      <div style={{ padding: '0 16px 6px', color: 'var(--text3)', fontSize: 13 }}>View all {post.comments} comments</div>

      {/* Time */}
      <div className="fc-time">{post.time}</div>
    </article>
  );
}

function StoriesBar({ userId }: { userId: string }) {
  const stories = [
    { name: 'Your story', av: '＋', own: true },
    { name: 'NeuralPay', av: '🤖' },
    { name: 'MedSync', av: '🏥' },
    { name: 'FlowDesk', av: '⚡' },
    { name: 'AgriChain', av: '🌾' },
    { name: 'EduVerse', av: '📚' },
    { name: 'GreenGrid', av: '☀️' },
  ];
  return (
    <div className="stories-bar">
      {stories.map((s, i) => (
        <div key={i} className="story-item">
          <div className={`story-ring${i === 0 ? ' add-new' : ''}`}>
            <div className="story-av">{s.av}</div>
          </div>
          <span className="story-label">{s.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('founder');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(s => {
      if (!s) { router.replace('/'); return; }
      setUserId(s.user.id);
      supabase.from('profiles').select('full_name,role').eq('id', s.user.id).single().then(({ data }) => {
        if (data) { setUserName(data.full_name || ''); setUserRole(data.role); }
        setLoading(false);
      });
    });
  }, [router]);

  if (loading) return (
    <div className="app-shell">
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spin" />
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Nav user={{ name: userName, role: userRole, email: '' }} />
      <main className="main-content">
        {/* Mobile top bar */}
        <div className="top-bar">
          <span className="top-logo">PitchPilot</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text)' }}>♡</button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text)' }}>✉</button>
          </div>
        </div>

        <div className="feed-center">
          <StoriesBar userId={userId} />
          {PITCH_VIDEOS.map((post, i) => (
            <VideoCard key={i} post={post} currentUser={userId} />
          ))}
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            You&apos;re all caught up · Check back soon for new pitches
          </div>
        </div>
      </main>
    </div>
  );
}
