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
  //  4-5 lesson    at the crosswalk, sung: "Para, olha pros lados e dá a mão!"
  //  6 green       the walking man turns green (plim) · beat 2: they cross, each stripe a note
  //  7 cross/eba   reach the other side · beat 2: "Eba!" thumbs-up
  //  8-9 outro     bench under the ipê, ukulele, sung: "Mais um conto do Tio Art!"
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
  // the lesson, sung by Tio Art (tenor, an octave below) and doubled by the xylophone
  const LESSON = {
    4: [['G4', 0, 1, 'pa'], ['E4', 1, 2, 'ra'], ['G4', 4, 1, 'o'], ['G4', 5, 1, 'lya'], ['A4', 6, 1, 'prus'], ['B4', 7, 1, 'la']],
    5: [['C5', 0, 2, 'dus'], ['A4', 2, 1, 'i'], ['B4', 3, 1, 'daa'], ['C5', 4, 3, 'mow']],
  };
  const OUTRO = {
    8: [['E4', 0, 1, 'mai'], ['G4', 1, 1, 'zum'], ['A4', 2, 1, 'kon'], ['G4', 3, 1, 'tu'], ['E4', 4, 1, 'du'], ['G4', 5, 1, 'chi'], ['A4', 6, 1, 'u']],
    9: [['C5', 0, 4, 'art']],
  };
  const sung = (tbl, bars) => bars.flatMap((b) => placeBar(clock, tbl[b].map(([n, s0, d]) => [n, s0, d]), b).map((x, i) => ({ ...x, syl: tbl[b][i][3] })));
  const lessonNotes = sung(LESSON, [4, 5]);
  const outroNotes = sung(OUTRO, [8, 9]);
  // intro/groove hook for the xylophone (bars 3, 6-7 under the action), same shape as the lesson
  const HOOK = [['E5', 0, 1], ['G5', 1, 1], ['E5', 2, 2], ['C5', 4, 1], ['D5', 5, 1], ['E5', 6, 2]];
  const hookNotes = [...placeBar(clock, HOOK, 3)];

  // ---------- words on screen ----------
  const w = (word, t, end) => ({ w: word, t, end });
  const subtitles = [
    {
      t: T(4, 0) - 0.05, end: T(6, 0) - 0.1, text: 'Para, olha pros lados e dá a mão!',
      words: [w('Para,', T(4, 0), T(4, 2)), w('olha', T(4, 2), T(4, 3)), w('pros', T(4, 3), T(4, 3.5)), w('lados', T(4, 3.5), T(5, 1)),
        w('e', T(5, 1), T(5, 1.5)), w('dá', T(5, 1.5), T(5, 1.75)), w('a', T(5, 1.75), T(5, 2)), w('mão!', T(5, 2), T(5, 3.5))],
    },
  ];
  // the channel name stamps on the sung outro words
  const title = [
    { text: 'Contos', t: T(8, 1), color: '#D94B3A' },
    { text: 'do', t: T(8, 2), color: '#3D8C86' },
    { text: 'Tio Art', t: T(9, 0), color: '#D9A23A' },
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

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, DURATION, clock, T, BEAT, S, m, chords, chordAt, ev, markers, lessonNotes, outroNotes, hookNotes, subtitles, title };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
