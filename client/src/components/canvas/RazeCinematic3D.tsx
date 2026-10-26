import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface RazeCinematic3DProps {
  onHandClick?: () => void;
  className?: string;
  isAwakened?: boolean;
}

export const RazeCinematic3D: React.FC<RazeCinematic3DProps> = ({
  onHandClick,
  className = '',
  isAwakened = false
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHandHovered, setIsHandHovered] = useState(false);
  const isHoveredRef = useRef(false);

  // Motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Mouse coordinates normalized (-1 to 1) and screen coords
  const mouseRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    screenX: 0,
    screenY: 0
  });

  const triggerAwakenRef = useRef(onHandClick);
  triggerAwakenRef.current = onHandClick;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // ============================================================
    // 1. THREE.JS SCENE, CAMERA, RENDERER
    // ============================================================
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020306, 0.0018);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('WebGL init failed:', e);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020306, 1.0);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Root group for all 3D entity components (enables mouse tilt & parallax)
    const entityGroup = new THREE.Group();
    scene.add(entityGroup);

    // Center offset for the figure: head around y=2.8, hand at y=-1.8
    entityGroup.position.set(0, 0.6, 0);

    // ============================================================
    // 2. TEXTURE GENERATORS (GLOWING SPHERES & DIFFRACTION SPIKES)
    // ============================================================
    const createParticleTexture = (): THREE.Texture => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.18, 'rgba(224, 242, 254, 0.95)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.45)');
      grad.addColorStop(0.8, 'rgba(14, 165, 233, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      return texture;
    };

    const particleTexture = createParticleTexture();

    // ============================================================
    // 3. HUMAN SILHOUETTE POINT CLOUD (REFERENCE IMAGE 1)
    // ============================================================
    // Generates ~6,500 particles precisely tracing the head arch, neck pillars,
    // clavicles, shoulders, deltoids, and dissolving lateral flanks.
    const silhouetteGeo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const basePositions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const phases: number[] = [];
    const driftSpeeds: number[] = [];
    const dissolveFactors: number[] = [];

    const addPoint = (
      x: number,
      y: number,
      z: number,
      colorHex: number,
      size: number,
      dissolve: number = 0,
      scatter: number = 0.05
    ) => {
      const rx = x + (Math.random() - 0.5) * scatter;
      const ry = y + (Math.random() - 0.5) * scatter;
      const rz = z + (Math.random() - 0.5) * scatter;

      positions.push(rx, ry, rz);
      basePositions.push(rx, ry, rz);

      const c = new THREE.Color(colorHex);
      colors.push(c.r, c.g, c.b);

      sizes.push(size * (0.8 + Math.random() * 0.5));
      phases.push(Math.random() * Math.PI * 2);
      driftSpeeds.push(0.005 + Math.random() * 0.02);
      dissolveFactors.push(dissolve);
    };

    // A. CRANIUM HALO & HEAD CONTOUR (Dome of intelligence)
    // Dense, brilliant sparkling particles defining the top crest of the cranium
    const craniumY = 2.4;
    for (let i = 0; i < 900; i++) {
      const angle = Math.PI * 0.12 + Math.random() * Math.PI * 0.76; // Sweep over cranium
      const radiusX = 1.05 + (Math.random() - 0.5) * 0.08;
      const radiusY = 1.35 + (Math.random() - 0.5) * 0.08;
      const depthZ = (Math.random() - 0.5) * 0.7;

      const px = Math.cos(angle) * radiusX;
      const py = craniumY + Math.sin(angle) * radiusY;
      const pz = depthZ;

      // Outer boundary points are purest white and brightest
      const isCrest = Math.sin(angle) > 0.65;
      const color = isCrest ? 0xffffff : Math.random() > 0.3 ? 0xe0f2fe : 0x7dd3fc;
      const size = isCrest ? 0.32 : 0.22;
      addPoint(px, py, pz, color, size, 0.08, 0.04);
    }

    // Inner cranium edge / jawline
    for (let i = 0; i < 600; i++) {
      const t = i / 600;
      const side = Math.random() > 0.5 ? 1 : -1;
      // Tracing temple down to jaw and chin
      const px = side * (0.95 - t * 0.45 + (Math.random() - 0.5) * 0.1);
      const py = craniumY - 0.2 - t * 1.5;
      const pz = (Math.random() - 0.5) * 0.6;
      addPoint(px, py, pz, 0xe0f2fe, 0.2, 0.1, 0.05);
    }

    // B. NECK PILLARS (Twin vertical cervical contours)
    for (let i = 0; i < 550; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const t = Math.random();
      const px = side * (0.55 + t * 0.08 + (Math.random() - 0.5) * 0.08);
      const py = 1.1 - t * 1.0;
      const pz = (Math.random() - 0.5) * 0.6;
      const color = Math.random() > 0.4 ? 0xffffff : 0x38bdf8;
      addPoint(px, py, pz, color, 0.22, 0.12, 0.06);
    }

    // C. BROAD SHOULDERS, CLAVICLES & DELTOIDS
    // The prominent glowing shoulder arches from reference image
    for (let i = 0; i < 1800; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const t = Math.random(); // 0 at neck base, 1 at deltoid edge
      // Sweeping cubic curve for athletic silhouette
      const shoulderX = side * (0.6 + Math.pow(t, 0.85) * 2.85);
      const shoulderY = 0.2 - Math.pow(t, 1.4) * 1.6;
      const shoulderZ = (Math.random() - 0.5) * 0.9;

      // Color: Intense white on top ridge, transitioning to icy blue and cyan
      const isTopRidge = Math.random() > 0.45;
      const color = isTopRidge ? 0xffffff : Math.random() > 0.3 ? 0xe0f2fe : 0x38bdf8;
      const size = isTopRidge ? 0.28 : 0.2;
      addPoint(shoulderX, shoulderY, shoulderZ, color, size, t * 0.4, 0.12);
    }

    // D. DISSOLVING OUTWARD LATERAL PARTICLES (Perlin-like edge dissolution)
    // Particles dispersing from the shoulders and arms out into deep space
    for (let i = 0; i < 1800; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const t = Math.random();
      const baseOutX = side * (2.2 + t * 2.4);
      const baseOutY = 0.0 - t * 2.8 + (Math.random() - 0.5) * 1.0;
      const baseOutZ = (Math.random() - 0.5) * 2.0;

      const color = Math.random() > 0.6 ? 0xe0f2fe : Math.random() > 0.3 ? 0x38bdf8 : 0xc4b5fd;
      addPoint(baseOutX, baseOutY, baseOutZ, color, 0.16 + Math.random() * 0.12, 0.85, 0.3);
    }

    // E. TORSO SIDES & RIB BOUNDARIES
    for (let i = 0; i < 900; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const t = Math.random();
      const px = side * (1.85 - t * 0.45 + (Math.random() - 0.5) * 0.2);
      const py = -1.2 - t * 1.6;
      const pz = (Math.random() - 0.5) * 0.8;
      addPoint(px, py, pz, 0x7dd3fc, 0.18, 0.4, 0.1);
    }

    silhouetteGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    silhouetteGeo.setAttribute('basePosition', new THREE.Float32BufferAttribute(basePositions, 3));
    silhouetteGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    silhouetteGeo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    silhouetteGeo.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
    silhouetteGeo.setAttribute('driftSpeed', new THREE.Float32BufferAttribute(driftSpeeds, 1));
    silhouetteGeo.setAttribute('dissolveFactor', new THREE.Float32BufferAttribute(dissolveFactors, 1));

    // Custom shader material for radiant bloom & twinkling particles
    const particleShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: particleTexture },
        uHover: { value: 0.0 },
        uMouse: { value: new THREE.Vector2(0, 0) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uHover;
        uniform vec2 uMouse;
        attribute vec3 basePosition;
        attribute vec3 color;
        attribute float size;
        attribute float phase;
        attribute float driftSpeed;
        attribute float dissolveFactor;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;

          // Organic breathing expansion
          float breath = sin(uTime * 0.85) * 0.035;

          // Gentle cosmic drift according to dissolve factor
          vec3 pos = basePosition;
          pos.x += sin(uTime * 1.5 + phase) * (0.02 + dissolveFactor * 0.12);
          pos.y += cos(uTime * 1.2 + phase) * (0.02 + dissolveFactor * 0.15) + (dissolveFactor * sin(uTime * 0.8) * 0.1);
          pos.z += sin(uTime * 0.9 + phase * 2.0) * (0.02 + dissolveFactor * 0.1);

          // Subtle whole-figure respiration
          pos.xy *= (1.0 + breath);

          // Cursor electromagnetic repulsion / excitation
          float distToCursor = distance(pos.xy, uMouse * 4.0);
          if (distToCursor < 2.0) {
            float force = (1.0 - distToCursor / 2.0) * 0.25;
            pos.xy += normalize(pos.xy - uMouse * 4.0) * force;
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Perspective size attenuation
          float twinkle = sin(uTime * 3.0 + phase) * 0.25 + 0.75;
          gl_PointSize = (size * 180.0 / -mvPosition.z) * twinkle * (1.0 + uHover * 0.25);

          // Opacity falloff with twinkle
          vAlpha = (0.55 + 0.45 * twinkle) * (1.0 - dissolveFactor * 0.35);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          if (texColor.a < 0.05) discard;
          gl_FragColor = vec4(vColor * 1.4, texColor.a * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const silhouettePoints = new THREE.Points(silhouetteGeo, particleShaderMat);
    entityGroup.add(silhouettePoints);

    // ============================================================
    // 4. VOLUMETRIC VERTICAL LIGHT BEAMS (RISING FROM PALM TO HEAD)
    // ============================================================
    // Cylindrical striated beam group shooting straight upward
    const rayGroup = new THREE.Group();
    rayGroup.position.set(0, -1.8, 0.4); // Rooted at hand palm level
    entityGroup.add(rayGroup);

    const rayGeometry = new THREE.CylinderGeometry(0.85, 0.35, 6.2, 32, 1, true);
    rayGeometry.translate(0, 3.1, 0); // Base at 0, extends upward to +6.2

    const rayShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uHover;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          // Vertical caustic striations
          float striations = sin(vUv.x * 48.0 + uTime * 1.5) * 0.25 + 
                             sin(vUv.x * 96.0 - uTime * 2.2) * 0.15 + 0.6;

          // Vertical gradient: brilliant core at palm (vUv.y = 0), fading softly toward top
          float verticalFalloff = pow(1.0 - vUv.y, 1.4);

          // Fresnel / rim edge glow
          float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          rim = pow(rim, 1.8);

          float alpha = verticalFalloff * striations * (0.35 + rim * 0.5) * (1.0 + uHover * 0.6);

          // Electric ice white with pale cyan core
          vec3 beamColor = mix(vec3(0.2, 0.75, 1.0), vec3(1.0, 1.0, 1.0), pow(verticalFalloff, 2.0));

          gl_FragColor = vec4(beamColor * 1.6, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mainRayCylinder = new THREE.Mesh(rayGeometry, rayShaderMat);
    rayGroup.add(mainRayCylinder);

    // Secondary intense core ray cylinder (narrower and brighter)
    const coreRayGeo = new THREE.CylinderGeometry(0.35, 0.12, 5.8, 24, 1, true);
    coreRayGeo.translate(0, 2.9, 0);
    const coreRayMesh = new THREE.Mesh(coreRayGeo, rayShaderMat.clone());
    rayGroup.add(coreRayMesh);

    // Inner photon stream particles flowing upwards inside the light rays
    const photonCount = 450;
    const photonGeo = new THREE.BufferGeometry();
    const photonPos = new Float32Array(photonCount * 3);
    const photonSpeeds = new Float32Array(photonCount);

    for (let i = 0; i < photonCount; i++) {
      const radius = Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;
      photonPos[i * 3 + 0] = Math.cos(angle) * radius;
      photonPos[i * 3 + 1] = Math.random() * 5.5; // Y height
      photonPos[i * 3 + 2] = Math.sin(angle) * radius;
      photonSpeeds[i] = 1.8 + Math.random() * 2.5;
    }

    photonGeo.setAttribute('position', new THREE.BufferAttribute(photonPos, 3));
    const photonMat = new THREE.PointsMaterial({
      size: 0.18,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      color: 0xffffff,
      depthWrite: false
    });

    const photonPoints = new THREE.Points(photonGeo, photonMat);
    rayGroup.add(photonPoints);

    // ============================================================
    // 5. THE LUMINOUS OPEN HAND & ENERGY PALM (REFERENCE IMAGE 1)
    // ============================================================
    // Situated at the lower chest/torso, palm facing upward, cupping the energy
    const handGroup = new THREE.Group();
    handGroup.position.set(0.08, -1.82, 0.65); // In front of lower torso
    entityGroup.add(handGroup);

    // A. Hand Cupped Silhouette Mesh (Curved contour with warm thermal rim)
    const handShape = new THREE.Shape();
    // Cupped palm contour
    handShape.moveTo(-1.1, -0.15); // Wrist base
    handShape.bezierCurveTo(-1.3, 0.25, -1.15, 0.7, -0.85, 0.65); // Thumb arch
    handShape.bezierCurveTo(-0.55, 0.45, -0.25, 0.2, 0.15, 0.18); // Palm center basin
    handShape.bezierCurveTo(0.55, 0.18, 0.95, 0.45, 1.15, 0.75); // Index & middle fingers cupping up
    handShape.bezierCurveTo(1.25, 0.45, 1.15, 0.05, 0.85, -0.25); // Ring & pinky side
    handShape.bezierCurveTo(0.45, -0.55, -0.45, -0.65, -1.1, -0.15); // Palm heel

    const handExtrudeSettings = {
      depth: 0.15,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08
    };

    const handGeometry = new THREE.ExtrudeGeometry(handShape, handExtrudeSettings);
    handGeometry.center();

    // Shader with thermal ember/orange subsurface rim glow (#FF4500)
    const handMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uHover;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          // Fresnel grazing edge angle
          float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
          fresnel = pow(fresnel, 2.2);

          // Thermal orange-red subsurface glow (#FF3B00 to #FF6D00)
          vec3 darkBase = vec3(0.04, 0.05, 0.09);
          vec3 warmOrange = vec3(1.0, 0.28, 0.05);
          vec3 brightRim = vec3(1.0, 0.55, 0.2);

          float pulse = sin(uTime * 2.5) * 0.15 + 0.85;
          vec3 color = mix(darkBase, warmOrange, fresnel * pulse * (1.0 + uHover * 0.8));
          color += brightRim * pow(fresnel, 4.0) * (1.2 + uHover);

          gl_FragColor = vec4(color, 0.95);
        }
      `,
      transparent: true
    });

    const handMesh = new THREE.Mesh(handGeometry, handMaterial);
    handMesh.scale.set(0.9, 0.9, 0.9);
    handMesh.rotation.x = -Math.PI * 0.12; // Tilted slightly toward camera
    handGroup.add(handMesh);

    // B. Intense Luminous Energy Core (Floating in cupped palm)
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0.05, 0.15, 0.12);
    handGroup.add(coreGroup);

    // Blinding white inner sphere
    const coreSphereGeo = new THREE.SphereGeometry(0.22, 24, 24);
    const coreSphereMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
    coreGroup.add(coreSphere);

    // Outer pulsating cyan-white plasma corona
    const coronaGeo = new THREE.SphereGeometry(0.48, 24, 24);
    const coronaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uHover;
        varying vec3 vNormal;
        void main() {
          float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          float pulse = sin(uTime * 4.0) * 0.2 + 0.8;
          vec3 cColor = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 1.0, 1.0), 0.5);
          gl_FragColor = vec4(cColor * 1.5, pow(rim, 2.0) * pulse * (0.8 + uHover * 0.5));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    coreGroup.add(coronaMesh);

    // Radial thermal halo around the hand
    const thermalHaloGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const thermalHaloMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uHover;
        varying vec2 vUv;
        void main() {
          float dist = distance(vUv, vec2(0.5));
          if (dist > 0.5) discard;
          float falloff = pow(1.0 - dist * 2.0, 1.8);
          float pulse = sin(uTime * 2.0) * 0.15 + 0.85;
          // Subsurface ember radiation
          vec3 warmOrange = vec3(1.0, 0.25, 0.04);
          gl_FragColor = vec4(warmOrange, falloff * 0.35 * pulse * (1.0 + uHover * 0.8));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const thermalHaloMesh = new THREE.Mesh(thermalHaloGeo, thermalHaloMat);
    thermalHaloMesh.position.set(0, 0, -0.05);
    handGroup.add(thermalHaloMesh);

    // ============================================================
    // 6. ASTRA 3D DEEP COSMIC STARFIELD (CHATGPT 6 ASTRA SYSTEM)
    // ============================================================
    const starCount = 950;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xe0f2fe),
      new THREE.Color(0xbae6fd),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xddd6fe)
    ];

    for (let i = 0; i < starCount; i++) {
      // 3D celestial distribution with depth
      starPositions[i * 3 + 0] = (Math.random() - 0.5) * 38;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 32;
      starPositions[i * 3 + 2] = -5.0 - Math.random() * 25.0; // Deep in the background

      const isBeacon = Math.random() > 0.92;
      const c = palette[Math.floor(Math.random() * palette.length)];
      starColors[i * 3 + 0] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;

      starSizes[i] = isBeacon ? 0.32 + Math.random() * 0.25 : 0.09 + Math.random() * 0.14;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const starField = new THREE.Points(starGeo, starMaterial);
    scene.add(starField);

    // ============================================================
    // 7. INTERACTIVE CLICK EXPLOSION SYSTEM (PALM BURST)
    // ============================================================
    const burstCount = 120;
    const burstGeo = new THREE.BufferGeometry();
    const burstPositions = new Float32Array(burstCount * 3);
    const burstVelocities = new Float32Array(burstCount * 3);
    const burstColors = new Float32Array(burstCount * 3);
    const burstAlphas = new Float32Array(burstCount);

    for (let i = 0; i < burstCount; i++) {
      burstPositions[i * 3 + 0] = 0;
      burstPositions[i * 3 + 1] = -100; // Hidden initially
      burstPositions[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.08 + Math.random() * 0.18;
      burstVelocities[i * 3 + 0] = Math.cos(angle) * speed;
      burstVelocities[i * 3 + 1] = Math.sin(angle) * speed + 0.05; // Upward bias
      burstVelocities[i * 3 + 2] = (Math.random() - 0.5) * speed;

      const isOrange = Math.random() > 0.6;
      const c = isOrange ? new THREE.Color(0xff5722) : new THREE.Color(0x38bdf8);
      burstColors[i * 3 + 0] = c.r;
      burstColors[i * 3 + 1] = c.g;
      burstColors[i * 3 + 2] = c.b;

      burstAlphas[i] = 0.0;
    }

    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
    burstGeo.setAttribute('color', new THREE.BufferAttribute(burstColors, 3));

    const burstMat = new THREE.PointsMaterial({
      size: 0.35,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false
    });

    const burstPoints = new THREE.Points(burstGeo, burstMat);
    entityGroup.add(burstPoints);

    let isBursting = false;
    let burstLife = 0;

    const triggerBurst = () => {
      isBursting = true;
      burstLife = 0;
      const posAttr = burstGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < burstCount; i++) {
        posAttr.setXYZ(i, handGroup.position.x, handGroup.position.y + 0.2, handGroup.position.z);
      }
      posAttr.needsUpdate = true;
      burstMat.opacity = 1.0;
    };

    // ============================================================
    // 8. INTERACTIVE EVENTS & MOUSE TRACKING
    // ============================================================
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / height) * 2 - 1);

      mouseRef.current.targetX = normX;
      mouseRef.current.targetY = normY;
      mouseRef.current.screenX = e.clientX;
      mouseRef.current.screenY = e.clientY;

      // Check distance to hand (in 2D screen space)
      // Project hand position to 2D screen coordinates
      const handWorldPos = new THREE.Vector3();
      handGroup.getWorldPosition(handWorldPos);
      const screenPos = handWorldPos.clone().project(camera);
      const handScreenX = ((screenPos.x + 1) / 2) * width;
      const handScreenY = ((-screenPos.y + 1) / 2) * height;

      const dist = Math.hypot(e.clientX - handScreenX, e.clientY - handScreenY);
      const isHover = dist < 110;
      if (isHover !== isHoveredRef.current) {
        isHoveredRef.current = isHover;
        setIsHandHovered(isHover);
      }
    };

    const handleClick = (e: MouseEvent) => {
      triggerBurst();
      if (triggerAwakenRef.current) {
        triggerAwakenRef.current();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // ============================================================
    // 9. ANIMATION LOOP (60FPS CONTINUOUS MOTION)
    // ============================================================
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;
      const mouse = mouseRef.current;

      // Spring damping mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.055;
      mouse.y += (mouse.targetY - mouse.y) * 0.055;

      // Smooth 3D tilt & parallax of the central entity
      entityGroup.rotation.y = mouse.x * 0.14;
      entityGroup.rotation.x = -mouse.y * 0.09;
      entityGroup.position.x = mouse.x * 0.25;
      entityGroup.position.y = 0.6 + mouse.y * 0.2;

      // Camera subtle responsive tracking
      camera.position.x = mouse.x * 0.4;
      camera.position.y = mouse.y * 0.3;
      camera.lookAt(0, 0.4, 0);

      // Starfield subtle inverse depth parallax
      starField.rotation.y = -mouse.x * 0.035;
      starField.rotation.x = mouse.y * 0.025;

      const hoverVal = isHoveredRef.current ? 1.0 : 0.0;

      // Update particle shader uniforms
      particleShaderMat.uniforms.uTime.value = elapsedTime;
      particleShaderMat.uniforms.uHover.value = THREE.MathUtils.lerp(
        particleShaderMat.uniforms.uHover.value,
        hoverVal,
        0.1
      );
      particleShaderMat.uniforms.uMouse.value.set(mouse.x, mouse.y);

      // Update light ray shader uniforms
      rayShaderMat.uniforms.uTime.value = elapsedTime;
      rayShaderMat.uniforms.uHover.value = THREE.MathUtils.lerp(
        rayShaderMat.uniforms.uHover.value,
        hoverVal,
        0.1
      );

      // Animate flowing photon particles upward through the light shaft
      const pPosAttr = photonGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < photonCount; i++) {
        let py = pPosAttr.getY(i);
        py += 0.045 * photonSpeeds[i];
        if (py > 5.8) py = 0.0;
        pPosAttr.setY(i, py);
      }
      pPosAttr.needsUpdate = true;

      // Animate hand materials & core pulse
      handMaterial.uniforms.uTime.value = elapsedTime;
      handMaterial.uniforms.uHover.value = THREE.MathUtils.lerp(
        handMaterial.uniforms.uHover.value,
        hoverVal,
        0.1
      );

      coronaMat.uniforms.uTime.value = elapsedTime;
      coronaMat.uniforms.uHover.value = handMaterial.uniforms.uHover.value;

      thermalHaloMat.uniforms.uTime.value = elapsedTime;
      thermalHaloMat.uniforms.uHover.value = handMaterial.uniforms.uHover.value;

      // Pulsing energy core breathing
      const pulseScale = 1.0 + Math.sin(elapsedTime * 3.5) * 0.08 + hoverVal * 0.25;
      coreGroup.scale.set(pulseScale, pulseScale, pulseScale);

      // Animate burst particles if triggered
      if (isBursting) {
        burstLife += 0.016;
        const bPos = burstGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < burstCount; i++) {
          const px = bPos.getX(i) + burstVelocities[i * 3 + 0];
          const py = bPos.getY(i) + burstVelocities[i * 3 + 1];
          const pz = bPos.getZ(i) + burstVelocities[i * 3 + 2];
          bPos.setXYZ(i, px, py, pz);
        }
        bPos.needsUpdate = true;
        burstMat.opacity = Math.max(0, 1.0 - burstLife * 1.5);
        if (burstLife > 0.8) {
          isBursting = false;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particleTexture.dispose();
      silhouetteGeo.dispose();
      particleShaderMat.dispose();
      rayGeometry.dispose();
      rayShaderMat.dispose();
      photonGeo.dispose();
      photonMat.dispose();
      handGeometry.dispose();
      handMaterial.dispose();
      starGeo.dispose();
      starMaterial.dispose();
      burstGeo.dispose();
      burstMat.dispose();
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full cursor-pointer select-none overflow-hidden ${className}`}
      title="Hover over the silhouette or click the palm energy core to awaken RAZE"
    >
      {/* Subtle indicator hint when hovering hand */}
      {isHandHovered && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none px-4 py-1.5 rounded-full bg-raze-orange/20 border border-raze-orange/40 backdrop-blur-md text-[11px] font-mono text-raze-ice tracking-wider flex items-center gap-2 animate-pulse shadow-glow-orange z-20">
          <span className="w-2 h-2 rounded-full bg-raze-orange animate-ping" />
          <span>CLICK TO RELEASE NEURAL ENERGY</span>
        </div>
      )}
    </div>
  );
};
