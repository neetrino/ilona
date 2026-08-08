'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LandingPremiumRocket } from './LandingPremiumRocket';

const INITIAL_FLIGHT_DELAY_MS = 5_000;
const FLIGHT_DELAY_RANGE_MS = { min: 90_000, max: 120_000 };
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

interface SparkParticle extends Point {
  vx: number;
  vy: number;
  age: number;
  lifetime: number;
  radius: number;
}

function randomDelay({ min, max }: { min: number; max: number }) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
      x: position.x - direction.x * 66 + spread,
      y: position.y - direction.y * 66 + spread,
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
    const alpha = Math.sin(Math.min(life * 1.7, 1) * Math.PI) * (1 - life) * 0.26;
    const colors = ['190,194,201', '226,226,228', '156,163,175'];
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

function addSpark(sparks: SparkParticle[], position: Point, direction: Point) {
  if (Math.random() < 0.42) return;
  sparks.push({
    x: position.x - direction.x * 72,
    y: position.y - direction.y * 72,
    vx: -direction.x * (35 + Math.random() * 55) + (Math.random() - 0.5) * 38,
    vy: -direction.y * (35 + Math.random() * 55) + (Math.random() - 0.5) * 38,
    age: 0,
    lifetime: 0.28 + Math.random() * 0.55,
    radius: 0.8 + Math.random() * 1.7,
  });
}

function drawSparks(context: CanvasRenderingContext2D, sparks: SparkParticle[], delta: number) {
  sparks.forEach((spark) => {
    spark.age += delta;
    spark.x += spark.vx * delta;
    spark.y += spark.vy * delta;
    const alpha = Math.max(0, 1 - spark.age / spark.lifetime);
    context.strokeStyle = `rgba(247,190,55,${alpha * 0.9})`;
    context.lineWidth = spark.radius;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(spark.x, spark.y);
    context.lineTo(spark.x - spark.vx * 0.035, spark.y - spark.vy * 0.035);
    context.stroke();
  });
  const livingSparks = sparks.filter((spark) => spark.age < spark.lifetime);
  sparks.splice(0, sparks.length, ...livingSparks.slice(-80));
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
    const sparks: SparkParticle[] = [];
    const startedAt = performance.now();
    let previousTime = startedAt;
    let animationFrame = 0;

    const render = (time: number) => {
      const elapsed = time - startedAt;
      const progress = Math.min(elapsed / FLIGHT_DURATION_MS, 1);
      const easedProgress = progress ** 2 * (3 - 2 * progress);
      const position = cubicPoint(easedProgress, size);
      const nextPosition = cubicPoint(Math.min(easedProgress + 0.002, 1), size);
      const angle = Math.atan2(nextPosition.y - position.y, nextPosition.x - position.x);
      const direction = { x: Math.cos(angle), y: Math.sin(angle) };
      const opacity = progress < 0.97 ? 1 : Math.max(0, (1 - progress) / 0.03);
      const delta = Math.min((time - previousTime) / 1000, 0.04);

      rocket.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) rotate(${angle}rad)`;
      rocket.style.opacity = String(opacity);
      if (progress < 1) {
        addSmoke(particles, position, direction);
        addSpark(sparks, position, direction);
      }
      drawSmoke(context, particles, delta);
      drawSparks(context, sparks, delta);
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
      <div ref={rocketRef} className="absolute left-0 top-0 h-[92px] w-[200px] will-change-transform max-tablet:h-[70px] max-tablet:w-[152px]">
        <LandingPremiumRocket />
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
    let flightTimer: number;

    const launch = () => {
      setFlightKey((current) => current + 1);
      setIsFlying(true);
      flightTimer = window.setTimeout(launch, randomDelay(FLIGHT_DELAY_RANGE_MS));
    };
    flightTimer = window.setTimeout(launch, INITIAL_FLIGHT_DELAY_MS);

    return () => window.clearTimeout(flightTimer);
  }, [prefersReducedMotion]);

  if (prefersReducedMotion || !isFlying) return null;
  return <RocketScene key={flightKey} onComplete={finishFlight} />;
}
