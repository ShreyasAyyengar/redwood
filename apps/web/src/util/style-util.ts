export function urgencyStyle(style: "red" | "orange" | "green" | "purple"): string {
  switch (style) {
    case "red":
      return "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30 transition-all duration-100";
    case "orange":
      return "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30 transition-all duration-100";
    case "green":
      return "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30 transition-all duration-100";
    case "purple":
      return "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30 transition-all duration-100";
    default:
      return "";
  }
}
// TODO add `border` class?

type GeneratedColorSet = {
  bg: string;
  text: string;
  border: string;
};

type Hsl = {
  h: number;
  s: number;
  l: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(hex: string): string {
  let clean = hex.trim().replace(/^#/, "");

  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return `#${clean.toLowerCase()}`;
}

function hexToRgb(hex: string) {
  const clean = normalizeHex(hex).slice(1);

  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case rn:
        h = 60 * (((gn - bn) / delta) % 6);
        break;
      case gn:
        h = 60 * ((bn - rn) / delta + 2);
        break;
      case bn:
        h = 60 * ((rn - gn) / delta + 4);
        break;
    }
  }

  if (h < 0) h += 360;

  return {
    h,
    s: s * 100,
    l: l * 100,
  };
}

function hslToRgb(h: number, s: number, l: number) {
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = c;
    g1 = x;
  } else if (h < 120) {
    r1 = x;
    g1 = c;
  } else if (h < 180) {
    g1 = c;
    b1 = x;
  } else if (h < 240) {
    g1 = x;
    b1 = c;
  } else if (h < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function generateAttributeColors(hex: string): GeneratedColorSet {
  const normalized = normalizeHex(hex);
  const { r, g, b } = hexToRgb(normalized);
  const { h, s, l } = rgbToHsl(r, g, b);

  const isNearBlack = l < 8;
  const isNearWhite = l > 96;
  const isGrayish = s < 10;

  if (isNearBlack) {
    return {
      bg: "#18181b",
      border: "#3f3f46",
      text: "#f4f4f5",
    };
  }

  if (isNearWhite) {
    return {
      bg: "#18181b",
      border: "#52525b",
      text: "#fafafa",
    };
  }

  return {
    bg: hslToHex(h, isGrayish ? 8 : clamp(s * 0.45, 20, 65), 14),
    border: hslToHex(h, isGrayish ? 10 : clamp(s * 0.55, 25, 70), 24),
    text: hslToHex(h, isGrayish ? 12 : clamp(s * 0.9, 45, 90), 78),
  };
}
