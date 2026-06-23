"use client";

import { useState, useRef, useEffect } from "react";

const HEADER_H = 64; // px reserved for the app header above games

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClose(); }}
      style={{
        position: "fixed", top: HEADER_H + 12, right: 20, zIndex: 1100,
        background: "rgba(0,0,0,0.7)", color: "#fff",
        border: "2px solid rgba(255,255,255,0.4)", borderRadius: 12,
        padding: "10px 20px", fontSize: 16, fontWeight: 800,
        cursor: "pointer", backdropFilter: "blur(4px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      ✕ Exit
    </button>
  );
}

// ─── Snake ─────────────────────────────────────────────────────────────────────
function SnakeGame({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const W = c.width = window.innerWidth;
    const H = c.height = window.innerHeight - HEADER_H;
    const ctx = c.getContext("2d")!;
    const CELL = Math.floor(Math.min(W, H) / 22);
    const COLS = Math.floor(W / CELL), ROWS = Math.floor(H / CELL);
    const HS_KEY = "loc-snake-hs";
    const getHi = () => { try { return parseInt(localStorage.getItem(HS_KEY) || "0"); } catch { return 0; } };
    const setHi = (s: number) => { try { if (s > getHi()) localStorage.setItem(HS_KEY, String(s)); } catch {} };

    const G = {
      snake: [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }],
      dir: { x: 1, y: 0 }, food: null as { x: number; y: number } | null,
      score: 0, state: "waiting", animId: 0, tick: 0, best: getHi(),
    };

    const SPEED_START = 28; // higher = slower on desktop

    const placeFood = () => {
      let f: { x: number; y: number };
      do { f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
      while (G.snake.some(s => s.x === f!.x && s.y === f!.y));
      G.food = f;
    };
    placeFood();

    const reset = () => {
      G.snake = [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }];
      G.dir = { x: 1, y: 0 }; G.score = 0; G.tick = 0; G.state = "playing";
      placeFood();
    };

    let touchStart: { x: number; y: number } | null = null;
    const applySwipe = (dx: number, dy: number) => {
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && G.dir.x !== -1) G.dir = { x: 1, y: 0 };
        else if (dx < 0 && G.dir.x !== 1) G.dir = { x: -1, y: 0 };
      } else {
        if (dy > 0 && G.dir.y !== -1) G.dir = { x: 0, y: 1 };
        else if (dy < 0 && G.dir.y !== 1) G.dir = { x: 0, y: -1 };
      }
      touchStart = null;
    };

    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (G.state !== "playing") { reset(); touchStart = null; return; }
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= 6) applySwipe(dx, dy);
      touchStart = null;
    };
    const onKey = (e: KeyboardEvent) => {
      const m: Record<string, { x: number; y: number }> = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 }, s: { x: 0, y: 1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
      };
      if (m[e.key]) { e.preventDefault(); const d = m[e.key]; if (d.x !== -G.dir.x || d.y !== -G.dir.y) G.dir = d; }
      if ((e.key === " " || e.key === "Enter") && G.state !== "playing") { e.preventDefault(); reset(); }
    };

    const draw = () => {
      ctx.fillStyle = "#08080f"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 1;
      for (let x = 0; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
      for (let y = 0; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }

      if (G.food) { ctx.font = `${CELL - 4}px system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("💰", G.food.x * CELL + CELL / 2, G.food.y * CELL + CELL / 2); }

      G.snake.forEach((seg, i) => {
        const isHead = i === 0, pct = i / G.snake.length;
        ctx.fillStyle = isHead ? "#5b5cf6" : `rgba(91,92,246,${0.9 - pct * 0.6})`;
        const pad = isHead ? 1 : 2;
        ctx.beginPath();
        (ctx as any).roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, isHead ? 6 : 4);
        ctx.fill();
        if (isHead) { ctx.fillStyle = "#fff"; ctx.font = `bold ${Math.floor(CELL * 0.5)}px system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("$", seg.x * CELL + CELL / 2, seg.y * CELL + CELL / 2 + 1); }
      });

      ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 20px system-ui";
      ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText("Score: " + G.score, 12, 12);
      ctx.textAlign = "right"; ctx.fillText("Best: " + G.best, W - 12, 12);

      if (G.state === "waiting") {
        ctx.fillStyle = "rgba(8,8,15,0.75)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#5b5cf6"; ctx.font = "bold 28px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Debt Collector", W / 2, H / 2 - 70);
        ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "16px system-ui";
        ctx.fillText("Collect money bags 💰", W / 2, H / 2 - 28);
        ctx.fillText("Arrow keys / WASD to move", W / 2, H / 2 + 8);
        ctx.fillStyle = "#34d399"; ctx.font = "bold 20px system-ui"; ctx.fillText("Press Space or tap to start", W / 2, H / 2 + 55);
      }
      if (G.state === "dead") {
        ctx.fillStyle = "rgba(8,8,15,0.8)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#f87171"; ctx.font = "bold 28px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Game Over", W / 2, H / 2 - 50);
        ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "18px system-ui";
        ctx.fillText("Score: " + G.score, W / 2, H / 2);
        ctx.fillStyle = "#34d399"; ctx.font = "14px system-ui"; ctx.fillText("Best: " + G.best, W / 2, H / 2 + 30);
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "bold 18px system-ui"; ctx.fillText("Space / tap to try again", W / 2, H / 2 + 70);
      }
    };

    const onClick = () => { if (G.state !== "playing") reset(); };

    const update = () => {
      if (G.state !== "playing") return;
      G.tick++;
      const speed = Math.max(6, SPEED_START - Math.floor(G.score / 3));
      if (G.tick % speed !== 0) return;
      const head = G.snake[0];
      const next = { x: (head.x + G.dir.x + COLS) % COLS, y: (head.y + G.dir.y + ROWS) % ROWS };
      if (G.snake.some(s => s.x === next.x && s.y === next.y)) { setHi(G.score); G.best = getHi(); G.state = "dead"; return; }
      G.snake.unshift(next);
      if (G.food && next.x === G.food.x && next.y === G.food.y) { G.score++; placeFood(); } else { G.snake.pop(); }
    };

    const loop = () => { update(); draw(); G.animId = requestAnimationFrame(loop); };
    G.animId = requestAnimationFrame(loop);

    c.addEventListener("touchstart", onTouchStart, { passive: false });
    c.addEventListener("touchend", onTouchEnd, { passive: false });
    c.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(G.animId);
      c.removeEventListener("touchstart", onTouchStart);
      c.removeEventListener("touchend", onTouchEnd);
      c.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div style={{ position: "fixed", top: HEADER_H, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <canvas ref={ref} style={{ display: "block", width: "100%", height: "100%" }} />
      <CloseBtn onClose={onClose} />
    </div>
  );
}

