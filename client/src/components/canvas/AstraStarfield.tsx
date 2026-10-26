import React, { useEffect, useRef } from 'react';

interface AstraStarfieldProps {
  className?: string;
  opacity?: number;
  starCount?: number;
  interactive?: boolean;
}

interface AstraStar3D {
  x: number;
  y: number;
  z: number;
  origZ: number;
  size: number;
  color: string;
  twinklePhase: number;
  twinkleSpeed: number;
  isBrightBeacon: boolean;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

export const AstraStarfield: React.FC<AstraStarfieldProps> = ({
  className = '',
  opacity = 0.85,
  starCount = 380,
  interactive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse tracking with inertia
  const mouseRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    vx: 0,
    vy: 0,
    screenX: -1000,
    screenY: -1000
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / height) * 2 - 1;

      mouseRef.current.targetX = normX;
      mouseRef.current.targetY = normY;
      mouseRef.current.screenX = e.clientX;
      mouseRef.current.screenY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // ========================================================
    // ASTRA 3D STAR SYSTEM INITIALIZATION
    // ========================================================
    let stars: AstraStar3D[] = [];
    const maxZ = 1200;
    const fov = 380;

    const starColors = [
      '#FFFFFF',
      '#E0F2FE', // Ice Blue
      '#BAE6FD', // Light Cyan
      '#38BDF8', // Pulsar Blue
      '#DDD6FE'  // Subtle Astral Violet
    ];

    const initStars = () => {
      stars = [];
      const actualCount = Math.min(starCount, Math.floor((width * height) / 3200));

      for (let i = 0; i < actualCount; i++) {
        const z = Math.random() * maxZ + 10;
        const color = starColors[Math.floor(Math.random() * starColors.length)];
        const isBeacon = Math.random() > 0.92; // 8% of stars have 4-point Astra diamond flare

        stars.push({
          x: (Math.random() - 0.5) * width * 2.2,
          y: (Math.random() - 0.5) * height * 2.2,
          z,
          origZ: z,
          size: isBeacon ? 1.8 + Math.random() * 1.4 : 0.6 + Math.random() * 1.5,
          color,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.015 + Math.random() * 0.035,
          isBrightBeacon: isBeacon
        });
      }
    };

    initStars();

    // ========================================================
    // ASTRAL METEOR / SHOOTING STAR SYSTEM
    // ========================================================
    const meteors: Meteor[] = [];
    for (let m = 0; m < 3; m++) {
      meteors.push({
        x: 0,
        y: 0,
        length: 80 + Math.random() * 100,
        speed: 12 + Math.random() * 14,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2, // ~45 deg diagonal
        opacity: 0,
        active: false
      });
    }

    let meteorTimer = 0;
    const spawnMeteor = () => {
      const inactive = meteors.find(m => !m.active);
      if (inactive) {
        inactive.x = Math.random() * width * 0.9;
        inactive.y = Math.random() * height * 0.35;
        inactive.opacity = 1;
        inactive.active = true;
      }
    };

    // ========================================================
    // RENDER LOOP (Astra Cosmic Space Flight & Mouse Tracking)
    // ========================================================
    let time = 0;

    const render = () => {
      time += 0.016;

      // Mouse inertia spring damping
      const mouse = mouseRef.current;
      const prevX = mouse.x;
      const prevY = mouse.y;

      mouse.x += (mouse.targetX - mouse.x) * 0.055;
      mouse.y += (mouse.targetY - mouse.y) * 0.055;
      mouse.vx = mouse.x - prevX;
      mouse.vy = mouse.y - prevY;

      // Clear with transparency so background theme shines through
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;

      // Multi-layer tilt offsets based on mouse position
      const tiltX = mouse.x * 65;
      const tiltY = mouse.y * 55;

      // Render Stars
      for (let star of stars) {
        // Continuous gentle cosmic forward drift
        star.z -= 0.65;
        if (star.z <= 10) {
          star.z = maxZ;
          star.x = (Math.random() - 0.5) * width * 2.2;
          star.y = (Math.random() - 0.5) * height * 2.2;
        }

        // 3D Perspective Projection
        const scale = fov / star.z;
        const depthRatio = 1 - star.z / maxZ; // 0 (far) to 1 (near)

        // Parallax shift is proportional to proximity (near stars move much more)
        const parallaxFactor = depthRatio * 1.6;
        const screenX = centerX + star.x * scale + tiltX * parallaxFactor;
        const screenY = centerY + star.y * scale + tiltY * parallaxFactor;

        // Skip if outside viewport
        if (screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) {
          continue;
        }

        // Interactive Cursor Gravity: stars passing near the cursor get pulled and flare up
        const dx = mouse.screenX - screenX;
        const dy = mouse.screenY - screenY;
        const dist = Math.hypot(dx, dy);
        let cursorInfluence = 0;

        if (dist < 140 && dist > 1) {
          cursorInfluence = (1 - dist / 140);
        }

        // Twinkle calculation
        const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.twinklePhase);
        const baseAlpha = 0.25 + depthRatio * 0.65;
        const alpha = Math.min(1.0, Math.max(0.1, baseAlpha + twinkle * 0.2 + cursorInfluence * 0.5));
        const currentSize = star.size * scale * (1 + cursorInfluence * 0.6);

        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha * opacity;

        // Draw star core
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(0.6, currentSize), 0, Math.PI * 2);
        ctx.fill();

        // If Bright Beacon or high cursor influence: draw Astra 4-point diamond cross glint!
        if ((star.isBrightBeacon && depthRatio > 0.4) || cursorInfluence > 0.4) {
          const glintLen = (star.size * 5 + cursorInfluence * 8) * scale;
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 0.8 * scale;
          ctx.beginPath();
          // Horizontal flare
          ctx.moveTo(screenX - glintLen, screenY);
          ctx.lineTo(screenX + glintLen, screenY);
          // Vertical flare
          ctx.moveTo(screenX, screenY - glintLen);
          ctx.lineTo(screenX, screenY + glintLen);
          ctx.stroke();

          // Soft radial glow around bright star
          const radGrad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glintLen * 1.2);
          radGrad.addColorStop(0, 'rgba(224, 242, 254, 0.4)');
          radGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(screenX, screenY, glintLen * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ========================================================
      // RENDER ASTRAL SHOOTING STARS / METEORS
      // ========================================================
      meteorTimer++;
      if (meteorTimer % 180 === 0 && Math.random() > 0.3) {
        spawnMeteor();
      }

      for (let m of meteors) {
        if (!m.active) continue;

        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.opacity -= 0.014;

        if (m.opacity <= 0 || m.x > width + 100 || m.y > height + 100) {
          m.active = false;
          continue;
        }

        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(0.7, `rgba(224, 242, 254, ${m.opacity * 0.6})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${m.opacity})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        // Meteor Head Sparkle
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = m.opacity;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [opacity, starCount, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none ${className}`}
    />
  );
};
