export const SPIKE_VIEWPORT_SIZE = 61;

export type AsciiTile = "." | ";" | "," | "#" | "@" | "W" | "P";

export interface AsciiViewport {
  rows: string[];
  width: number;
  height: number;
}

export function createAsciiViewport(size = SPIKE_VIEWPORT_SIZE): AsciiViewport {
  if (size % 2 === 0 || size < 3) {
    throw new Error("ASCII viewport size must be an odd number >= 3");
  }

  const center = Math.floor(size / 2);
  const rows: string[] = [];

  for (let y = 0; y < size; y++) {
    let row = "";
    for (let x = 0; x < size; x++) {
      row += tileAt(x, y, center);
    }
    rows.push(row);
  }

  return {
    rows,
    width: size,
    height: size
  };
}

export function viewportToText(viewport: AsciiViewport): string {
  return viewport.rows.join("\n");
}

function tileAt(x: number, y: number, center: number): AsciiTile {
  if (x === center && y === center) return "@";
  if (x === center || y === center) return "#";
  if (x === 6 && y === 8) return "P";
  if (x === 54 && y === 47) return "W";
  if ((x + y) % 11 === 0) return ";";
  if ((x * 3 + y * 5) % 17 === 0) return ",";
  return ".";
}

