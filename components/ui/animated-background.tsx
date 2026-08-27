"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedBackgroundProps {
  className?: string;
  intensity?: "subtle" | "medium" | "vibrant";
  interactive?: boolean;
}

/**
 * SmokeyBackground — High-performance, GPU-accelerated WebGL ambient fluid smoke
 * with GRABIT signature orange plumes, interactive mouse/touch swirl, and automatic performance scaling.
 */
export function AnimatedBackground({
  className = "",
  intensity = "medium",
  interactive = true,
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    // Check reduced-motion preferences
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setHasWebGL(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl =
        canvas.getContext("webgl", {
          alpha: false,
          depth: false,
          stencil: false,
          antialias: false,
          preserveDrawingBuffer: false,
          powerPreference: "high-performance",
        }) ||
        (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    } catch {
      setHasWebGL(false);
      return;
    }

    if (!gl) {
      setHasWebGL(false);
      return;
    }

    // Vertex Shader: Fullscreen quad
    const vsSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Fragment Shader: High-fidelity organic domain-warped fluid smoke in GRABIT orange
    const fsSource = `
      precision highp float;

      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      uniform float uIntensity;

      // 2D Noise & Simplex functions
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(
          0.211324865405187,
          0.366025403784439,
          -0.577350269189626,
          0.024390243902439
        );
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m * m;
        m = m * m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // Fractional Brownian Motion (Multi-octave smoke synthesis)
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 5; i++) {
          value += amplitude * snoise(p * frequency);
          p = p * 2.02 + vec2(0.35, 0.17);
          amplitude *= 0.5;
        }
        return value;
      }

      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec2 uv = fragCoord / iResolution.xy;
        
        // Aspect-ratio normalized coordinates
        vec2 p = (fragCoord * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);

        // Smooth mouse perturbation
        vec2 m = (iMouse * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
        float mouseDist = length(p - m);
        vec2 mouseWarp = (p - m) * exp(-mouseDist * 2.2) * 0.45;
        p += mouseWarp;

        // Slow, elegant smoke drift
        float t = iTime * 0.12;

        // Domain warping layers for authentic fluid dynamics
        vec2 q = vec2(
          fbm(p + vec2(0.0, 0.0) + vec2(t * 0.14, t * 0.20)),
          fbm(p + vec2(5.2, 1.3) + vec2(-t * 0.10, t * 0.16))
        );

        vec2 r = vec2(
          fbm(p + 2.8 * q + vec2(1.7, 9.2) + 0.18 * t),
          fbm(p + 2.8 * q + vec2(8.3, 2.8) + 0.14 * t)
        );

        float f = fbm(p + 3.2 * r + vec2(t * 0.08, -t * 0.10));

        // GRABIT Brand Color Palette
        // 1. Deep midnight charcoal foundation
        vec3 cBase = vec3(0.035, 0.035, 0.04);
        
        // 2. Dark burnt ember smoke (#6B2000)
        vec3 cDarkSmoke = vec3(0.42, 0.125, 0.0);
        
        // 3. Deep Brand Orange (#D95300)
        vec3 cDeepOrange = vec3(0.85, 0.32, 0.0);
        
        // 4. Primary Signature Orange (#FF7A00)
        vec3 cPrimaryOrange = vec3(1.0, 0.478, 0.0);
        
        // 5. Glowing Luminous Core (#FFA834)
        vec3 cBrightGlow = vec3(1.0, 0.658, 0.20);
        
        // 6. Radiant Center Flare
        vec3 cFlare = vec3(1.0, 0.88, 0.55);

        // Normalize and blend smoke density
        float density = clamp((f + 0.42) * 0.85, 0.0, 1.0);
        float core = clamp(length(r) * 0.85, 0.0, 1.0);
        float glowFactor = clamp(pow(density * core, 1.35), 0.0, 1.0);

        vec3 color = cBase;

        // Multi-tier color gradients
        color = mix(color, cDarkSmoke, smoothstep(0.08, 0.65, density) * uIntensity);
        color = mix(color, cDeepOrange, smoothstep(0.25, 0.78, density * core) * uIntensity);
        color = mix(color, cPrimaryOrange, smoothstep(0.38, 0.88, glowFactor) * uIntensity);
        color = mix(color, cBrightGlow, smoothstep(0.55, 0.95, glowFactor * core) * uIntensity);
        color = mix(color, cFlare, smoothstep(0.80, 1.0, glowFactor * f) * 0.7 * uIntensity);

        // Atmospheric vignette around the edges
        float vig = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
        vig = clamp(pow(16.0 * vig, 0.22), 0.0, 1.0);
        color *= (0.75 + 0.25 * vig);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const createShader = (type: number, source: string) => {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      setHasWebGL(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setHasWebGL(false);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      setHasWebGL(false);
      return;
    }

    // Geometry buffer (2 Triangles covering viewport)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const posAttr = gl.getAttribLocation(program, "aPosition");
    const resUniform = gl.getUniformLocation(program, "iResolution");
    const timeUniform = gl.getUniformLocation(program, "iTime");
    const mouseUniform = gl.getUniformLocation(program, "iMouse");
    const intensityUniform = gl.getUniformLocation(program, "uIntensity");

    let animationFrameId: number;
    const startTime = performance.now();
    let isVisible = true;

    // Mouse tracking with smooth lerp
    let targetMouseX = window.innerWidth * 0.5;
    let targetMouseY = window.innerHeight * 0.5;
    let currentMouseX = targetMouseX;
    let currentMouseY = targetMouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = window.innerHeight - e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetMouseX = e.touches[0].clientX;
        targetMouseY = window.innerHeight - e.touches[0].clientY;
      }
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
    }

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Responsive Canvas Resizing
    const resize = () => {
      if (!canvas || !gl) return;
      // High-DPI scale for crisp 60fps rendering across all mobile and desktop screens
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = dpr > 1 ? 0.75 : 1.0;
      const width = Math.floor(window.innerWidth * scale);
      const height = Math.floor(window.innerHeight * scale);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    window.addEventListener("resize", resize);
    resize();

    const intensityMultiplier =
      intensity === "vibrant" ? 1.25 : intensity === "medium" ? 1.05 : 0.85;

    const render = (now: number) => {
      if (!gl || !program || !canvas) return;

      if (isVisible) {
        const elapsed = (now - startTime) * 0.001;

        // Smooth mouse damping
        currentMouseX += (targetMouseX - currentMouseX) * 0.06;
        currentMouseY += (targetMouseY - currentMouseY) * 0.06;

        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(posAttr);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(resUniform, canvas.width, canvas.height);
        gl.uniform1f(timeUniform, elapsed);
        gl.uniform2f(
          mouseUniform,
          (currentMouseX / window.innerWidth) * canvas.width,
          (currentMouseY / window.innerHeight) * canvas.height,
        );
        gl.uniform1f(intensityUniform, intensityMultiplier);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("touchmove", handleTouchMove);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (gl && program) {
        gl.deleteProgram(program);
        if (vs) gl.deleteShader(vs);
        if (fs) gl.deleteShader(fs);
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
      }
    };
  }, [intensity, interactive]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {hasWebGL ? (
        <canvas
          ref={canvasRef}
          className="pointer-events-none select-none h-full w-full object-cover block"
          style={{ width: "100vw", height: "100vh" }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#050505]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,122,0,0.25),rgba(0,0,0,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(232,93,0,0.18),transparent_55%)]" />
        </div>
      )}
    </div>
  );
}