// ─── Flappy ────────────────────────────────────────────────────────────────────
function FlappyGame({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight - HEADER_H;
    const ctx = canvas.getContext("2d")!;
    // Physics in px/s and px/s² — delta-time based so 60Hz and 120Hz feel identical
    const GRAVITY = 1300, FLAP_V = -480, PIPE_W = 55, GAP = 195, SPEED = 380;
    const BIRD_X = Math.round(W * 0.28), BIRD_R = 20;
    const HS_KEY = "loc-flappy-hs";
    const getHi = () => { try { return parseInt(localStorage.getItem(HS_KEY) || "0"); } catch { return 0; } };
    const setHi = (s: number) => { try { if (s > getHi()) localStorage.setItem(HS_KEY, String(s)); } catch {} };

    const G = { bird: { y: H / 2, vel: 0 }, pipes: [] as { x: number; top: number; passed: boolean }[], score: 0, dist: 0, state: "waiting", animId: 0, best: getHi(), lastT: 0 };

    const reset = () => { G.bird = { y: H / 2, vel: 0 }; G.pipes = []; G.score = 0; G.dist = 0; G.state = "playing"; G.lastT = 0; };
    const flap = () => {
      if (G.state !== "playing") reset();
      G.bird.vel = FLAP_V;
    };
    const PIPE_EVERY = W * 0.55; // spawn a pipe every this many pixels scrolled
    const addPipe = () => { G.pipes.push({ x: W + PIPE_W, top: 90 + Math.random() * (H - GAP - 180), passed: false }); };

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };

    const draw = () => {
      ctx.fillStyle = "#08080f"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      for (let i = 0; i < 40; i++) { const sx = (i * 137 + G.dist * 0.2) % W, sy = (i * 79) % H; ctx.fillRect(sx, sy, 1.5, 1.5); }

      G.pipes.forEach(p => {
        const g1 = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0); g1.addColorStop(0, "#7f1d1d"); g1.addColorStop(1, "#dc2626"); ctx.fillStyle = g1;
        rr(p.x, 0, PIPE_W, p.top - 8, 8); ctx.fill();
        ctx.fillStyle = "#ef4444"; rr(p.x - 5, p.top - 24, PIPE_W + 10, 20, 6); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "bold 10px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("MCA", p.x + PIPE_W / 2, p.top / 2);
        const g2 = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0); g2.addColorStop(0, "#7f1d1d"); g2.addColorStop(1, "#dc2626"); ctx.fillStyle = g2;
        rr(p.x, p.top + GAP + 8, PIPE_W, H, 8); ctx.fill();
        ctx.fillStyle = "#ef4444"; rr(p.x - 5, p.top + GAP + 4, PIPE_W + 10, 20, 6); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("DEBT", p.x + PIPE_W / 2, p.top + GAP + 8 + (H - p.top - GAP - 8) / 2);
      });

      const bx = BIRD_X, by = G.bird.y;
      const angle = Math.min(Math.max(G.bird.vel * 0.003, -0.4), 0.6);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(angle);
      ctx.beginPath(); ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = G.state === "dead" ? "#6b7280" : "#fde68a"; ctx.fill();
      ctx.font = "bold 16px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000";
      ctx.fillText(G.state === "dead" ? "💀" : "😬", 0, 2);
      ctx.restore();
      ctx.beginPath(); ctx.arc(bx, by, BIRD_R, 0, Math.PI * 2);
      ctx.strokeStyle = G.state === "dead" ? "rgba(239,68,68,0.8)" : "rgba(251,191,36,0.9)"; ctx.lineWidth = 3; ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = "bold 38px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(String(G.score), W / 2, 50);
      ctx.font = "12px system-ui"; ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fillText("BEST " + G.best, W / 2, 94);

      if (G.state === "waiting") {
        ctx.fillStyle = "rgba(8,8,15,0.7)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fde68a"; ctx.font = "bold 26px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Flappy Dollar", W / 2, H / 2 - 70);
        ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "16px system-ui"; ctx.fillText("Dodge the MCA debt!", W / 2, H / 2 - 30);
        ctx.fillText("Click, tap, or press Space / ↑", W / 2, H / 2 + 5);
        ctx.fillStyle = "#34d399"; ctx.font = "bold 20px system-ui"; ctx.fillText("Press Space to start", W / 2, H / 2 + 50);
      }
      if (G.state === "dead") {
        ctx.fillStyle = "rgba(8,8,15,0.8)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#f87171"; ctx.font = "bold 28px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Crushed by Debt", W / 2, H / 2 - 50);
        ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "18px system-ui"; ctx.fillText("Score: " + G.score, W / 2, H / 2);
        ctx.fillStyle = "#34d399"; ctx.font = "14px system-ui"; ctx.fillText("Best: " + G.best, W / 2, H / 2 + 30);
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "bold 18px system-ui"; ctx.fillText("Space / tap to try again", W / 2, H / 2 + 70);
      }
    };

    const loop = (now: number) => {
      if (G.state === "playing") {
        const dt = G.lastT ? Math.min((now - G.lastT) / 1000, 0.05) : 0.016;
        G.lastT = now;
        G.bird.vel += GRAVITY * dt;
        G.bird.y += G.bird.vel * dt;
        const moved = SPEED * dt;
        G.dist += moved;
        if (G.dist >= PIPE_EVERY && (G.pipes.length === 0 || G.pipes[G.pipes.length - 1].x < W - 80)) {
          addPipe(); G.dist = 0;
        }
        G.pipes.forEach(p => { p.x -= moved; });
        G.pipes = G.pipes.filter(p => p.x > -PIPE_W - 10);
        for (const p of G.pipes) {
          if (!p.passed && p.x + PIPE_W < BIRD_X) { p.passed = true; G.score++; }
          const hit = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W && (G.bird.y - BIRD_R < p.top || G.bird.y + BIRD_R > p.top + GAP);
          if (hit || G.bird.y + BIRD_R > H || G.bird.y - BIRD_R < 0) { setHi(G.score); G.best = getHi(); G.state = "dead"; break; }
        }
      } else {
        G.lastT = 0;
      }
      draw(); G.animId = requestAnimationFrame(loop);
    };
    G.animId = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent) => { e.stopPropagation(); flap(); };
    const onTouch = (e: TouchEvent) => { e.preventDefault(); flap(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); flap(); }
    };

    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(G.animId);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onTouch);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div style={{ position: "fixed", top: HEADER_H, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <canvas ref={ref} style={{ display: "block", width: "100%", height: "100%" }} />
      <CloseBtn onClose={onClose} />
    </div>
  );
}

