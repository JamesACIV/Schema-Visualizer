import React, { useState } from 'react';

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

const SAMPLE_SQL = `-- Airbnb Maintenance Schema
CREATE TABLE contacts (
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

const SAMPLE_JSON = JSON.stringify({
  tables: [
    {
      name: "users",
      columns: [
        { name: "id", type: "uuid", primaryKey: true },
        { name: "username", type: "text" },
        { name: "email", type: "text" },
        { name: "created_at", type: "timestamp" }
      ]
    },
    {
      name: "posts",
      columns: [
        { name: "id", type: "uuid", primaryKey: true },
        { name: "user_id", type: "uuid", foreignKey: { table: "users", column: "id" } },
        { name: "title", type: "text" },
        { name: "content", type: "text" },
        { name: "published", type: "boolean" },
        { name: "created_at", type: "timestamp" }
      ]
    }
  ]
}, null, 2);

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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
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
        <div className="fixed top-16 left-4 z-50 w-80 max-w-[calc(100vw-2rem)] bg-dark-card border border-dark-border rounded-lg shadow-xl">
          <div className="p-4">
            <h2 className="text-dark-text font-semibold mb-4">Schema Input</h2>
            
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
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
            
            {/* Text Area */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputMode === 'sql' ? 'Enter CREATE TABLE statements...' : 'Enter JSON schema...'}
              className="w-full h-64 bg-dark-bg border border-dark-border rounded p-3 text-dark-text text-sm font-mono resize-none focus:outline-none focus:border-accent-blue"
            />
            
            {/* Error Message */}
            {error && (
              <div className="mt-3 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-sm">
                {error}
              </div>
            )}
            
            {/* Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleParse}
                className="flex-1 bg-accent-blue hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
              >
                Parse & Render
              </button>
              <button
                onClick={loadSample}
                className="bg-dark-border hover:bg-dark-border/80 text-dark-text py-2 px-4 rounded transition-colors"
              >
                Load Sample
              </button>
            </div>
            
            {/* Import/Export */}
            <div className="flex gap-2 mt-3">
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
        </div>
      )}
    </>
  );
};
