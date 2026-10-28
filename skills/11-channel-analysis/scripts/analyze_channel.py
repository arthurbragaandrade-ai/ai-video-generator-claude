#!/usr/bin/env python3
"""
Channel Analysis — data collector
=================================
Pulls the public data of a YouTube channel with yt-dlp and writes:

    <out>/summary.md       stats tables to read before writing the report
    <out>/videos.csv       one row per video
    <out>/info/            raw yt-dlp metadata (reused on re-runs)
    <out>/storyboards/     frame grids of the top and bottom videos
    <out>/thumbs/          thumbnails of the same videos

Usage:
    python analyze_channel.py @handle
    python analyze_channel.py https://youtube.com/@handle --out ./handle --limit 150 --frames 5

Requires: pip install "yt-dlp[default]"   plus Node.js or Deno on PATH.
"""

import argparse
import csv
import datetime as dt
import json
import re
import shutil
import statistics as st
import subprocess
import sys
import urllib.request
from collections import defaultdict
from pathlib import Path

TABS = ("videos", "shorts", "streams")
IMMATURE_DAYS = 14          # younger videos are still collecting views
HIT_MULTIPLIER = 10         # a "hit" is 10x the channel median

STOP = {
    "the", "and", "for", "with", "you", "your", "our", "are", "this", "that",
    "from", "how", "what", "why", "who", "all", "new", "get", "its", "it's",
    "shorts", "short",
}
WORD = re.compile(r"#?[a-z0-9']+")


# ── yt-dlp ──────────────────────────────────────────────────────────

def js_runtime_args() -> list[str]:
    # yt-dlp enables only Deno by default; without a JS runtime YouTube
    # answers "This video is not available" for most videos.
    if shutil.which("deno"):
        return []
    if shutil.which("node"):
        return ["--js-runtimes", "node"]
    print("! No Deno or Node.js found: full metadata will likely fail", file=sys.stderr)
    return []


def ytdlp(*args: str) -> subprocess.CompletedProcess:
    cmd = [sys.executable, "-m", "yt_dlp", *js_runtime_args(), *args]
    return subprocess.run(cmd, capture_output=True, text=True)


def channel_url(arg: str) -> str:
    arg = arg.strip()
    if arg.startswith("@"):
        return f"https://www.youtube.com/{arg}"
    if "youtube.com" in arg and not arg.startswith("http"):
        arg = "https://" + arg
    if not arg.startswith("http"):
        return f"https://www.youtube.com/@{arg}"
    url = arg.split("?")[0].rstrip("/")
    return re.sub(r"/(videos|shorts|streams|featured)$", "", url)


def list_entries(base: str, limit: int) -> tuple[list[dict], dict]:
    """Flat listing of every tab: cheap, rarely blocked."""
    entries, meta = [], {}
    for tab in TABS:
        r = ytdlp("--flat-playlist", "-J", "--playlist-end", str(limit), f"{base}/{tab}")
        if r.returncode != 0:
            continue  # the channel has no such tab
        data = json.loads(r.stdout)
        meta = meta or data
        for e in data.get("entries") or []:
            entries.append({
                "id": e["id"],
                "tab": tab,
                "title": e.get("title") or "",
                "views": e.get("view_count") or 0,
            })
    return entries, meta


def fetch_info(entries: list[dict], info_dir: Path) -> bool:
    """Full metadata per video. Returns True if YouTube started bot-blocking."""
    todo = [e["id"] for e in entries if not (info_dir / f"{e['id']}.info.json").exists()]
    if not todo:
        return False
    batch = info_dir.parent / "todo.txt"
    batch.write_text("\n".join(f"https://www.youtube.com/watch?v={i}" for i in todo))
    r = ytdlp(
        "--skip-download", "--write-info-json", "--no-write-playlist-metafiles",
        "--ignore-no-formats-error", "--ignore-errors", "--sleep-requests", "0.5",
        "-o", str(info_dir / "%(id)s.%(ext)s"), "-a", str(batch),
    )
    batch.unlink()
    return "not a bot" in r.stderr


