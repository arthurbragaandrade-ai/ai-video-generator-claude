---
name: youtube-channel-analysis
description: Analyze any public YouTube channel from its URL or @handle and reverse-engineer what makes its videos work — performance by theme, format, duration, title terms, posting cadence and dubbing, plus a frame-by-frame visual review of hits vs. flops — then turn the winning formula into Seedance 2.0 prompts with the other skills in this pack. Use when the user shares a YouTube channel link, asks to analyze, audit, benchmark, model or copy a channel, asks "why did this video go viral", or wants to know what content to make next in a niche. Triggers on analyze channel, YouTube channel, @handle, competitor channel, channel audit, viral shorts, what works on this channel, modelar canal, analisar canal.
---

# Channel Analysis — Reverse-Engineer Any YouTube Channel

One channel URL in → a data-backed report on what wins, what loses, the visual formula of the hits, and ready-to-produce video concepts out.

The work splits in two: a script collects the public data (fast, mechanical), then Claude does the part that needs judgment — grouping videos into themes, reading the storyboards, and writing recommendations tied to evidence.

---

## Step 0 — Setup (once per machine)

```bash
pip install "yt-dlp[default]"     # [default] pulls the YouTube JS challenge solver
node --version || deno --version  # one JS runtime must be on PATH
```

Without the `[default]` extra and a JS runtime, YouTube answers "This video is not available" for almost every video. The script passes `--js-runtimes node` automatically when Deno is missing.

---

## Step 1 — Collect

```bash
python scripts/analyze_channel.py https://www.youtube.com/@handle --out ./handle
```

| Flag | Default | Use |
|---|---|---|
| `--out` | `./<handle>` | Output folder. Re-running with the same folder resumes: videos already in `info/` are not fetched again |
| `--limit` | 200 | Max videos per tab (videos, shorts, streams) |
| `--frames` | 5 | Storyboards for the top N and bottom N of each tab |

Output:

| File | What's in it |
|---|---|
| `summary.md` | Snapshot, top 15, bottom 10, tables by tab / month / duration / dubbing, title-term lift, cadence |
| `videos.csv` | One row per video: date, duration, views, likes, comments, dubbed tracks, tags |
| `storyboards/<id>_<n>.jpg` | 3×3 frame grids covering the whole video, in order |
| `thumbs/<id>.jpg` | Thumbnails of the same videos |

Read `summary.md` in full before anything else.

---

## Step 2 — Read the numbers

Check these in order. Each one becomes a line in the report only if the data supports it.

| Signal | Where | What it tells you |
|---|---|---|
| **Concentration** | "Top 5 = X% of views" | Above 60% = a hit-driven channel; the analysis is about what the few hits share, not about the average video |
| **Trajectory** | By upload month | Is the median rising? A rising median with flat hits means the channel is gaining baseline distribution |
| **Format** | By tab, by duration | Shorts vs. long-form, and which length band holds the hits |
| **Packaging** | Title terms | Terms with lift > 2x on n ≥ 3 are the channel's winning promises; terms < 0.6x are what the audience ignores |
| **Dubbing** | By dubbed audio tracks | 5+ audio languages = YouTube multi-language audio is on. Hits often get dubbed after they take off, so treat it as a signal, not a cause |
| **Cadence** | Cadence | Uploads/week and gaps. Compare views of the first video after a long gap with the pre-gap median |
| **Comments hidden** | Footer note | All videos hidden = almost certainly "made for kids" (no comments, no notification bell, limited ad targeting) |

**Guardrails — say these in the report when they apply:**
- Videos younger than 14 days are still growing. Never call them flops.
- Group stats with n < 3 are anecdotes.
- Correlation is not cause: a theme can win because the algorithm found an audience for one video and pushed its siblings.
- Public data cannot show CTR, retention, traffic sources or revenue. Don't guess them.

---

## Step 3 — Group by theme

The script can't know a channel's themes; you can. Read every title in `videos.csv` and define 5–10 themes specific to this channel (e.g. for a kids channel: *Good habits*, *Safety / boo-boo*, *Colors*, *Numbers*; for finance: *Market crash*, *Side hustle*, *Billionaire story*). Then compute the table:

```python
import csv, re, statistics as st
from collections import defaultdict
rows = list(csv.DictReader(open("handle/videos.csv")))
THEMES = {  # first match wins — put the most specific patterns first
    "Safety": r"safety|boo boo|seatbelt",
    "Good habits": r"habit|manner|sharing|wash|teeth",
    "Colors": r"colou?r",
}
groups = defaultdict(list)
for r in rows:
    theme = next((t for t, p in THEMES.items() if re.search(p, r["title"], re.I)), "Other")
    groups[theme].append(int(r["views"]))
for t, v in sorted(groups.items(), key=lambda x: -st.median(x[1])):
    print(f"{t:20s} n={len(v):3d} median={int(st.median(v)):>10,} max={max(v):>12,}")
```

