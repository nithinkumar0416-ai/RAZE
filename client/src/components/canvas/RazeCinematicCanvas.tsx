import React, { useEffect, useRef, useState, useCallback } from 'react';

interface RazeCinematicCanvasProps {
  onHandClick?: () => void;
  className?: string;
  isAwakened?: boolean;
}

interface Particle {
  x: number;
  y: number;
  origX: number;
  origY: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  color: string;
  depth: number;
  driftSpeed: number;
  driftPhase: number;
  isLightStream?: boolean;
}

interface AstraStar {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  color: string;
  twinkleSpeed: number;
  phase: number;
  isBrightBeacon: boolean;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface HeroMeteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

export const RazeCinematicCanvas: React.FC<RazeCinematicCanvasProps> = ({
  onHandClick,
  className = '',
  isAwakened = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isHandHovered, setIsHandHovered] = useState(false);
  const [burstCount, setBurstCount] = useState(0);

  // Motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Mouse coords normalized (-1 to 1) & absolute
  const mouseRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    screenX: 0,
    screenY: 0,
    isHoveringHand: false
  });

  const burstParticlesRef = useRef<BurstParticle[]>([]);
  const handPosRef = useRef({ x: 0, y: 0, radius: 80 });

  // Handle hand click
  const triggerPalmBurst = useCallback((clickX?: number, clickY?: number) => {
    const x = clickX ?? handPosRef.current.x;
    const y = clickY ?? handPosRef.current.y;

    // Spawn 75 radiant particles
    const newBursts: BurstParticle[] = [];
    const colors = ['#FFFFFF', '#E0F2FE', '#38BDF8', '#00E5FF', '#FF5722', '#FF7043'];

    for (let i = 0; i < 75; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 6.5;
      const isOrange = Math.random() > 0.6;
      newBursts.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0, // slight upward bias
        size: 1.2 + Math.random() * 2.8,
        alpha: 1.0,
        color: isOrange ? (Math.random() > 0.5 ? '#FF5722' : '#FF7043') : colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 40 + Math.random() * 45
      });
    }

    burstParticlesRef.current.push(...newBursts);
    setBurstCount(prev => prev + 1);

    if (onHandClick) {
      onHandClick();
    }
  }, [onHandClick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      generateScene();
    };

    window.addEventListener('resize', handleResize);

    // Track mouse
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / height) * 2 - 1;
      mouseRef.current.targetX = normX;
      mouseRef.current.targetY = normY;
      mouseRef.current.screenX = e.clientX;
      mouseRef.current.screenY = e.clientY;

      // Check distance to hand
      const hx = handPosRef.current.x;
      const hy = handPosRef.current.y;
      const dist = Math.hypot(e.clientX - hx, e.clientY - hy);
      const isHover = dist < handPosRef.current.radius;
      mouseRef.current.isHoveringHand = isHover;
      setIsHandHovered(isHover);
    };

    const handleCanvasClick = (e: MouseEvent) => {
      const hx = handPosRef.current.x;
      const hy = handPosRef.current.y;
      const dist = Math.hypot(e.clientX - hx, e.clientY - hy);

      if (dist < handPosRef.current.radius + 20) {
        triggerPalmBurst(e.clientX, e.clientY);
      } else {
        // Subtle ripple at click pos
        triggerPalmBurst(e.clientX, e.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleCanvasClick);

    // =========================================================
    // SCENE GENERATION
    // =========================================================
    let stars: AstraStar[] = [];
    let particles: Particle[] = [];
    let lightRays: { x: number; width: number; speed: number; alphaOffset: number }[] = [];
    const maxZ = 1200;
    const fov = 380;

    // Meteors
    const heroMeteors: HeroMeteor[] = [];
    for (let m = 0; m < 3; m++) {
      heroMeteors.push({
        x: 0,
        y: 0,
        length: 90 + Math.random() * 90,
        speed: 14 + Math.random() * 12,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.25,
        opacity: 0,
        active: false
      });
    }

    const starPalette = ['#FFFFFF', '#E0F2FE', '#BAE6FD', '#38BDF8', '#DDD6FE'];

    const generateScene = () => {
      // 1. Astra 3D Stars background
      stars = [];
      const starCount = Math.min(380, Math.floor((width * height) / 3400));
      for (let i = 0; i < starCount; i++) {
        const isBeacon = Math.random() > 0.91;
        stars.push({
          x: (Math.random() - 0.5) * width * 2.2,
          y: (Math.random() - 0.5) * height * 2.2,
          z: Math.random() * maxZ + 20,
          size: isBeacon ? 1.6 + Math.random() * 1.5 : 0.6 + Math.random() * 1.4,
          alpha: Math.random() * 0.7 + 0.3,
          color: starPalette[Math.floor(Math.random() * starPalette.length)],
          twinkleSpeed: 0.015 + Math.random() * 0.035,
          phase: Math.random() * Math.PI * 2,
          isBrightBeacon: isBeacon
        });
      }

      // 2. Center coordinates for human silhouette
      const centerX = width * 0.5;
      const centerY = height * 0.44;
      const scale = Math.min(width / 1100, height / 950) * (width < 640 ? 0.75 : 1.0);

      // Hand position located below the torso where light rays converge
      const handX = centerX + 10 * scale;
      const handY = centerY + 180 * scale;
      handPosRef.current = { x: handX, y: handY, radius: 90 * scale };

      particles = [];

      // HELPER: Add points along Bezier / elliptical curves
      const addContourPoints = (
        curveFunc: (t: number) => { x: number; y: number },
        count: number,
        scatter: number,
        colorWeights: { white: number; ice: number; cyan: number },
        depth: number = 0.5
      ) => {
        for (let i = 0; i < count; i++) {
          const t = i / count;
          const pos = curveFunc(t);
          const sX = (Math.random() - 0.5) * scatter;
          const sY = (Math.random() - 0.5) * scatter;
          const finalX = pos.x + sX;
          const finalY = pos.y + sY;

          // Color selection
          const rand = Math.random();
          let color = '#E0F2FE';
          if (rand < colorWeights.white) color = '#FFFFFF';
          else if (rand < colorWeights.white + colorWeights.ice) color = '#BAE6FD';
          else color = '#38BDF8';

          particles.push({
            x: finalX,
            y: finalY,
            origX: finalX,
            origY: finalY,
            vx: 0,
            vy: 0,
            size: Math.random() * 2.2 + 0.8,
            baseAlpha: Math.random() * 0.65 + 0.35,
            alpha: 1,
            color,
            depth,
            driftSpeed: 0.005 + Math.random() * 0.015,
            driftPhase: Math.random() * Math.PI * 2
          });
        }
      };

      // A. HEAD / HALO ARCH (Crown of particle intelligence)
      // Elliptical arch tracing the top and sides of the human head
      addContourPoints(
        (t) => {
          // t from 0 to 1 sweeps from left temple, up over cranium, down to right temple
          const angle = Math.PI * 1.1 + t * (Math.PI * 0.8);
          const rx = 65 * scale;
          const ry = 80 * scale;
          return {
            x: centerX + Math.cos(angle) * rx,
            y: centerY - 150 * scale + Math.sin(angle) * ry
          };
        },
        180,
        14 * scale,
        { white: 0.65, ice: 0.25, cyan: 0.1 },
        0.45
      );

      // Fine dense skull crest halo (the iconic glow from the poster)
      addContourPoints(
        (t) => {
          const angle = Math.PI * 1.15 + t * (Math.PI * 0.7);
          const rx = 64 * scale;
          const ry = 78 * scale;
          return {
            x: centerX + Math.cos(angle) * rx,
            y: centerY - 150 * scale + Math.sin(angle) * ry
          };
        },
        140,
        5 * scale,
        { white: 0.85, ice: 0.15, cyan: 0.0 },
        0.4
      );

      // B. NECK COLUMNS
      // Left neck contour
      addContourPoints(
        (t) => ({
          x: centerX - 36 * scale + (t * -4) * scale,
          y: centerY - 90 * scale + t * 65 * scale
        }),
        80,
        9 * scale,
        { white: 0.5, ice: 0.35, cyan: 0.15 },
        0.5
      );

      // Right neck contour
      addContourPoints(
        (t) => ({
          x: centerX + 36 * scale + (t * 4) * scale,
          y: centerY - 90 * scale + t * 65 * scale
        }),
        80,
        9 * scale,
        { white: 0.5, ice: 0.35, cyan: 0.15 },
        0.5
      );

      // C. SHOULDERS & DELTOIDS
      // Left shoulder curve sweeping outward and down
      addContourPoints(
        (t) => {
          const p0 = { x: centerX - 40 * scale, y: centerY - 25 * scale };
          const p1 = { x: centerX - 120 * scale, y: centerY - 15 * scale };
          const p2 = { x: centerX - 200 * scale, y: centerY + 80 * scale };
          const inv = 1 - t;
          return {
            x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
            y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y
          };
        },
        220,
        22 * scale,
        { white: 0.55, ice: 0.3, cyan: 0.15 },
        0.6
      );

      // Right shoulder curve sweeping outward and down
      addContourPoints(
        (t) => {
          const p0 = { x: centerX + 40 * scale, y: centerY - 25 * scale };
          const p1 = { x: centerX + 120 * scale, y: centerY - 15 * scale };
          const p2 = { x: centerX + 200 * scale, y: centerY + 80 * scale };
          const inv = 1 - t;
          return {
            x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
            y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y
          };
        },
        220,
        22 * scale,
        { white: 0.55, ice: 0.3, cyan: 0.15 },
        0.6
      );

      // D. TORSO SIDES (Feathering into space)
      addContourPoints(
        (t) => ({
          x: centerX - (180 - t * 45) * scale,
          y: centerY + (80 + t * 120) * scale
        }),
        120,
        28 * scale,
        { white: 0.3, ice: 0.45, cyan: 0.25 },
        0.7
      );

      addContourPoints(
        (t) => ({
          x: centerX + (180 - t * 45) * scale,
          y: centerY + (80 + t * 120) * scale
        }),
        120,
        28 * scale,
        { white: 0.3, ice: 0.45, cyan: 0.25 },
        0.7
      );

      // E. DOWNWARD LIGHT STREAM PARTICLES (Flowing down into the cupped hand)
      const streamCount = 180;
      for (let i = 0; i < streamCount; i++) {
        const streamX = centerX + (Math.random() - 0.5) * 80 * scale;
        const streamY = centerY - 60 * scale + Math.random() * 230 * scale;
        particles.push({
          x: streamX,
          y: streamY,
          origX: streamX,
          origY: streamY,
          vx: 0,
          vy: 0.8 + Math.random() * 1.5,
          size: Math.random() * 1.8 + 0.6,
          baseAlpha: Math.random() * 0.7 + 0.3,
          alpha: 1,
          color: Math.random() > 0.4 ? '#FFFFFF' : '#BAE6FD',
          depth: 0.35,
          driftSpeed: 0.02 + Math.random() * 0.02,
          driftPhase: Math.random() * Math.PI * 2,
          isLightStream: true
        });
      }

      // F. LIGHT RAY COLUMNS DEFINITIONS
      lightRays = [];
      const rayCount = 14;
      for (let r = 0; r < rayCount; r++) {
        const offset = (r / (rayCount - 1) - 0.5) * 110 * scale;
        lightRays.push({
          x: centerX + offset,
          width: 4 * scale + Math.random() * 9 * scale,
          speed: 0.8 + Math.random() * 1.4,
          alphaOffset: Math.random() * Math.PI * 2
        });
      }
    };

    generateScene();

    // =========================================================
    // RENDER LOOP
    // =========================================================
    let time = 0;

    const render = () => {
      time += 0.016;

      // Smooth mouse spring interpolation
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // 1. Clear with deep void black #030407
      ctx.fillStyle = '#030407';
      ctx.fillRect(0, 0, width, height);

      // 2. Background radial nebula glow (subtle ice blue atmosphere behind silhouette)
      const scale = Math.min(width / 1100, height / 950) * (width < 640 ? 0.75 : 1.0);
      const centerX = width * 0.5 + mouse.x * 15;
      const centerY = height * 0.44 + mouse.y * 15;

      const bgGlow = ctx.createRadialGradient(
        centerX,
        centerY - 40 * scale,
        10 * scale,
        centerX,
        centerY,
        420 * scale
      );
      bgGlow.addColorStop(0, 'rgba(56, 189, 248, 0.09)');
      bgGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.03)');
      bgGlow.addColorStop(1, 'rgba(3, 4, 7, 0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // 3. Render Stars with ChatGPT Astra 3D Mouse Tracking & Celestial Depth
      const tiltX = mouse.x * 65;
      const tiltY = mouse.y * 55;

      for (let s of stars) {
        // Forward cosmic drift
        s.z -= 0.6;
        if (s.z <= 10) {
          s.z = maxZ;
          s.x = (Math.random() - 0.5) * width * 2.2;
          s.y = (Math.random() - 0.5) * height * 2.2;
        }

        const starScale = fov / s.z;
        const depthRatio = 1 - s.z / maxZ;
        const parallaxFactor = depthRatio * 1.6;

        const screenX = width * 0.5 + s.x * starScale + tiltX * parallaxFactor;
        const screenY = height * 0.5 + s.y * starScale + tiltY * parallaxFactor;

        if (screenX < -40 || screenX > width + 40 || screenY < -40 || screenY > height + 40) {
          continue;
        }

        // Cursor proximity gravity flare
        const dx = mouse.screenX - screenX;
        const dy = mouse.screenY - screenY;
        const dist = Math.hypot(dx, dy);
        let cursorInfluence = 0;
        if (dist < 130 && dist > 1) {
          cursorInfluence = (1 - dist / 130);
        }

        const twinkle = Math.sin(time * s.twinkleSpeed * 60 + s.phase);
        const baseAlpha = 0.2 + depthRatio * 0.7;
        const curAlpha = Math.min(1.0, Math.max(0.1, baseAlpha + twinkle * 0.25 + cursorInfluence * 0.45));
        const finalSize = s.size * starScale * (1 + cursorInfluence * 0.5);

        ctx.fillStyle = s.color;
        ctx.globalAlpha = curAlpha;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(0.5, finalSize), 0, Math.PI * 2);
        ctx.fill();

        // Astra 4-point diamond cross glint
        if ((s.isBrightBeacon && depthRatio > 0.45) || cursorInfluence > 0.45) {
          const glintLen = (s.size * 4.5 + cursorInfluence * 7) * starScale;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.8 * starScale;
          ctx.beginPath();
          ctx.moveTo(screenX - glintLen, screenY);
          ctx.lineTo(screenX + glintLen, screenY);
          ctx.moveTo(screenX, screenY - glintLen);
          ctx.lineTo(screenX, screenY + glintLen);
          ctx.stroke();

          // Star bloom
          const glow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glintLen * 1.4);
          glow.addColorStop(0, 'rgba(224, 242, 254, 0.45)');
          glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(screenX, screenY, glintLen * 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Shooting stars / meteors
      if (Math.random() < 0.007) {
        const inactive = heroMeteors.find(m => !m.active);
        if (inactive) {
          inactive.x = Math.random() * width * 0.9;
          inactive.y = Math.random() * height * 0.35;
          inactive.opacity = 1;
          inactive.active = true;
        }
      }

      for (let m of heroMeteors) {
        if (!m.active) continue;
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.opacity -= 0.016;
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
      }
      ctx.globalAlpha = 1.0;

      // 4. Volumetric Vertical Light Beams (Plunging down from head into the hand)
      const beamTopY = centerY - 130 * scale;
      const beamBottomY = handPosRef.current.y + 10 * scale;

      ctx.save();
      for (let ray of lightRays) {
        const rayX = ray.x + mouse.x * 22;
        const pulse = Math.sin(time * ray.speed + ray.alphaOffset);
        const rayAlpha = 0.18 + pulse * 0.08;

        const rayGrad = ctx.createLinearGradient(rayX, beamTopY, rayX, beamBottomY);
        rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        rayGrad.addColorStop(0.15, `rgba(224, 242, 254, ${rayAlpha * 0.7})`);
        rayGrad.addColorStop(0.65, `rgba(186, 230, 253, ${rayAlpha})`);
        rayGrad.addColorStop(0.95, `rgba(255, 255, 255, ${rayAlpha * 1.4})`);
        rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');

        ctx.fillStyle = rayGrad;
        ctx.fillRect(rayX - ray.width * 0.5, beamTopY, ray.width, beamBottomY - beamTopY);
      }
      ctx.restore();

      // 5. Extended Energy Hand (Silhouette + Thermal Red-Orange & Palm Energy Core)
      const handX = handPosRef.current.x + mouse.x * 30;
      const handY = handPosRef.current.y + mouse.y * 30;
      const handHoverGlow = mouse.isHoveringHand ? 1.6 : 1.0;

      ctx.save();
      // A. Thermal energy aura radiating from cupped hand (as in reference image)
      const thermalGrad = ctx.createRadialGradient(
        handX - 25 * scale,
        handY + 15 * scale,
        5 * scale,
        handX,
        handY,
        140 * scale * handHoverGlow
      );
      thermalGrad.addColorStop(0, `rgba(255, 87, 34, ${0.45 * handHoverGlow})`);
      thermalGrad.addColorStop(0.35, `rgba(255, 112, 67, ${0.22 * handHoverGlow})`);
      thermalGrad.addColorStop(0.7, 'rgba(239, 68, 68, 0.07)');
      thermalGrad.addColorStop(1, 'rgba(3, 4, 7, 0)');

      ctx.fillStyle = thermalGrad;
      ctx.beginPath();
      ctx.arc(handX, handY, 140 * scale * handHoverGlow, 0, Math.PI * 2);
      ctx.fill();

      // B. Cupped Hand silhouette drawing
      // Path represents the cupped palm holding the light
      ctx.beginPath();
      ctx.moveTo(handX - 70 * scale, handY + 10 * scale); // wrist / thumb edge
      // Thumb contour
      ctx.bezierCurveTo(
        handX - 85 * scale, handY - 15 * scale,
        handX - 75 * scale, handY - 45 * scale,
        handX - 55 * scale, handY - 40 * scale
      );
      // Palm basin
      ctx.bezierCurveTo(
        handX - 40 * scale, handY + 5 * scale,
        handX - 10 * scale, handY + 25 * scale,
        handX + 25 * scale, handY + 22 * scale
      );
      // Fingers curled upwards cradling light
      ctx.bezierCurveTo(
        handX + 55 * scale, handY + 18 * scale,
        handX + 75 * scale, handY - 10 * scale,
        handX + 70 * scale, handY - 25 * scale
      );
      // Underhand contour
      ctx.bezierCurveTo(
        handX + 50 * scale, handY + 45 * scale,
        handX - 20 * scale, handY + 60 * scale,
        handX - 60 * scale, handY + 35 * scale
      );
      ctx.closePath();

      // Hand shading: dark silhouette base with warm edge rim
      ctx.fillStyle = '#0a0d16';
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 87, 34, ${0.5 * handHoverGlow})`;
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      // C. Brilliant focal pool where light rays hit the cupped palm!
      const poolGrad = ctx.createRadialGradient(
        handX + 5 * scale,
        handY - 5 * scale,
        2 * scale,
        handX + 5 * scale,
        handY - 5 * scale,
        50 * scale
      );
      poolGrad.addColorStop(0, '#FFFFFF');
      poolGrad.addColorStop(0.3, 'rgba(224, 242, 254, 0.95)');
      poolGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.4)');
      poolGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = poolGrad;
      ctx.beginPath();
      ctx.arc(handX + 5 * scale, handY - 5 * scale, 50 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 6. Draw Particle Silhouette (with mouse parallax & organic spring easing)
      const mouseScreenX = mouse.screenX;
      const mouseScreenY = mouse.screenY;

      for (let p of particles) {
        // Floating organic drift
        const drift = Math.sin(time * 3 + p.driftPhase) * 2.5;

        // Downward cascade for light stream particles
        if (p.isLightStream) {
          p.origY += p.vy;
          if (p.origY > beamBottomY + 15 * scale) {
            p.origY = beamTopY + Math.random() * 30 * scale;
            p.origX = centerX + (Math.random() - 0.5) * 80 * scale;
          }
        }

        // Parallax target according to particle depth
        const targetX = p.origX + mouse.x * 35 * p.depth + drift * 0.5;
        const targetY = p.origY + mouse.y * 35 * p.depth + drift;

        // Cursor proximity gravity/light field
        const dx = mouseScreenX - p.x;
        const dy = mouseScreenY - p.y;
        const dist = Math.hypot(dx, dy);
        const cursorInfluenceRadius = 130;

        let proximityBoost = 0;
        if (dist < cursorInfluenceRadius && dist > 1) {
          // Subtle repelling wave + illumination
          const force = (1 - dist / cursorInfluenceRadius) * 14;
          p.vx -= (dx / dist) * force * 0.15;
          p.vy -= (dy / dist) * force * 0.15;
          proximityBoost = (1 - dist / cursorInfluenceRadius) * 0.5;
        }

        // Spring toward target
        p.vx += (targetX - p.x) * 0.08;
        p.vy += (targetY - p.y) * 0.08;
        p.vx *= 0.82; // friction
        p.vy *= 0.82;
        p.x += p.vx;
        p.y += p.vy;

        // Render particle
        const alpha = Math.min(1.0, p.baseAlpha + proximityBoost);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + proximityBoost * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 7. Render Radial Burst Particles (from clicking palm or interactive events)
      if (burstParticlesRef.current.length > 0) {
        ctx.save();
        for (let i = burstParticlesRef.current.length - 1; i >= 0; i--) {
          const bp = burstParticlesRef.current[i];
          bp.life++;
          bp.x += bp.vx;
          bp.y += bp.vy;
          bp.vx *= 0.94;
          bp.vy *= 0.94;
          bp.vy += 0.06; // slight gravity

          const progress = bp.life / bp.maxLife;
          const currentAlpha = (1 - progress) * bp.alpha;

          if (bp.life >= bp.maxLife) {
            burstParticlesRef.current.splice(i, 1);
            continue;
          }

          ctx.fillStyle = bp.color;
          ctx.globalAlpha = currentAlpha;
          ctx.beginPath();
          ctx.arc(bp.x, bp.y, bp.size * (1 - progress * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 8. Subtle interactive cursor aura
      if (mouseScreenX > 0 && mouseScreenY > 0) {
        const cursorGlow = ctx.createRadialGradient(
          mouseScreenX,
          mouseScreenY,
          2,
          mouseScreenX,
          mouseScreenY,
          110
        );
        cursorGlow.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
        cursorGlow.addColorStop(0.6, 'rgba(0, 229, 255, 0.03)');
        cursorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(mouseScreenX, mouseScreenY, 110, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [triggerPalmBurst]);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair z-0"
      />

      {/* Interactive Hand Hitbox Indicator / Tooltip on Hover */}
      <div
        className="absolute z-10 pointer-events-none transition-opacity duration-300 transform -translate-x-1/2 -translate-y-1/2 text-center"
        style={{
          left: `${handPosRef.current.x}px`,
          top: `${handPosRef.current.y + 45}px`,
          opacity: isHandHovered ? 1 : 0
        }}
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-raze-void/80 border border-raze-orange/40 backdrop-blur-md shadow-glow-orange text-[10px] tracking-widest text-raze-orange font-mono uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-raze-orange animate-ping" />
          Click to Release Energy
        </div>
      </div>
    </div>
  );
};
