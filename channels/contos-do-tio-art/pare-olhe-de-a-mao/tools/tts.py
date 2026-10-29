#!/usr/bin/env python3
"""Speak one line with a Microsoft neural voice (edge-tts) into an mp3.

    python3 tools/tts.py --voice pt-BR-AntonioNeural --text "Tá tudo bem, Lulu." --out voices/x.mp3 [--pitch +0Hz] [--rate +0%]

Behind a TLS-inspecting proxy, set TTS_CA_BUNDLE to its CA file: edge-tts pins certifi's bundle, so it is
pointed at that file before the library loads (verification stays on). HTTPS_PROXY is passed through.
"""
import argparse
import asyncio
import os

import certifi

if os.environ.get("TTS_CA_BUNDLE"):
    certifi.where = lambda: os.environ["TTS_CA_BUNDLE"]

import edge_tts  # noqa: E402  (must load after the CA override)


async def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--voice", required=True)
    p.add_argument("--text", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--pitch", default="+0Hz")
    p.add_argument("--rate", default="+0%")
    a = p.parse_args()
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    com = edge_tts.Communicate(a.text, a.voice, pitch=a.pitch, rate=a.rate, proxy=proxy)
    await com.save(a.out)


asyncio.run(main())
