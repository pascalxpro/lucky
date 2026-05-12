'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDeviceId } from '@/lib/fingerprint';
import { Star, Trophy, ChevronLeft, ChevronRight, Volume2, VolumeX, Sparkles, Info, Calendar, MapPin, Gift, X, ZoomIn } from 'lucide-react';
import WheelGame from './games/WheelGame';
import ScratchGame from './games/ScratchGame';
import SlotGame from './games/SlotGame';
import ConfettiEffect from './effects/ConfettiEffect';
import GameResult from './games/GameResult';
import ClaimForm from './ClaimForm';
import { audioManager } from '@/lib/audio';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  gameMode: string;
  projects: Array<{
    id: string; name: string; description: string | null;
    imageUrl: string | null; images: string | null; _count: { votes: number };
  }>;
  banners: Array<{ id: string; imageUrl: string; linkUrl: string | null }>;
  prizes: Array<{ id: string; name: string; imageUrl: string | null }>;
}

interface LotteryResult {
  winnerId: string;
  prizeName: string;
  isWin: boolean;
  isConsolation: boolean;
}

/** Parse images JSON from DB */
function parseImages(images: string | null | undefined): string[] {
  if (!images) return [];
  try { return JSON.parse(images); } catch { return []; }
}

/** Per-card image carousel with auto-advance + touch swipe */
function ProjectCardImage({ project }: { project: Campaign['projects'][0] }) {
  const imgs = parseImages(project.images);
  const allImgs = imgs.length > 0 ? imgs : (project.imageUrl ? [project.imageUrl] : []);
  const [idx, setIdx] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const safeIdx = allImgs.length > 0 ? idx % allImgs.length : 0;

  useEffect(() => {
    if (allImgs.length <= 1) return;
    const timer = setInterval(() => setIdx(i => (i + 1) % allImgs.length), 3000);
    return () => clearInterval(timer);
  }, [allImgs.length]);

  if (allImgs.length === 0) {
    return (
      <div className="project-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
        🎨
      </div>
    );
  }

  return (
    <div className="project-card-img" style={{ position: 'relative', overflow: 'hidden' }}
      onTouchStart={e => setTouchX(e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touchX === null) return;
        const delta = e.changedTouches[0].clientX - touchX;
        if (Math.abs(delta) > 40) {
          setIdx(i => delta < 0 ? (i + 1) % allImgs.length : (i - 1 + allImgs.length) % allImgs.length);
        }
        setTouchX(null);
      }}
    >
      {allImgs.map((url, i) => (
        <img key={i} src={url} alt={`${project.name} ${i + 1}`}
          style={{
            position: i === 0 ? 'relative' : 'absolute',
            top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: i === safeIdx ? 1 : 0, transition: 'opacity 0.5s ease',
          }} />
      ))}
      {allImgs.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 8, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 4, zIndex: 5,
        }}>
          {allImgs.map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              style={{
                width: i === safeIdx ? 18 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                background: i === safeIdx ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.3s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
          ))}
        </div>
      )}
      {allImgs.length > 1 && (
        <div style={{
          position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)',
          color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 10,
          fontFamily: 'var(--font-en)', backdropFilter: 'blur(4px)',
        }}>
          {safeIdx + 1}/{allImgs.length}
        </div>
      )}
    </div>
  );
}

