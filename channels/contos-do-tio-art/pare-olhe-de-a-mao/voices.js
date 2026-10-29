// THE DUB — renders every line of SCORE.dialogue with a pt-BR neural voice into voices/<id>.wav
// and writes voices/manifest.js (each line's real duration, read back by score.js).
//   node voices.js          (re-renders only lines whose text or voice changed)
// Needs python3 + `pip install edge-tts` and network access. Behind a TLS-inspecting proxy, set
// TTS_CA_BUNDLE to its CA file (see tools/tts.py).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const sc = require('./score');

const dir = path.join(__dirname, 'voices');
fs.mkdirSync(dir, { recursive: true });
const manifestFile = path.join(dir, 'manifest.js');
let old = {};
try { old = require(manifestFile); } catch (e) { /* first run */ }

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${(r.stderr || '').trim().split('\n').pop()}`);
  return r.stdout;
};

const manifest = {};
for (const d of sc.dialogue) {
  const key = crypto.createHash('sha1').update([d.voice, d.pitch, d.rate, d.text].join('|')).digest('hex').slice(0, 12);
  const wav = path.join(dir, `${d.id}.wav`);
  if (old[d.id] && old[d.id].key === key && fs.existsSync(wav)) { manifest[d.id] = old[d.id]; continue; }
  const mp3 = path.join(dir, `${d.id}.tmp.mp3`);
  run('python3', [path.join(__dirname, 'tools', 'tts.py'), '--voice', d.voice, '--pitch', d.pitch, '--rate', d.rate, '--text', d.text, '--out', mp3]);
  // trim the silence the voice service leaves at both ends, so `at` is where the first sound lands
  const trim = 'silenceremove=start_periods=1:start_threshold=-42dB,areverse,silenceremove=start_periods=1:start_threshold=-42dB,areverse,afade=t=in:d=0.005';
  run('ffmpeg', ['-v', 'error', '-y', '-i', mp3, '-af', trim, '-ac', '1', '-ar', '48000', wav]);
  fs.unlinkSync(mp3);
  const dur = parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]));
  manifest[d.id] = { key, dur: Math.round(dur * 1000) / 1000 };
  console.log(`  ${d.id.padEnd(16)} ${dur.toFixed(2)}s  ${d.who}: ${d.text}`);
}
fs.writeFileSync(manifestFile, `// written by voices.js: the rendered length of each dubbed line\n(function () {\n  const M = ${JSON.stringify(manifest, null, 2).replace(/\n/g, '\n  ')};\n  if (typeof module !== 'undefined') module.exports = M; else globalThis.VOICES = M;\n})();\n`);

// overlaps between consecutive lines are worth a look before rendering
delete require.cache[require.resolve('./score')];
delete require.cache[require.resolve(manifestFile)];
const fresh = require('./score');
const lines = [...fresh.dialogue].sort((a, b) => a.at - b.at);
for (let i = 1; i < lines.length; i++) {
  if (lines[i].at < lines[i - 1].end) console.log(`  ! ${lines[i - 1].id} ends at ${lines[i - 1].end.toFixed(2)}s, after ${lines[i].id} starts at ${lines[i].at.toFixed(2)}s`);
}
console.log(`wrote voices/manifest.js (${Object.keys(manifest).length} lines)`);
