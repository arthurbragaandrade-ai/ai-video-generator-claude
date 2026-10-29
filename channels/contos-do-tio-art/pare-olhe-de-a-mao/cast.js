// The cast of "Contos do Tio Art", drawn with human proportions and smooth, even outlines.
//   Ch.lulu(ctx, o)  — Lulu, 3 years old (≈ 4.5 heads tall).      Ch.LULU_SK: her skeleton (local units)
//   Ch.tio(ctx, o)   — Tio Art, early 30s (≈ 7.5 heads tall).     Ch.TIO_SK:  his skeleton
//   Ch.tioHand(ctx, x, y, s, ang, kind) · Ch.ukulele(ctx, x, y, rot, s) · Ch.redBall(ctx, x, y, r, spin)
// Origin at the feet (stand / walk / run / kick / lifted) or at the hips on the seat (sit). Front view.
// Limbs are tapered outlines through the joints (Catmull-Rom), so elbows and knees bend in smooth curves.
(function () {
  const U = globalThis.U, G = globalThis.G, Ch = globalThis.Ch;
  const { lerp } = U;
  const shade = Ch.shade;

  // ======================= body kit =======================
  function spline(P, n = 7) {
    const out = [], N = P.length;
    for (let i = 0; i < N - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(N - 1, i + 2)];
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
        out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]), seg: i, u: t });
      }
    }
    out.push({ x: P[N - 1][0], y: P[N - 1][1], seg: N - 2, u: 1 });
    return out;
  }
  // a closed outline around a tapered limb: P = joints, ws = widths at the joints, bulge = extra width mid-segment
  function limbPts(P, ws, bulge = []) {
    const S = spline(P);
    const L = [], R = [], W = [], Tn = [];
    S.forEach((s, i) => {
      const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y;
      const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
      const w = (lerp(ws[s.seg], ws[s.seg + 1], s.u) + (bulge[s.seg] || 0) * Math.sin(Math.PI * s.u)) / 2;
      L.push([s.x - ty * w, s.y + tx * w]); R.push([s.x + ty * w, s.y - tx * w]); W.push(w); Tn.push([tx, ty]);
    });
    const cap = (i, back) => {
      const s = S[i], w = W[i], [tx, ty] = Tn[i], pts = [];
      for (let k = 1; k < 6; k++) {
        const a = (k / 6) * Math.PI, c = Math.cos(a), sn = Math.sin(a);
        const [nx, ny] = back ? [c * ty - sn * tx, -c * tx - sn * ty] : [-c * ty + sn * tx, c * tx + sn * ty];
        pts.push([s.x + nx * w, s.y + ny * w]);
      }
      return pts;
    };
    return [...L, ...cap(S.length - 1, false), ...R.reverse(), ...cap(0, true)];
  }
  // a smooth closed blob through control points
  function blobPts(P, n = 6) {
    const out = [], N = P.length;
    for (let i = 0; i < N; i++) {
      const p0 = P[(i - 1 + N) % N], p1 = P[i], p2 = P[(i + 1) % N], p3 = P[(i + 2) % N];
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    return out;
  }
  const BK = {
    limb: (ctx, P, ws, { fill, lw = 3.4, seed = 1, bulge } = {}) => G.shape(ctx, limbPts(P, ws, bulge), { fill, lw, seed, amp: 0, second: false }),
    blob: (ctx, P, { fill, lw = 3.4, seed = 1 } = {}) => G.shape(ctx, blobPts(P), { fill, lw, seed, amp: 0, second: false }),
    ell: (ctx, x, y, rx, ry, { fill, lw = 3.4, seed = 1 } = {}) => G.shape(ctx, G.ellPts(x, y, rx, ry), { fill, lw, seed, amp: 0, second: false }),
    line: (ctx, pts, { color = G.C.ink, lw = 3, seed = 1 } = {}) => G.line(ctx, pts, { color, lw, seed, amp: 0, step: 6 }),
  };
  Ch.BK = BK;

  // a hand at P, pointing along `ang` (wrist → fingertips); kind: grip | open | point | thumbsUp
  function hand(ctx, P, ang, size, kind, skin, seed, side = 1) {
    const k = size / 30, lw = 3 / k;
    ctx.save();
    ctx.translate(P[0], P[1]); ctx.rotate(ang); ctx.scale(k, k * side);
    const o = (n) => ({ fill: skin, lw, seed: seed + n });
    if (kind === 'open') {
      for (let f = 0; f < 4; f++) { const yy = -10 + f * 6.4; BK.limb(ctx, [[12, yy], [27 - Math.abs(f - 1.5) * 2, yy * 1.35]], [7.4, 6.2], o(f)); }
      BK.limb(ctx, [[4, 9], [13, 21]], [8, 6.6], o(9));
    }
    if (kind === 'point') BK.limb(ctx, [[12, -6], [34, -7]], [7.4, 6.2], o(5));
    BK.blob(ctx, [[-5, -9], [8, -12], [18, -9], [21, 1], [16, 10], [2, 11], [-5, 4]], o(7));
    if (kind !== 'open' && kind !== 'thumbsUp') BK.limb(ctx, [[2, 8], [12, 12]], [8, 6.6], o(8));
    if (kind === 'grip' || kind === 'point' || kind === 'thumbsUp') for (let f = 0; f < 3; f++) BK.line(ctx, [[15, -6 + f * 5], [19, -5 + f * 5]], { lw: 1.6 / k, seed: seed + 20 + f });
    ctx.restore();
    if (kind === 'thumbsUp') BK.limb(ctx, [[P[0], P[1] - 6 * k], [P[0] + 2 * k, P[1] - 24 * k]], [9 * k, 7.4 * k], { fill: skin, lw: 3, seed: seed + 11 });
  }
  function curlyPts(cx, cy, rx, ry, bumps, depth, a0 = 0, a1 = Math.PI * 2) {
    const pts = [], n = bumps * 6;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      const k = 1 + depth * Math.abs(Math.sin((i / 6) * Math.PI));
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  }
  // a face outline: round skull, softer narrower jaw, a gentle chin
  function facePts(rx, ry, jaw, chin) {
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2, sn = Math.sin(a);
      const low = Math.max(0, sn);
      pts.push([Math.cos(a) * rx * (1 - jaw * Math.pow(low, 1.6)), sn * ry + chin * Math.pow(low, 6)]);
    }
    return pts;
  }

  // ======================= Lulu =======================
  const LULU = {
    skin: '#B9805A', hair: '#2B1A14', tee: '#FBF6EC', overalls: '#D94B3A', star: '#F5C542',
    scrunchie: '#F5C542', shoes: '#D94B3A', sole: '#FBF6EC', blush: '#E8718D', iris: '#4A2A1A', lip: '#9A4A3A',
  };
  const UP = 25; // the upper body is built in its own coordinates and set 25 units lower onto the shorter legs
  const LSK = { sh: -302 + UP, shX: 40, hip: -190 + UP, up: 58, fore: 51, head: -374 + UP };
  Ch.LULU = LULU; Ch.LULU_SK = LSK;
  Ch.luluHand = (ctx, x, y, s = 1, ang = Math.PI / 2, kind = 'grip', seed = 590) => hand(ctx, [x, y], ang, 21 * s, kind, LULU.skin, seed, 1);

  function sneaker(ctx, A, sd, col, sole, seed, s = 1) {
    const x = A[0] + sd * 2 * s, y = A[1];
    BK.blob(ctx, [[x - 12 * s, y - 4 * s], [x + 12 * s, y - 4 * s], [x + 18 * s, y + 9 * s], [x + 16 * s, y + 17 * s], [x - 16 * s, y + 17 * s], [x - 18 * s, y + 9 * s]], { fill: col, seed });
    BK.line(ctx, [[x - 15 * s, y + 14 * s], [x + 15 * s, y + 14 * s]], { color: sole, lw: 3.6 * s, seed: seed + 1 });
    BK.line(ctx, [[x - 6 * s, y + 3 * s], [x + 6 * s, y + 3 * s]], { color: sole, lw: 2 * s, seed: seed + 2 });
  }

  Ch.lulu = (ctx, o) => {
    const {
      x, y, s = 1, sx = 1, sy = 1, rot = 0, pose = 'stand', run = 0, kick = 0, seed = 500,
      eyes = 'normal', look = 0, lookY = 0, blink = 0, brows = 'neutral', mouth = 'smile', tears = 0, blush = 0.5,
      headRot = 0, tremble = 0, handL, handR, gesture = null, hugBall = false, swing = 0, shadow = true, t = G.t,
    } = o;
    const L = LULU, sit = pose === 'sit';
    const skinD = shade(L.skin, 0.8);
    ctx.save();
    ctx.translate(x + (tremble ? U.noise1(t * 38, seed) * 3 * tremble : 0), y);
    if (shadow && pose !== 'lifted' && !sit) {
      ctx.fillStyle = 'rgba(20,10,20,0.2)';
      ctx.beginPath(); ctx.ellipse(0, 4, 50 * s, 9 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
    const ph = 2 * Math.PI * run;
    if (pose === 'run') ctx.translate(0, -Math.abs(Math.sin(ph)) * 10 * s);
    ctx.scale(s * sx, s * sy);
    ctx.rotate(rot + (pose === 'run' ? Math.sin(ph) * 0.03 : 0));
    if (sit) ctx.translate(0, -LSK.hip);

    // ---------- legs (overalls), cuffs, sneakers ----------
    const red = L.overalls, redL = shade(red, 1.12);
    if (!sit) BK.blob(ctx, [[-42, -190], [42, -190], [44, -170], [26, -150], [0, -145], [-26, -150], [-44, -170]], { fill: red, seed: seed + 12 });
    for (const sd of [-1, 1]) {
      if (sit) {
        const sw = Math.sin(t * 6 + (sd > 0 ? Math.PI : 0)) * 9 * swing;
        const K = [sd * 22, -145], A = [sd * 23 + sw * 0.3, -80 + sw];
        BK.limb(ctx, [K, A], [26, 19], { fill: red, seed: seed + 1 + sd });
        BK.ell(ctx, sd * 21, -153, 23, 19, { fill: red, seed: seed + 3 + sd });
        G.rrect(ctx, A[0] - 11, A[1] - 12, 22, 9, 4, { fill: redL, lw: 2.6, seed: seed + 5 + sd, amp: 0, second: false });
        sneaker(ctx, A, sd, L.shoes, L.sole, seed + 7 + sd);
        continue;
      }
      const Hp = [sd * 19, -158];
      let K = [sd * 21, -86], A = [sd * 21, -20];
      if (pose === 'run') {
        const a = ph + (sd > 0 ? Math.PI : 0), lift = Math.max(0, Math.sin(a)), sw = Math.cos(a);
        A = [sd * 21 + sw * 8, -20 - lift * 30]; K = [sd * (21 + lift * 7), -86 - lift * 26];
      } else if (pose === 'kick' && sd > 0) {
        const k = U.ease.outQuad(kick);
        K = [sd * (21 + 16 * k), -86 - 20 * k]; A = [sd * (21 + 50 * k), -20 - 44 * k];
      } else if (pose === 'lifted') {
        const sw = Math.sin(t * 9 + sd) * 5;
        K = [sd * 19, -84]; A = [sd * 18 + sw, -18];
      }
      BK.limb(ctx, [Hp, K, A], [38, 28, 22], { fill: red, seed: seed + 1 + sd, bulge: [3, 2] });
      G.rrect(ctx, A[0] - 12, A[1] - 13, 24, 10, 4, { fill: redL, lw: 2.6, seed: seed + 5 + sd, amp: 0, second: false });
      sneaker(ctx, A, sd, L.shoes, L.sole, seed + 7 + sd);
    }
    ctx.save();
    ctx.translate(0, UP);
    // ---------- torso ----------
    BK.limb(ctx, [[0, -330], [0, -306]], [27, 30], { fill: L.skin, seed: seed + 14 }); // neck: short and soft
    BK.blob(ctx, [[-13, -314], [13, -314], [36, -307], [45, -292], [44, -262], [47, -232], [45, -208], [0, -203], [-45, -208], [-47, -232], [-44, -262], [-45, -292], [-36, -307]], { fill: L.tee, seed: seed + 15 });
    BK.line(ctx, [[-12, -312], [0, -304], [12, -312]], { lw: 2.4, seed: seed + 16 }); // collar
    G.rrect(ctx, -29, -270, 58, 58, 10, { fill: red, lw: 3.4, seed: seed + 17, amp: 0, second: false }); // bib
    G.rrect(ctx, -44, -219, 88, 16, 7, { fill: red, lw: 3.4, seed: seed + 18, amp: 0, second: false }); // waistband
    for (const sd of [-1, 1]) {
      BK.limb(ctx, [[sd * 24, -264], [sd * 31, -306]], [9, 9], { fill: red, seed: seed + 19 + sd });
      BK.ell(ctx, sd * 24, -262, 4.5, 4.5, { fill: L.star, lw: 2, seed: seed + 21 + sd });
    }
    G.star(ctx, 0, -244, 10, { fill: L.star, seed: seed + 23 });
    if (hugBall) ballDraw(ctx, 0, -252, 34, t * 2, seed + 24);

    // ---------- arms ----------
    const SL = [-LSK.shX, LSK.sh - UP + 6], SR = [LSK.shX, LSK.sh - UP + 6];
    const swingA = pose === 'run' ? Math.cos(ph) : 0;
    const up = (p) => p && [p[0], p[1] - UP]; // targets come in feet coordinates
    let pL = up(handL), pR = up(handR), kindL = 'grip', kindR = 'grip';
    if (gesture === 'thumbsUp') { pR = pR || [58, -282]; kindR = 'thumbsUp'; }
    if (gesture === 'wave') { pR = pR || [72 + Math.sin(t * 14) * 10, -392]; kindR = 'open'; }
    if (gesture === 'stop') { pR = pR || [82, -350]; kindR = 'open'; }
    if (gesture === 'armsUp') { pL = pL || [-52, -398]; pR = pR || [52, -398]; kindL = kindR = 'open'; }
    if (hugBall || gesture === 'hug') { pL = pL || [-26, -246]; pR = pR || [26, -246]; }
    if (pose === 'lifted') { pL = pL || [-56, -338]; pR = pR || [56, -338]; kindL = kindR = 'open'; }
    if (sit) { pL = pL || [-38, -196]; pR = pR || [38, -196]; }
    pL = pL || [-47 - 5 * swingA, -180 - 10 * Math.max(0, swingA)];
    pR = pR || [47 - 5 * swingA, -180 - 10 * Math.max(0, -swingA)];
    const armL = Ch.ik(SL, pL, LSK.up, LSK.fore, pL[1] < SL[1] ? -1 : 1);
    const armR = Ch.ik(SR, pR, LSK.up, LSK.fore, pR[1] < SR[1] ? 1 : -1);
    for (const [S, A, sd, kind] of [[SL, armL, -1, kindL], [SR, armR, 1, kindR]]) {
      BK.limb(ctx, [S, A.E, A.H], [17, 14, 11.5], { fill: L.skin, seed: seed + 30 + sd, bulge: [2, 1] });
      BK.limb(ctx, [[S[0] - sd * 2, S[1] - 2], [lerp(S[0], A.E[0], 0.45), lerp(S[1], A.E[1], 0.45)]], [27, 23], { fill: L.tee, seed: seed + 33 + sd });
      const ang = Math.atan2(A.H[1] - A.E[1], A.H[0] - A.E[0]);
      hand(ctx, A.H, ang, 21, kind, L.skin, seed + 36 + sd * 3, sd < 0 ? -1 : 1);
    }

    // ---------- head ----------
    const hr = headRot;
    ctx.save();
    ctx.translate(0, LSK.head - UP);
    ctx.rotate(hr * 0.1);
    for (const sd of [-1, 1]) G.shape(ctx, curlyPts(sd * 48 - hr * 8, -38, 34, 32, 9, 0.05), { fill: L.hair, lw: 3.4, seed: seed + 41 + sd, amp: 0, second: false });
    for (const sd of [-1, 1]) {
      const ex = sd * 41 - hr * 5;
      BK.ell(ctx, ex, 4, 7.5, 11, { fill: L.skin, seed: seed + 43 + sd });
      BK.line(ctx, [[ex - sd * 1, -2], [ex + sd * 2.5, 4], [ex - sd * 1, 9]], { color: skinD, lw: 1.8, seed: seed + 45 + sd });
    }
    G.shape(ctx, facePts(42, 44, 0.16, 4), { fill: L.skin, lw: 3.4, seed: seed + 47, amp: 0, second: false });
    // hair cap with a soft hairline
    BK.blob(ctx, [[-43, 2], [-44, -24], [-34, -40], [-17, -48], [0, -50], [17, -48], [34, -40], [44, -24], [43, 2], [37, -10], [26, -20], [10, -24], [-10, -24], [-26, -20], [-37, -10]], { fill: L.hair, seed: seed + 49 });
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 38 - hr * 8, -30); ctx.rotate(sd * 0.75);
      G.shape(ctx, curlyPts(0, 0, 14, 6, 5, 0.06), { fill: L.scrunchie, lw: 2.6, seed: seed + 51 + sd, amp: 0, second: false });
      ctx.restore();
    }
    const fx = hr * 12;
    // eyes, with an upper lid line and lashes
    for (const sd of [-1, 1]) {
      const ex = sd * 17 + fx, ey = 2, bl = U.clamp(blink, 0, 1);
      if (eyes === 'happy') { BK.line(ctx, [[ex - 9, ey + 3], [ex, ey - 5], [ex + 9, ey + 3]], { lw: 3.4, seed: seed + 53 + sd }); continue; }
      if (eyes === 'closed' || bl > 0.85) { BK.line(ctx, [[ex - 9, ey], [ex, ey + 4], [ex + 9, ey]], { lw: 3, seed: seed + 55 + sd }); continue; }
      const wide = eyes === 'wide' ? 1.18 : 1, rx = 9.6 * wide, ry = 10.6 * wide * (1 - bl);
      BK.ell(ctx, ex, ey, rx, ry, { fill: '#FFFFFF', lw: 2.2, seed: seed + 57 + sd });
      const ir = (eyes === 'wide' ? 6.2 : 7.2), ix = ex + look * 3.4, iy = ey + 1 + lookY * 3;
      ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, rx, Math.max(1, ry), 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = L.iris; ctx.beginPath(); ctx.arc(ix, iy, ir, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#140A06'; ctx.beginPath(); ctx.arc(ix, iy, ir * 0.52, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ix - ir * 0.34, iy - ir * 0.38, ir * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const lid = []; for (let k = 0; k <= 8; k++) { const a = Math.PI * (1.08 + 0.84 * k / 8); lid.push([ex + Math.cos(a) * rx * 1.04, ey + Math.sin(a) * ry * 1.04]); }
      BK.line(ctx, lid, { lw: 3.4, seed: seed + 59 + sd });
      BK.line(ctx, [lid[sd > 0 ? 8 : 0], [lid[sd > 0 ? 8 : 0][0] + sd * 4, lid[sd > 0 ? 8 : 0][1] - 3]], { lw: 2.4, seed: seed + 61 + sd });
      if (tears > 0) {
        ctx.save(); ctx.globalAlpha *= U.clamp(tears * 1.5, 0, 1);
        ctx.fillStyle = 'rgba(150,210,255,0.85)';
        ctx.beginPath(); ctx.ellipse(ex, ey + ry * 0.72, rx * 0.9, 2.5 + 2.6 * tears, 0, 0, Math.PI); ctx.fill();
        if (tears > 0.7) { const d = (tears - 0.7) / 0.3; ctx.beginPath(); ctx.ellipse(ex + sd * 4, ey + ry + 5 + d * 16, 3.2, 5, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
    }
    for (const sd of [-1, 1]) {
      const bx = sd * 17 + fx, by = eyes === 'wide' ? -17 : -14;
      const inner = brows === 'worried' ? -5 : brows === 'up' ? -4 : 0, outer = brows === 'worried' ? 3 : brows === 'up' ? -4 : 0;
      BK.line(ctx, [[bx - sd * 8, by + inner], [bx, by - 2 + (inner + outer) / 2], [bx + sd * 8, by + outer]], { color: L.hair, lw: 3, seed: seed + 63 + sd });
    }
    BK.line(ctx, [[fx - 4, 19], [fx, 21.5], [fx + 4, 19]], { color: skinD, lw: 2.4, seed: seed + 65 });
    if (blush > 0) {
      ctx.save(); ctx.globalAlpha *= blush * 0.8; ctx.fillStyle = L.blush;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 27 + fx * 0.6, 20, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    const my = 31, mx = fx;
    if (mouth === 'smile') BK.line(ctx, [[mx - 9, my - 2], [mx, my + 3.5], [mx + 9, my - 2]], { lw: 2.8, seed: seed + 67 });
    else if (mouth === 'grin' || mouth === 'open' || mouth === 'cry') {
      const pts = [], down = mouth === 'cry';
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (i / 12);
        pts.push(down ? [mx + Math.cos(a) * 10, my + 6 - Math.sin(a) * 9] : [mx + Math.cos(a) * 11, my - 3 + Math.sin(a) * (mouth === 'grin' ? 10 : 12)]);
      }
      G.shape(ctx, pts, { fill: '#5A1E1A', lw: 2.6, seed: seed + 68, amp: 0, second: false });
      if (mouth === 'grin') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(mx - 8, my - 3, 16, 3.5); }
      if (!down) { ctx.fillStyle = '#E8718D'; ctx.beginPath(); ctx.ellipse(mx, my + 5, 5, 3, 0, 0, Math.PI * 2); ctx.fill(); }
    } else if (mouth === 'o') BK.ell(ctx, mx, my + 1, 5, 6.5, { fill: '#5A1E1A', lw: 2.4, seed: seed + 69 });
    else if (mouth === 'wavy') {
      const pts = [];
      for (let i = 0; i <= 8; i++) pts.push([mx - 10 + i * 2.5, my + 2 + Math.sin(i * 1.8 + t * 30) * 1.8]);
      BK.line(ctx, pts, { lw: 2.8, seed: seed + 70 });
    }
    ctx.restore();
    ctx.restore();
    ctx.restore();
  };

  // ======================= Tio Art =======================
  const TIO = {
    skin: '#B07A55', hair: '#2A1C16', glasses: '#7A4A2A', tee: '#FBF6EC', cardigan: '#D9A23A',
    pants: '#2E3E66', shoes: '#8A5A3A', sole: '#F2E6D0', lip: '#8E4E3C',
  };
  const TSK = { sh: -448, shX: 62, hip: -262, up: 104, fore: 96, head: -520 };
  Ch.TIO = TIO; Ch.TIO_SK = TSK;
  Ch.tioHand = (ctx, x, y, s = 1, ang = Math.PI / 2, kind = 'grip', seed = 880) => hand(ctx, [x, y], ang, 34 * s, kind, TIO.skin, seed, 1);

  function shoe(ctx, A, sd, seed) {
    const x = A[0] + sd * 3, y = A[1];
    BK.blob(ctx, [[x - 15, y - 2], [x + 15, y - 2], [x + 23, y + 12], [x + 21, y + 22], [x - 21, y + 22], [x - 23, y + 12]], { fill: TIO.shoes, seed });
    BK.line(ctx, [[x - 20, y + 19], [x + 20, y + 19]], { color: TIO.sole, lw: 3.2, seed: seed + 1 });
  }

  Ch.tio = (ctx, o) => {
    const {
      x, y, s = 1, pose = 'stand', walk = 0, eyes = 'normal', brows = 'neutral', mouth = 'smile', look = 0, lookY = 0,
      headRot = 0, blink = 0, handL, handR, gesture = null, backUke = false, seed = 800, shadow = true, t = G.t,
    } = o;
    const T_ = TIO, sit = pose === 'sit', walking = pose === 'walk';
    const wph = 2 * Math.PI * walk;
    const skinD = shade(T_.skin, 0.8), cardD = shade(T_.cardigan, 0.82);
    ctx.save();
    ctx.translate(x, y);
    if (shadow && !sit) { ctx.fillStyle = 'rgba(20,10,20,0.2)'; ctx.beginPath(); ctx.ellipse(0, 4, 74 * s, 12 * s, 0, 0, Math.PI * 2); ctx.fill(); }
    if (walking) ctx.translate(0, -Math.abs(Math.sin(wph)) * 9 * s);
    ctx.scale(s, s);
    if (walking) ctx.rotate(Math.sin(wph) * 0.02);
    if (sit) ctx.translate(0, -TSK.hip);
    if (backUke) Ch.ukulele(ctx, 36, -352, 0.45, 0.8, seed + 90);

    // ---------- legs ----------
    if (!sit) BK.blob(ctx, [[-56, -292], [56, -292], [58, -264], [38, -244], [0, -238], [-38, -244], [-58, -264]], { fill: T_.pants, seed: seed + 8 });
    for (const sd of [-1, 1]) {
      if (sit) {
        const K = [sd * 34, -236], A = [sd * 36, -116];
        BK.limb(ctx, [K, A], [34, 23], { fill: T_.pants, seed: seed + 1 + sd, bulge: [4] });
        BK.ell(ctx, sd * 33, -246, 33, 28, { fill: T_.pants, seed: seed + 3 + sd });
        shoe(ctx, A, sd, seed + 5 + sd);
        continue;
      }
      const Hp = [sd * 30, -256];
      let K = [sd * 31, -138], A = [sd * 31, -24];
      if (walking) {
        const a = wph + (sd > 0 ? Math.PI : 0), lift = Math.max(0, Math.sin(a)), sw = Math.cos(a);
        A = [sd * 31 + sw * 6, -24 - lift * 30]; K = [sd * (31 + lift * 6), -138 - lift * 24];
      }
      BK.limb(ctx, [Hp, K, A], [50, 33, 22], { fill: T_.pants, seed: seed + 1 + sd, bulge: [4, 5] });
      shoe(ctx, A, sd, seed + 5 + sd);
    }

    // ---------- torso: tee under an open cardigan ----------
    BK.limb(ctx, [[0, -492], [0, -452]], [27, 31], { fill: T_.skin, seed: seed + 10 });
    BK.blob(ctx, [[-16, -462], [16, -462], [52, -452], [66, -430], [62, -380], [54, -322], [58, -276], [0, -270], [-58, -276], [-54, -322], [-62, -380], [-66, -430], [-52, -452]], { fill: T_.tee, seed: seed + 11 });
    BK.line(ctx, [[-15, -461], [0, -450], [15, -461]], { lw: 2.6, seed: seed + 12 });
    for (const sd of [-1, 1]) {
      const P = [[sd * 18, -464], [sd * 54, -452], [sd * 68, -430], [sd * 64, -380], [sd * 56, -322], [sd * 61, -272], [sd * 12, -266], [sd * 10, -330], [sd * 14, -410]];
      BK.blob(ctx, P, { fill: T_.cardigan, seed: seed + 13 + sd });
      G.rrect(ctx, sd > 0 ? 12 : -61, -286, 49, 16, 6, { fill: cardD, lw: 2.6, seed: seed + 15 + sd, amp: 0, second: false });
      BK.line(ctx, [[sd * 40, -330], [sd * 54, -330]], { color: cardD, lw: 3, seed: seed + 17 + sd }); // pocket edge
    }
    for (const yb of [-404, -366, -328]) BK.ell(ctx, 15, yb, 3.6, 3.6, { fill: '#7A4A2A', lw: 1.8, seed: seed + 20 + yb });

    // ---------- arms (cardigan sleeves, ribbed cuffs, hands) ----------
    const sh = TSK.sh;
    const SL = [-TSK.shX, sh + 8], SR = [TSK.shX, sh + 8];
    const aw = walking ? Math.cos(wph) : 0;
    let pL = handL, pR = handR, kindL = 'grip', kindR = 'grip';
    if (gesture === 'point') { pR = pR || [226, sh + 8]; kindR = 'point'; }
    if (gesture === 'thumbsUp') { pR = pR || [104, sh + 96]; kindR = 'thumbsUp'; }
    if (gesture === 'wave') { pR = pR || [132 + Math.sin(t * 12) * 14, sh - 150]; kindR = 'open'; }
    if (gesture === 'stop') { pR = pR || [128, sh - 118]; kindR = 'open'; }
    if (sit) { pL = pL || [-62, sh + 196]; pR = pR || [62, sh + 196]; }
    pL = pL || [-70 - 6 * aw, -252 - 18 * Math.max(0, aw)];
    pR = pR || [70 - 6 * aw, -252 - 18 * Math.max(0, -aw)];
    const armL = Ch.ik(SL, pL, TSK.up, TSK.fore, pL[1] < SL[1] ? -1 : 1);
    const armR = Ch.ik(SR, pR, TSK.up, TSK.fore, pR[1] < SR[1] ? 1 : -1);
    for (const [S, A, sd, kind] of [[SL, armL, -1, kindL], [SR, armR, 1, kindR]]) {
      BK.limb(ctx, [S, A.E, A.H], [32, 25, 20], { fill: T_.cardigan, seed: seed + 30 + sd, bulge: [4, 2] });
      const c0 = [lerp(A.E[0], A.H[0], 0.8), lerp(A.E[1], A.H[1], 0.8)];
      BK.limb(ctx, [c0, A.H], [23, 22], { fill: cardD, seed: seed + 33 + sd });
      const ang = Math.atan2(A.H[1] - A.E[1], A.H[0] - A.E[0]);
      hand(ctx, A.H, ang, 33, kind, T_.skin, seed + 36 + sd * 3, sd < 0 ? -1 : 1);
    }

    // ---------- head ----------
    const hr = headRot;
    ctx.save();
    ctx.translate(0, TSK.head);
    ctx.rotate(hr * 0.08);
    for (const sd of [-1, 1]) {
      const ex = sd * 31 - hr * 4;
      BK.ell(ctx, ex, 2, 7.5, 12.5, { fill: T_.skin, seed: seed + 40 + sd });
      BK.line(ctx, [[ex - sd, -5], [ex + sd * 2.5, 2], [ex - sd, 9]], { color: skinD, lw: 1.8, seed: seed + 42 + sd });
    }
    G.shape(ctx, facePts(31, 39, 0.24, 6), { fill: T_.skin, lw: 3.4, seed: seed + 44, amp: 0, second: false });
    const fx = hr * 9;
    // beard along the jaw, mustache, then the mouth on top
    BK.blob(ctx, [[-31, 0], [-29, 20], [-20, 36], [-8, 44], [8, 44], [20, 36], [29, 20], [31, 0], [24, 8], [14, 14], [fx, 13], [-14, 14], [-24, 8]], { fill: T_.hair, seed: seed + 46 });
    BK.blob(ctx, [[fx - 13, 19], [fx, 15], [fx + 13, 19], [fx + 9, 23], [fx, 21], [fx - 9, 23]], { fill: T_.hair, seed: seed + 47 });
    const my = 27, mx = fx;
    if (mouth === 'open' || mouth === 'talk') { // 'talk' = half open, for lip-sync
      const k = mouth === 'open' ? 1 : 0.6;
      BK.ell(ctx, mx, my + 3 * k, 8, 7 * k, { fill: '#4A1A16', lw: 2.4, seed: seed + 48 });
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(mx - 6, my - 4 * k + 1, 12, 2.6);
    } else if (mouth === 'grin') {
      const pts = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; pts.push([mx + Math.cos(a) * 10, my - 2 + Math.sin(a) * 8]); }
      G.shape(ctx, pts, { fill: '#4A1A16', lw: 2.4, seed: seed + 49, amp: 0, second: false });
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(mx - 8, my - 2, 16, 3);
    } else {
      BK.blob(ctx, [[mx - 9, my - 1], [mx, my + 3], [mx + 9, my - 1], [mx, my + 6]], { fill: T_.lip, lw: 2, seed: seed + 50 });
    }
    // hair: short and wavy, a little volume on top
    BK.blob(ctx, [[-33, -4], [-34, -24], [-27, -40], [-12, -48], [4, -50], [20, -47], [31, -36], [34, -16], [32, -4], [28, -16], [20, -26], [6, -28], [-8, -27], [-22, -24], [-29, -14]], { fill: T_.hair, seed: seed + 52 });
    G.shape(ctx, curlyPts(-4, -47, 22, 7, 5, 0.12, Math.PI, Math.PI * 2), { fill: T_.hair, lw: 3, seed: seed + 53, amp: 0, second: false, closed: true });
    // eyes behind round glasses
    for (const sd of [-1, 1]) {
      const ex = sd * 13 + fx, ey = -2, bl = U.clamp(blink, 0, 1);
      if (eyes === 'happy') BK.line(ctx, [[ex - 6, ey + 2], [ex, ey - 3], [ex + 6, ey + 2]], { lw: 2.6, seed: seed + 55 + sd });
      else if (eyes === 'closed' || bl > 0.85) BK.line(ctx, [[ex - 6, ey], [ex, ey + 2.5], [ex + 6, ey]], { lw: 2.4, seed: seed + 57 + sd });
      else {
        const wide = eyes === 'wide' ? 1.2 : 1;
        BK.ell(ctx, ex, ey, 6.4 * wide, 4.8 * wide * (1 - bl), { fill: '#FFFFFF', lw: 1.6, seed: seed + 59 + sd });
        ctx.fillStyle = '#3A2214'; ctx.beginPath(); ctx.arc(ex + look * 2.4, ey + 0.5 + lookY * 1.6, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ex + look * 2.4 - 1.2, ey - 0.8, 1.1, 0, Math.PI * 2); ctx.fill();
        BK.line(ctx, [[ex - 7, ey - 1], [ex, ey - 5.4 * wide], [ex + 7, ey - 1]], { lw: 2.4, seed: seed + 61 + sd });
      }
      ctx.save(); ctx.strokeStyle = T_.glasses; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.arc(ex, ey, 11.5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex + sd * 11.5, ey - 2); ctx.lineTo(sd * 30 - hr * 4, ey - 4); ctx.stroke();
      ctx.restore();
      const bx = ex, by = -20;
      const inner = brows === 'worried' ? -4 : brows === 'up' ? -3 : 0, outer = brows === 'worried' ? 2 : brows === 'up' ? -3 : 0;
      BK.limb(ctx, [[bx - sd * 9, by + inner], [bx + sd * 9, by + outer]], [5.4, 3.6], { fill: T_.hair, lw: 1.6, seed: seed + 63 + sd });
    }
    ctx.save(); ctx.strokeStyle = T_.glasses; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(fx - 2, -3); ctx.quadraticCurveTo(fx, -6, fx + 2, -3); ctx.stroke(); ctx.restore();
    BK.line(ctx, [[fx, 0], [fx - 3, 10], [fx + 1, 12.5], [fx + 4, 10.5]], { color: skinD, lw: 2.4, seed: seed + 65 });
    ctx.restore();
    ctx.restore();
  };

  // ======================= props =======================
  function ballDraw(ctx, x, y, r, spin, seed) {
    BK.ell(ctx, x, y, r, r, { fill: '#E2483C', lw: 3.4, seed });
    BK.line(ctx, [[x - r * 0.85, y + Math.sin(spin) * r * 0.3], [x, y + Math.sin(spin) * r * 0.45 + r * 0.1], [x + r * 0.85, y + Math.sin(spin) * r * 0.3]], { color: '#FBF6EC', lw: 2.6, seed: seed + 1 });
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.4, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  Ch.redBall = (ctx, x, y, r, spin, seed = 600) => ballDraw(ctx, x, y, r, spin, seed);

  // a ukulele: body centre at (x, y), neck pointing along `rot` (radians, 0 = up)
  Ch.ukulele = (ctx, x, y, rot = 0, s = 1, seed = 900) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    G.rrect(ctx, -8, -118, 16, 80, 5, { fill: '#7A4A2A', lw: 3, seed, amp: 0, second: false });
    G.rrect(ctx, -12, -140, 24, 24, 6, { fill: '#5E3A22', lw: 3, seed: seed + 1, amp: 0, second: false });
    BK.blob(ctx, [[-30, -60], [0, -72], [30, -60], [34, -30], [26, -8], [44, 14], [40, 44], [0, 56], [-40, 44], [-44, 14], [-26, -8], [-34, -30]], { fill: '#C98A4B', seed: seed + 2 });
    BK.ell(ctx, 0, -14, 12, 12, { fill: '#3A2416', lw: 2.4, seed: seed + 4 });
    for (let k = -1.5; k <= 1.5; k++) G.line(ctx, [[k * 3.5, -134], [k * 4, 34]], { lw: 1.2, color: '#F6EBD6', seed: seed + 5 + k, amp: 0 });
    G.rrect(ctx, -16, 28, 32, 8, 3, { fill: '#5E3A22', lw: 2.4, seed: seed + 9, amp: 0, second: false });
    ctx.restore();
  };
})();
