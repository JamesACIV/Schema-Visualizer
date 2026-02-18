import React, { useState, useRef, useEffect } from 'react';

interface InputPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onParseSQL: (sql: string) => void;
  onParseJSON: (json: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  error: string | null;
  onClearError: () => void;
}

const SAMPLE_SQL = `-- E-Commerce Schema
CREATE TABLE customers (
    id int4 PRIMARY KEY,
    email text,
    first_name text,
    last_name text,
    phone text,
    created_at timestamp
);

CREATE TABLE products (
    id int4 PRIMARY KEY,
    name text,
    description text,
    price float4,
    stock_qty int4,
    category_id int4 REFERENCES categories(id)
);

CREATE TABLE categories (
    id int4 PRIMARY KEY,
    name text,
    parent_id int4
);

CREATE TABLE orders (
    id int4 PRIMARY KEY,
    customer_id int4 REFERENCES customers(id),
    status text,
    total float4,
    created_at timestamp
);

CREATE TABLE order_items (
    id int4 PRIMARY KEY,
    order_id int4 REFERENCES orders(id),
    product_id int4 REFERENCES products(id),
    quantity int4,
    unit_price float4
);

CREATE TABLE reviews (
    id int4 PRIMARY KEY,
    product_id int4 REFERENCES products(id),
    customer_id int4 REFERENCES customers(id),
    rating int4,
    body text,
    created_at timestamp
);`;

const SAMPLE_JSON = JSON.stringify({
  tables: [
    {
      name: "customers",
      columns: [
        { name: "id", type: "int4", primaryKey: true },
        { name: "email", type: "text" },
        { name: "first_name", type: "text" },
        { name: "last_name", type: "text" },
        { name: "created_at", type: "timestamp" }
      ]
    },
    {
      name: "products",
      columns: [
        { name: "id", type: "int4", primaryKey: true },
        { name: "name", type: "text" },
        { name: "price", type: "float4" },
        { name: "stock_qty", type: "int4" },
        { name: "category_id", type: "int4", foreignKey: { table: "categories", column: "id" } }
      ]
    },
    {
      name: "categories",
      columns: [
        { name: "id", type: "int4", primaryKey: true },
        { name: "name", type: "text" }
      ]
    },
    {
      name: "orders",
      columns: [
        { name: "id", type: "int4", primaryKey: true },
        { name: "customer_id", type: "int4", foreignKey: { table: "customers", column: "id" } },
        { name: "status", type: "text" },
        { name: "total", type: "float4" },
        { name: "created_at", type: "timestamp" }
      ]
    },
    {
      name: "order_items",
      columns: [
        { name: "id", type: "int4", primaryKey: true },
        { name: "order_id", type: "int4", foreignKey: { table: "orders", column: "id" } },
        { name: "product_id", type: "int4", foreignKey: { table: "products", column: "id" } },
        { name: "quantity", type: "int4" },
        { name: "unit_price", type: "float4" }
      ]
    }
  ]
}, null, 2);

const MIN_WIDTH = 280;
const MIN_HEIGHT = 300;
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 480;

