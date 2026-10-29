// THE SONG — every sound of "Pare, Olhe e Dê a Mão!", rendered from score.js into out/music.wav.
//   node song.js   (STEMS=1 also writes out/stem-*.wav, LUFS=-14 masters to a loudness target)
const path = require('path');
const { Bus, reverb, pingpong } = require('./engine/audio/dsp');
const { SR } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const Sing = require('./engine/audio/sing');
const sc = require('./score');
const { T, BEAT, DURATION, m, ev, clock } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const uke = bus(), xylo = bus(), bass = bus(), drums = bus(), pad = bus(), vox = bus(), fx = bus();
const verb = bus(), dly = bus();

// the music holds its breath during the scare (bar 2, beats 0-2): only the "uh-oh" plays there
const quiet = (t) => t >= ev.scare - 0.01 && t < ev.lift - 0.01;
const playing = (t) => t >= ev.kick - 0.01 && !quiet(t) && t < ev.end + 0.01;

// ---------- ukulele: down strum on the beat, lighter up strum on the "and" ----------
const ukeVoicing = (c) => [c.notes[0], c.notes[1], c.notes[2], (c.notes[3] || c.notes[0] + 12)].map((n) => n + 12);
clock.eachStep(0, 10, 8, (t, b, s) => {
  if (!playing(t)) return;
  const c = sc.chordAt(t);
  if (!c) return;
  const v = ukeVoicing(c);
  const down = s % 2 === 0;
  if (b === 2 && !down) return; // the rescue strums only on the beat
  const order = down ? v : [...v].reverse();
  const g = down ? (s % 4 === 0 ? 0.5 : 0.38) : 0.22;
  order.forEach((n, i) => {
    const x = I.guitar(n, BEAT * 0.9, { bright: 0.72, sustain: 0.993, seed: 40 + i + s });
    uke.addMono(x, t + i * 0.011, g * (1 - i * 0.06), (i - 1.5) * 0.18);
  });
});

// ---------- bass: plucked root on 1, fifth on 3 ----------
clock.eachStep(0, 10, 4, (t, b, s) => {
  if (!playing(t)) return;
  const c = sc.chordAt(t);
  if (!c) return;
  const R = c.bass + 12;
  if (s === 0 || s === 2) bass.addMono(I.pizz(s === 2 ? R + 7 : R, { seed: 60 + b }), t, 0.75);
});
bass.addMono(I.bass(m('C3'), 2.2, { bright: 0.2, sub: 0.8 }), T(9, 2), 0.35);

// ---------- light percussion ----------
const SH = [I.shaker(0.8, 15), I.shaker(1, 16)], K = I.kick({ punch: 0.7, tail: 0.25 }), CL = I.clap({ spread: 0.013 });
clock.eachStep(0, 10, 8, (t, b, s) => {
  if (!playing(t)) return;
  drums.addMono(SH[s % 2], t, s % 2 ? 0.16 : 0.1, 0.3);
  if (b >= 4 && b <= 9 && (s === 0 || s === 4)) drums.addMono(K, t, 0.55);
  if (b >= 4 && b <= 7 && (s === 2 || s === 6)) { drums.addMono(CL, t, 0.35); verb.addMono(CL, t, 0.15); }
});

// ---------- soft pad under everything ----------
for (const c of sc.chords) {
  for (const n of c.notes) { const { L, R } = I.padNote(n, c.t1 - c.t0, { cutoff: 1100, attack: 0.25, release: 0.8 }); pad.addStereo(L, R, c.t0, 0.05); }
}

// ---------- xylophone: the ball, the hook, the lesson, the zebra steps, the outro ----------
const xy = (midi, t, g, opts = {}, pan = 0) => { const x = I.marimba(midi, { thock: 0, decay: 0.5, ...opts }); xylo.addMono(x, t, g, pan); verb.addMono(x, t, g * 0.35); };
ev.ballNotes.forEach((n, i) => xy(n.midi, n.t, 0.36, { thock: 0.9 }, -0.2 + i * 0.12)); // every touch of the ball is a note
for (const n of sc.hookNotes) xy(n.midi, n.t, 0.32);
for (const n of sc.lessonNotes) xy(n.midi + 12, n.t, 0.12); // doubles the singer an octave up
for (const n of ev.steps) xy(n.midi, n.t, 0.42, { thock: 0.25 }, -0.4 + n.i * 0.1); // each stripe sings
for (const n of sc.outroNotes) xy(n.midi + 12, n.t, 0.1);
// "uh-oh" on the scare: the only sound while the music holds its breath
xy(m('G5'), ev.scare, 0.42, { decay: 0.7 });
xy(m('E5'), ev.scare + BEAT * 0.75, 0.36, { decay: 0.9 });
{ const { L, R } = I.padNote(m('A3'), BEAT * 2, { cutoff: 700, attack: 0.05, release: 0.6 }); pad.addStereo(L, R, ev.scare, 0.06); }

