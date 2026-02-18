import { Table, Column, Relationship } from '../types/schema';

export interface ParseResult {
  tables: Table[];
  relationships: Relationship[];
  error?: string;
}

export function parseSQL(sql: string): ParseResult {
  try {
    const tables: Table[] = [];
    const relationships: Relationship[] = [];
    
    // Remove comments and normalize whitespace
    const cleanedSQL = sql
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/--.*$/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Find all CREATE TABLE statements
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([^;]+)\);?/gi;
    let match;
    
    while ((match = createTableRegex.exec(cleanedSQL)) !== null) {
      const tableName = match[1];
      const columnsText = match[2];
      
      const table: Table = {
        id: tableName.toLowerCase(),
        name: tableName,
        columns: []
      };
      
      // Split columns by comma, but be careful about nested parentheses
      const columnDefs = splitColumns(columnsText);
      
      for (const colDef of columnDefs) {
        const trimmed = colDef.trim();
        if (!trimmed) continue;
        
        // Check for constraints
        if (trimmed.toUpperCase().startsWith('PRIMARY KEY')) {
          // Table-level primary key constraint
          const pkMatch = trimmed.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
          if (pkMatch) {
            const pkColumns = pkMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
            for (const pkCol of pkColumns) {
              const col = table.columns.find(c => c.name.toLowerCase() === pkCol.toLowerCase());
              if (col) col.isPrimaryKey = true;
            }
          }
          continue;
        }
        
        if (trimmed.toUpperCase().startsWith('FOREIGN KEY')) {
          // Table-level foreign key constraint
          const fkMatch = trimmed.match(/FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s*(\w+)\s*\((\w+)\)/i);
          if (fkMatch) {
            const [, fkColumn, refTable, refColumn] = fkMatch;
            const col = table.columns.find(c => c.name.toLowerCase() === fkColumn.toLowerCase());
            if (col) {
              col.isForeignKey = true;
              col.references = { table: refTable, column: refColumn };
            }
            relationships.push({
              id: `${tableName}_${fkColumn}_${refTable}_${refColumn}`,
              fromTable: tableName,
              fromColumn: fkColumn,
              toTable: refTable,
              toColumn: refColumn
            });
          }
          continue;
        }
        
        if (trimmed.toUpperCase().startsWith('CONSTRAINT')) {
          continue; // Skip named constraints for now
        }
        
        // Parse column definition
        const colMatch = trimmed.match(/^(\w+)\s+(\w+(?:\(\d+(?:,\s*\d+)?\))?)/i);
        if (colMatch) {
          const [, colName, colType] = colMatch;
          const upperDef = trimmed.toUpperCase();
          
          const column: Column = {
            name: colName,
            type: colType.toLowerCase(),
            isPrimaryKey: upperDef.includes('PRIMARY KEY'),
            isForeignKey: upperDef.includes('REFERENCES'),
            isNullable: !upperDef.includes('NOT NULL') && !upperDef.includes('PRIMARY KEY')
          };
          
          // Check for inline foreign key
          const fkRefMatch = trimmed.match(/REFERENCES\s+(\w+)\s*\((\w+)\)/i);
          if (fkRefMatch) {
            column.isForeignKey = true;
            column.references = {
              table: fkRefMatch[1],
              column: fkRefMatch[2]
            };
            relationships.push({
              id: `${tableName}_${colName}_${fkRefMatch[1]}_${fkRefMatch[2]}`,
              fromTable: tableName,
              fromColumn: colName,
              toTable: fkRefMatch[1],
              toColumn: fkRefMatch[2]
            });
          }
          
          table.columns.push(column);
        }
      }
      
      tables.push(table);
    }
    
    if (tables.length === 0) {
      return { tables: [], relationships: [], error: 'No CREATE TABLE statements found' };
    }
    
    return { tables, relationships };
  } catch (err) {
    return { 
      tables: [], 
      relationships: [], 
      error: `Parse error: ${err instanceof Error ? err.message : 'Unknown error'}` 
    };
  }
}

function splitColumns(columnsText: string): string[] {
  const columns: string[] = [];
  let current = '';
  let depth = 0;
  
  for (let i = 0; i < columnsText.length; i++) {
    const char = columnsText[i];
    
    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      columns.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    columns.push(current.trim());
  }
  
  return columns;
}
