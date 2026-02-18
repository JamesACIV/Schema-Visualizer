export type ColumnType = 'int4' | 'text' | 'uuid' | 'float4' | 'boolean' | 'timestamp' | string;

export interface Column {
  name: string;
  type: ColumnType;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface Table {
  id: string;
  name: string;
  columns: Column[];
}

export interface Relationship {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export interface TablePosition {
  x: number;
  y: number;
}

export interface Schema {
  tables: Table[];
  relationships: Relationship[];
}

export interface DiagramState {
  schema: Schema;
  positions: Record<string, TablePosition>;
  zoom: number;
  pan: { x: number; y: number };
  selectedTableId: string | null;
}

export interface ExportData {
  version: string;
  schema: Schema;
  positions: Record<string, TablePosition>;
  viewState: {
    zoom: number;
    pan: { x: number; y: number };
  };
}