// ---------- voices (formant singer), doubled by the xylophone and shown on screen ----------
function sing(notes, type, gain, opts = {}) {
  const t0 = notes[0].t;
  const x = Sing.phrase(notes.map((n) => ({ ...n, t: n.t - t0, dur: n.dur * 0.95 })), { type, ...opts });
  vox.addMono(x, t0 - x.lead, gain);
  verb.addMono(x, t0 - x.lead, gain * 0.18);
}
sing(sc.lessonNotes.map((n) => ({ ...n, midi: n.midi - 12 })), 'tenor', 0.55, { vib: 0.18, seed: 3 }); // Tio Art
sing([{ t: ev.eba, dur: BEAT * 0.4, midi: m('E5'), syl: 'e' }, { t: ev.eba + BEAT * 0.5, dur: BEAT * 0.9, midi: m('A5'), syl: 'baa' }], 'soprano', 0.45, { bright: 1.2, seed: 7 }); // Lulu: "Eba!"
sing(sc.outroNotes.map((n) => ({ ...n, midi: n.midi - 12 })), 'tenor', 0.5, { vib: 0.2, seed: 5 }); // "Mais um conto do Tio Art!"

// ---------- fx, each one tied to an event in the score ----------
fx.addMono(I.thwack(), ev.kick, 0.35);
for (const t of ev.bounces) fx.addMono(I.thud(140, 0.05), t, 0.25);
fx.addMono(I.boing(), ev.bounces[2] - 0.02, 0.18); // over the curb
// a friendly two-tone "bi-bi"
for (const t of ev.beeps) {
  const a = I.pulse(m('A4'), 0.17, { duty: 0.5, decay: 4 }), b = I.pulse(m('C#5'), 0.17, { duty: 0.5, decay: 4 });
  fx.addMono(a, t, 0.13, 0.4); fx.addMono(b, t, 0.11, 0.4);
}
fx.addMono(I.noiseSweep(0.35, 5200, 3600, { q: 6 }), ev.carStop - 0.3, 0.05, 0.4); // soft brake squeak
fx.addMono(I.noiseSweep(0.45, 300, 3000, { q: 0.9, pink: true }), ev.lift, 0.3); // whoosh: lifted back to safety
fx.addMono(I.pop(900), ev.lift, 0.3);
fx.addMono(I.thud(110, 0.08), ev.land, 0.35);
fx.addMono(I.bell(2093, 0.4, 1.5, 2.0), ev.wipe, 0.08); // the tear wiped away
fx.addMono(I.woodTick(1.2), ev.point, 0.25);
fx.addMono(I.pop(1600), ev.stop, 0.12);
// "plim": the walking man turns green
fx.addMono(I.bell(1568, 0.9, 1.2, 2.0), ev.green, 0.3);
fx.addMono(I.bell(2349, 0.7, 1.0, 2.0), ev.green + 0.09, 0.2);
fx.addMono(I.pop(2400), ev.eba, 0.35);
fx.addMono(I.paperFwip(1, 3), ev.outro - 0.25, 0.25);
for (const s of sc.title) fx.addMono(I.thud(170, 0.05), s.t, 0.2);
for (const n of [m('C6'), m('E6'), m('G6'), m('B6')]) { const x = I.musicBox(n); fx.addMono(x, T(9, 2) + (n - m('C6')) * 0.02, 0.1); verb.addMono(x, T(9, 2), 0.1); }

// ---------- mix ----------
MIX.duck([uke, xylo, drums], vox, { depth: 0.55 }); // the band steps back while someone sings
const stems = {
  uke, xylo, bass, drums, pad, vox, fx,
  verb: reverb(verb, { room: 0.7, damp: 0.4 }),
  dly: pingpong(dly, BEAT * 0.75, 0.3, 3500),
};
const GAIN = { uke: 1.4, xylo: 1.1, bass: 0.9, drums: 0.5, pad: 2.0, vox: 3.6, fx: 1.0, verb: 0.8, dly: 0.6 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 30);
MIX.fadeOut(mix, DURATION - 1.2, DURATION);
// ceiling 0.7 (≈ -3 dBTP): AAC adds ~1.2 dB to the sharp xylophone and pop transients
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.8'), 0.7, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)}` : ''})`);
