// THE FILM — "Pare, Olhe e Dê a Mão!" (Contos do Tio Art, vídeo 1). Every frame is a pure function of t.
(function () {
  const U = globalThis.U, G = globalThis.G, Ch = globalThis.Ch, S = globalThis.SCORE, Studio = globalThis.Studio;
  const Shots = globalThis.Shots, Subs = globalThis.Subs;
  const { T, BEAT, ev } = S;
  const { clamp, lerp, ease, pulse } = U;
  const W = G.W, H = G.H;
  G.setStyle('paper', { amp: 0, second: false, hatch: false, textBoil: 0 }); // smooth, even outlines everywhere

  // ---------- layout of the street (1080 × 1920) ----------
  const SKY_END = 930, SB = 1110, CURB = 1150, ST0 = 1172, ST1 = 1632, LANE = 1402, CAR_Y = 1590;
  const LS = 0.8, TS = 1.0; // Lulu / Tio Art scale in wide shots (she is ≈ 0.6 of his height)
  const CW = [300, 760]; // crosswalk x range
  const stripeY = (i) => 1192 + i * 56; // zebra stripes (8)
  const PAL = { sky0: '#BFE3E0', sky1: '#F6F0E2', walk: '#EFE3CC', curb: '#D8D2C6', road: '#5E6472', grass: '#9CC97A' };

  // a world point → a character's own (feet) coordinates; seated characters are built hips-at-origin, so pass their hip
  const toLocal = (p, x, y, s, hipY = 0) => [(p[0] - x) / s, (p[1] - y) / s + hipY];
  const TIO_HIP = Ch.TIO_SK.hip, LSK = Ch.LULU_SK;
  // lip-sync: out/lipsync.json (written by song.js) holds each character's voice loudness per frame
  let LIP = null;
  const lip = (t, who, base) => {
    const a = LIP ? LIP[who][Math.round(t * LIP.fps)] || 0 : 0;
    return a > 0.5 ? 'open' : a > 0.18 ? (who === 'tio' ? 'talk' : 'o') : base;
  };
  const blinkAt = (t, seed) => { const k = Math.floor(t / 2.3); const tb = k * 2.3 + 0.4 + U.hash(seed, k) * 1.4; return Math.abs(t - tb) < 0.07 ? 1 : 0; };

  // ---------- scenery ----------
  function sky(ctx) {
    const g = ctx.createLinearGradient(0, -200, 0, SKY_END);
    g.addColorStop(0, PAL.sky0); g.addColorStop(1, PAL.sky1);
    ctx.fillStyle = g; ctx.fillRect(-300, -400, W + 600, SKY_END + 400);
    for (const [x, y, s, k] of [[170, 300, 1, 1], [700, 210, 0.8, 2], [960, 360, 0.6, 3]]) {
      for (const [dx, dy, r] of [[-60, 10, 50], [0, -10, 66], [62, 12, 48]]) G.ellipse(ctx, x + dx * s, y + dy * s, r * s, r * 0.72 * s, { fill: '#FFFFFF', lw: 3, seed: 30 + k * 7 + dx });
    }
  }
  const HOUSES = [
    { x: -40, w: 300, h: 420, col: '#E8A07A', roof: '#B5523B', door: '#3D8C86' },
    { x: 270, w: 270, h: 360, col: '#F2D27A', roof: '#B5523B', door: '#D94B3A' },
    { x: 550, w: 290, h: 450, col: '#9FD0C9', roof: '#8E4A3A', door: '#D9A23A' },
    { x: 850, w: 280, h: 390, col: '#F6C9C0', roof: '#B5523B', door: '#3D8C86' },
  ];
  function houses(ctx) {
    HOUSES.forEach((hs, i) => {
      const top = SKY_END - hs.h, sd = 100 + i * 20;
      G.rrect(ctx, hs.x, top, hs.w, hs.h + 10, 6, { fill: hs.col, lw: 4, seed: sd, hatch: { color: 'rgba(0,0,0,0.06)', gap: 9 } });
      G.poly(ctx, [[hs.x - 22, top + 4], [hs.x + hs.w / 2, top - 110], [hs.x + hs.w + 22, top + 4]], { fill: hs.roof, lw: 4, seed: sd + 1, hatch: { color: 'rgba(0,0,0,0.15)', gap: 8 } });
      const dx = hs.x + hs.w / 2 - 34;
      G.rrect(ctx, dx, SKY_END - 140, 68, 140, 26, { fill: hs.door, lw: 4, seed: sd + 2 });
      G.ellipse(ctx, dx + 52, SKY_END - 70, 5, 5, { fill: '#F2B84B', lw: 2, seed: sd + 3 });
      for (const wx of [hs.x + 30, hs.x + hs.w - 100]) {
        G.rrect(ctx, wx, top + 60, 70, 80, 8, { fill: '#DDF0F2', lw: 3.5, seed: sd + 4 + wx });
        G.line(ctx, [[wx + 35, top + 62], [wx + 35, top + 138]], { lw: 3, seed: sd + 5 + wx });
        G.line(ctx, [[wx + 2, top + 100], [wx + 68, top + 100]], { lw: 3, seed: sd + 6 + wx });
      }
    });
  }
  // the ipê-amarelo: trunk + a canopy of yellow puffs; petals drift down
  function ipe(ctx, cx, cy, s, t, seed = 200) {
    G.limb(ctx, [[cx + 10 * s, SKY_END + 40], [cx, cy + 120 * s], [cx - 50 * s, cy + 20 * s]], { color: '#7A4A2A', lw: 30 * s, seed });
    G.limb(ctx, [[cx, cy + 140 * s], [cx + 70 * s, cy + 30 * s]], { color: '#7A4A2A', lw: 22 * s, seed: seed + 1 });
    const puffs = [[-150, 20, 110], [-60, -60, 130], [70, -70, 125], [160, 10, 110], [0, 40, 140], [-110, 110, 90], [110, 110, 95]];
    puffs.forEach(([dx, dy, r], i) => G.ellipse(ctx, cx + dx * s, cy + dy * s, r * s, r * 0.82 * s, { fill: i % 2 ? '#F5C542' : '#F2B84B', lw: 4, seed: seed + 5 + i, hatch: { color: 'rgba(160,100,10,0.18)', gap: 8 } }));
  }
  function petals(ctx, t, x0, x1, y0, y1, n, seed) {
    for (let i = 0; i < n; i++) {
      const sp = 60 + U.hash(seed, i, 1) * 60, ph = U.hash(seed, i, 2);
      const yy = y0 + ((ph * (y1 - y0) + t * sp) % (y1 - y0));
      const xx = x0 + U.hash(seed, i, 3) * (x1 - x0) + Math.sin(t * 1.6 + i) * 22;
      ctx.save(); ctx.translate(xx, yy); ctx.rotate(t * 2 + i);
      ctx.fillStyle = i % 2 ? '#F5C542' : '#F2B84B'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
  function ground(ctx, { crosswalk = false, glow = null } = {}) {
    G.rrect(ctx, -300, SKY_END, W + 600, CURB - SKY_END + 4, 0, { fill: PAL.walk, lw: 0, seed: 300, second: false });
    for (const y of [1000, 1075]) G.line(ctx, [[-300, y], [W + 300, y]], { lw: 2, color: 'rgba(120,90,60,0.25)', seed: 301 + y });
    for (let x = -240; x < W + 300; x += 140) G.line(ctx, [[x, SKY_END + 4], [x + 30, CURB - 4]], { lw: 2, color: 'rgba(120,90,60,0.2)', seed: 305 + x });
    G.rrect(ctx, -300, ST0, W + 600, ST1 - ST0, 0, { fill: PAL.road, lw: 0, seed: 310, second: false, hatch: { color: 'rgba(255,255,255,0.04)', gap: 10 } });
    G.rrect(ctx, -300, CURB - 6, W + 600, 28, 6, { fill: PAL.curb, lw: 4, seed: 311 });
    for (let x = -260; x < W + 300; x += 190) {
      if (crosswalk && x + 90 > CW[0] - 30 && x < CW[1] + 30) continue;
      G.rrect(ctx, x, LANE - 6, 96, 12, 5, { fill: '#F6F0E2', lw: 0, seed: 312 + x, second: false });
    }
    if (crosswalk) {
      for (let i = 0; i < 8; i++) {
        const gl = glow ? glow(i) : 0;
        G.rrect(ctx, CW[0], stripeY(i), CW[1] - CW[0], 30, 6, { fill: gl > 0.02 ? G.tint('#FFF6C8', 0) : '#F6F0E2', lw: 3, seed: 320 + i });
        if (gl > 0.02) { ctx.save(); ctx.globalAlpha *= gl; ctx.fillStyle = '#F5C542'; ctx.fillRect(CW[0] + 6, stripeY(i) + 5, CW[1] - CW[0] - 12, 20); ctx.restore(); }
      }
    }
    G.rrect(ctx, -300, ST1 - 4, W + 600, 30, 6, { fill: PAL.curb, lw: 4, seed: 330 });
    G.rrect(ctx, -300, ST1 + 22, W + 600, 600, 0, { fill: PAL.walk, lw: 0, seed: 331, second: false });
  }
  function street(ctx, t, opts = {}) {
    sky(ctx);
    houses(ctx);
    ipe(ctx, 820, 560, 1, t);
    petals(ctx, t, 600, 1080, 450, 1120, 10, 7);
    ground(ctx, opts);
  }

  // ---------- the pedestrian signal ----------
  function walker(ctx, x, y, s, color, walking, t, seed) {
    const ph = walking ? Math.sin(t * 9) : 0;
    G.ellipse(ctx, x, y - 52 * s, 9 * s, 9 * s, { fill: color, lw: 0, seed, second: false });
    G.line(ctx, [[x, y - 42 * s], [x, y - 12 * s]], { lw: 8 * s, color, seed: seed + 1, amp: 0.3 });
    G.line(ctx, [[x, y - 12 * s], [x - (walking ? 10 + ph * 6 : 6) * s, y + 14 * s]], { lw: 7 * s, color, seed: seed + 2, amp: 0.3 });
    G.line(ctx, [[x, y - 12 * s], [x + (walking ? 10 - ph * 6 : 6) * s, y + 14 * s]], { lw: 7 * s, color, seed: seed + 3, amp: 0.3 });
    G.line(ctx, [[x, y - 36 * s], [x - (walking ? 12 : 9) * s, y - 14 * s]], { lw: 6 * s, color, seed: seed + 4, amp: 0.3 });
    G.line(ctx, [[x, y - 36 * s], [x + (walking ? 12 : 9) * s, y - 14 * s]], { lw: 6 * s, color, seed: seed + 5, amp: 0.3 });
  }
  function signal(ctx, x, bottom, top, green, t, glow = 0) {
    G.rrect(ctx, x - 9, top, 18, bottom - top, 6, { fill: '#7C8290', lw: 3.5, seed: 400 });
    const bx = x - 50, by = top - 170;
    G.rrect(ctx, bx, by, 100, 180, 14, { fill: '#3B3F4A', lw: 4, seed: 401 });
    for (const [cy, on, col, walking, sd] of [[by + 48, !green, '#F05A4A', false, 410], [by + 132, green, '#5BD37A', true, 420]]) {
      if (on) { ctx.save(); const gl = ctx.createRadialGradient(x, cy, 4, x, cy, 70 + glow * 60); gl.addColorStop(0, col + 'AA'); gl.addColorStop(1, col + '00'); ctx.fillStyle = gl; ctx.fillRect(x - 140, cy - 140, 280, 280); ctx.restore(); }
      G.rrect(ctx, x - 38, cy - 38, 76, 76, 12, { fill: on ? '#1E2128' : '#2A2D35', lw: 3, seed: sd });
      walker(ctx, x, cy + 10, 0.85, on ? col : G.tint(col, -0.55), walking && on, t, sd + 1);
    }
  }

  // ---------- the car (side view, facing left) ----------
  function car(ctx, x, y, t, { wave = 0, beep = 0, squash = 0 } = {}) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(20,10,20,0.25)'; ctx.beginPath(); ctx.ellipse(0, 4, 230, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.scale(1 + squash * 0.03, 1 - squash * 0.04);
    const body = '#3D8C86';
    G.ellipse(ctx, 0, -150, 160, 100, { fill: body, lw: 4.5, seed: 500, hatch: { color: 'rgba(0,0,0,0.1)', gap: 8 } });
    G.rrect(ctx, -220, -160, 440, 112, 44, { fill: body, lw: 4.5, seed: 501, hatch: { color: 'rgba(0,0,0,0.1)', gap: 8 } });
    G.rrect(ctx, -110, -236, 92, 70, 22, { fill: '#D7EEF2', lw: 3.5, seed: 502 });
    G.rrect(ctx, 0, -236, 100, 70, 22, { fill: '#D7EEF2', lw: 3.5, seed: 503 });
    // the driver, who waves the walkers across
    G.ellipse(ctx, -60, -192, 24, 25, { fill: '#E0B48C', lw: 3, seed: 504 });
    G.shape(ctx, G.ellPts(-60, -208, 26, 14), { fill: '#5A3A28', lw: 3, seed: 505 });
    G.ellipse(ctx, -68, -190, 3, 4, { fill: G.C.ink, lw: 0, seed: 506, second: false });
    G.line(ctx, [[-76, -178], [-66, -174], [-58, -178]], { lw: 2.5, seed: 507 });
    if (wave > 0) {
      const hy = -246 - 14 * wave + Math.sin(t * 14) * 4, hx = -96 + Math.sin(t * 12) * 10;
      G.limb(ctx, [[-78, -200], [hx, hy]], { color: '#E0B48C', lw: 12, seed: 508 });
      G.ellipse(ctx, hx, hy, 11, 11, { fill: '#E0B48C', lw: 3, seed: 509 });
    }
    G.line(ctx, [[-6, -160], [-6, -64]], { lw: 3, color: 'rgba(0,0,0,0.35)', seed: 510 });
    G.rrect(ctx, 20, -126, 28, 8, 4, { fill: '#2A2320', lw: 0, seed: 511, second: false });
    G.ellipse(ctx, -206, -118, 16, 20, { fill: '#FFE9A8', lw: 3.5, seed: 512 });
    G.rrect(ctx, -232, -78, 70, 18, 8, { fill: '#C9CED6', lw: 3.5, seed: 513 });
    G.rrect(ctx, 168, -78, 66, 18, 8, { fill: '#C9CED6', lw: 3.5, seed: 514 });
    for (const wx of [-130, 130]) {
      G.ellipse(ctx, wx, -44, 46, 46, { fill: '#2A2320', lw: 4, seed: 515 + wx });
      G.ellipse(ctx, wx, -44, 20, 20, { fill: '#C9CED6', lw: 3, seed: 516 + wx });
      const a = -x / 46;
      G.line(ctx, [[wx + Math.cos(a) * 18, -44 + Math.sin(a) * 18], [wx - Math.cos(a) * 18, -44 - Math.sin(a) * 18]], { lw: 3, seed: 517 + wx });
    }
    if (beep > 0) {
      ctx.save(); ctx.globalAlpha *= beep;
      for (let k = 0; k < 3; k++) G.line(ctx, [[-246 - k * 18, -140 - k * 10], [-256 - k * 18, -118], [-246 - k * 18, -96 + k * 10]], { lw: 5, color: '#F5C542', seed: 520 + k, step: 8 });
      ctx.restore();
    }
    ctx.restore();
  }
  const beepAmt = (t) => Math.max(0, ...ev.beeps.map((b) => (t >= b && t < b + 0.28 ? 1 - (t - b) / 0.28 : 0)));

  // ---------- the ball's flight (kick, three bounces, the street) ----------
  const BALL_R = 24;
  const BALL_PTS = [[ev.kick, 362, SB - BALL_R - 4, 0], [ev.bounces[0], 480, SB - BALL_R, 150], [ev.bounces[1], 590, SB - BALL_R, 120], [ev.bounces[2], 690, CURB - BALL_R, 90], [ev.ballStreet, 650, 1300, 60]];
  function ballAt(t) {
    if (t <= BALL_PTS[0][0]) return { x: BALL_PTS[0][1], y: BALL_PTS[0][2], spin: 0 };
    for (let i = 1; i < BALL_PTS.length; i++) {
      const [t0, x0, y0] = BALL_PTS[i - 1], [t1, x1, y1, h] = BALL_PTS[i];
      if (t <= t1) { const u = (t - t0) / (t1 - t0); return { x: lerp(x0, x1, u), y: lerp(y0, y1, u) - h * 4 * u * (1 - u), spin: t * 9 }; }
    }
    const u = ease.outCubic(clamp((t - ev.ballStreet) / 0.9));
    return { x: lerp(650, 610, u), y: lerp(1300, 1312, u), spin: ev.ballStreet * 9 + u * 1.5 };
  }

  // ---------- characters in the street shots ----------
  function luluChase(t) {
    if (t < ev.run) {
      const k = clamp(1 - (t - ev.kick) / 0.32);
      const watching = t > ev.bounces[0] - 0.1;
      return { x: 300, y: SB, s: LS, pose: k > 0 ? 'kick' : 'stand', kick: k, eyes: watching ? 'happy' : 'normal', mouth: t > ev.bounces[2] - 0.05 ? 'o' : 'grin', look: 1 };
    }
    const u = clamp((t - ev.run) / (ev.beeps[0] - ev.run));
    const x = lerp(300, 520, ease.inOutQuad(u)), y = lerp(SB, 1330, ease.inOutQuad(u));
    if (u < 1) return { x, y, s: LS, pose: 'run', run: (t - ev.run) * 2.6, eyes: 'normal', mouth: 'open', look: 0.6 };
    return { x, y, s: LS, pose: 'stand', eyes: 'wide', brows: 'up', mouth: 'o', look: 1, headRot: 0.6 };
  }
  function carX(t) {
    const u = clamp((t - ev.carIn) / (ev.carStop - ev.carIn));
    return lerp(1520, 1010, ease.outCubic(u));
  }

  // ---------- shots ----------
  function shotKick(ctx, t) {
    street(ctx, t);
    const b = ballAt(t), L = luluChase(t);
    Ch.lulu(ctx, { ...L, mouth: lip(t, 'lulu', L.mouth), blink: blinkAt(t, 1) });
    Ch.redBall(ctx, b.x, b.y, BALL_R, b.spin, 600); // in front of her: it starts at her kicking foot
    if (t >= ev.carIn) car(ctx, carX(t), CAR_Y, t, { beep: beepAmt(t), squash: t > ev.carStop ? pulse(t, ev.carStop, 7) : 0 });
  }
  function shotScare(ctx, t, s) {
    // close-up: blurred street behind, Lulu's face fills the frame
    ctx.save(); ctx.filter = 'blur(9px)';
    ctx.translate(-260, -420); ctx.scale(1.5, 1.5);
    street(ctx, t); car(ctx, 1010, CAR_Y, t);
    ctx.restore();
    const u = clamp((t - ev.scare) / (ev.lift - ev.scare));
    Ch.lulu(ctx, { x: 490, y: 860 - LSK.head * 6.2, s: 6.2, eyes: 'wide', brows: 'worried', mouth: 'wavy', tears: 0.15 + 0.75 * ease.outQuad(u), tremble: 1, look: u < 0.4 ? 0.7 : 0.1, lookY: u < 0.4 ? 0 : 0.4, shadow: false, blink: 0 });
  }
  function shotLift(ctx, t) {
    street(ctx, t);
    Ch.redBall(ctx, 610, 1312, BALL_R, 0, 600);
    car(ctx, 1010, CAR_Y, t);
    // Tio Art scoops her up and carries her back to the sidewalk
    const u = clamp((t - ev.lift) / (ev.land - ev.lift));
    const tx = lerp(470, 390, ease.inOutQuad(u)), ty = lerp(1330, SB + 10, ease.inOutQuad(u));
    const ls = LS * 0.9, lx = tx + 128 * TS, ly = ty - 170 * TS; // held at his side, by the armpits, so both faces show
    const pits = [-1, 1].map((sd) => [lx + sd * 36 * ls, ly + (LSK.sh + 14) * ls]);
    Ch.tio(ctx, { x: tx, y: ty, s: TS, pose: 'walk', walk: u * 1.2, eyes: 'normal', brows: 'up', mouth: lip(t, 'tio', 'smile'), look: 0.6, handL: toLocal(pits[0], tx, ty, TS), handR: toLocal(pits[1], tx, ty, TS), backUke: true });
    Ch.lulu(ctx, { x: lx, y: ly, s: ls, pose: 'lifted', eyes: u < 0.6 ? 'wide' : 'normal', brows: 'up', mouth: 'o', tears: 0.5, look: -0.6, shadow: false });
    pits.forEach((p, i) => Ch.tioHand(ctx, p[0], p[1], TS, i ? Math.PI + 0.5 : -0.5, 'grip', 530 + i));
  }
  function shotComfort(ctx, t) {
    street(ctx, t);
    Ch.redBall(ctx, 760, SB - BALL_R + 4, BALL_R, 0, 600);
    car(ctx, 1010, CAR_Y, t);
    const calm = clamp((t - ev.wipe) / 0.3), pointing = t >= ev.point;
    const lx = 300, ly = SB, tx = 500, ty = CURB;
    const lh = [62, -250], hp = [lx + lh[0] * LS, ly + lh[1] * LS];
    Ch.tio(ctx, { x: tx, y: ty, s: TS, pose: 'sit', eyes: t >= ev.wipe && t < ev.point ? 'happy' : 'normal', brows: 'up', mouth: lip(t, 'tio', 'smile'), look: pointing ? 1 : -0.7, handL: toLocal(hp, tx, ty, TS, TIO_HIP), gesture: pointing ? 'point' : null, blink: blinkAt(t, 3) });
    Ch.lulu(ctx, { x: lx, y: ly, s: LS, eyes: 'normal', brows: calm < 1 ? 'worried' : 'neutral', mouth: calm < 1 ? 'wavy' : 'smile', tears: 0.55 * (1 - calm), look: pointing ? 1 : 0.6, headRot: pointing ? 0.5 : 0.2, handR: lh, blink: blinkAt(t, 4) });
    if (t >= ev.wipe && t < ev.wipe + 0.6) { const a = 1 - (t - ev.wipe) / 0.6; ctx.save(); ctx.globalAlpha *= a; G.star(ctx, lx + 17 * LS, ly + (LSK.head + 2) * LS, 12 + 8 * (1 - a), { fill: '#FFF6C8', seed: 540 }); ctx.restore(); }
  }
  // holding hands: Lulu reaches up, Tio Art reaches down; both hands meet just above her shoulder
  function holdHands(lx, ly, tx, ty) {
    const lh = [72, -318], hp = [lx + lh[0] * LS, ly + lh[1] * LS];
    return { luluR: lh, tioL: toLocal(hp, tx, ty, TS), world: hp };
  }
  function shotLesson(ctx, t) {
    street(ctx, t, { crosswalk: true });
    signal(ctx, 200, SB + 10, 640, false, t);
    Ch.redBall(ctx, 330, SB - BALL_R + 4, BALL_R, 0, 600);
    car(ctx, 1010, CAR_Y, t);
    const lx = 430, tx = 610;
    const look = t >= ev.lookR ? 1 : t >= ev.lookL ? -1 : 0;
    const lookOn = t >= ev.lookL && t < T(5, 0.5);
    const stop = t >= ev.stop && t < ev.lookL;
    const joined = t >= ev.hands;
    const hh = holdHands(lx, SB, tx, SB);
    const reach = clamp((t - (ev.hands - 0.25)) / 0.25);
    Ch.tio(ctx, { x: tx, y: SB, s: TS, pose: 'stand', eyes: joined ? 'happy' : 'normal', mouth: lip(t, 'tio', 'smile'), look: lookOn ? look : -0.6, headRot: lookOn ? look * 0.5 : 0, brows: 'up', handL: reach > 0 ? [lerp(-70, hh.tioL[0], reach), lerp(-252, hh.tioL[1], reach)] : undefined, gesture: stop ? 'stop' : null, backUke: true, blink: blinkAt(t, 5) });
    Ch.lulu(ctx, { x: lx, y: SB, s: LS, eyes: joined ? 'happy' : 'normal', mouth: joined ? 'grin' : 'smile', look: lookOn ? look : 0.5, headRot: lookOn ? look : 0, gesture: stop ? 'stop' : null, handR: reach > 0 && !stop ? [lerp(47, hh.luluR[0], reach), lerp(-180, hh.luluR[1], reach)] : undefined, blink: blinkAt(t, 6) });
    if (joined) {
      for (let k = 0; k < 3; k++) {
        const a = clamp((t - ev.hands - k * 0.08) / 0.9);
        if (a <= 0 || a >= 1) continue;
        ctx.save(); ctx.globalAlpha *= 1 - a;
        G.heart(ctx, hh.world[0] + (k - 1) * 40, hh.world[1] - 40 - a * 120, 0.7);
        ctx.restore();
      }
    }
  }
  function shotGreen(ctx, t) {
    ctx.save(); ctx.filter = 'blur(10px)';
    ctx.translate(-300, -300); ctx.scale(1.6, 1.6);
    street(ctx, t, { crosswalk: true });
    ctx.restore();
    const g = pulse(t, ev.green, 4);
    G.rays(ctx, 470, 760, { n: 18, r0: 230, r1: 520, color: '#FFF6C8', lw: 10, alpha: 0.6 * g + 0.15, spin: t * 0.4 });
    ctx.save(); ctx.translate(470, 900); ctx.scale(3.2, 3.2); ctx.translate(-200, -640);
    signal(ctx, 200, 900, 640, true, t, g);
    ctx.restore();
  }
  function shotCross(ctx, t) {
    // they walk down the zebra; every stripe they step on lights up and plays a note
    const p = clamp((t - (ev.steps[0].t - BEAT / 2)) / (BEAT / 2), 0, 8); // lands on stripe i exactly at step i's note
    const glow = (i) => { const st = ev.steps[i]; return t >= st.t ? Math.exp(-(t - st.t) * 3) : 0; };
    street(ctx, t, { crosswalk: true, glow });
    signal(ctx, 200, SB + 10, 640, true, t);
    car(ctx, 1010, CAR_Y, t, { wave: clamp((t - ev.cross) / 0.3) });
    const k = Math.floor(p), f = p - k;
    const stepY = (i) => (i <= 0 ? SB : stripeY(i - 1) + 28);
    const y = lerp(stepY(Math.min(k, 8)), stepY(Math.min(k + 1, 8)), ease.inOutQuad(f));
    const lx = 440, tx = 615;
    const jump = t >= ev.eba ? Math.max(0, Math.sin(Math.PI * clamp((t - ev.eba) / 0.5))) * 80 : 0;
    const eba = t >= ev.eba;
    const hh = holdHands(lx, y, tx, y);
    const walking = p < 8;
    Ch.tio(ctx, { x: tx, y, s: TS, pose: walking ? 'walk' : 'stand', walk: p / 2, eyes: eba ? 'happy' : 'normal', mouth: lip(t, 'tio', 'smile'), look: -0.5, handL: eba ? undefined : hh.tioL, gesture: eba ? 'thumbsUp' : null, backUke: true, blink: blinkAt(t, 7) });
    const ballHand = [-44, -196]; // the ball tucked under her left arm
    Ch.lulu(ctx, { x: lx, y: y - jump, s: LS, pose: walking ? 'run' : 'stand', run: p / 2, eyes: eba ? 'happy' : 'normal', mouth: lip(t, 'lulu', eba ? 'grin' : 'smile'), look: 0.4, handR: eba ? undefined : hh.luluR, gesture: eba ? 'thumbsUp' : null, handL: ballHand, shadow: !jump, blink: blinkAt(t, 8) });
    Ch.redBall(ctx, lx + (ballHand[0] - 12) * LS, y - jump + (ballHand[1] + 4) * LS, BALL_R, 0, 600);
    Ch.luluHand(ctx, lx + ballHand[0] * LS, y - jump + ballHand[1] * LS, LS, -0.3, 'grip', 541);
    if (eba) {
      G.bubble(ctx, 'Eba!', lx - 30, y - jump - 400, lx, y - jump - 345, t, ev.eba, ev.outro - 0.15, { size: 72 });
    }
  }
  function shotOutro(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, 1200);
    g.addColorStop(0, PAL.sky0); g.addColorStop(1, PAL.sky1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ipe(ctx, 560, 470, 1.9, t, 260);
    G.rrect(ctx, -40, 1180, W + 80, 800, 0, { fill: PAL.grass, lw: 0, seed: 700, second: false, hatch: { color: 'rgba(40,90,30,0.12)', gap: 9 } });
    // the bench: backrest, seat, legs
    for (const y of [1060, 1130]) G.rrect(ctx, 60, y, 940, 40, 10, { fill: '#B8743E', lw: 4, seed: 701 + y });
    for (const x of [120, 940]) G.rrect(ctx, x, 1300, 26, 170, 6, { fill: '#7A4A2A', lw: 3.5, seed: 705 + x });
    G.rrect(ctx, 40, 1300, 1000, 44, 10, { fill: '#C9844B', lw: 4, seed: 704 });
    const waving = t >= ev.wave;
    const strum = Math.max(0, ...ev.strums.map((s) => (t >= s && t < s + 0.2 ? 1 - (t - s) / 0.2 : 0)));
    // Tio Art plays the ukulele (his strumming hand moves on every strum)
    const OS = 1.3, tx = 660, ty = 1308, rot = -1.2, ub = [tx + 30 * OS, ty - 100 * OS];
    const neck = [ub[0] + Math.sin(rot) * 112 * OS, ub[1] - Math.cos(rot) * 112 * OS];
    const hR = [ub[0] + 12 * OS, ub[1] + (strum * 16 - 2) * OS];
    Ch.tio(ctx, { x: tx, y: ty, s: OS, pose: 'sit', eyes: 'happy', mouth: lip(t, 'tio', 'smile'), look: -0.3, handL: toLocal(neck, tx, ty, OS, TIO_HIP), handR: waving ? undefined : toLocal(hR, tx, ty, OS, TIO_HIP), gesture: waving ? 'wave' : null });
    Ch.ukulele(ctx, ub[0], ub[1], rot, 0.95 * OS, 720);
    Ch.tioHand(ctx, neck[0], neck[1], OS, -Math.PI / 2, 'grip', 730);
    if (!waving) Ch.tioHand(ctx, hR[0], hR[1], OS, Math.PI * 0.7, 'grip', 731);
    Ch.lulu(ctx, { x: 330, y: ty, s: LS * 1.3, pose: 'sit', swing: 1, eyes: 'happy', mouth: lip(t, 'lulu', 'grin'), gesture: waving ? 'wave' : null, look: 0.5, headRot: 0.2 });
    petals(ctx, t, 0, W, 150, 1500, 22, 11);
    // the channel name stamps on the sung words, on a torn paper banner
    const shown = S.title.filter((w) => t >= w.t);
    if (shown.length) {
      G.tornPaper(ctx, 70, 250, 800, 330, { fill: '#FBF6EC', seed: 750 });
      const pos = { Contos: [470, 400, 128], do: [250, 525, 72], 'Tio Art': [560, 530, 104] };
      shown.forEach((w, i) => {
        const [x, y, size] = pos[w.text];
        const a = clamp((t - w.t) / 0.18);
        const sc = lerp(2.2, 1, ease.outBack(a, 2.2));
        ctx.save(); ctx.translate(x, y - size * 0.35); ctx.rotate((i - 1) * 0.04); ctx.scale(sc, sc); ctx.globalAlpha *= clamp(a * 3);
        G.text(ctx, w.text, 0, size * 0.35, { size, fam: 'Bungee', weight: 400, color: w.color, align: 'center', stroke: '#2A2320', strokeW: 6 });
        ctx.restore();
      });
    }
  }

  const film = Shots.film([
    { at: 0, draw: shotKick, cam: (s) => { const u = ease.inOutQuad(clamp((s.t - ev.run) / (ev.beeps[0] - ev.run))); return { x: lerp(-70, 80, u), y: lerp(40, 240, u), zoom: 1.55 }; } },
    { at: ev.scare, draw: shotScare, cam: Shots.push(1, 1.08) },
    { at: ev.lift, draw: shotLift, cam: { x: -70, y: 90, zoom: 1.4 } },
    { at: ev.land, draw: shotComfort, cam: Shots.combine({ x: -120, y: 20 }, Shots.push(1.42, 1.48)) },
    { at: ev.lesson, draw: shotLesson, cam: Shots.combine({ x: -20, y: 60 }, Shots.push(1.1, 1.14)) },
    { at: ev.green, draw: shotGreen },
    { at: ev.cross, draw: shotCross, cam: (s) => ({ x: -5, y: lerp(-10, 390, ease.inOutQuad(clamp((s.t - ev.cross) / (ev.steps[7].t - ev.cross)))), zoom: 1.3 }) },
    { at: ev.outro, draw: shotOutro, in: 'paper', cam: Shots.push(1, 1.03) },
  ]);

  Studio.film({
    async init() { LIP = await Studio.loadJSON('out/lipsync.json'); },
    draw(ctx, t) {
      if (t < ev.kick) return; // black before the first downbeat: the story starts with the kick
      film(ctx, t);
      // the lesson's words, drawn over the camera so they stay put and inside the safe area
      // every other line as a small caption at the bottom of the safe area
      Subs.draw(ctx, t, S.captions, { style: 'pop', size: 54, fam: 'Inter', y: t >= ev.outro ? 790 : G.SAFE.y + G.SAFE.h - 40, maxW: 820 }); // outro: between the banner and the bench
      if (t >= ev.lesson - 0.1 && t < ev.green) Subs.draw(ctx, t, S.subtitles, { style: 'karaoke', size: 70, fam: 'Inter', y: 380, maxW: 760, highlight: '#F5C542' });
      if (t >= ev.eba && t < ev.outro + 0.4) G.confetti(ctx, t, ev.eba, { n: 110, seed: 9, spawn: 0.5, fall: 420 });
      const flash = t >= ev.eba && t < ev.eba + 0.3 ? 0.35 * Math.exp(-(t - ev.eba) * 14) : 0;
      if (flash > 0.01) { ctx.fillStyle = `rgba(255,250,235,${flash})`; ctx.fillRect(0, 0, W, H); }
    },
    post: { paper: 0.18, vignette: 0.15, grain: 0.03 },
    fadeOut: 0.8,
  });
})();
