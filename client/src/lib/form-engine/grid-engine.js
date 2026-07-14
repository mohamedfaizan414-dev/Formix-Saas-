export const GRID_COLUMNS = 12;
export const ROW_UNIT_PX = 90;
export const GRID_GAP_PX = 16;

export const WIDTH_TO_SPAN = {
  full: 12,
  "three-quarters": 9,
  "two-thirds": 8,
  half: 6,
  third: 4,
  quarter: 3,
  fifth: 2,
  sixth: 2,
};

export const SPAN_TO_WIDTH = {
  12: "full",
  9: "three-quarters",
  8: "two-thirds",
  6: "half",
  4: "third",
  3: "quarter",
  2: "sixth",
};

export const SNAP_SPANS = [2, 3, 4, 6, 8, 9, 12];

export function spanForNode(node) {
  const preset = node.display?.width || "full";
  return Math.min(GRID_COLUMNS, WIDTH_TO_SPAN[preset] ?? GRID_COLUMNS);
}

function heightForNode(node) {
  const hinted = node.meta?.rowSpan;
  return Math.max(1, Math.round(hinted ?? 1));
}

export function packGrid(nodes, columns = GRID_COLUMNS) {
  const colHeights = new Array(columns).fill(0);
  const positions = new Map();

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

export function rectToGridStyle(rect) {
  return {
    gridColumn: `${rect.x + 1} / span ${rect.w}`,
    gridRow: `${rect.y + 1} / span ${rect.h}`,
  };
}

export function pixelToCell(
  clientX,
  clientY,
  containerRect,
  columns = GRID_COLUMNS,
  rowUnitPx = ROW_UNIT_PX,
  gapPx = GRID_GAP_PX
) {
  const colWidth = (containerRect.width - gapPx * (columns - 1)) / columns;
  const relX = clientX - containerRect.left;
  const relY = clientY - containerRect.top;

  const x = Math.min(columns - 1, Math.max(0, Math.floor(relX / (colWidth + gapPx))));
  const y = Math.max(0, Math.floor(relY / (rowUnitPx + gapPx)));
  return { x, y };
}

export function findInsertionIndex(
  nodes,
  layout,
  pointerCell,
  activeId
) {
  const others = nodes
    .filter((node) => node.id !== activeId)
    .map((node, position) => ({ node, position, rect: layout.positions.get(node.id) }))
    .filter(
      (entry) => !!entry.rect
    );

  if (others.length === 0) return 0;

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

  const rowEntries = others
    .filter((e) => e.rect.y === closestRowY)
    .sort((a, b) => a.rect.x - b.rect.x);

  for (const entry of rowEntries) {
    const centerX = entry.rect.x + entry.rect.w / 2;
    if (pointerCell.x < centerX) return entry.position;
  }

  return rowEntries[rowEntries.length - 1].position + 1;
}