def load_info(info_dir: Path, vid: str) -> dict | None:
    path = info_dir / f"{vid}.info.json"
    return json.loads(path.read_text()) if path.exists() else None


# ── Rows ────────────────────────────────────────────────────────────

def audio_languages(info: dict) -> list[str]:
    # More than one language means YouTube (auto-)dubbing is on for the video.
    return sorted({
        f["language"] for f in info.get("formats") or []
        if f.get("language") and f.get("acodec") not in (None, "none")
    })


def to_row(entry: dict, info: dict | None) -> dict:
    if info is None:
        return {**entry, "date": None, "duration": None, "likes": None,
                "comments": None, "audio_langs": None, "tags": "", "full": False}
    return {
        "id": entry["id"],
        "tab": entry["tab"],
        "title": info.get("title") or entry["title"],
        "date": info.get("upload_date"),
        "duration": info.get("duration"),
        "views": info.get("view_count") or entry["views"],
        "likes": info.get("like_count"),
        "comments": info.get("comment_count"),
        "audio_langs": len(audio_languages(info)),
        "tags": "|".join(info.get("tags") or []),
        "full": True,
    }


def parse_date(s: str) -> dt.date:
    return dt.date(int(s[:4]), int(s[4:6]), int(s[6:]))


def age_days(row: dict, today: dt.date) -> int | None:
    return (today - parse_date(row["date"])).days if row["date"] else None


# ── Summary ─────────────────────────────────────────────────────────

def fmt(n) -> str:
    return "—" if n is None else f"{int(n):,}"


def group_table(title: str, groups: dict, hit: float) -> list[str]:
    lines = [f"\n## {title}\n", "| Group | n | Median views | Mean views | Max | Hits |",
             "|---|---|---|---|---|---|"]
    for key, rows in groups.items():
        if not rows:
            continue
        v = [r["views"] for r in rows]
        lines.append(f"| {key} | {len(v)} | {fmt(st.median(v))} | {fmt(st.mean(v))} "
                     f"| {fmt(max(v))} | {sum(x >= hit for x in v)} |")
    return lines


DURATIONS = ((10, "<10s"), (15, "10–14s"), (20, "15–19s"), (30, "20–29s"), (61, "30–60s"),
             (181, "1–3 min"), (600, "3–10 min"), (1800, "10–30 min"), (float("inf"), "30+ min"))


def duration_bucket(d: int | None) -> str:
    return "unknown" if d is None else next(label for hi, label in DURATIONS if d < hi)


def title_terms(rows: list[dict]) -> list[tuple]:
    """Median views of titles with a term vs without it."""
    tokens = {r["id"]: {w for w in WORD.findall(r["title"].lower())
                        if w not in STOP and len(w.lstrip("#")) > 2} for r in rows}
    seen = defaultdict(list)
    for r in rows:
        for w in tokens[r["id"]]:
            seen[w].append(r)
    out = []
    for w, with_ in seen.items():
        if not 3 <= len(with_) <= 0.8 * len(rows):
            continue
        without = [r["views"] for r in rows if w not in tokens[r["id"]]]
        m_with = st.median(r["views"] for r in with_)
        out.append((m_with / max(st.median(without), 1), w, len(with_), m_with))
    return sorted(out, reverse=True)


