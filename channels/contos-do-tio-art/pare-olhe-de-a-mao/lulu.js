// Lulu — a 3-year-old girl built from G.* primitives (toddler proportions: big head, short limbs).
// Origin at the feet (stand/run/kick/lifted) or at the hips on the seat (sit). Front view.
//   Ch.lulu(ctx, { x, y, s, pose: 'stand'|'run'|'kick'|'lifted'|'sit', run (cycle phase 0..1), kick (0..1),
//     eyes: 'normal'|'wide'|'happy'|'closed', look, lookY, blink, brows: 'neutral'|'worried'|'up',
//     mouth: 'smile'|'grin'|'open'|'o'|'wavy'|'cry', tears (0..1), blush, headRot (-1..1), tremble,
//     handL, handR ([x, y] targets), gesture: 'thumbsUp'|'wave'|'stop'|'hug'|'armsUp', ball (draw a hugged ball),
//     swing (sit: legs swinging), shadow })
(function () {
  const U = globalThis.U, G = globalThis.G, Ch = globalThis.Ch, C = G.C;
  const shade = Ch.shade;

  const LULU = {
    skin: '#B9805A', hair: '#2B1A14', tee: '#FBF6EC', overalls: '#D94B3A', star: '#F5C542',
    scrunchie: '#F5C542', shoes: '#D94B3A', sole: '#FBF6EC', blush: '#E8718D', iris: '#4A2A1A',
  };
  Ch.LULU = LULU;

  // a bumpy "curly" outline around an ellipse
  function curlyPts(cx, cy, rx, ry, bumps, depth, seed, a0 = 0, a1 = Math.PI * 2) {
    const pts = [];
    const n = bumps * 6;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      const k = 1 + depth * Math.abs(Math.sin((i / 6) * Math.PI)) + 0.02 * U.hash(seed, i);
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  }

  function hand(ctx, P, seed, thumbUp = false, palm = false) {
    const col = LULU.skin;
    if (palm) {
      G.rrect(ctx, P[0] - 14, P[1] - 18, 28, 30, 11, { fill: col, lw: 3.5, seed });
      for (let k = -1; k <= 1; k++) G.line(ctx, [[P[0] + k * 7, P[1] - 18], [P[0] + k * 7, P[1] - 8]], { lw: 2, seed: seed + 2 + k });
      return;
    }
    G.ellipse(ctx, P[0], P[1], 13, 12, { fill: col, lw: 3.5, seed });
    if (thumbUp) G.rrect(ctx, P[0] - 5, P[1] - 30, 11, 22, 5, { fill: col, lw: 3, seed: seed + 1 });
  }

  function ball(ctx, x, y, r, spin, seed) {
    G.ellipse(ctx, x, y, r, r, { fill: '#E2483C', lw: 4, seed, hatch: { color: 'rgba(120,20,10,0.22)', gap: 7 } });
    G.line(ctx, [[x - r * 0.85, y + Math.sin(spin) * r * 0.3], [x, y + Math.sin(spin) * r * 0.45 + r * 0.1], [x + r * 0.85, y + Math.sin(spin) * r * 0.3]], { lw: 3, color: '#FBF6EC', seed: seed + 1, step: 8 });
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.4, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  Ch.redBall = ball;

  Ch.lulu = (ctx, o) => {
    const {
      x, y, s = 1, sx = 1, sy = 1, rot = 0, pose = 'stand', run = 0, kick = 0, seed = 500,
      eyes = 'normal', look = 0, lookY = 0, blink = 0, brows = 'neutral', mouth = 'smile', tears = 0, blush = 0.5,
      headRot = 0, tremble = 0, handL, handR, gesture = null, hugBall = false, swing = 0, shadow = true, t = G.t,
    } = o;
    const L = LULU;
    const sit = pose === 'sit';
    ctx.save();
    ctx.translate(x + (tremble ? U.noise1(t * 38, seed) * 3 * tremble : 0), y);
    if (shadow && pose !== 'lifted' && !sit) {
      ctx.fillStyle = 'rgba(20,10,20,0.22)';
      ctx.beginPath(); ctx.ellipse(0, 4, 62 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
    const ph = 2 * Math.PI * run;
    if (pose === 'run') ctx.translate(0, -Math.abs(Math.sin(ph)) * 14 * s);
    ctx.scale(s * sx, s * sy);
    ctx.rotate(rot + (pose === 'run' ? Math.sin(ph) * 0.04 : 0));
    if (sit) ctx.translate(0, 85); // sit origin = hips on the seat; the body below is built from the feet
    const hip = -85, sh = -146, headY = -224;
    const hatch = { color: 'rgba(120,30,20,0.2)', gap: 7 };

    // ---------- legs ----------
    const legCol = L.overalls;
    for (const sd of [-1, 1]) {
      const Hp = [sd * 20, hip + 18];
      let F = [sd * 24, -6], K;
      if (pose === 'run') {
        const a = ph + (sd > 0 ? Math.PI : 0);
        const lift = Math.max(0, Math.sin(a)), sw = Math.cos(a);
        F = [sd * 24 + sw * 10, -6 - lift * 30];
        K = [(Hp[0] + F[0]) / 2 + sd * lift * 10, (Hp[1] + F[1]) / 2 - lift * 12];
      } else if (pose === 'kick' && sd > 0) {
        const k = U.ease.outQuad(kick);
        F = [sd * (24 + 46 * k), -6 - 34 * k];
        K = [(Hp[0] + F[0]) / 2 + 6, (Hp[1] + F[1]) / 2 - 8 * k];
      } else if (pose === 'lifted') {
        const sw = Math.sin(t * 9 + sd) * 6;
        F = [sd * 20 + sw, 4];
      } else if (sit) {
        // thighs toward camera (foreshortened), shins hanging from the bench edge, swinging
        const sw = Math.sin(t * 6 + (sd > 0 ? Math.PI : 0)) * 10 * swing;
        G.ellipse(ctx, sd * 24, -70, 24, 20, { fill: legCol, lw: 3.5, seed: seed + 8 + sd, hatch });
        F = [sd * 26 + sw * 0.3, -2 + sw];
        K = [sd * 24, -62];
      }
      K = K || [(Hp[0] + F[0]) / 2 + sd * 2, (Hp[1] + F[1]) / 2];
      G.limb(ctx, sit ? [K, F] : [Hp, K, F], { color: legCol, lw: 28, seed: seed + 1 + sd });
      G.rrect(ctx, F[0] - 16, F[1] - 22, 32, 12, 5, { fill: shade(legCol, 1.15), lw: 3, seed: seed + 4 + sd }); // rolled cuff
      G.rrect(ctx, F[0] - 22 + sd * 4, F[1] - 12, 44, 20, 9, { fill: L.shoes, lw: 3.5, seed: seed + 6 + sd });
      G.line(ctx, [[F[0] - 18 + sd * 4, F[1] + 4], [F[0] + 20 + sd * 4, F[1] + 4]], { lw: 4, color: L.sole, seed: seed + 9 + sd });
    }

    // ---------- arms (targets) ----------
    const SL = [-46, sh + 10], SR = [46, sh + 10];
    let pL = handL, pR = handR, thumb = false, palmR = false;
    const swingA = pose === 'run' ? Math.cos(ph) : 0;
    const restL = [-58 - 4 * swingA, hip + 4 - 14 * Math.max(0, swingA)];
    const restR = [58 - 4 * swingA, hip + 4 - 14 * Math.max(0, -swingA)];
    if (gesture === 'thumbsUp') { pR = pR || [62, sh + 4]; thumb = true; }
    if (gesture === 'wave') pR = pR || [74 + Math.sin(t * 14) * 12, sh - 58];
    if (gesture === 'stop') { pR = pR || [70, sh - 40]; palmR = true; }
    if (gesture === 'armsUp') { pL = pL || [-56, sh - 70]; pR = pR || [56, sh - 70]; }
    if (hugBall || gesture === 'hug') { pL = pL || [-30, sh + 46]; pR = pR || [30, sh + 46]; }
    if (pose === 'lifted') { pL = pL || [-62, sh - 30]; pR = pR || [62, sh - 30]; }
    if (sit) { pL = pL || [-50, hip + 8]; pR = pR || [50, hip + 8]; }
    pL = pL || restL; pR = pR || restR;
    const armL = Ch.ik(SL, pL, 36, 34, pL[1] < sh ? -1 : 1);
    const armR = Ch.ik(SR, pR, 36, 34, pR[1] < sh ? 1 : -1);

    // ---------- torso: tee, overalls (bib + straps + star) ----------
    G.rrect(ctx, -50, sh - 4, 100, hip - sh + 18, 22, { fill: L.tee, lw: 4, seed: seed + 20, hatch: { color: 'rgba(0,0,0,0.06)', gap: 8 } });
    G.rrect(ctx, -52, hip - 22, 104, 44, 16, { fill: L.overalls, lw: 4, seed: seed + 21, hatch });
    G.rrect(ctx, -34, sh + 22, 68, hip - sh - 12, 10, { fill: L.overalls, lw: 3.5, seed: seed + 22, hatch });
    for (const sd of [-1, 1]) {
      G.line(ctx, [[sd * 28, sh + 26], [sd * 34, sh - 2]], { lw: 11, color: L.overalls, seed: seed + 23 + sd });
      G.ellipse(ctx, sd * 27, sh + 28, 5, 5, { fill: L.star, lw: 2, seed: seed + 25 + sd });
    }
    G.star(ctx, 0, sh + 52, 13, { fill: L.star, seed: seed + 27 });
    if (hugBall) ball(ctx, 0, sh + 40, 40, t * 2, seed + 28);
    // sleeves + arms
    for (const [S, A, P, sd] of [[SL, armL, pL, -1], [SR, armR, pR, 1]]) {
      G.limb(ctx, [S, A.E, A.H], { color: L.skin, lw: 17, seed: seed + 30 + sd });
      G.ellipse(ctx, S[0] + sd * 2, S[1] + 4, 18, 16, { fill: L.tee, lw: 3.5, seed: seed + 33 + sd });
      hand(ctx, A.H, seed + 35 + sd, sd > 0 && thumb, sd > 0 && palmR);
    }

    // ---------- head ----------
    const hr = headRot;
    ctx.save();
    ctx.translate(0, headY);
    ctx.rotate(hr * 0.12);
    G.rrect(ctx, -12, 52, 24, 26, 8, { fill: L.skin, lw: 3, seed: seed + 40 }); // neck
    // puffs (behind), scrunchies
    for (const sd of [-1, 1]) {
      const px = sd * 64 - hr * 10, py = -70;
      G.shape(ctx, curlyPts(px, py, 40, 38, 9, 0.09, seed + 41 + sd), { fill: L.hair, lw: 4, seed: seed + 41 + sd, hatch: { color: 'rgba(255,255,255,0.08)', gap: 6 } });
    }
    // ears, face
    for (const sd of [-1, 1]) G.ellipse(ctx, sd * 70 - hr * 6, 6, 12, 15, { fill: L.skin, lw: 3.5, seed: seed + 46 + sd });
    G.ellipse(ctx, 0, 0, 72, 68, { fill: L.skin, lw: 4.5, seed: seed + 48, hatch: { color: 'rgba(110,50,20,0.07)', gap: 9, angle: -0.8 } });
    // hair cap with a curly hairline
    const cap = curlyPts(0, -6, 74, 66, 11, 0.06, seed + 50, Math.PI * 1.05, Math.PI * 1.95);
    cap.push([62, -26], [30, -44], [0, -48], [-30, -44], [-62, -26]);
    G.shape(ctx, cap, { fill: L.hair, lw: 4, seed: seed + 50, hatch: { color: 'rgba(255,255,255,0.08)', gap: 6 } });
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 50 - hr * 9, -50); ctx.rotate(sd * 0.75);
      G.shape(ctx, curlyPts(0, 0, 19, 7, 5, 0.08, seed + 44 + sd), { fill: L.scrunchie, lw: 3, seed: seed + 44 + sd });
      ctx.restore();
    }

    // face features shift with the head turn
    const fx = hr * 18;
    // eyes
    for (const sd of [-1, 1]) {
      const ex = sd * 27 + fx, ey = 8;
      const bl = U.clamp(blink, 0, 1);
      if (eyes === 'happy') { G.line(ctx, [[ex - 13, ey + 5], [ex, ey - 8], [ex + 13, ey + 5]], { lw: 5, seed: seed + 52 + sd }); continue; }
      if (eyes === 'closed' || bl > 0.85) { G.line(ctx, [[ex - 13, ey], [ex, ey + 7], [ex + 13, ey]], { lw: 4.5, seed: seed + 54 + sd }); continue; }
      const wide = eyes === 'wide' ? 1.22 : 1;
      const ry = 18 * wide * (1 - bl);
      G.ellipse(ctx, ex, ey, 15 * wide, ry, { fill: '#FFFFFF', lw: 3, seed: seed + 56 + sd, amp: 0.5 });
      const ir = (eyes === 'wide' ? 9.5 : 12) * (1 - bl * 0.5);
      const ix = ex + look * 5, iy = ey + 2 + lookY * 5;
      ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, 15 * wide, Math.max(1, ry), 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = L.iris; ctx.beginPath(); ctx.arc(ix, iy, ir, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#140A06'; ctx.beginPath(); ctx.arc(ix, iy, ir * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ix - ir * 0.35, iy - ir * 0.4, ir * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ix + ir * 0.3, iy + ir * 0.3, ir * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // tears welling on the lower lid, and a drop down the cheek when full
      if (tears > 0) {
        ctx.save(); ctx.globalAlpha *= U.clamp(tears * 1.5, 0, 1);
        ctx.fillStyle = 'rgba(150,210,255,0.85)';
        ctx.beginPath(); ctx.ellipse(ex, ey + ry * 0.75, 13 * wide, 4 + 4 * tears, 0, 0, Math.PI); ctx.fill();
        if (tears > 0.7) {
          const d = (tears - 0.7) / 0.3;
          ctx.beginPath(); ctx.ellipse(ex + sd * 6, ey + ry + 8 + d * 26, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }
    // brows
    for (const sd of [-1, 1]) {
      const bx = sd * 27 + fx, by = eyes === 'wide' ? -24 : -18;
      const inner = brows === 'worried' ? -8 : brows === 'up' ? -6 : 0;
      const outer = brows === 'worried' ? 4 : brows === 'up' ? -6 : 0;
      G.line(ctx, [[bx - sd * 12, by + inner], [bx + sd * 12, by + outer]], { lw: 5, color: L.hair, seed: seed + 58 + sd });
    }
    // nose
    G.line(ctx, [[fx - 6, 30], [fx, 34], [fx + 6, 30]], { lw: 3, color: shade(L.skin, 0.7), seed: seed + 60 });
    // cheeks
    if (blush > 0) {
      ctx.save(); ctx.globalAlpha *= blush; ctx.fillStyle = L.blush;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 44 + fx * 0.6, 32, 13, 8, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    // mouth
    const my = 48, mx = fx;
    if (mouth === 'smile') G.line(ctx, [[mx - 14, my - 3], [mx, my + 6], [mx + 14, my - 3]], { lw: 4, seed: seed + 62, step: 6 });
    else if (mouth === 'grin' || mouth === 'open' || mouth === 'cry') {
      const pts = [];
      const down = mouth === 'cry';
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (i / 12);
        pts.push(down ? [mx + Math.cos(a) * 15, my + 10 - Math.sin(a) * 14] : [mx + Math.cos(a) * 17, my - 4 + Math.sin(a) * (mouth === 'grin' ? 16 : 20)]);
      }
      G.shape(ctx, pts, { fill: '#5A1E1A', lw: 3.5, seed: seed + 63 });
      if (mouth === 'grin') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(mx - 12, my - 4, 24, 5); }
      if (!down) { ctx.fillStyle = '#E8718D'; ctx.beginPath(); ctx.ellipse(mx, my + 9, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    } else if (mouth === 'o') G.ellipse(ctx, mx, my + 2, 8, 10, { fill: '#5A1E1A', lw: 3, seed: seed + 64 });
    else if (mouth === 'wavy') {
      const pts = [];
      for (let i = 0; i <= 8; i++) pts.push([mx - 14 + i * 3.5, my + 4 + Math.sin(i * 1.8 + t * 30) * 2.5]);
      G.line(ctx, pts, { lw: 4, seed: seed + 65, step: 4 });
    }
    ctx.restore();
    ctx.restore();
  };

  // ---------------- props ----------------
  // a ukulele: body centre at (x, y), neck pointing along `rot` (radians, 0 = up)
  Ch.ukulele = (ctx, x, y, rot = 0, s = 1, seed = 900) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    G.rrect(ctx, -8, -118, 16, 80, 5, { fill: '#7A4A2A', lw: 3.5, seed });
    G.rrect(ctx, -12, -140, 24, 24, 6, { fill: '#5E3A22', lw: 3.5, seed: seed + 1 });
    G.ellipse(ctx, 0, -40, 34, 32, { fill: '#C98A4B', lw: 4, seed: seed + 2, hatch: { color: 'rgba(90,40,10,0.2)', gap: 7 } });
    G.ellipse(ctx, 0, 14, 44, 40, { fill: '#C98A4B', lw: 4, seed: seed + 3, hatch: { color: 'rgba(90,40,10,0.2)', gap: 7 } });
    G.ellipse(ctx, 0, -10, 13, 13, { fill: '#3A2416', lw: 2.5, seed: seed + 4 });
    for (let k = -1.5; k <= 1.5; k++) G.line(ctx, [[k * 3.5, -134], [k * 4, 36]], { lw: 1.2, color: '#F6EBD6', seed: seed + 5 + k, amp: 0.2 });
    G.rrect(ctx, -16, 30, 32, 8, 3, { fill: '#5E3A22', lw: 2.5, seed: seed + 9 });
    ctx.restore();
  };
})();
