'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { audioManager } from '@/lib/audio';

export default function ScratchGame({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scratching, setScratching] = useState(false);
  const [completed, setCompleted] = useState(false);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw silver scratch layer
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#c0c0c0');
    gradient.addColorStop(0.5, '#d4d4d4');
    gradient.addColorStop(1, '#a8a8a8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add "刮開此處" text
    ctx.fillStyle = '#888';
    ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ 刮開此處 ✨', canvas.width / 2, canvas.height / 2 + 7);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || completed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, 2 * Math.PI);
    ctx.fill();

    audioManager.playScratch();

    // Check percentage scratched
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) cleared++;
    }
    const pct = cleared / (imageData.data.length / 4);
    if (pct > 0.45 && !completed) {
      setCompleted(true);
      onComplete();
    }
  }, [completed, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
        🎫 幸運刮刮樂
      </h2>
      <div className="scratch-container">
        <div className="scratch-result">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎁</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>揭曉獎品中...</div>
        </div>
        <canvas
          ref={canvasRef}
          width={320}
          height={200}
          className="scratch-canvas"
          onMouseDown={() => { isDrawing.current = true; setScratching(true); }}
          onMouseUp={() => { isDrawing.current = false; }}
          onMouseLeave={() => { isDrawing.current = false; }}
          onMouseMove={(e) => { if (isDrawing.current) { const p = getPos(e); scratch(p.x, p.y); } }}
          onTouchStart={() => { isDrawing.current = true; setScratching(true); }}
          onTouchEnd={() => { isDrawing.current = false; }}
          onTouchMove={(e) => { if (isDrawing.current) { e.preventDefault(); const p = getPos(e); scratch(p.x, p.y); } }}
        />
      </div>
      {!scratching && (
        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          用手指或滑鼠刮開銀色區域！
        </p>
      )}
    </div>
  );
}
