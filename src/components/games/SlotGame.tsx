'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣', '🎰'];

function getRandomSymbols(count: number): string[] {
  return Array.from({ length: count }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
}

export default function SlotGame({ onComplete }: { onComplete: () => void }) {
  const [reels, setReels] = useState([
    getRandomSymbols(1),
    getRandomSymbols(1),
    getRandomSymbols(1),
  ]);
  const [spinning, setSpinning] = useState(false);
  const intervals = useRef<NodeJS.Timeout[]>([]);

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);

    // Spin each reel
    const newReels = [getRandomSymbols(1), getRandomSymbols(1), getRandomSymbols(1)];

    // Animate each reel with different durations
    [0, 1, 2].forEach((reelIdx) => {
      let count = 0;
      const maxCount = 15 + reelIdx * 8; // Each reel spins longer
      const interval = setInterval(() => {
        setReels(prev => {
          const copy = [...prev];
          copy[reelIdx] = [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]];
          return copy;
        });
        count++;
        if (count >= maxCount) {
          clearInterval(interval);
          setReels(prev => {
            const copy = [...prev];
            copy[reelIdx] = newReels[reelIdx];
            return copy;
          });
          // When last reel stops
          if (reelIdx === 2) {
            setTimeout(() => {
              setSpinning(false);
              onComplete();
            }, 300);
          }
        }
      }, 60 + reelIdx * 15);
      intervals.current.push(interval);
    });
  }, [spinning, onComplete]);

  useEffect(() => {
    return () => {
      intervals.current.forEach(clearInterval);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
        🎰 幸運拉霸
      </h2>
      <div className="slot-machine">
        <div className="slot-reels">
          {reels.map((reel, i) => (
            <div key={i} className="slot-reel-window">
              <div className="slot-symbol" style={{ transition: spinning ? 'none' : 'transform 0.3s ease' }}>
                {reel[0]}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn btn-gold btn-lg"
            onClick={spin}
            disabled={spinning}
            style={{ width: '100%' }}
          >
            {spinning ? '🎰 轉動中...' : '🎰 拉下拉桿！'}
          </button>
        </div>
      </div>
      {!spinning && (
        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          點擊按鈕試試手氣！
        </p>
      )}
    </div>
  );
}
