'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface Prize { id: string; name: string; }

const COLORS = [
  '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444',
  '#8b5cf6', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#f87171',
];

interface WheelGameProps {
  prizes: Prize[];
  onComplete: () => void;
  /** If provided, the wheel will land on this prize ID after spinning */
  targetPrizeId?: string | null;
  /** Called when the user clicks GO to start spin (parent should call API here) */
  onSpinStart?: () => void;
}

export default function WheelGame({ prizes, onComplete, targetPrizeId, onSpinStart }: WheelGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const rotRef = useRef(0);
  const animRef = useRef<number>(0);
  const targetRotRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const segments = prizes.length > 0 ? prizes : [
    { id: '1', name: '大獎' }, { id: '2', name: '二獎' },
    { id: '3', name: '三獎' }, { id: '4', name: '四獎' },
    { id: '5', name: '安慰獎' }, { id: '6', name: '再接再厲' },
  ];
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const drawWheel = useCallback((rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const segs = segmentsRef.current;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const segAngle = (2 * Math.PI) / segs.length;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rot);

    segs.forEach((seg, i) => {
      const startAngle = i * segAngle;
      const endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text — auto-fit font size
      ctx.save();
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;

      const maxTextWidth = radius * 0.58;
      let label = seg.name;
      let fontSize = Math.min(18, 220 / segs.length);

      ctx.font = `bold ${fontSize}px "Noto Sans TC", sans-serif`;
      let measured = ctx.measureText(label).width;
      while (measured > maxTextWidth && fontSize > 10) {
        fontSize -= 1;
        ctx.font = `bold ${fontSize}px "Noto Sans TC", sans-serif`;
        measured = ctx.measureText(label).width;
      }
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
    for (let i = 0; i < segs.length; i++) {
      const angle = i * segAngle;
      const x = Math.cos(angle) * (radius - 2);
      const y = Math.sin(angle) * (radius - 2);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
    }

    ctx.restore();
  }, []);

  // Draw initial wheel
  useEffect(() => {
    drawWheel(rotRef.current);
  }, [drawWheel]);

  // When targetPrizeId arrives, calculate the exact final angle
  useEffect(() => {
    if (!targetPrizeId || !spinning) return;

    const segs = segmentsRef.current;
    const targetIndex = segs.findIndex(s => s.id === targetPrizeId);
    if (targetIndex === -1) return;

    const segAngle = (2 * Math.PI) / segs.length;
    // Pointer is at top (12 o'clock). Canvas 0° is 3 o'clock.
    // To land segment[i] under pointer: rot ≡ -π/2 - (i*segAngle + segAngle/2) (mod 2π)
    const segCenter = targetIndex * segAngle + segAngle / 2;
    let targetAngle = -Math.PI / 2 - segCenter;

    // Add jitter within segment so it doesn't always land dead center
    const jitter = (Math.random() - 0.5) * segAngle * 0.6;
    targetAngle += jitter;

    // Ensure target is well ahead of current position (at least 4 full spins)
    const curr = rotRef.current;
    const minSpins = 4;
    while (targetAngle < curr + minSpins * 2 * Math.PI) {
      targetAngle += 2 * Math.PI;
    }

    targetRotRef.current = targetAngle;
  }, [targetPrizeId, spinning]);

  const spin = useCallback(() => {
    if (spinning) return;
    completedRef.current = false;
    setSpinning(true);

    // Notify parent to call the API
    if (onSpinStart) {
      onSpinStart();
    }

    // Start animation loop
    const startTime = performance.now();
    let lastTime = startTime;
    const baseSpeed = 0.25 + Math.random() * 0.1; // initial angular velocity

    const animate = (now: number) => {
      const dt = Math.min(now - lastTime, 50); // cap delta to avoid jumps
      lastTime = now;

      const target = targetRotRef.current;
      const curr = rotRef.current;

      if (target !== null) {
        // We have a target — ease toward it
        const remaining = target - curr;

        if (remaining < 0.002) {
          // Arrived at target
          rotRef.current = target;
          drawWheel(target);
          targetRotRef.current = null;
          setSpinning(false);
          if (!completedRef.current) {
            completedRef.current = true;
            setTimeout(() => onCompleteRef.current(), 400);
          }
          return; // Stop animation
        }

        // Smooth ease-out deceleration
        const speed = Math.max(0.003, remaining * 0.05);
        rotRef.current = curr + speed;
        drawWheel(rotRef.current);
      } else {
        // No target yet — free spin at constant speed (waiting for API)
        const elapsed = (now - startTime) / 1000;
        // Slight natural deceleration while waiting, but stay fast
        const speed = baseSpeed * Math.max(0.7, 1 - elapsed * 0.02);
        rotRef.current = curr + speed * (dt / 16.67);
        drawWheel(rotRef.current);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, drawWheel, onSpinStart]);

  // Free-spin mode (for admin preview — no onSpinStart)
  const freeSpinOnly = useCallback(() => {
    if (spinning) return;
    completedRef.current = false;
    setSpinning(true);

    let speed = 0.3 + Math.random() * 0.2;

    const animate = () => {
      speed *= 0.985;
      rotRef.current += speed;
      drawWheel(rotRef.current);

      if (speed > 0.002) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current();
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);
  }, [spinning, drawWheel]);

  const handleClick = useCallback(() => {
    if (onSpinStart) {
      spin();
    } else {
      freeSpinOnly();
    }
  }, [onSpinStart, spin, freeSpinOnly]);

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
          onClick={handleClick}
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
