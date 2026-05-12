'use client';

import { Gift, X, PartyPopper } from 'lucide-react';

interface LotteryResult {
  winnerId: string;
  prizeName: string;
  isWin: boolean;
  isConsolation: boolean;
}

export default function GameResult({
  result, onClaim, onClose, requireClaimInfo = true,
}: { result: LotteryResult; onClaim: () => void; onClose: () => void; requireClaimInfo?: boolean }) {
  return (
    <div className="modal-overlay">
      <div className={`modal-content ${result.isWin ? 'win' : ''}`}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.5 }}>
          <X size={20} />
        </button>

        {result.isWin ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              <span className="text-gold">恭喜中獎！</span>
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
              您獲得了
            </p>
            <div className="glass-card" style={{ padding: '1rem', margin: '1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <Gift size={24} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{result.prizeName}</span>
            </div>
            {requireClaimInfo ? (
              <>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  請填寫收件資料以領取獎品
                </p>
                <button className="btn btn-gold btn-lg" onClick={onClaim} style={{ width: '100%' }}>
                  <PartyPopper size={20} /> 立即領獎
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  恭喜您！請留意後續通知領取獎品。
                </p>
                <button className="btn btn-gold btn-lg" onClick={onClose} style={{ width: '100%' }}>
                  🎊 太棒了！
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😊</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              {result.prizeName}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              別灰心！繼續投票，還有更多抽獎機會等著您！
            </p>
            <button className="btn btn-outline" onClick={onClose} style={{ width: '100%' }}>
              繼續投票
            </button>
          </>
        )}
      </div>
    </div>
  );
}
