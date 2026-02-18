import React from 'react';
import { Table } from '../types/schema';

interface TableDetailsProps {
  table: Table | null;
  onClose: () => void;
}

export const TableDetails: React.FC<TableDetailsProps> = ({ table, onClose }) => {
  if (!table) {
    return (
      <div className="fixed top-4 right-4 w-72 bg-dark-card border border-dark-border rounded-lg z-40">
        <div className="p-4">
          <h2 className="text-dark-text text-sm font-medium mb-2">Table Details</h2>
          <p className="text-dark-muted text-xs">Click on a table to view details</p>
        </div>
      </div>
    );
  }
  
  const generateSQL = (): string => {
    const lines: string[] = [];
    lines.push(`CREATE TABLE ${table.name} (`);
    
    const columnDefs = table.columns.map(col => {
      let def = `    ${col.name} ${col.type}`;
      if (col.isPrimaryKey) {
        def += ' PRIMARY KEY';
      }
      if (!col.isNullable && !col.isPrimaryKey) {
        def += ' NOT NULL';
      }
      if (col.isForeignKey && col.references) {
        def += ` REFERENCES ${col.references.table}(${col.references.column})`;
      }
      return def;
    });
    
    lines.push(columnDefs.join(',\n'));
    lines.push(');');
    
    return lines.join('\n');
  };
  
  const getIcon = (col: Table['columns'][0]) => {
    if (col.isPrimaryKey) {
      return <DiamondIcon className="text-dark-muted" />;
    }
    if (col.isForeignKey) {
      return <DiamondIcon className="text-accent-purple" />;
    }
    return <CircleIcon />;
  };
  
  return (
    <div className="fixed top-4 right-4 w-72 bg-dark-card border border-dark-border rounded-lg z-40 max-h-[calc(100vh-32px)] overflow-y-auto">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-dark-text text-sm font-medium">{table.name}</h2>
          <button
            onClick={onClose}
            className="text-dark-muted hover:text-dark-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Column List */}
        <div className="mb-4">
          <h3 className="text-dark-muted text-[10px] uppercase tracking-wider mb-2">Columns</h3>
          <div className="space-y-1">
            {table.columns.map(col => (
              <div key={col.name} className="flex items-center gap-2 py-1">
                {getIcon(col)}
                <span className="text-dark-text text-xs flex-1">{col.name}</span>
                <span className="text-dark-muted text-[10px] uppercase">{col.type}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* SQL Preview */}
        <div>
          <h3 className="text-dark-muted text-[10px] uppercase tracking-wider mb-2">SQL</h3>
          <pre className="bg-dark-bg border border-dark-border rounded p-2 text-[10px] text-dark-text font-mono overflow-x-auto whitespace-pre-wrap">
            {generateSQL()}
          </pre>
        </div>
      </div>
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