/* ── Project Detail Modal ── */
function ProjectDetailModal({ project, voteCount, hasVoted, isDisabled, onVote, onClose }: {
  project: Campaign['projects'][0];
  voteCount: number; hasVoted: boolean; isDisabled: boolean;
  onVote: () => void; onClose: () => void;
}) {
  const imgs = parseImages(project.images);
  const allImgs = imgs.length > 0 ? imgs : (project.imageUrl ? [project.imageUrl] : []);
  const [idx, setIdx] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const safeIdx = allImgs.length > 0 ? idx % allImgs.length : 0;

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && allImgs.length > 1) setIdx(i => (i - 1 + allImgs.length) % allImgs.length);
      if (e.key === 'ArrowRight' && allImgs.length > 1) setIdx(i => (i + 1) % allImgs.length);
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [allImgs.length, onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.25s ease',
    }} onClick={onClose}>
      <div style={{
        maxWidth: 540, width: '100%', maxHeight: '90vh',
        padding: 0, position: 'relative',
        borderRadius: 'var(--radius)', overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s ease',
      }} onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, zIndex: 10,
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', backdropFilter: 'blur(4px)',
        }}>
          <X size={18} />
        </button>

        {/* Image */}
        {allImgs.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#fff' }}
            onTouchStart={e => setTouchX(e.touches[0].clientX)}
            onTouchEnd={e => {
              if (touchX === null) return;
              const delta = e.changedTouches[0].clientX - touchX;
              if (Math.abs(delta) > 40) {
                setIdx(i => delta < 0 ? (i + 1) % allImgs.length : (i - 1 + allImgs.length) % allImgs.length);
              }
              setTouchX(null);
            }}
          >
            {allImgs.map((url, i) => (
              <img key={i} src={url} alt={`${project.name} ${i + 1}`}
                style={{
                  position: i === 0 ? 'relative' : 'absolute',
                  top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
                  opacity: i === safeIdx ? 1 : 0, transition: 'opacity 0.4s ease',
                }} />
            ))}
            {/* Arrows */}
            {allImgs.length > 1 && (
              <>
                <button onClick={() => setIdx(i => (i - 1 + allImgs.length) % allImgs.length)}
                  style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'rgba(0,0,0,0.4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><ChevronLeft size={20} /></button>
                <button onClick={() => setIdx(i => (i + 1) % allImgs.length)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'rgba(0,0,0,0.4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><ChevronRight size={20} /></button>
              </>
            )}
            {/* Dots */}
            {allImgs.length > 1 && (
              <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
                {allImgs.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    style={{
                      width: i === safeIdx ? 20 : 7, height: 7, borderRadius: 4, border: 'none', cursor: 'pointer',
                      background: i === safeIdx ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                      transition: 'all 0.3s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                ))}
              </div>
            )}
            {/* Counter */}
            {allImgs.length > 1 && (
              <div style={{
                position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)',
                color: '#fff', fontSize: '0.7rem', padding: '3px 10px', borderRadius: 10,
                fontFamily: 'var(--font-en)', backdropFilter: 'blur(4px)',
              }}>
                {safeIdx + 1}/{allImgs.length}
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', background: '#fff' }}>
            🎨
          </div>
        )}

        {/* Content — solid dark background for guaranteed contrast */}
        <div style={{ padding: '1.25rem 1.5rem', background: '#1a1520' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fef3e2' }}>
            {project.name}
          </h2>
          {project.description && (
            <p style={{
              fontSize: '0.92rem', lineHeight: 1.7, color: '#e0cdb8',
              marginBottom: '1.25rem', whiteSpace: 'pre-wrap',
            }}>
              {project.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-en)', fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{voteCount}</span>
              <span style={{ marginLeft: 4, fontSize: '0.75rem', color: '#c4a882' }}>票</span>
            </div>
            <button
              className={`btn ${hasVoted ? 'btn-outline' : isDisabled ? 'btn-outline' : 'btn-gold'}`}
              onClick={onVote}
              disabled={isDisabled}
              style={{ ...(isDisabled && !hasVoted ? { opacity: 0.5 } : {}), padding: '0.6rem 1.5rem' }}
            >
              {hasVoted ? '✓ 已投票' : isDisabled ? '已額滿' : '🗳️ 投票'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ campaign, maxVotesPerPerson = 0, campaignDetails = '', requireClaimInfo = true, logoUrl = '', companyName = '', votesPerGame = 1, thankYouMessage = '' }: { campaign: Campaign; maxVotesPerPerson?: number; campaignDetails?: string; requireClaimInfo?: boolean; logoUrl?: string; companyName?: string; votesPerGame?: number; thankYouMessage?: string }) {
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [votedProjects, setVotedProjects] = useState<Set<string>>(new Set());
  const [bannerIndex, setBannerIndex] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const [gameResult, setGameResult] = useState<LotteryResult | null>(null);
  const [selectedProject, setSelectedProject] = useState<Campaign['projects'][0] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [remainingVotes, setRemainingVotes] = useState<number | null>(maxVotesPerPerson > 0 ? maxVotesPerPerson : null);
  const [voteProgress, setVoteProgress] = useState(0); // tracks votes toward next game
  const [showThankYou, setShowThankYou] = useState(false);

  // Initialize vote counts
  useEffect(() => {
    const counts: Record<string, number> = {};
    campaign.projects.forEach(p => { counts[p.id] = p._count.votes; });
    setVoteCounts(counts);
  }, [campaign.projects]);

  // Banner auto-rotation
  useEffect(() => {
    if (campaign.banners.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIndex(i => (i + 1) % campaign.banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [campaign.banners.length]);

  const handleVote = useCallback(async (projectId: string) => {
    if (votedProjects.has(projectId) || voting) return;
    // Check client-side limit
    if (remainingVotes !== null && remainingVotes <= 0) {
      alert(`您已達到投票上限（${maxVotesPerPerson} 票）`);
      return;
    }
    setVoting(projectId);
    audioManager.playClick();

    try {
      const deviceId = getDeviceId();
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, campaignId: campaign.id, deviceId }),
      });
      const data = await res.json();

      if (data.success) {
        setVoteCounts(prev => ({ ...prev, [projectId]: data.voteCount }));
        setVotedProjects(prev => new Set(prev).add(projectId));
        // Update remaining votes
        if (data.remaining !== null && data.remaining !== undefined) {
          setRemainingVotes(data.remaining);
        } else if (remainingVotes !== null) {
          setRemainingVotes(r => r !== null ? r - 1 : null);
        }
        // Track vote progress toward next game
        const newProgress = voteProgress + 1;
        if (newProgress >= votesPerGame) {
          setVoteProgress(0);
          setShowGame(true);
        } else {
          setVoteProgress(newProgress);
        }
      } else if (data.alreadyVoted) {
        setVotedProjects(prev => new Set(prev).add(projectId));
        alert('您已經為此作品投過票了！');
      } else if (data.limitReached) {
        setRemainingVotes(0);
        alert(data.error);
      }
    } catch {
      alert('投票失敗，請稍後再試');
    } finally {
      setVoting(null);
    }
  }, [campaign.id, votedProjects, voting, remainingVotes, maxVotesPerPerson, voteProgress, votesPerGame]);

  const handleGameComplete = useCallback(async () => {
    try {
      const deviceId = getDeviceId();
      const res = await fetch('/api/lottery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, deviceId }),
      });
      const data = await res.json();

      if (data.success) {
        setGameResult({
          winnerId: data.winnerId,
          prizeName: data.prizeName,
          isWin: data.isWin,
          isConsolation: data.isConsolation,
        });
        if (data.isWin) {
          audioManager.playWin();
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        } else {
          audioManager.playLose();
        }
      }
    } catch {
      alert('抽獎失敗，請稍後再試');
      setShowGame(false);
    }
  }, [campaign.id]);

  const handleClaimPrize = () => {
    setShowClaim(true);
    setGameResult(null);
    setShowGame(false);
  };

  const handleCloseResult = () => {
    setGameResult(null);
    setShowGame(false);
    setShowThankYou(true);
  };

  const handleCloseThankYou = () => {
    setShowThankYou(false);
  };

  if (showClaim && gameResult) {
    return <ClaimForm winnerId={gameResult.winnerId} prizeName={gameResult.prizeName} onBack={() => setShowClaim(false)} />;
  }

  return (
    <div className="hero-bg" style={{ minHeight: '100vh' }}>
      {showConfetti && <ConfettiEffect />}

      {/* Floating orbs */}
      <div className="floating-orb" style={{ width: 300, height: 300, background: 'var(--primary)', opacity: 0.15, top: '-5%', right: '-5%' }} />
      <div className="floating-orb" style={{ width: 200, height: 200, background: 'var(--accent)', opacity: 0.1, bottom: '10%', left: '-3%', animationDelay: '3s' }} />
      <div className="floating-orb" style={{ width: 150, height: 150, background: 'var(--accent-light)', opacity: 0.1, top: '40%', right: '10%', animationDelay: '5s' }} />

      {/* Sound toggle */}
      <button
        onClick={() => setMuted(audioManager.toggleMute())}
        style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100, background: 'var(--glass)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Thank You Modal */}
      {showThankYou && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>🙏</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              <span className="text-gradient">感謝您的參與！</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.5rem', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
              {thankYouMessage || '感謝您的投票與參加抽獎活動，\n您的每一票都是最珍貴的支持！'}
            </p>
            {remainingVotes !== null && remainingVotes <= 0 ? (
              <div style={{
                padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                fontSize: '0.82rem', color: 'var(--danger)', margin: '1rem 0',
              }}>
                🏁 您的投票次數已全部用完，活動已結束！
              </div>
            ) : remainingVotes !== null && remainingVotes > 0 ? (
              <div style={{
                padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                fontSize: '0.82rem', color: 'var(--success)', margin: '1rem 0',
              }}>
                🗳️ 您還有 <strong className="font-en">{remainingVotes}</strong> 票可投，繼續支持喜愛的作品吧！
              </div>
            ) : (
              <div style={{
                padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)',
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '1rem 0',
              }}>
                🌟 繼續投票支持更多作品，還有抽獎機會等著您！
              </div>
            )}
            <button className="btn btn-gold btn-lg" onClick={handleCloseThankYou} style={{ width: '100%', marginTop: '0.5rem' }}>
              {remainingVotes !== null && remainingVotes <= 0 ? '🎉 完成' : '👍 繼續投票'}
            </button>
          </div>
        </div>
      )}

      {/* Game Modal */}
      {showGame && !gameResult && (
        <div className="modal-overlay">
          <div style={{ width: '90%', maxWidth: 500 }}>
            {campaign.gameMode === 'wheel' && <WheelGame prizes={campaign.prizes} onComplete={handleGameComplete} />}
            {campaign.gameMode === 'scratch' && <ScratchGame onComplete={handleGameComplete} />}
            {campaign.gameMode === 'slot' && <SlotGame onComplete={handleGameComplete} />}
          </div>
        </div>
      )}

      {/* Game Result */}
      {gameResult && (
        <GameResult
          result={gameResult}
          onClaim={handleClaimPrize}
          onClose={handleCloseResult}
          requireClaimInfo={requireClaimInfo}
        />
      )}

      <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '2.5rem' }} className="animate-fade-in">
          {/* Logo & Company Name */}
          {(logoUrl || companyName) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {logoUrl && (
                <img src={logoUrl} alt={companyName || 'Logo'}
                  style={{
                    width: 64, height: 64, objectFit: 'contain', borderRadius: '14px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    background: 'rgba(255,255,255,0.06)', padding: 4,
                    border: '1px solid var(--glass-border)',
                  }} />
              )}
              {companyName && (
                <div style={{
                  fontSize: '0.88rem', fontWeight: 600, letterSpacing: '0.08em',
                  color: 'var(--text-secondary)', textTransform: 'uppercase',
                }}>
                  {companyName}
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            <span className="badge badge-gold font-en">VOTE & WIN</span>
            <Sparkles size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 style={{ fontSize: 'var(--hero-title-size, clamp(1.8rem, 5vw, 2.8rem))', fontWeight: 900, lineHeight: 1.2, marginBottom: '0.75rem', color: 'var(--hero-title-color, inherit)', fontFamily: 'var(--hero-font, var(--font-heading))' }}>
            <span className="text-gradient" style={{ color: 'var(--hero-title-color, inherit)', WebkitTextFillColor: 'var(--hero-title-color, transparent)' }}>{campaign.name}</span>
          </h1>
          <p style={{ color: 'var(--hero-body-color, var(--text-secondary))', fontSize: 'var(--hero-body-size, 1.05rem)', maxWidth: 600, margin: '0 auto', fontFamily: 'var(--hero-font, inherit)' }}>
            {campaign.description}
          </p>
        </header>

        {/* Banner Carousel */}
        {campaign.banners.length > 0 && (
          <div style={{ marginBottom: '3rem', position: 'relative' }} className="animate-slide-up">
            <div style={{ overflow: 'hidden', borderRadius: 'var(--radius)' }}>
              <div className="banner-track" style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>
                {campaign.banners.map(b => (
                  <div key={b.id} className="banner-slide">
                    {b.linkUrl ? (
                      <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                        <img src={b.imageUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </a>
                    ) : (
                      <img src={b.imageUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {campaign.banners.length > 1 && (
              <>
                <button onClick={() => setBannerIndex(i => (i - 1 + campaign.banners.length) % campaign.banners.length)}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'var(--glass)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setBannerIndex(i => (i + 1) % campaign.banners.length)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'var(--glass)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={20} />
                </button>
                <div className="banner-dots">
                  {campaign.banners.map((_, i) => (
                    <button key={i} className={`banner-dot ${i === bannerIndex ? 'active' : ''}`} onClick={() => setBannerIndex(i)} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Campaign Details Section */}
        {campaignDetails && (
          <div style={{ marginBottom: '2.5rem' }} className="animate-slide-up">
            <div className="glass-card" style={{
              padding: '1.5rem 2rem',
              borderLeft: '4px solid var(--info)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Subtle background decoration */}
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 100, height: 100, borderRadius: '50%',
                background: 'rgba(59,130,246,0.05)',
              }} />
              <h2 style={{
                fontSize: 'var(--details-title-size, 1.1rem)', fontWeight: 700,
                marginBottom: '1rem', color: 'var(--details-title-color, inherit)',
                fontFamily: 'var(--details-font, var(--font-heading))',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <Info size={20} style={{ color: 'var(--info)' }} />
                活動說明
              </h2>
              <div style={{
                fontSize: 'var(--details-body-size, 0.92rem)', lineHeight: 1.8,
                color: 'var(--details-body-color, var(--text-secondary))',
                fontFamily: 'var(--details-font, inherit)',
                whiteSpace: 'pre-wrap',
              }}>
                {campaignDetails}
              </div>
            </div>
          </div>
        )}

        {/* Prize Showcase */}
        {campaign.prizes.length > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-slide-up">
            <h2 style={{ fontSize: 'var(--prize-title-size, 1.3rem)', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--prize-title-color, inherit)', fontFamily: 'var(--prize-font, var(--font-heading))' }}>
              <Trophy size={22} style={{ color: 'var(--accent)' }} />
              <span className="text-gold" style={{ color: 'var(--prize-title-color, inherit)' }}>豐富獎品等你拿</span>
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(campaign.prizes.length, 4)}, 1fr)`,
              gap: '1rem', maxWidth: 800, margin: '0 auto',
            }}>
              {campaign.prizes.map((prize, i) => {
                const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎁';
                const isTop = i === 0;
                return (
                  <div key={prize.id} className="glass-card prize-card-animated" style={{
                    padding: 0, overflow: 'hidden', textAlign: 'center',
                    animationDelay: `${i * 0.15}s`,
                  }}>
                    {/* Prize Image */}
                    <div style={{
                      width: '100%', aspectRatio: '1', overflow: 'hidden',
                      background: 'var(--gradient-card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                    }}>
                      {prize.imageUrl ? (
                        <img src={prize.imageUrl} alt={prize.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '3.5rem' }}>{rankEmoji}</span>
                      )}
                      {/* Rank badge */}
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        width: 32, height: 32, borderRadius: '50%',
                        background: i === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                                    i === 1 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' :
                                    i === 2 ? 'linear-gradient(135deg, #CD7F32, #A0522D)' :
                                    'var(--glass)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: 800, color: i < 3 ? '#1a1a2e' : 'var(--text)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        fontFamily: 'var(--font-en)',
                      }}>
                        {i + 1}
                      </div>
                    </div>
                    {/* Prize name */}
                    <div style={{
                      padding: '0.75rem 0.5rem',
                      fontSize: isTop ? 'var(--prize-body-size, 0.95rem)' : 'var(--prize-body-size, 0.85rem)',
                      fontWeight: 700, color: 'var(--prize-body-color, inherit)',
                      fontFamily: 'var(--prize-font, inherit)',
                    }}>
                      {prize.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Cards */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: 'var(--project-title-size, 1.3rem)', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--project-title-color, inherit)', fontFamily: 'var(--project-font, var(--font-heading))' }}>
            <Star size={22} style={{ color: 'var(--accent)' }} />
            投票作品
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>({campaign.projects.length})</span>
          </h2>
          {/* Vote limit info */}
          {remainingVotes !== null && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)',
              background: remainingVotes > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${remainingVotes > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              fontSize: '0.82rem', color: remainingVotes > 0 ? 'var(--success)' : 'var(--danger)',
            }}>
              🗳️ {remainingVotes > 0
                ? <>剩餘 <strong className="font-en">{remainingVotes}</strong> 票可投</>
                : <>已用完全部 <strong className="font-en">{maxVotesPerPerson}</strong> 票</>}
            </div>
          )}
          {/* Game progress indicator (when votesPerGame > 1) */}
          {votesPerGame > 1 && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
              background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Gift size={14} style={{ color: 'var(--accent)' }} />
                  {voteProgress >= votesPerGame
                    ? '🎉 已解鎖抽獎遊戲！'
                    : `再投 ${votesPerGame - voteProgress} 票即可玩抽獎遊戲`}
                </span>
                <span className="font-en" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)' }}>
                  {voteProgress}/{votesPerGame}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.round((voteProgress / votesPerGame) * 100)}%`,
                  height: '100%', borderRadius: 3,
                  background: 'var(--gradient-gold)',
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
              </div>
            </div>
          )}
        </div>

        <div className="project-grid stagger">
          {campaign.projects.map(project => {
            const hasVoted = votedProjects.has(project.id);
            const isVoting = voting === project.id;
            const limitReached = remainingVotes !== null && remainingVotes <= 0;
            const isDisabled = hasVoted || isVoting || (limitReached && !hasVoted);
            return (
              <div key={project.id} className="project-card animate-slide-up">
                <div onClick={() => setSelectedProject(project)} style={{ cursor: 'pointer', position: 'relative' }}>
                  <ProjectCardImage project={project} />
                  {/* Zoom hint */}
                  <div style={{
                    position: 'absolute', bottom: 8, right: 8,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', pointerEvents: 'none',
                  }}>
                    <ZoomIn size={14} />
                  </div>
                </div>
                <div className="project-card-body">
                  <h3 className="project-card-title">{project.name}</h3>
                  <p className="project-card-desc">{project.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span className="vote-count">{voteCounts[project.id] ?? project._count.votes}</span>
                      <span className="vote-label">票</span>
                    </div>
                    <button
                      className={`btn btn-sm ${hasVoted ? 'btn-outline' : limitReached ? 'btn-outline' : 'btn-gold'}`}
                      onClick={() => handleVote(project.id)}
                      disabled={isDisabled}
                      style={limitReached && !hasVoted ? { opacity: 0.5 } : undefined}
                    >
                      {isVoting ? '投票中...' : hasVoted ? '✓ 已投票' : limitReached ? '已達上限' : '🗳️ 投票'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Project Detail Modal */}
        {selectedProject && (() => {
          const hasVoted = votedProjects.has(selectedProject.id);
          const limitReached = remainingVotes !== null && remainingVotes <= 0;
          return (
            <ProjectDetailModal
              project={selectedProject}
              voteCount={voteCounts[selectedProject.id] ?? selectedProject._count.votes}
              hasVoted={hasVoted}
              isDisabled={hasVoted || (limitReached && !hasVoted)}
              onVote={() => { handleVote(selectedProject.id); }}
              onClose={() => setSelectedProject(null)}
            />
          );
        })()}

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--glass-border)', color: 'var(--footer-body-color, var(--text-muted))', fontSize: 'var(--footer-body-size, 0.85rem)', fontFamily: 'var(--footer-font, inherit)' }}>
          <p>© 2026 Riiqi Lucky — 互動式投票暨動態抽獎系統</p>
        </footer>
      </div>
    </div>
  );
}
