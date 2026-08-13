"use client";

/**
 * Confetti — lightweight canvas-based celebration burst.
 *
 * Triggered on PR or milestone. Renders a single 3-second particle shower
 * centered on the viewport; auto-cleans on unmount. No external deps.
 */

import { useEffect, useRef } from "react";

interface Props {
  active: boolean;
  duration?: number;   // ms
  particleCount?: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; color: string;
  rot: number; vrot: number;
  life: number;
}

const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#a3e635", "#f59e0b", "#f43f5e"];

export default function Confetti({ active, duration = 2200, particleCount = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size to viewport
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 3;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 8;
      particles.push({
        x: originX + (Math.random() - 0.5) * 100,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 6 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        life: 1,
      });
    }

    const start = performance.now();
    const gravity = 0.25;
    const tick = (now: number) => {
      const t = (now - start) / duration;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.vy += gravity;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.life = Math.max(0, 1 - t);
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, duration, particleCount]);

  if (!active) return null;
  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" />
  );
}
