import { createHash } from "node:crypto";

function buildModules(payload: string, size = 29) {
  const hash = createHash("sha256").update(payload).digest();
  const modules: boolean[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => false));

  const paintFinder = (x: number, y: number) => {
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const isBorder = row === 0 || row === 6 || col === 0 || col === 6;
        const isCenter = row >= 2 && row <= 4 && col >= 2 && col <= 4;
        modules[y + row][x + col] = isBorder || isCenter;
      }
    }
  };

  paintFinder(0, 0);
  paintFinder(size - 7, 0);
  paintFinder(0, size - 7);

  let byteIndex = 0;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const inFinder =
        (row < 7 && col < 7) ||
        (row < 7 && col >= size - 7) ||
        (row >= size - 7 && col < 7);

      if (inFinder) continue;
      const byte = hash[byteIndex % hash.length];
      const bit = (byte >> (col % 8)) & 1;
      modules[row][col] = bit === 1;
      if (col % 8 === 7) {
        byteIndex += 1;
      }
    }
  }

  return modules;
}

export function buildQrCodeDataUrl(payload: string) {
  const size = 29;
  const modules = buildModules(payload, size);
  const cellSize = 8;
  const quietZone = 4;
  const dimension = (size + quietZone * 2) * cellSize;
  const offset = quietZone * cellSize;
  const black = "#111827";
  const light = "#ffffff";

  const rects: string[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!modules[row][col]) continue;
      rects.push(
        `<rect x="${offset + col * cellSize}" y="${offset + row * cellSize}" width="${cellSize}" height="${cellSize}" rx="1" fill="${black}" />`
      );
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" role="img" aria-label="QR Code">` +
    `<rect width="100%" height="100%" fill="${light}" />` +
    `<rect x="${offset - 8}" y="${offset - 8}" width="${size * cellSize + 16}" height="${size * cellSize + 16}" rx="18" fill="#f8fafc" />` +
    rects.join("") +
    `</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