// ─── Breakout ──────────────────────────────────────────────────────────────────
function BreakoutGame({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const W = c.width = window.innerWidth, H = c.height = window.innerHeight - HEADER_H;
    const ctx = c.getContext("2d")!;
    const HS = "loc-brkout-hs";
    const getHi = () => { try { return parseInt(localStorage.getItem(HS) || "0"); } catch { return 0; } };
    const setHi = (s: number) => { try { if (s > getHi()) localStorage.setItem(HS, String(s)); } catch {} };
    const COLS = 7, BH = 28, BW = (W - 20) / COLS, BTOP = 70, GAP = 5;
    const PW = 150, PH = 16, PY = H - 65;
    const PR = 18;

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
    };

    const makeBricks = (lv: number) => {
      const rows = Math.min(3 + lv, 7), bricks = [];
      for (let r = 0; r < rows; r++) for (let cc = 0; cc < COLS; cc++)
        bricks.push({ x: 10 + cc * BW, y: BTOP + r * (BH + GAP), alive: true, hits: r < 1 ? 2 : 1, max: r < 1 ? 2 : 1 });
      return bricks;
    };

    const G = {
      state: "waiting", level: 1, score: 0, lives: 3, best: getHi(),
      pad: W / 2 - PW / 2,
      ball: { x: W / 2, y: PY - PR - 2, vx: 0, vy: 0 },
      bricks: makeBricks(1), parts: [] as { x: number; y: number; vx: number; vy: number; life: number; col: string; r: number }[],
      animId: 0, keys: { left: false, right: false },
    };

    const launch = () => {
      const spd = 2 + G.level * 0.15, ang = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
      G.ball = { x: G.pad + PW / 2, y: PY - PR - 2, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd };
      G.state = "playing";
    };

    const addParts = (x: number, y: number, col: string) => {
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 5;
        G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, col, r: 3 + Math.random() * 4 });
      }
    };

    const draw = () => {
      ctx.fillStyle = "#08080f"; ctx.fillRect(0, 0, W, H);

      G.bricks.forEach(b => {
        if (!b.alive) return;
        const x = b.x + 2, y = b.y + 2, w = BW - 4, h = BH - 2;
        const ok = b.hits >= b.max;
        const grd = ctx.createLinearGradient(x, y, x, y + h);
        grd.addColorStop(0, ok ? "#16a34a" : "#92400e"); grd.addColorStop(1, ok ? "#064e3b" : "#78350f");
        ctx.fillStyle = grd; rr(x, y, w, h, 5); ctx.fill();
        ctx.strokeStyle = ok ? "#4ade80" : "#fbbf24"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = ok ? "rgba(255,255,255,0.85)" : "rgba(251,191,36,0.85)";
        ctx.font = `bold ${Math.floor(h * 0.58)}px system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("$", x + w / 2, y + h / 2);
      });

      G.parts.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fillStyle = p.col; ctx.fill();
      });
      ctx.globalAlpha = 1;

      const pg = ctx.createLinearGradient(G.pad, PY, G.pad, PY + PH); pg.addColorStop(0, "#818cf8"); pg.addColorStop(1, "#4f46e5");
      ctx.fillStyle = pg; rr(G.pad, PY, PW, PH, 7); ctx.fill();
      ctx.strokeStyle = "#c4b5fd"; ctx.lineWidth = 1; ctx.stroke();

      // Ball
      ctx.beginPath(); ctx.arc(G.ball.x, G.ball.y, PR, 0, Math.PI * 2);
      ctx.fillStyle = "#fde68a"; ctx.fill();
      ctx.strokeStyle = "rgba(251,191,36,0.9)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = "bold 14px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000";
      ctx.fillText("$", G.ball.x, G.ball.y + 1);

      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "bold 16px system-ui"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(`Lv ${G.level}  Score: ${G.score}  Lives: ${"♥".repeat(G.lives)}`, 10, 12);
      ctx.textAlign = "right"; ctx.fillText("Best: " + G.best, W - 10, 12);

      if (G.state === "waiting") {
        ctx.fillStyle = "rgba(8,8,15,0.75)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#818cf8"; ctx.font = "bold 28px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Debt Breaker", W / 2, H / 2 - 70);
        ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "16px system-ui"; ctx.fillText("Break the $ debt blocks!", W / 2, H / 2 - 28);
        ctx.fillText("Mouse to move paddle · ← → arrow keys", W / 2, H / 2 + 8);
        ctx.fillStyle = "#34d399"; ctx.font = "bold 20px system-ui"; ctx.fillText("Click or press Space to start", W / 2, H / 2 + 55);
      }
      if (G.state === "respawn") {
        ctx.fillStyle = "rgba(8,8,15,0.75)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#f87171"; ctx.font = "bold 28px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Ball Lost!", W / 2, H / 2 - 50);
        ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "22px system-ui"; ctx.fillText("Lives: " + "♥".repeat(G.lives), W / 2, H / 2);
        ctx.fillStyle = "#34d399"; ctx.font = "bold 18px system-ui"; ctx.fillText("Click or Space to continue", W / 2, H / 2 + 50);
      }
      if (G.state === "dead") {
        ctx.fillStyle = "rgba(8,8,15,0.85)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#f87171"; ctx.font = "bold 28px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Game Over", W / 2, H / 2 - 50);
        ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "18px system-ui"; ctx.fillText("Score: " + G.score, W / 2, H / 2);
        ctx.fillStyle = "#34d399"; ctx.font = "14px system-ui"; ctx.fillText("Best: " + G.best, W / 2, H / 2 + 30);
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "bold 18px system-ui"; ctx.fillText("Click or Space to try again", W / 2, H / 2 + 70);
      }
      if (G.state === "level") {
        ctx.fillStyle = "rgba(8,8,15,0.8)"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fbbf24"; ctx.font = "bold 36px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("CHA-CHING! 💰", W / 2, H / 2 - 20);
        ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "18px system-ui"; ctx.fillText("Level " + (G.level - 1) + " cleared!", W / 2, H / 2 + 30);
        ctx.fillStyle = "#34d399"; ctx.font = "bold 16px system-ui"; ctx.fillText("Click or Space for level " + G.level, W / 2, H / 2 + 70);
      }
    };

    let mouseX = W / 2;
    const onMouseMove = (e: MouseEvent) => { mouseX = e.clientX; };
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); mouseX = e.touches[0].clientX; };

    const startOrLaunch = () => {
      if (G.state === "dead") {
        G.score = 0; G.lives = 3; G.level = 1; G.bricks = makeBricks(1); launch(); return;
      }
      if (G.state === "waiting" || G.state === "respawn" || G.state === "level") { launch(); return; }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); G.keys.left = true; }
      if (e.key === "ArrowRight") { e.preventDefault(); G.keys.right = true; }
      if ((e.key === " " || e.key === "Enter") && G.state !== "playing") { e.preventDefault(); startOrLaunch(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") G.keys.left = false;
      if (e.key === "ArrowRight") G.keys.right = false;
    };
    const onClick = () => startOrLaunch();

    const loop = () => {
      // Keyboard paddle movement
      if (G.keys.left) mouseX = Math.max(PW / 2, mouseX - 10);
      if (G.keys.right) mouseX = Math.min(W - PW / 2, mouseX + 10);

      G.pad = Math.max(0, Math.min(W - PW, mouseX - PW / 2));

      if (G.state === "playing") {
        G.ball.x += G.ball.vx; G.ball.y += G.ball.vy;
        if (G.ball.x - PR < 0 || G.ball.x + PR > W) { G.ball.vx *= -1; G.ball.x = G.ball.x - PR < 0 ? PR : W - PR; }
        if (G.ball.y - PR < 0) { G.ball.vy = Math.abs(G.ball.vy); }
        if (G.ball.y + PR > PY && G.ball.y - PR < PY + PH && G.ball.x > G.pad && G.ball.x < G.pad + PW) {
          G.ball.vy = -Math.abs(G.ball.vy);
          G.ball.vx += ((G.ball.x - (G.pad + PW / 2)) / (PW / 2)) * 1;
          const maxVx = 5; G.ball.vx = Math.max(-maxVx, Math.min(maxVx, G.ball.vx));
        }
        if (G.ball.y > H + 40) {
          G.lives--;
          if (G.lives <= 0) { setHi(G.score); G.best = getHi(); G.state = "dead"; }
          else { G.ball = { x: G.pad + PW / 2, y: PY - PR - 2, vx: 0, vy: 0 }; G.state = "respawn"; }
        }
        G.bricks.forEach(b => {
          if (!b.alive) return;
          const bx = b.x + 2, by = b.y + 2, bw = BW - 4, bh = BH - 2;
          if (G.ball.x + PR > bx && G.ball.x - PR < bx + bw && G.ball.y + PR > by && G.ball.y - PR < by + bh) {
            b.hits--;
            if (b.hits <= 0) { b.alive = false; G.score += 10; addParts(b.x + BW / 2, b.y + BH / 2, b.max > 1 ? "#fbbf24" : "#34d399"); }
            const overlapX = Math.min(G.ball.x + PR - bx, bx + bw - (G.ball.x - PR));
            const overlapY = Math.min(G.ball.y + PR - by, by + bh - (G.ball.y - PR));
            if (overlapX < overlapY) G.ball.vx *= -1; else G.ball.vy *= -1;
          }
        });
        if (G.bricks.every(b => !b.alive)) { G.level++; G.bricks = makeBricks(G.level); G.state = "level"; }
        G.parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.03; });
        G.parts = G.parts.filter(p => p.life > 0);
      }

      draw(); G.animId = requestAnimationFrame(loop);
    };
    G.animId = requestAnimationFrame(loop);

    c.addEventListener("mousemove", onMouseMove);
    c.addEventListener("touchmove", onTouchMove, { passive: false });
    c.addEventListener("click", onClick);
    c.addEventListener("touchstart", (e) => { e.preventDefault(); startOrLaunch(); }, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      cancelAnimationFrame(G.animId);
      c.removeEventListener("mousemove", onMouseMove);
      c.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <div style={{ position: "fixed", top: HEADER_H, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <canvas ref={ref} style={{ display: "block", width: "100%", height: "100%" }} />
      <CloseBtn onClose={onClose} />
    </div>
  );
}

// ─── Launcher ──────────────────────────────────────────────────────────────────
type GameName = "snake" | "flappy" | "breakout";

export default function EasterEggGames() {
  const [active, setActive] = useState<GameName | null>(null);
  const [open, setOpen] = useState(false);

  if (active === "snake") return <SnakeGame onClose={() => setActive(null)} />;
  if (active === "flappy") return <FlappyGame onClose={() => setActive(null)} />;
  if (active === "breakout") return <BreakoutGame onClose={() => setActive(null)} />;

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="Easter Eggs"
        style={{ fontSize: 24, lineHeight: 1, background: "none", border: "none", cursor: "pointer", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" }}
      >
        🎮
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-20 right-4 z-50 rounded-2xl p-4 space-y-2 shadow-2xl" style={{ background: "var(--surf)", border: "1px solid var(--bdrA)", minWidth: 210 }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>🥚 Easter Eggs</p>
            {[
              { key: "snake" as GameName, label: "Debt Collector 🐍", desc: "Arrow keys / WASD" },
              { key: "flappy" as GameName, label: "Flappy Dollar 🐦", desc: "Space / click to flap" },
              { key: "breakout" as GameName, label: "Debt Breaker 🧱", desc: "Mouse or ← → arrow keys" },
            ].map(g => (
              <button key={g.key} onClick={() => { setActive(g.key); setOpen(false); }}
                className="w-full text-left rounded-xl px-3 py-2.5 transition-opacity hover:opacity-80"
                style={{ background: "var(--surfB)", border: "1px solid var(--bdr)" }}>
                <p className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>{g.label}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{g.desc}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
