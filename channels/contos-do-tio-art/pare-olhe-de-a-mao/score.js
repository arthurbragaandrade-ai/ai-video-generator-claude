// THE SCORE — "Pare, Olhe e Dê a Mão!" (Contos do Tio Art, vídeo 1).
// Single source of truth for music AND picture: every beat of the story is an event here.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock, placeBar, makeChords } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const WIDE = W / H > 1.2;
  const clock = makeClock({ bpm: 120, offset: 0.25 }); // 1 beat = 0.5s, 1 bar = 2s
  const { T, BEAT } = clock;
  const DURATION = T(10) + 0.5;

  // ---------- story, bar by bar ----------
  //  0 kick        Lulu kicks the red ball; it bounces along the sidewalk and over the curb
  //  1 chase       she runs into the street after it; a car comes, beeps twice, stops far away
  //  2 scare/lift  close-up: the scare (music holds its breath) · beat 2: Tio Art lifts her back
  //  3 comfort     on the curb, he holds her hand, wipes the tear, points to the crosswalk
  //  4-5 lesson    at the crosswalk, spoken: "Para... olha pros lados... e dá a mão!"
  //  6 green       the walking man turns green (plim) · beat 2: they cross, each stripe a note
  //  7 cross/eba   reach the other side · beat 2: "Eba!" thumbs-up
  //  8-9 outro     bench under the ipê, ukulele: "E esse foi mais um conto do Tio Art!"
  const S = {
    kick: [T(0), T(1)],
    chase: [T(1), T(2)],
    scare: [T(2), T(2, 2)],
    lift: [T(2, 2), T(3)],
    comfort: [T(3), T(4)],
    lesson: [T(4), T(6)],
    green: [T(6), T(6, 2)],
    cross: [T(6, 2), T(8)],
    outro: [T(8), DURATION],
  };

  const ev = {
    kick: T(0, 0),
    bounces: [T(0, 1), T(0, 2), T(0, 3)], // sidewalk, sidewalk, over the curb
    ballStreet: T(1, 0), // lands in the street and rolls
    run: T(1, 0),
    carIn: T(1, 0.5),
    beeps: [T(1, 2), T(1, 2.5)],
    carStop: T(1, 3),
    scare: T(2, 0),
    lift: T(2, 2),
    land: T(3, 0),
    wipe: T(3, 1),
    point: T(3, 2),
    lesson: T(4, 0),
    stop: T(4, 0), // "Pa-ra": hand up
    lookL: T(4, 2), // "o-lha"
    lookR: T(4, 3), // "pros la-dos"
    hands: T(5, 2), // "mão"
    green: T(6, 0),
    cross: T(6, 2),
    eba: T(7, 2), // right after the last step on the zebra
    outro: T(8, 0),
    wave: T(9, 1),
    end: T(10, 0),
  };
  // footsteps on the zebra stripes, one per 8th, each a note of a rising scale
  ev.steps = [];
  for (let i = 0; i < 8; i++) ev.steps.push({ t: T(6, 2) + i * BEAT / 2, i, midi: m(['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'][i]) });
  // the ball plays a little tune: kick + 3 bounces + the street
  ev.ballNotes = [ev.kick, ...ev.bounces, ev.ballStreet].map((t, i) => ({ t, midi: m(['C5', 'E5', 'G5', 'C6', 'G5'][i]) }));
  // ukulele strums in the outro (Tio Art's strumming hand moves on each one)
  ev.strums = [];
  for (let b = 0; b < 8; b++) ev.strums.push(T(8, 0) + b * BEAT);

  // ---------- harmony (C major) ----------
  const { chords, chordAt } = makeChords(clock, {
    C: { notes: ['C4', 'E4', 'G4'], bass: 'C2' },
    F: { notes: ['C4', 'F4', 'A4'], bass: 'F2' },
    G: { notes: ['B3', 'D4', 'G4'], bass: 'G2' },
    Am: { notes: ['C4', 'E4', 'A4'], bass: 'A2' },
    Cmaj7: { notes: ['C4', 'E4', 'G4', 'B4'], bass: 'C2' },
  }, [
    [0, 0, 4, 'C'], [1, 0, 2, 'F'], [1, 2, 2, 'G'],
    [2, 0, 2, 'Am'], [2, 2, 2, 'F'], [3, 0, 2, 'C'], [3, 2, 2, 'G'],
    [4, 0, 4, 'C'], [5, 0, 2, 'G'], [5, 2, 2, 'C'],
    [6, 0, 2, 'F'], [6, 2, 2, 'C'], [7, 0, 2, 'G'], [7, 2, 2, 'C'],
    [8, 0, 2, 'C'], [8, 2, 2, 'F'], [9, 0, 2, 'G'], [9, 2, 2, 'Cmaj7'],
  ]);

  // ---------- melodies (8th-note grid: [note, start8th, dur8ths]) ----------
  // intro/groove hook for the xylophone (bars 3, 6-7 under the action), same shape as the lesson
  const HOOK = [['E5', 0, 1], ['G5', 1, 1], ['E5', 2, 2], ['C5', 4, 1], ['D5', 5, 1], ['E5', 6, 2]];
  const hookNotes = [...placeBar(clock, HOOK, 3)];

  // ---------- the dub: who says what, and when (pt-BR neural voices, rendered by `node voices.js`) ----------
  // voices/manifest.js holds each line's real duration once rendered; until then a duration is estimated.
  const VO = node ? (() => { try { return require('./voices/manifest.js'); } catch (e) { return {}; } })() : globalThis.VOICES || {};
  const VOICE = {
    tio: { voice: 'pt-BR-AntonioNeural', pitch: '+0Hz', rate: '+6%' },
    lulu: { voice: 'pt-BR-FranciscaNeural', pitch: '+70Hz', rate: '+8%' }, // raised to a child's register
  };
  const dialogue = [
    { id: 'lulu-la-vai', who: 'lulu', at: T(0, 0.4), text: 'Lá vai!' },
    { id: 'lulu-minha-bola', who: 'lulu', at: T(1, 0.25), text: 'Minha bola!' },
    { id: 'tio-opa', who: 'tio', at: T(2, 2) + 0.2, text: 'Opa, peguei!' },
    { id: 'tio-tudo-bem', who: 'tio', at: T(3, 0) + 0.3, text: 'Tá tudo bem.' },
    { id: 'tio-vem', who: 'tio', at: T(3, 2) + 0.1, text: 'Vem comigo.' },
    { id: 'tio-para', who: 'tio', at: T(4, 0) + 0.02, text: 'Para...', display: 'Para,' },
    { id: 'tio-olha', who: 'tio', at: T(4, 2) + 0.02, text: 'olha pros lados...', display: 'olha pros lados' },
    { id: 'tio-mao', who: 'tio', at: T(5, 1), text: 'e dá a mão!' },
    { id: 'lulu-verde', who: 'lulu', at: T(6, 0.6), text: 'Verde!' },
    { id: 'tio-agora', who: 'tio', at: T(6, 2) + 0.05, text: 'Agora sim, de mãos dadas!' },
    { id: 'lulu-eba', who: 'lulu', at: ev.eba, text: 'Eba!' },
    { id: 'tio-conto', who: 'tio', at: T(8, 0) + 0.3, text: 'E esse foi mais um conto do Tio Art!' },
    { id: 'lulu-tchau', who: 'lulu', at: T(9, 2) + 0.1, text: 'Tchau!' },
  ].map((d) => {
    const shown = (d.display || d.text).split(/\s+/);
    const dur = VO[d.id] ? VO[d.id].dur : 0.12 + shown.length * 0.32;
    // word times inside the line, shared out by length (a voice spends longer on longer words)
    const weight = shown.map((x) => x.replace(/[^\p{L}]/gu, '').length + 2), sum = weight.reduce((a, b) => a + b, 0);
    let t = d.at;
    const words = shown.map((x, i) => { const o = { w: x, t, end: t + (dur * weight[i]) / sum }; t = o.end; return o; });
    return { ...VOICE[d.who], ...d, dur, end: d.at + dur, words };
  });
  const line = (id) => dialogue.find((d) => d.id === id);

  // ---------- words on screen ----------
  // the lesson as big karaoke words; every other line as a small caption at the bottom of the safe area
  const LESSON_IDS = ['tio-para', 'tio-olha', 'tio-mao'];
  const lessonWords = LESSON_IDS.flatMap((id) => line(id).words);
  const subtitles = [{ t: T(4, 0) - 0.05, end: T(6, 0) - 0.1, text: lessonWords.map((x) => x.w).join(' '), words: lessonWords }];
  const captions = dialogue.filter((d) => !LESSON_IDS.includes(d.id)).map((d) => ({ t: d.at - 0.05, end: d.end + 0.35, text: d.words.map((x) => x.w).join(' '), words: d.words, who: d.who }));
  // the channel name stamps on the spoken outro words: "conto", "do", "Tio"
  const outro = line('tio-conto').words, at = (word) => outro.find((x) => x.w.toLowerCase().startsWith(word)).t;
  const title = [
    { text: 'Contos', t: at('conto'), color: '#D94B3A' },
    { text: 'do', t: at('do'), color: '#3D8C86' },
    { text: 'Tio Art', t: at('tio'), color: '#D9A23A' },
  ];

  // ---------- named moments ----------
  const markers = {
    kick: { t: ev.kick, sync: 'av' }, // first frame + the kick
    beep: ev.beeps[0],
    scare: { t: ev.scare, sync: 'av' }, // hard cut to the close-up + "uh-oh"
    lift: { t: ev.lift, sync: 'av' }, // cut + whoosh
    comfort: ev.land,
    lesson: { t: ev.lesson, sync: 'v' },
    green: { t: ev.green, sync: 'av' }, // the signal turns green + plim
    cross: { t: ev.cross, sync: 'v' },
    eba: { t: ev.eba, sync: 'av' },
    outro: ev.outro,
    end: ev.end,
  };

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, S, m, chords, chordAt, ev, markers, hookNotes, dialogue, subtitles, captions, title };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