def write_summary(path: Path, meta: dict, rows: list[dict], today: dt.date, blocked: bool) -> None:
    views = [r["views"] for r in rows]
    median = st.median(views)
    hit = median * HIT_MULTIPLIER
    ranked = sorted(rows, key=lambda r: -r["views"])
    total = sum(views) or 1
    full = [r for r in rows if r["full"]]

    per_tab = ", ".join(f"{t}: {n}" for t in TABS if (n := sum(r["tab"] == t for r in rows)))
    L = [f"# {meta.get('channel') or meta.get('title')} — data summary",
         f"\nCollected {today.isoformat()} · subscribers {fmt(meta.get('channel_follower_count'))} · "
         f"{len(rows)} videos ({per_tab})",
         f"\nTotal views {fmt(total)} · median {fmt(median)} · mean {fmt(st.mean(views))} · "
         f"hit threshold (10x median) {fmt(hit)}",
         f"\nTop 5 = {100 * sum(r['views'] for r in ranked[:5]) / total:.0f}% of views · "
         f"top 10 = {100 * sum(r['views'] for r in ranked[:10]) / total:.0f}%"]
    if len(full) < len(rows):
        L.append(f"\n> Full metadata for {len(full)}/{len(rows)} videos"
                 + (" — YouTube bot-blocked the rest; re-run later to resume." if blocked else "."))
    L.append(f"\n## Channel description\n\n{(meta.get('description') or '').strip()}")
    if meta.get("tags"):
        L.append(f"\nChannel tags: {', '.join(meta['tags'])}")

    L += ["\n## Top 15\n", "| # | Tab | Date | Dur | Views | Likes/view | Dub | Title | ID |",
          "|---|---|---|---|---|---|---|---|---|"]
    for i, r in enumerate(ranked[:15], 1):
        lv = f"{100 * r['likes'] / r['views']:.2f}%" if r["likes"] and r["views"] else "—"
        L.append(f"| {i} | {r['tab']} | {r['date'] or '—'} | {r['duration'] or '—'} | {fmt(r['views'])} | {lv} "
                 f"| {r['audio_langs'] if r['audio_langs'] is not None else '—'} | {r['title']} | {r['id']} |")

    mature = [r for r in ranked if (age_days(r, today) or 999) >= IMMATURE_DAYS]
    L += ["\n## Bottom 10 (older than 14 days)\n", "| Tab | Date | Views | Title | ID |", "|---|---|---|---|---|"]
    for r in mature[-10:]:
        L.append(f"| {r['tab']} | {r['date'] or '—'} | {fmt(r['views'])} | {r['title']} | {r['id']} |")

    L += group_table("By tab", {t: [r for r in rows if r["tab"] == t] for t in TABS}, hit)

    months = defaultdict(list)
    for r in full:
        months[r["date"][:6]].append(r)
    L += group_table("By upload month", dict(sorted(months.items())), hit)

    buckets = {label: [] for _, label in DURATIONS}
    for r in full:
        buckets[duration_bucket(r["duration"])].append(r)
    L += group_table("By duration", buckets, hit)

    dub = {"1 audio track": [r for r in full if (r["audio_langs"] or 0) <= 1],
           "2–4 tracks": [r for r in full if 2 <= (r["audio_langs"] or 0) <= 4],
           "5+ tracks (dubbed)": [r for r in full if (r["audio_langs"] or 0) >= 5]}
    L += group_table("By dubbed audio tracks", dub, hit)

    L += ["\n## Title terms (median views with term ÷ without)\n",
          "| Term | n | Median with | Lift |", "|---|---|---|---|"]
    terms = title_terms(rows)
    for t in terms[:15] + [None] + terms[-8:] if len(terms) > 23 else terms:
        if t is None:
            L.append("| … | | | |")
            continue
        lift, w, n, m = t
        L.append(f"| {w} | {n} | {fmt(m)} | {lift:.2f}x |")

    dates = sorted({parse_date(r["date"]) for r in full})
    if len(dates) > 1:
        weeks = max((dates[-1] - dates[0]).days / 7, 1)
        gaps = [(a, b) for a, b in zip(dates, dates[1:]) if (b - a).days > 3]
        L += ["\n## Cadence\n",
              f"First upload {dates[0]} · last {dates[-1]} ({(today - dates[-1]).days} days ago) · "
              f"{len(full) / weeks:.1f} uploads/week",
              "\nGaps over 3 days: " + (", ".join(f"{a} → {b}" for a, b in gaps) or "none")]

    if full and all(r["comments"] is None for r in full):
        L.append("\n> Comment counts are hidden on every video (typical of 'made for kids').")
    L.append(f"\n> Videos younger than {IMMATURE_DAYS} days are still collecting views; "
             "group stats are correlation, not cause.")
    path.write_text("\n".join(L) + "\n")


