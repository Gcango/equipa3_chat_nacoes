#!/usr/bin/env python3
"""Remove fundo preto do logo oficial; mantém prata e azul."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public"
SRC = ROOT / "logo-gerabriel-original.png"
OUT = ROOT / "logo-gerabriel.png"
TH = 48


def is_background_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 8:
        return True
    if max(r, g, b) - min(r, g, b) > 28:
        return False
    return r <= TH and g <= TH and b <= TH


def main() -> None:
    src = SRC if SRC.exists() else OUT
    img = Image.open(src).convert("RGBA")
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
        if not is_background_pixel(r, g, b, a):
            continue
        px[x, y] = (0, 0, 0, 0)
        if x > 0:
            q.append((x - 1, y))
        if x + 1 < w:
            q.append((x + 1, y))
        if y > 0:
            q.append((x, y - 1))
        if y + 1 < h:
            q.append((x, y + 1))

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r <= 55 and g <= 55 and b <= 55 and max(r, g, b) - min(r, g, b) < 20:
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                        px[x, y] = (r, g, b, max(0, a - 180))
                        break

    img.save(OUT, "PNG")
    print(f"Written {OUT} (fundo removido, cores originais)")


if __name__ == "__main__":
    main()
