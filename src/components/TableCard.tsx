import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Table, Column, TablePosition } from '../types/schema';

interface TableCardProps {
  table: Table;
  position: TablePosition;
  isSelected: boolean;
  zoom: number;
  onPositionChange: (id: string, pos: TablePosition) => void;
  onSelect: (id: string) => void;
}

const COLUMN_HEIGHT = 24;
const HEADER_HEIGHT = 36;

export const TableCard: React.FC<TableCardProps> = ({
  table,
  position,
  isSelected,
  zoom,
  onPositionChange,
  onSelect
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const tableStartPos = useRef({ x: 0, y: 0 });
  // Keep a ref to zoom so the window mousemove handler always sees the current value
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(table.id);

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    tableStartPos.current = { x: position.x, y: position.y };
    setIsDragging(true);
  }, [table.id, position, onSelect]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragStartPos.current.x) / zoomRef.current;
      const deltaY = (e.clientY - dragStartPos.current.y) / zoomRef.current;
      onPositionChange(table.id, {
        x: tableStartPos.current.x + deltaX,
        y: tableStartPos.current.y + deltaY,
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, table.id, onPositionChange]);

  const cardWidth = 220;

  return (
    <div
      className={`
        absolute bg-dark-card border rounded-lg overflow-hidden
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      `}
      style={{
        left: position.x,
        top: position.y,
        width: cardWidth,
        zIndex: isSelected ? 10 : 1,
        borderColor: isSelected ? '#3b82f6' : '#3f3f46',
        boxShadow: isSelected
          ? '0 0 0 2px #3b82f6, 0 0 20px 4px #3b82f650'
          : '0 0 0 1px #3f3f4640',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-dark-border bg-dark-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TableIcon />
          <h3 className="text-dark-text text-xs font-medium">{table.name}</h3>
        </div>
        <LinkIcon />
      </div>

      {/* Columns */}
      <div>
        {table.columns.map((column, index) => (
          <ColumnRow key={column.name} column={column} index={index} />
        ))}
      </div>
    </div>
  );
};

const TableIcon = () => (
  <svg className="w-3.5 h-3.5 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-3.5 h-3.5 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

interface ColumnRowProps {
  column: Column;
  index: number;
}

const ColumnRow: React.FC<ColumnRowProps> = ({ column, index }) => {
  const getIcon = () => {
    if (column.isPrimaryKey) {
      return <DiamondIcon className="text-dark-muted" />;
    }
    if (column.isForeignKey) {
      return <DiamondIcon className="text-accent-purple" />;
    }
    return <CircleIcon />;
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 hover:bg-dark-hover transition-colors"
      style={{ height: COLUMN_HEIGHT }}
      data-column={column.name}
    >
      {getIcon()}
      <span className="text-dark-text text-[11px] font-normal truncate flex-1">{column.name}</span>
      <span className="text-dark-muted text-[10px] uppercase tracking-wide">{column.type}</span>
    </div>
  );
};

const DiamondIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`w-2 h-2 ${className}`} fill="currentColor" viewBox="0 0 8 8">
    <path d="M4 0L8 4L4 8L0 4L4 0Z" />
  </svg>
);

const CircleIcon = () => (
  <svg className="w-1.5 h-1.5 text-dark-muted" fill="currentColor" viewBox="0 0 6 6">
    <circle cx="3" cy="3" r="3" />
  </svg>
);

export { COLUMN_HEIGHT, HEADER_HEIGHT };
