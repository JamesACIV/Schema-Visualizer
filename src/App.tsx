import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TableCard } from './components/TableCard';
import { SVGLines } from './components/SVGLines';
import { Minimap } from './components/Minimap';
import { InputPanel } from './components/InputPanel';
import { TableDetails } from './components/TableDetails';
import { parseSQL } from './parsers/sqlParser';
import { parseJSONSchema } from './parsers/jsonParser';
import { exportDiagram, importDiagram, downloadJSON, readFile } from './utils/exportImport';
import { Table, TablePosition, Schema } from './types/schema';

const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2000;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.0;

function App() {
  const [schema, setSchema] = useState<Schema>({ tables: [], relationships: [] });
  const [positions, setPositions] = useState<Record<string, TablePosition>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isInputPanelOpen, setIsInputPanelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const airbnbSchema = `CREATE TABLE contacts (
    id int4 PRIMARY KEY,
    name text,
    company text,
    phone text,
    email text,
    service_type text,
    user_id uuid REFERENCES auth.users(id)
);

CREATE TABLE properties (
    id int4 PRIMARY KEY,
    name text,
    address text,
    status text,
    user_id uuid REFERENCES auth.users(id)
);

CREATE TABLE tasks (
    id int4 PRIMARY KEY,
    property_id int4 REFERENCES properties(id),
    contact_id int4 REFERENCES contacts(id),
    description text,
    start_date text,
    end_date text,
    cost float4,
    payment_status text,
    completion_status text,
    recurring text,
    recurrence_interval text,
    notes text,
    user_id uuid REFERENCES auth.users(id)
);`;
    handleParseSQL(airbnbSchema);
    
    // Set initial positions to match the screenshot layout
    setTimeout(() => {
      setPositions({
        contacts: { x: 600, y: 100 },
        properties: { x: 900, y: 350 },
        tasks: { x: 350, y: 350 }
      });
    }, 100);
  }, []);
  
  const handleParseSQL = useCallback((sql: string) => {
    const result = parseSQL(sql);
    if (result.error) {
      setError(result.error);
      return;
    }
    
    setSchema({ tables: result.tables, relationships: result.relationships });
    
    const newPositions: Record<string, TablePosition> = {};
    const cols = Math.ceil(Math.sqrt(result.tables.length));
    result.tables.forEach((table, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      newPositions[table.id] = {
        x: 100 + col * 320,
        y: 100 + row * 250
      };
    });
    
    setPositions(newPositions);
    setError(null);
    setSelectedTableId(null);
  }, []);
  
  const handleParseJSON = useCallback((json: string) => {
    const result = parseJSONSchema(json);
    if (result.error) {
      setError(result.error);
      return;
    }
    
    setSchema(result.schema);
    
    const newPositions: Record<string, TablePosition> = {};
    const cols = Math.ceil(Math.sqrt(result.schema.tables.length));
    result.schema.tables.forEach((table, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      newPositions[table.id] = {
        x: 100 + col * 320,
        y: 100 + row * 250
      };
    });
    
    setPositions(newPositions);
    setError(null);
    setSelectedTableId(null);
  }, []);
  
  const handlePositionChange = useCallback((id: string, pos: TablePosition) => {
    setPositions(prev => ({ ...prev, [id]: pos }));
  }, []);
  
  const handleExport = useCallback(() => {
    const data = exportDiagram({
      schema,
      positions,
      zoom,
      pan,
      selectedTableId
    });
    downloadJSON(data, 'schema-diagram.json');
  }, [schema, positions, zoom, pan, selectedTableId]);
  
  const handleImport = useCallback(async (file: File) => {
    try {
      const content = await readFile(file);
      const result = importDiagram(content);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (result.data) {
        setSchema(result.data.schema);
        setPositions(result.data.positions);
        setZoom(result.data.viewState.zoom);
        setPan(result.data.viewState.pan);
        setError(null);
        setSelectedTableId(null);
      }
    } catch (err) {
      setError('Failed to import file');
    }
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    
    if (newZoom !== zoom && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setPan({
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
      });
      setZoom(newZoom);
    }
  }, [zoom, pan]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);
  
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);
  
  const selectedTable = selectedTableId 
    ? schema.tables.find(t => t.id === selectedTableId) || null
    : null;
  
  return (
    <div className="h-screen w-screen bg-dark-bg overflow-hidden relative">
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={canvasRef}
          className="absolute"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
          data-canvas="true"
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
          
          <SVGLines
            relationships={schema.relationships}
            tables={schema.tables}
            positions={positions}
            zoom={zoom}
            pan={pan}
            canvasBounds={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          />
          
          {schema.tables.map(table => (
            <TableCard
              key={table.id}
              table={table}
              position={positions[table.id] || { x: 0, y: 0 }}
              isSelected={table.id === selectedTableId}
              zoom={zoom}
              onPositionChange={handlePositionChange}
              onSelect={setSelectedTableId}
            />
          ))}
        </div>
      </div>
      
      <InputPanel
        isOpen={isInputPanelOpen}
        onToggle={() => setIsInputPanelOpen(!isInputPanelOpen)}
        onParseSQL={handleParseSQL}
        onParseJSON={handleParseJSON}
        onExport={handleExport}
        onImport={handleImport}
        error={error}
        onClearError={() => setError(null)}
      />
      
      <TableDetails
        table={selectedTable}
        onClose={() => setSelectedTableId(null)}
      />
      
      <Minimap
        tables={schema.tables}
        positions={positions}
        zoom={zoom}
        pan={pan}
        canvasBounds={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        viewportSize={{ 
          width: containerRef.current?.clientWidth || window.innerWidth,
          height: containerRef.current?.clientHeight || window.innerHeight
        }}
        onPanChange={setPan}
      />
      
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        <button
          onClick={() => setZoom(Math.min(MAX_ZOOM, zoom + 0.25))}
          className="w-10 h-10 bg-dark-card border border-dark-border text-dark-text rounded-lg shadow-lg hover:bg-dark-border transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={() => setZoom(Math.max(MIN_ZOOM, zoom - 0.25))}
          className="w-10 h-10 bg-dark-card border border-dark-border text-dark-text rounded-lg shadow-lg hover:bg-dark-border transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="w-10 h-10 bg-dark-card border border-dark-border text-dark-text rounded-lg shadow-lg hover:bg-dark-border transition-colors flex items-center justify-center text-xs font-mono"
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>
    </div>
  );
}

export default App;
