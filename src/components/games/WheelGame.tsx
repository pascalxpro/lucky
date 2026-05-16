'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface Prize { id: string; name: string; }

const COLORS = [
  '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444',
  '#8b5cf6', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#f87171',
];

export default function WheelGame({ prizes, onComplete }: { prizes: Prize[]; onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const animRef = useRef<number>(0);
  const speedRef = useRef(0);

  const segments = prizes.length > 0 ? prizes : [
    { id: '1', name: '大獎' }, { id: '2', name: '二獎' },
    { id: '3', name: '三獎' }, { id: '4', name: '四獎' },
    { id: '5', name: '安慰獎' }, { id: '6', name: '再接再厲' },
  ];

  const drawWheel = useCallback((rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const segAngle = (2 * Math.PI) / segments.length;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rot);

    segments.forEach((seg, i) => {
      const startAngle = i * segAngle;
      const endAngle = startAngle + segAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text — auto-fit font size to available arc space
      ctx.save();
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;

      const maxTextWidth = radius * 0.58; // available width for text (from center button edge to near outer ring)
      let label = seg.name;
      let fontSize = Math.min(18, 220 / segments.length);

      // Try to fit the full text, shrink font if needed
      ctx.font = `bold ${fontSize}px "Noto Sans TC", sans-serif`;
      let measured = ctx.measureText(label).width;
      while (measured > maxTextWidth && fontSize > 10) {
        fontSize -= 1;
        ctx.font = `bold ${fontSize}px "Noto Sans TC", sans-serif`;
        measured = ctx.measureText(label).width;
      }
      // If still too wide after shrinking, truncate
      if (measured > maxTextWidth) {
        while (ctx.measureText(label + '..').width > maxTextWidth && label.length > 1) {
          label = label.slice(0, -1);
        }
        label += '..';
      }
      ctx.fillText(label, radius - 14, fontSize * 0.2);
      ctx.restore();
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(245,158,11,0.6)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Decorative dots
    for (let i = 0; i < segments.length; i++) {
      const angle = i * segAngle;
      const x = Math.cos(angle) * (radius - 2);
      const y = Math.sin(angle) * (radius - 2);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
    }

    ctx.restore();
  }, [segments]);

  useEffect(() => {
    drawWheel(rotation);
  }, [rotation, drawWheel]);

  const spin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    speedRef.current = 0.3 + Math.random() * 0.2;

    const decelerate = () => {
      speedRef.current *= 0.985;
      setRotation(prev => {
        const next = prev + speedRef.current;
        drawWheel(next);
        return next;
      });

      if (speedRef.current > 0.002) {
        animRef.current = requestAnimationFrame(decelerate);
      } else {
        setSpinning(false);
        onComplete();
      }
    };

    animRef.current = requestAnimationFrame(decelerate);
  }, [spinning, drawWheel, onComplete]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
        🎰 幸運轉盤
      </h2>
      <div className="wheel-wrapper">
        <div className="wheel-pointer" />
        <canvas ref={canvasRef} width={420} height={420} className="wheel-canvas" style={{ maxWidth: '90vw', maxHeight: '90vw' }} />
        <button
          className="wheel-center animate-pulse-glow"
          onClick={spin}
          disabled={spinning}
        >
          {spinning ? '轉動中' : 'GO!'}
        </button>
      </div>
      {!spinning && (
        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          點擊中心按鈕開始轉動！
        </p>
      )}
    </div>
  );
}