export const InputPanel: React.FC<InputPanelProps> = ({
  isOpen,
  onToggle,
  onParseSQL,
  onParseJSON,
  onExport,
  onImport,
  error,
  onClearError
}) => {
  const [input, setInput] = useState('');
  const [inputMode, setInputMode] = useState<'sql' | 'json'>('sql');
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    dir: 'e' | 's' | 'se';
  } | null>(null);

  // Auto-focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const startResize = (e: React.MouseEvent, dir: 'e' | 's' | 'se') => {
    e.preventDefault();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
      dir,
    };

    const onMouseMove = (ev: MouseEvent) => {
      const r = resizeRef.current;
      if (!r) return;
      const dx = ev.clientX - r.startX;
      const dy = ev.clientY - r.startY;
      setSize({
        width:  r.dir !== 's' ? Math.max(MIN_WIDTH,  r.startW + dx) : r.startW,
        height: r.dir !== 'e' ? Math.max(MIN_HEIGHT, r.startH + dy) : r.startH,
      });
    };

    const onMouseUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  
  const handleParse = () => {
    onClearError();
    if (inputMode === 'sql') {
      onParseSQL(input);
    } else {
      onParseJSON(input);
    }
  };
  
  const loadSample = () => {
    setInput(inputMode === 'sql' ? SAMPLE_SQL : SAMPLE_JSON);
    onClearError();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter → parse
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleParse();
      return;
    }

    // Tab → insert 2 spaces at cursor
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const spaces = '  ';

      if (e.shiftKey) {
        // Shift+Tab → remove up to 2 leading spaces on the current line
        const lineStart = input.lastIndexOf('\n', start - 1) + 1;
        const before = input.slice(lineStart, start);
        const trimmed = before.replace(/^ {1,2}/, '');
        const removed = before.length - trimmed.length;
        if (removed > 0) {
          const next = input.slice(0, lineStart) + trimmed + input.slice(start);
          setInput(next);
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start - removed;
          });
        }
      } else {
        // Tab → insert 2 spaces
        const next = input.slice(0, start) + spaces + input.slice(end);
        setInput(next);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + spaces.length;
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
    e.target.value = '';
  };
  
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-[60] bg-dark-card border border-dark-border text-dark-text px-4 py-2 rounded-lg shadow-lg hover:bg-dark-border transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {isOpen ? 'Close Panel' : 'Open Panel'}
      </button>
      
      {/* Panel */}
      {isOpen && (
        <div
          className="fixed top-16 left-4 z-50 bg-dark-card border border-dark-border rounded-lg shadow-xl flex flex-col overflow-hidden"
          style={{ width: size.width, height: size.height }}
        >
          {/* Scrollable content */}
          <div className="flex flex-col flex-1 min-h-0 p-4">
            <h2 className="text-dark-text font-semibold mb-4 shrink-0">Schema Input</h2>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4 shrink-0">
              <button
                onClick={() => setInputMode('sql')}
                className={`flex-1 py-2 px-4 rounded transition-colors ${
                  inputMode === 'sql'
                    ? 'bg-accent-blue text-white'
                    : 'bg-dark-border text-dark-text hover:bg-dark-border/80'
                }`}
              >
                SQL
              </button>
              <button
                onClick={() => setInputMode('json')}
                className={`flex-1 py-2 px-4 rounded transition-colors ${
                  inputMode === 'json'
                    ? 'bg-accent-blue text-white'
                    : 'bg-dark-border text-dark-text hover:bg-dark-border/80'
                }`}
              >
                JSON
              </button>
            </div>

            {/* Text Area — grows to fill remaining space */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputMode === 'sql' ? 'Enter CREATE TABLE statements...' : 'Enter JSON schema...'}
              className="flex-1 min-h-0 w-full bg-dark-bg border border-dark-border rounded p-3 text-dark-text text-sm font-mono resize-none focus:outline-none focus:border-accent-blue"
            />

            {/* Error Message */}
            {error && (
              <div className="mt-3 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-sm shrink-0">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 mt-4 shrink-0">
              <button
                onClick={handleParse}
                className="flex-1 bg-accent-blue hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
              >
                Parse & Render
                <span className="text-blue-200 text-[10px] font-mono opacity-70">⌃↵</span>
              </button>
              <button
                onClick={loadSample}
                className="bg-dark-border hover:bg-dark-border/80 text-dark-text py-2 px-4 rounded transition-colors"
              >
                Load Sample
              </button>
            </div>

            {/* Import/Export */}
            <div className="flex gap-2 mt-3 shrink-0">
              <button
                onClick={onExport}
                className="flex-1 bg-dark-border hover:bg-dark-border/80 text-dark-text py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-dark-border hover:bg-dark-border/80 text-dark-text py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Right edge — resize width */}
          <div
            className="absolute top-0 right-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-accent-blue/40 transition-colors"
            onMouseDown={(e) => startResize(e, 'e')}
          />

          {/* Bottom edge — resize height */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-accent-blue/40 transition-colors"
            onMouseDown={(e) => startResize(e, 's')}
          />

          {/* Bottom-right corner — resize both */}
          <div
            className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize flex items-center justify-center"
            onMouseDown={(e) => startResize(e, 'se')}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" className="text-dark-muted">
              <path d="M1 7 L7 1 M4 7 L7 4 M7 7 L7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}
    </>
  );
};
