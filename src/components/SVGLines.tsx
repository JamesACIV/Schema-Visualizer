import React, { useMemo } from 'react';
import { Relationship, Table, TablePosition } from '../types/schema';
import { findPath, smoothPath, generateSVGPath, Point, Rect } from '../utils/pathfinding';

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
const EDGE_BUFFER = 12;

export const SVGLines: React.FC<SVGLinesProps> = ({
  relationships,
  tables,
  positions,
  canvasBounds
}) => {
  const lines = useMemo(() => {
    return relationships.map(rel => {
      const fromTable = tables.find(t => t.id === rel.fromTable.toLowerCase());
      const toTable = tables.find(t => t.id === rel.toTable.toLowerCase());
      
      if (!fromTable || !toTable) return null;
      
      const fromPos = positions[fromTable.id];
      const toPos = positions[toTable.id];
      
      if (!fromPos || !toPos) return null;
      
      // Find column indices
      const fromColIndex = fromTable.columns.findIndex(
        c => c.name.toLowerCase() === rel.fromColumn.toLowerCase()
      );
      const toColIndex = toTable.columns.findIndex(
        c => c.name.toLowerCase() === rel.toColumn.toLowerCase()
      );
      
      if (fromColIndex === -1 || toColIndex === -1) return null;
      
      // Calculate connection points with buffer so lines don't connect flush to table edges
      const fromPoint: Point = {
        x: fromPos.x + TABLE_WIDTH + EDGE_BUFFER,
        y: fromPos.y + HEADER_HEIGHT + fromColIndex * COLUMN_HEIGHT + COLUMN_HEIGHT / 2
      };

      const toPoint: Point = {
        x: toPos.x - EDGE_BUFFER,
        y: toPos.y + HEADER_HEIGHT + toColIndex * COLUMN_HEIGHT + COLUMN_HEIGHT / 2
      };
      
      // Create obstacle list (all tables except source and target)
      const obstacles: Rect[] = tables
        .filter(t => t.id !== fromTable.id && t.id !== toTable.id)
        .map(t => ({
          x: positions[t.id]?.x || 0,
          y: positions[t.id]?.y || 0,
          width: TABLE_WIDTH,
          height: HEADER_HEIGHT + t.columns.length * COLUMN_HEIGHT
        }));
      
      // Find path using A*
      const pathPoints = findPath(fromPoint, toPoint, obstacles, canvasBounds);
      const smoothedPath = smoothPath(pathPoints);
      
      // Ensure path ends exactly at the target point
      if (smoothedPath.length > 0) {
        smoothedPath[smoothedPath.length - 1] = { ...toPoint };
      }
      
      const svgPath = generateSVGPath(smoothedPath);
      
      // Calculate arrow angle based on last segment
      let arrowAngle = 0;
      if (smoothedPath.length >= 2) {
        const lastPoint = smoothedPath[smoothedPath.length - 1];
        const prevPoint = smoothedPath[smoothedPath.length - 2];
        arrowAngle = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x) * 180 / Math.PI;
      }
      
      return {
        id: rel.id,
        path: svgPath,
        fromX: fromPoint.x,
        fromY: fromPoint.y,
        toX: toPoint.x,
        toY: toPoint.y,
        arrowAngle
      };
    }).filter(Boolean);
  }, [relationships, tables, positions, canvasBounds]);
  
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: canvasBounds.width,
        height: canvasBounds.height,
      }}
    >
      {lines.map(line => line && (
        <g key={line.id}>
          {/* Main path - dashed style */}
          <path
            d={line.path}
            fill="none"
            stroke="#3f3f46"
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />
          
          {/* Arrow at the end */}
          <g transform={`translate(${line.toX}, ${line.toY}) rotate(${line.arrowAngle})`}>
            <polygon
              points="0,0 -6,-3 -6,3"
              fill="#3f3f46"
            />
          </g>
        </g>
      ))}
    </svg>
  );
};
