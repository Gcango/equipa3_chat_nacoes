#!/usr/bin/env python3
"""Gera logo-gerabriel-transparent.png (login navy) — ícone fiel, wordmark branco limpo."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public"
SRC = ROOT / "logo-gerabriel-official.png"
FALLBACK = ROOT / "logo-gerabriel-original.png"
FALLBACK2 = ROOT / "logo-gerabriel.png"
OUT_TRANSPARENT = ROOT / "logo-gerabriel-transparent.png"
OUT_ON_DARK = ROOT / "logo-gerabriel-on-dark.png"

ICON_Y1_RATIO = 0.58
WORDMARK_Y_RATIO = 0.66
ORANGE_LO = (220, 120, 0)
ORANGE_HI = (255, 200, 120)


def is_near_white(r: int, g: int, b: int, a: int) -> bool:
    if a < 12:
        return True
    return r >= 248 and g >= 248 and b >= 248


def is_flood_background(r: int, g: int, b: int, a: int) -> bool:
    if a < 12:
        return True
    if is_near_white(r, g, b, a):
        return True
    if max(r, g, b) <= 40 and max(r, g, b) - min(r, g, b) < 18:
        return True
    return False


def is_orange(r: int, g: int, b: int) -> bool:
    return r >= ORANGE_LO[0] and g >= ORANGE_LO[1] and b <= ORANGE_HI[2] and r > b + 40


def is_institutional_blue(r: int, g: int, b: int) -> bool:
    if is_orange(r, g, b):
        return False
    if b >= 120 and r <= 120 and b >= r + 25:
        return True
    if b >= 90 and r <= 100 and g <= 130 and b > r:
        return True
    return False


def is_wordmark_neutral(r: int, g: int, b: int) -> bool:
    if is_orange(r, g, b) or is_institutional_blue(r, g, b):
        return True
    spread = max(r, g, b) - min(r, g, b)
    peak = max(r, g, b)
    if spread <= 38 and peak >= 158:
        return True
    return False


def flood_transparent(img: Image.Image) -> None:
    w, h = img.size
    px = img.load()
    visited = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    def idx(x: int, y: int) -> int:
        return y * w + x

    while q:
        x, y = q.popleft()
        i = idx(x, y)
        if visited[i]:
            continue
        visited[i] = 1
        r, g, b, a = px[x, y]
        if not is_flood_background(r, g, b, a):
            continue
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                q.append((nx, ny))


def opaque_neighbors(px, w: int, h: int, x: int, y: int, min_a: int = 48) -> int:
    n = 0
    for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] >= min_a:
            n += 1
    return n


def cleanup_artifacts(img: Image.Image, wordmark_y: int) -> None:
    w, h = img.size
    px = img.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue

            if a < 48 and r > 235 and g > 235 and b > 235:
                px[x, y] = (0, 0, 0, 0)
                continue

            if y >= wordmark_y and is_wordmark_neutral(r, g, b) and not is_orange(r, g, b):
                px[x, y] = (255, 255, 255, 255)
                continue

            if y > int(h * 0.78) and r > 242 and g > 242 and b > 242:
                if opaque_neighbors(px, w, h, x, y) < 3:
                    px[x, y] = (0, 0, 0, 0)

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if y < wordmark_y:
                continue
            if is_orange(r, g, b):
                continue
            if is_institutional_blue(r, g, b) or (max(r, g, b) - min(r, g, b) <= 40 and min(r, g, b) >= 150):
                px[x, y] = (255, 255, 255, 255)


def build() -> None:
    src_path = SRC if SRC.exists() else (FALLBACK if FALLBACK.exists() else FALLBACK2)
    source = Image.open(src_path).convert("RGBA")
    w, h = source.size
    icon_y1 = int(h * ICON_Y1_RATIO)
    wordmark_y = int(h * WORDMARK_Y_RATIO)

    out = source.copy()
    flood_transparent(out)
    src_px = source.load()
    out_px = out.load()

    for y in range(h):
        for x in range(w):
            sr, sg, sb, sa = src_px[x, y]
            if sa < 8 or is_flood_background(sr, sg, sb, sa):
                out_px[x, y] = (0, 0, 0, 0)
                continue

            if y < icon_y1:
                out_px[x, y] = (sr, sg, sb, sa)
                continue

            if y < wordmark_y:
                out_px[x, y] = (sr, sg, sb, sa)
                continue

            if is_orange(sr, sg, sb):
                out_px[x, y] = (sr, sg, sb, sa)
            elif is_wordmark_neutral(sr, sg, sb):
                out_px[x, y] = (255, 255, 255, 255)
            else:
                out_px[x, y] = (sr, sg, sb, sa)

    cleanup_artifacts(out, wordmark_y)

    out.save(OUT_TRANSPARENT, "PNG", optimize=True)
    out.save(OUT_ON_DARK, "PNG", optimize=True)
    print(
        f"Written {OUT_TRANSPARENT} ({w}x{h}, icon<{icon_y1}, wordmark>={wordmark_y})"
    )


if __name__ == "__main__":
    build()
