import React, { useMemo } from 'react';
import { Relationship, Table, TablePosition } from '../types/schema';

interface SVGLinesProps {
  relationships: Relationship[];
  tables: Table[];
  positions: Record<string, TablePosition>;
  zoom: number;
  pan: { x: number; y: number };
  canvasBounds: { width: number; height: number };
}

const HEADER_HEIGHT = 36;
const COLUMN_HEIGHT = 24;
const TABLE_WIDTH = 220;
const CORNER_RADIUS = 10;

/**
 * Generates an orthogonal (H → V → H) SVG path between two points.
 * Lines exit and enter horizontally so they always arrive straight into the column row.
 */
function orthogonalPath(
  fx: number, fy: number,
  tx: number, ty: number,
  exitRight: boolean
): string {
  // Straight horizontal line — same row
  if (Math.abs(ty - fy) < 1) {
    return `M ${fx} ${fy} H ${tx}`;
  }

  const mx = (fx + tx) / 2;
  const dySign = ty > fy ? 1 : -1;

  // Clamp radius so it never exceeds half the available horizontal or vertical space
  const r = Math.min(
    CORNER_RADIUS,
    Math.abs(ty - fy) / 2,
    Math.abs(mx - fx)
  );

  if (exitRight) {
    // Exit right, enter left
    return [
      `M ${fx} ${fy}`,
      `H ${mx - r}`,
      `Q ${mx} ${fy} ${mx} ${fy + r * dySign}`,
      `V ${ty - r * dySign}`,
      `Q ${mx} ${ty} ${mx + r} ${ty}`,
      `H ${tx}`,
    ].join(' ');
  } else {
    // Exit left, enter right
    return [
      `M ${fx} ${fy}`,
      `H ${mx + r}`,
      `Q ${mx} ${fy} ${mx} ${fy + r * dySign}`,
      `V ${ty - r * dySign}`,
      `Q ${mx} ${ty} ${mx - r} ${ty}`,
      `H ${tx}`,
    ].join(' ');
  }
}

export const SVGLines: React.FC<SVGLinesProps> = ({
  relationships,
  tables,
  positions,
  canvasBounds
}) => {
  const lines = useMemo(() => {
    return relationships.map(rel => {
      const fromTable = tables.find(t => t.id === rel.fromTable.toLowerCase());
      const toTable   = tables.find(t => t.id === rel.toTable.toLowerCase());

      if (!fromTable || !toTable) return null;

      const fromPos = positions[fromTable.id];
      const toPos   = positions[toTable.id];

      if (!fromPos || !toPos) return null;

      const fromColIndex = fromTable.columns.findIndex(
        c => c.name.toLowerCase() === rel.fromColumn.toLowerCase()
      );
      const toColIndex = toTable.columns.findIndex(
        c => c.name.toLowerCase() === rel.toColumn.toLowerCase()
      );

      if (fromColIndex === -1 || toColIndex === -1) return null;

      // Y centre of each column row
      const fromY = fromPos.y + HEADER_HEIGHT + fromColIndex * COLUMN_HEIGHT + COLUMN_HEIGHT / 2;
      const toY   = toPos.y   + HEADER_HEIGHT + toColIndex   * COLUMN_HEIGHT + COLUMN_HEIGHT / 2;

      // Pick the side (left/right) that results in the shorter horizontal run
      const fromCenterX = fromPos.x + TABLE_WIDTH / 2;
      const toCenterX   = toPos.x   + TABLE_WIDTH / 2;
      const exitRight   = toCenterX >= fromCenterX;

      // Connect directly to the table edge — no floating buffer
      const fx = exitRight ? fromPos.x + TABLE_WIDTH : fromPos.x;
      const tx = exitRight ? toPos.x                 : toPos.x + TABLE_WIDTH;

      const pathD      = orthogonalPath(fx, fromY, tx, toY, exitRight);
      const arrowAngle = exitRight ? 0 : 180;

      return { id: rel.id, pathD, tx, toY, arrowAngle };
    }).filter(Boolean);
  }, [relationships, tables, positions]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: canvasBounds.width, height: canvasBounds.height }}
    >
      <defs>
        {/* Reusable arrowhead markers — one per direction */}
        <marker id="arrow-right" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="0">
          <polygon points="0,0 6,3 0,6" fill="#71717a" />
        </marker>
        <marker id="arrow-left" markerWidth="8" markerHeight="8" refX="0" refY="3" orient="180">
          <polygon points="6,0 0,3 6,6" fill="#71717a" />
        </marker>
      </defs>

      {lines.map(line => line && (
        <g key={line.id}>
          <path
            d={line.pathD}
            fill="none"
            stroke="#71717a"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            markerEnd={line.arrowAngle === 0 ? 'url(#arrow-right)' : 'url(#arrow-left)'}
          />
        </g>
      ))}
    </svg>
  );
};
