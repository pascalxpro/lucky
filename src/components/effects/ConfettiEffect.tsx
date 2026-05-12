'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#fbbf24'];

export default function ConfettiEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width, y: -20 - Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 6, vy: Math.random() * 3 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4, rot: Math.random() * 6.28, opacity: 1,
    }));

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.rot += 0.1; p.opacity -= 0.003;
        if (p.opacity <= 0) return;
        alive = true;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
        ctx.restore();
      });
      if (alive) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} />;
}
