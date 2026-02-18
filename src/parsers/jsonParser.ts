import { Table, Column, Relationship, Schema } from '../types/schema';

export interface JSONParseResult {
  schema: Schema;
  error?: string;
}

export interface JSONSchemaFormat {
  tables: {
    name: string;
    columns: {
      name: string;
      type: string;
      primaryKey?: boolean;
      foreignKey?: {
        table: string;
        column: string;
      };
      nullable?: boolean;
    }[];
  }[];
}

export function parseJSONSchema(json: string): JSONParseResult {
  try {
    const data: JSONSchemaFormat = JSON.parse(json);
    
    if (!data.tables || !Array.isArray(data.tables)) {
      return { schema: { tables: [], relationships: [] }, error: 'Invalid JSON: missing tables array' };
    }
    
    const tables: Table[] = [];
    const relationships: Relationship[] = [];
    
    for (const tableData of data.tables) {
      const table: Table = {
        id: tableData.name.toLowerCase(),
        name: tableData.name,
        columns: []
      };
      
      for (const colData of tableData.columns) {
        const column: Column = {
          name: colData.name,
          type: colData.type,
          isPrimaryKey: colData.primaryKey || false,
          isForeignKey: !!colData.foreignKey,
          isNullable: colData.nullable !== false
        };
        
        if (colData.foreignKey) {
          column.references = {
            table: colData.foreignKey.table,
            column: colData.foreignKey.column
          };
          
          relationships.push({
            id: `${tableData.name}_${colData.name}_${colData.foreignKey.table}_${colData.foreignKey.column}`,
            fromTable: tableData.name,
            fromColumn: colData.name,
            toTable: colData.foreignKey.table,
            toColumn: colData.foreignKey.column
          });
        }
        
        table.columns.push(column);
      }
      
      tables.push(table);
    }
    
    return { schema: { tables, relationships } };
  } catch (err) {
    return { 
      schema: { tables: [], relationships: [] }, 
      error: `JSON parse error: ${err instanceof Error ? err.message : 'Invalid JSON'}` 
    };
  }
}
