function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHexColor(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
    return trimmed.length === 4
      ? `#${trimmed
          .slice(1)
          .split("")
          .map((char) => char + char)
          .join("")}`
      : trimmed;
  }
  return fallback;
}

export function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex, "#000000").slice(1);
  const int = Number.parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

export function rgbToHsl(rgb: { r: number; g: number; b: number }) {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hexToHslComponents(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl({ r, g, b });
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

export function hslToHex(components: { h: number; s: number; l: number }) {
  const s = components.s / 100;
  const l = components.l / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((components.h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (components.h < 60) {
    r = c;
    g = x;
  } else if (components.h < 120) {
    r = x;
    g = c;
  } else if (components.h < 180) {
    g = c;
    b = x;
  } else if (components.h < 240) {
    g = x;
    b = c;
  } else if (components.h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (value: number) => Math.round((value + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function shiftLightness(hex: string, delta: number) {
  const normalized = normalizeHexColor(hex, "#000000");
  const hsl = rgbToHsl(hexToRgb(normalized));
  return hslToHex({
    h: hsl.h,
    s: clamp(hsl.s, 0, 100),
    l: clamp(hsl.l + delta, 4, 96),
  });
}

export function colorToCssHsl(hex: string) {
  return hexToHslComponents(hex);
}

export function contrastRatio(foregroundHex: string, backgroundHex: string) {
  const fg = hexToRgb(foregroundHex);
  const bg = hexToRgb(backgroundHex);

  const toLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const [rs, gs, bs] = [r, g, b].map((value) => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const luminanceA = toLuminance(fg);
  const luminanceB = toLuminance(bg);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

