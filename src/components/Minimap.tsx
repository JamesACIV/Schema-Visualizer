import React, { useCallback, useRef } from 'react';
import { Table, TablePosition } from '../types/schema';

interface MinimapProps {
  tables: Table[];
  positions: Record<string, TablePosition>;
  zoom: number;
  pan: { x: number; y: number };
  canvasBounds: { width: number; height: number };
  viewportSize: { width: number; height: number };
  onPanChange: (pan: { x: number; y: number }) => void;
}

const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 130;
const TABLE_WIDTH = 220;
const HEADER_HEIGHT = 36;
const COLUMN_HEIGHT = 24;

export const Minimap: React.FC<MinimapProps> = ({
  tables,
  positions,
  zoom,
  pan,
  canvasBounds,
  viewportSize,
  onPanChange
}) => {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  
  const scaleX = MINIMAP_WIDTH / Math.max(canvasBounds.width, viewportSize.width / zoom);
  const scaleY = MINIMAP_HEIGHT / Math.max(canvasBounds.height, viewportSize.height / zoom);
  const scale = Math.min(scaleX, scaleY, 1);
  
  const minimapWidth = Math.max(canvasBounds.width, viewportSize.width / zoom) * scale;
  const minimapHeight = Math.max(canvasBounds.height, viewportSize.height / zoom) * scale;
  
  const viewportX = -pan.x / zoom * scale;
  const viewportY = -pan.y / zoom * scale;
  const viewportWidth = viewportSize.width / zoom * scale;
  const viewportHeight = viewportSize.height / zoom * scale;
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updatePanFromMouse(e);
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    updatePanFromMouse(e);
  }, [isDragging]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const updatePanFromMouse = (e: React.MouseEvent) => {
    if (!minimapRef.current) return;
    
    const rect = minimapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const canvasX = x / scale;
    const canvasY = y / scale;
    
    const newPan = {
      x: -(canvasX - viewportSize.width / zoom / 2) * zoom,
      y: -(canvasY - viewportSize.height / zoom / 2) * zoom
    };
    
    onPanChange(newPan);
  };
  
  return (
    <div
      ref={minimapRef}
      className="fixed bottom-4 left-4 bg-dark-card border border-dark-border rounded-lg overflow-hidden z-50"
      style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background */}
      <div 
        className="absolute bg-dark-bg"
        style={{ width: minimapWidth, height: minimapHeight }}
      />
      
      {/* Table representations */}
      {tables.map(table => {
        const pos = positions[table.id];
        if (!pos) return null;
        
        const width = TABLE_WIDTH * scale;
        const height = (HEADER_HEIGHT + table.columns.length * COLUMN_HEIGHT) * scale;
        
        return (
          <div
            key={table.id}
            className="absolute bg-dark-border border border-dark-border"
            style={{
              left: pos.x * scale,
              top: pos.y * scale,
              width,
              height
            }}
          />
        );
      })}
      
      {/* Viewport rectangle */}
      <div
        className="absolute border border-accent-blue"
        style={{
          left: viewportX,
          top: viewportY,
          width: viewportWidth,
          height: viewportHeight
        }}
      />
    </div>
  );
};