Report median **and** max per theme. A theme with a low median but one huge max is a lottery ticket; a theme with a high median is a reliable floor.

---

## Step 4 — Visual review (storyboards)

Read every storyboard sheet of the top videos, then the bottom ones. Frames are evenly spaced, read left→right, top→bottom; sheet `_1` continues `_0`. Some videos only offer a 48×27 storyboard (a strip of unreadable specks); use the thumbnail for those. Fill this checklist for each video and compare columns:

| Dimension | Look for |
|---|---|
| **First frame** | What is on screen at 0s — a face, an action, an object, text? |
| **Story arc** | Is there conflict → consequence → resolution, or just a demonstration of a concept? |
| **Characters** | Same recurring character across hits? Number of characters? Emotion shown (crying, surprise, joy)? |
| **Transformation** | Does something change state on screen (explodes, morphs, hatches, gets fixed)? |
| **Setting** | Indoor/outdoor, recurring locations, palette |
| **Text on screen** | Captions, labels, none |
| **Cut rhythm** | Frames per distinct shot ≈ seconds per cut |
| **Production** | 3D / 2D / live action / AI-generated (look for morphing hands, inconsistent props, plastic skin) |
| **Branding** | Watermark position, intro, end card |

The difference between the top and bottom columns is the formula. Write it as 3–5 rules a producer could follow.

---

## Step 5 — Write the report

Write in the user's language. Keep this structure; drop a section only when there is no data for it.

```
# <Channel> — Channel Analysis (<date>)

## Snapshot
Subscribers · videos (by format) · total views · channel age · uploads/week · made for kids?

## The verdict in 3 lines
What the channel is, what actually drives its views, the single biggest opportunity.

## What wins
Theme table (n, median, max, hits) + 2–4 bullets, each citing numbers.

## What loses
Same, for the bottom themes/formats.

## The formula of the hits
The 3–5 rules from the storyboard review, each with the video IDs that show it.

## Packaging
Title terms with lift, duration band, dubbing, thumbnails/first frame.

## Caveats
Immature videos, small samples, what public data can't show.

## Recommendations
5–8 actions ranked by expected impact. Each: action → evidence → how to test it.

## Next videos
5 concepts in the winning formula + 1 full Seedance 2.0 prompt (Step 6).
```

---

## Step 6 — Hand off to Seedance 2.0

Condense the analysis into a **Channel DNA card**, then pick the production skill from this pack that matches the channel's format:

```
CHANNEL DNA
Format:      9:16 Shorts, 15–19s
Character:   <recurring hero, look, outfit>
Arc:         <e.g. mistake → consequence → helper → fix → happy ending>
Hook (0–2s): <what the first frame shows>
Setting:     <recurring locations, palette, lighting>
Sound:       <music style, SFX, voice>
Title:       <winning terms> + emoji + 2–3 hashtags
```

| Channel type | Use skill |
|---|---|
| Animated / no presenter / narration-driven | 05 Faceless Channel |
| Hook-driven Shorts in any niche | 01 Viral Hook |
| Creator on camera | 03 Personal Brand / 09 AI Avatar |
| Transformation content | 07 Before-After |
| Product / SaaS | 02 SaaS Launch |
| Podcast / talking head clips | 10 Podcast Visual |

Write one full prompt following that skill's structure (timestamped beats, camera, lighting, motion, sound), using the DNA card as the brief. Seedance clips are 4–15s: for a longer hit format, split it into 2 prompts that share the character description word-for-word and feed the last frame of clip 1 as `@image1` to clip 2.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `This video is not available` on every video | `pip install "yt-dlp[default]"` and install Node.js or Deno |
| `n challenge solving failed` | Same as above; the JS solver is missing |
| `Sign in to confirm you're not a bot` | YouTube rate-limited this IP. Already-fetched metadata stays in `info/`; re-run later to resume. Storyboards and thumbnails still download because they come from i.ytimg.com |
| `This channel does not have a streams tab` | Normal — the script skips missing tabs |
| `Requested format is not available` | Harmless for metadata; the script sets `--ignore-no-formats-error` |
| Comments all `None` | The channel is "made for kids" or disabled comments; say so, don't treat it as zero engagement |

---

## Example

`examples/nursytots-2026-10.md` — full report on a kids' 3D-animation Shorts channel (84 Shorts, 94M views in 4.5 months), written in Portuguese for a Brazilian user, with the Seedance handoff prompt at the end.