# ── Frames ──────────────────────────────────────────────────────────

def download(url: str, dest: Path) -> bool:
    try:
        urllib.request.urlretrieve(url, dest)
        return True
    except Exception as e:
        print(f"  ! {dest.name}: {e}", file=sys.stderr)
        return False


def save_frames(info: dict, sb_dir: Path, thumb_dir: Path) -> int:
    """Storyboards come from i.ytimg.com, so they still work when video downloads are blocked."""
    vid = info["id"]
    if info.get("thumbnail"):
        download(info["thumbnail"], thumb_dir / f"{vid}.jpg")
    sbs = [f for f in info.get("formats") or [] if str(f.get("format_id", "")).startswith("sb")]
    if not sbs:
        return 0
    best = max(sbs, key=lambda f: (f.get("width") or 0) * (f.get("height") or 0))
    saved = 0
    for n, frag in enumerate(best.get("fragments") or []):
        url = frag.get("url") or (best.get("fragment_base_url", "") + frag.get("path", ""))
        saved += download(url, sb_dir / f"{vid}_{n}.jpg")
    return saved


# ── Main ────────────────────────────────────────────────────────────

def main() -> None:
    p = argparse.ArgumentParser(description="Collect public data for a YouTube channel.")
    p.add_argument("channel", help="@handle, handle or channel URL")
    p.add_argument("--out", help="output folder (default: ./<handle>)")
    p.add_argument("--limit", type=int, default=200, help="max videos per tab (default 200)")
    p.add_argument("--frames", type=int, default=5, help="storyboards for top N and bottom N (default 5)")
    args = p.parse_args()

    base = channel_url(args.channel)
    out = Path(args.out or base.rsplit("/", 1)[-1].lstrip("@") or "channel")
    info_dir, sb_dir, thumb_dir = out / "info", out / "storyboards", out / "thumbs"
    for d in (info_dir, sb_dir, thumb_dir):
        d.mkdir(parents=True, exist_ok=True)

    print(f"→ Listing {base}")
    entries, meta = list_entries(base, args.limit)
    if not entries:
        sys.exit("No videos found. Check the URL, or YouTube is blocking this network.")
    print(f"  {len(entries)} videos")

    print("→ Fetching metadata (resumes from info/)")
    blocked = fetch_info(entries, info_dir)
    rows = [to_row(e, load_info(info_dir, e["id"])) for e in entries]
    print(f"  full metadata for {sum(r['full'] for r in rows)}/{len(rows)}"
          + (" — bot-blocked, re-run later to resume" if blocked else ""))

    today = dt.date.today()
    with open(out / "videos.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    write_summary(out / "summary.md", meta, rows, today, blocked)

    print(f"→ Storyboards for top {args.frames} and bottom {args.frames} of each tab")
    picks = []
    for tab in TABS:
        ranked = sorted((r for r in rows if r["full"] and r["tab"] == tab), key=lambda r: -r["views"])
        mature = [r for r in ranked if age_days(r, today) >= IMMATURE_DAYS]
        picks += [r["id"] for r in ranked[:args.frames] + mature[-args.frames:]]
    for vid in dict.fromkeys(picks):
        print(f"  {vid}: {save_frames(load_info(info_dir, vid), sb_dir, thumb_dir)} sheets")

    print(f"\nDone → {out / 'summary.md'}")


if __name__ == "__main__":
    main()
