'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const FLIGHT_INTERVAL_MS = 15_000;
const INITIAL_FLIGHT_DELAY_MS = 1_500;
const FLIGHT_DURATION_MS = 6_200;
const SMOKE_SETTLE_MS = 1_800;

interface Point {
  x: number;
  y: number;
}

interface SmokeParticle extends Point {
  vx: number;
  vy: number;
  radius: number;
  age: number;
  lifetime: number;
  tone: number;
}

function PremiumRocket() {
  return (
    <svg viewBox="0 0 180 90" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="rocket-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#dbe5f2" />
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#8da2bd" />
        </linearGradient>
        <linearGradient id="rocket-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3ad" />
          <stop offset="0.35" stopColor="#d4af37" />
          <stop offset="0.7" stopColor="#fff0a0" />
          <stop offset="1" stopColor="#9a6f12" />
        </linearGradient>
        <radialGradient id="rocket-window" cx="35%" cy="28%">
          <stop offset="0" stopColor="#dff7ff" />
          <stop offset="0.38" stopColor="#62c7ee" />
          <stop offset="1" stopColor="#073b75" />
        </radialGradient>
        <filter id="rocket-shadow" x="-30%" y="-50%" width="170%" height="200%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#061b45" floodOpacity="0.35" />
        </filter>
        <filter id="flame-glow" x="-80%" y="-100%" width="260%" height="300%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <g filter="url(#rocket-shadow)">
        <path d="M40 45C60 12 112 5 161 45C112 85 60 78 40 45Z" fill="url(#rocket-body)" stroke="#17366f" strokeWidth="2" />
        <path d="M111 14C132 18 149 29 161 45C149 61 132 72 111 76C125 59 125 31 111 14Z" fill="url(#rocket-gold)" />
        <path d="M61 25L32 7L36 39Z" fill="url(#rocket-gold)" stroke="#17366f" strokeWidth="2" />
        <path d="M61 65L32 83L36 51Z" fill="url(#rocket-gold)" stroke="#17366f" strokeWidth="2" />
        <path d="M39 35H24V55H39Z" fill="#263c66" stroke="#0b1f46" strokeWidth="2" />
        <circle cx="89" cy="45" r="15" fill="url(#rocket-gold)" />
        <circle cx="89" cy="45" r="10.5" fill="url(#rocket-window)" stroke="#102b5c" strokeWidth="2" />
        <path d="M52 36C77 20 105 18 129 28" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g>
        <path d="M24 37C8 39-5 45-18 45C-5 45 8 51 24 53Z" fill="#ff8a00" filter="url(#flame-glow)" opacity="0.55" />
        <path d="M24 37C7 39-5 45-19 45C-4 47 8 52 24 53Z" fill="#ff5b16">
          <animate attributeName="d" dur="0.18s" repeatCount="indefinite" values="M24 37C7 39-5 45-19 45C-4 47 8 52 24 53Z;M24 37C10 40 0 45-12 45C0 47 10 50 24 53Z;M24 37C7 39-5 45-19 45C-4 47 8 52 24 53Z" />
        </path>
        <path d="M24 40C12 41 4 45-6 45C4 46 12 49 24 50Z" fill="#fff4b0" />
      </g>
    </svg>
  );
}

function cubicPoint(progress: number, size: Point): Point {
  const inverse = 1 - progress;
  const start = { x: size.x + 100, y: size.y + 90 };
  const controlA = { x: size.x * 0.9, y: size.y * 0.76 };
  const controlB = { x: size.x * 0.42, y: size.y * 0.3 };
  const end = { x: 28, y: 28 };

  return {
    x: inverse ** 3 * start.x + 3 * inverse ** 2 * progress * controlA.x + 3 * inverse * progress ** 2 * controlB.x + progress ** 3 * end.x,
    y: inverse ** 3 * start.y + 3 * inverse ** 2 * progress * controlA.y + 3 * inverse * progress ** 2 * controlB.y + progress ** 3 * end.y,
  };
}

function addSmoke(particles: SmokeParticle[], position: Point, direction: Point) {
  for (let index = 0; index < 2; index += 1) {
    const spread = (Math.random() - 0.5) * 22;
    particles.push({
      x: position.x - direction.x * 48 + spread,
      y: position.y - direction.y * 48 + spread,
      vx: -direction.x * (8 + Math.random() * 12) + (Math.random() - 0.5) * 9,
      vy: -direction.y * (8 + Math.random() * 12) - 5 - Math.random() * 7,
      radius: 8 + Math.random() * 11,
      age: 0,
      lifetime: 2.2 + Math.random() * 2.1,
      tone: Math.floor(Math.random() * 3),
    });
  }
}

function drawSmoke(context: CanvasRenderingContext2D, particles: SmokeParticle[], delta: number) {
  context.clearRect(0, 0, context.canvas.clientWidth, context.canvas.clientHeight);

  particles.forEach((particle) => {
    particle.age += delta;
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.vx *= 0.995;
    particle.vy -= 1.6 * delta;
    particle.radius += 10 * delta;
    const life = particle.age / particle.lifetime;
    const alpha = Math.sin(Math.min(life * 1.7, 1) * Math.PI) * (1 - life) * 0.3;
    const colors = ['203,213,225', '226,232,240', '174,187,204'];
    const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius);
    gradient.addColorStop(0, `rgba(${colors[particle.tone]},${alpha})`);
    gradient.addColorStop(0.5, `rgba(${colors[particle.tone]},${alpha * 0.62})`);
    gradient.addColorStop(1, `rgba(${colors[particle.tone]},0)`);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
  });

  const livingParticles = particles.filter((particle) => particle.age < particle.lifetime);
  particles.splice(0, particles.length, ...livingParticles.slice(-240));
}

