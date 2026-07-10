// lib/form-engine/grid-engine.ts
import type { FormComponentNode } from "./types";

export const GRID_COLUMNS = 12;

// Minimum row height in px. Actual rendered rows can grow taller than this
// (see canvas.tsx: `gridAutoRows: minmax(ROW_UNIT_PX, auto)`), because label
// text, help text, and validation hints vary in height per field. Treating
// this as a hard fixed height was the root cause of fields visually
// overlapping the row below them.
export const ROW_UNIT_PX = 90;
export const GRID_GAP_PX = 16;

// NOTE on "fifth": a 12-column grid cannot represent exact fifths (12 / 5 =
// 2.4). We intentionally collapse "fifth" to the nearest representable span,
// which is the same span as "sixth" (2 of 12 columns, ~16.6%). This is a
// deliberate approximation, not a bug — if you need true fifths, the grid
// would need to move to a column count divisible by 5 (e.g. 60), which is a
// bigger change (see PR notes). Both presets remain in the schema for
// forward/backward compatibility with saved forms.
// lib/form-engine/grid-engine.ts

export const WIDTH_TO_SPAN: Record<string, number> = {
  full: 12,
  "three-quarters": 9, // 🌟 Map 75% down to exactly 9 columns
  "two-thirds": 8,     // 🌟 Map 66.6% down to exactly 8 columns
  half: 6,
  third: 4,
  quarter: 3,
  fifth: 2,
  sixth: 2,
};

export const SPAN_TO_WIDTH: Record<number, FormComponentNode["display"]["width"]> = {
  12: "full",
  9: "three-quarters", // 🌟 Now securely commits 75% width on pointer release
  8: "two-thirds",     // 🌟 Now securely commits 66.6% width on pointer release
  6: "half",
  4: "third",
  3: "quarter",
  2: "sixth",
};

// Complete step array configuration stops
export const SNAP_SPANS = [2, 3, 4, 6, 8, 9, 12] as const;

export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PackedLayout {
  positions: Map<string, GridRect>;
  rowCount: number;
}

export function spanForNode(node: Pick<FormComponentNode, "display">): number {
  const preset = node.display?.width ?? "full";
  return Math.min(GRID_COLUMNS, WIDTH_TO_SPAN[preset] ?? GRID_COLUMNS);
}

function heightForNode(node: FormComponentNode): number {
  const hinted = (node.meta as { rowSpan?: number } | undefined)?.rowSpan;
  return Math.max(1, Math.round(hinted ?? 1));
}

/**
 * Skyline bin-packing: places each node at the left-most column offset that
 * minimizes its resulting Y position, given nodes already placed before it.
 */
export function packGrid(nodes: FormComponentNode[], columns: number = GRID_COLUMNS): PackedLayout {
  const colHeights = new Array(columns).fill(0);
  const positions = new Map<string, GridRect>();

  for (const node of nodes) {
    const w = spanForNode(node);
    const h = heightForNode(node);

    let bestX = 0;
    let bestY = Infinity;

    for (let x = 0; x <= columns - w; x++) {
      let y = 0;
      for (let i = x; i < x + w; i++) {
        y = Math.max(y, colHeights[i]);
      }
      if (y < bestY) {
        bestY = y;
        bestX = x;
      }
    }

    positions.set(node.id, { x: bestX, y: bestY, w, h });
    for (let i = bestX; i < bestX + w; i++) {
      colHeights[i] = bestY + h;
    }
  }

  return { positions, rowCount: colHeights.reduce((m, v) => Math.max(m, v), 0) };
}

export function rectToGridStyle(rect: GridRect): React.CSSProperties {
  return {
    gridColumn: `${rect.x + 1} / span ${rect.w}`,
    gridRow: `${rect.y + 1} / span ${rect.h}`,
  };
}

export interface Cell {
  x: number;
  y: number;
}

/**
 * Converts a pointer position into an approximate grid cell. This is an
 * approximation: because rows can auto-grow taller than ROW_UNIT_PX (see
 * canvas.tsx), the Y estimate can drift on tall rows. That's acceptable here
 * because this value is only used to pick a *drop target row* during drag,
 * not for final layout — the actual layout is always derived from
 * `packGrid`, which is exact.
 */
export function pixelToCell(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  columns: number = GRID_COLUMNS,
  rowUnitPx: number = ROW_UNIT_PX,
  gapPx: number = GRID_GAP_PX
): Cell {
  const colWidth = (containerRect.width - gapPx * (columns - 1)) / columns;
  const relX = clientX - containerRect.left;
  const relY = clientY - containerRect.top;

  const x = Math.min(columns - 1, Math.max(0, Math.floor(relX / (colWidth + gapPx))));
  const y = Math.max(0, Math.floor(relY / (rowUnitPx + gapPx)));
  return { x, y };
}

/**
 * Finds the index (relative to the array with the dragged node removed —
 * i.e. the same array shape the caller is about to splice into) at which
 * the dragged node should be inserted, based on which row is closest to the
 * pointer and where the pointer falls horizontally within that row.
 *
 * Previous implementation bug: it returned indices from `nodes.forEach`
 * (the *original* array, which still includes the dragged node's own slot)
 * while the caller spliced into a *filtered* array with the dragged node
 * removed. Whenever the dragged node's original position was before the
 * drop target, every subsequent index was off by one. It also applied
 * row-boundary corrections unconditionally to every node in the loop
 * instead of only the nearest one, which could override a correct
 * candidate with an unrelated distant node's index.
 */
export function findInsertionIndex(
  nodes: FormComponentNode[],
  layout: PackedLayout,
  pointerCell: Cell,
  activeId: string
): number {
  const others = nodes
    .filter((node) => node.id !== activeId)
    .map((node, position) => ({ node, position, rect: layout.positions.get(node.id) }))
    .filter(
      (entry): entry is { node: FormComponentNode; position: number; rect: GridRect } => !!entry.rect
    );

  if (others.length === 0) return 0;

  // 1. Find the row whose vertical center is closest to the pointer.
  let closestRowY = others[0].rect.y;
  let closestRowDist = Infinity;
  for (const { rect } of others) {
    const rowCenter = rect.y + rect.h / 2;
    const dist = Math.abs(rowCenter - (pointerCell.y + 0.5));
    if (dist < closestRowDist) {
      closestRowDist = dist;
      closestRowY = rect.y;
    }
  }

  // 2. Within that row, walk left-to-right and insert before the first
  //    item whose horizontal center is to the right of the pointer.
  const rowEntries = others
    .filter((e) => e.rect.y === closestRowY)
    .sort((a, b) => a.rect.x - b.rect.x);

  for (const entry of rowEntries) {
    const centerX = entry.rect.x + entry.rect.w / 2;
    if (pointerCell.x < centerX) return entry.position;
  }

  // Pointer is to the right of every item in this row: insert after the last one.
  return rowEntries[rowEntries.length - 1].position + 1;
}