function RocketScene({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const rocket = rocketRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !rocket || !context) return;

    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    const size = { x: window.innerWidth, y: window.innerHeight };
    canvas.width = size.x * pixelRatio;
    canvas.height = size.y * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const particles: SmokeParticle[] = [];
    const startedAt = performance.now();
    let previousTime = startedAt;
    let animationFrame = 0;

    const render = (time: number) => {
      const elapsed = time - startedAt;
      const progress = Math.min(elapsed / FLIGHT_DURATION_MS, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      const position = cubicPoint(easedProgress, size);
      const nextPosition = cubicPoint(Math.min(easedProgress + 0.002, 1), size);
      const angle = Math.atan2(nextPosition.y - position.y, nextPosition.x - position.x);
      const direction = { x: Math.cos(angle), y: Math.sin(angle) };
      const opacity = progress < 0.97 ? 1 : Math.max(0, (1 - progress) / 0.03);
      const delta = Math.min((time - previousTime) / 1000, 0.04);

      rocket.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) rotate(${angle}rad)`;
      rocket.style.opacity = String(opacity);
      if (progress < 1) addSmoke(particles, position, direction);
      drawSmoke(context, particles, delta);
      previousTime = time;

      if (elapsed < FLIGHT_DURATION_MS + SMOKE_SETTLE_MS) {
        animationFrame = requestAnimationFrame(render);
      } else {
        onComplete();
      }
    };

    animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, [onComplete]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div ref={rocketRef} className="absolute left-0 top-0 h-[88px] w-[176px] will-change-transform max-tablet:h-[60px] max-tablet:w-[120px]">
        <PremiumRocket />
      </div>
    </div>
  );
}

export function LandingRocketFlight() {
  const prefersReducedMotion = useReducedMotion();
  const [flightKey, setFlightKey] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const finishFlight = useCallback(() => setIsFlying(false), []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const launch = () => {
      setFlightKey((current) => current + 1);
      setIsFlying(true);
    };
    const initialTimer = window.setTimeout(launch, INITIAL_FLIGHT_DELAY_MS);
    const flightTimer = window.setInterval(launch, FLIGHT_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(flightTimer);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion || !isFlying) return null;
  return <RocketScene key={flightKey} onComplete={finishFlight} />;
}
