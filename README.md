# SQL Schema Visualizer

A powerful web application for visualizing SQL database schemas as interactive Entity-Relationship (ER) diagrams. Built with React, TypeScript, and Tailwind CSS.

## ✨ Features

### Core Functionality
- **🎨 Dark Theme** - Professional dark slate color scheme optimized for extended use
- **📊 Interactive Table Cards** - Drag and drop tables anywhere on the canvas
- **🔗 Smart Relationship Lines** - A* pathfinding algorithm creates orthogonal lines that avoid overlapping tables
- **🔍 Zoom & Pan** - Mouse wheel zooms toward cursor (25%-200%), left-click drag to pan
- **🗺️ Minimap Navigation** - Overview window in bottom-left with click/drag navigation
- **💾 Save & Load** - Export/import diagrams as JSON files
- **📋 SQL/JSON Input** - Parse CREATE TABLE statements or JSON schema definitions

### Visual Features
- **🔑 Primary Key Icons** - Key icon marks primary key columns
- **🔷 Foreign Key Icons** - Diamond icon marks foreign key columns  
- **● Regular Columns** - Dot icon for standard columns
- **📐 Smart Routing** - Lines route around tables using A* algorithm
- **📱 Responsive Design** - Works on various screen sizes

### Input Formats

#### SQL CREATE TABLE
```sql
CREATE TABLE users (
    id uuid PRIMARY KEY,
    username text NOT NULL,
    email text NOT NULL,
    created_at timestamp
);

CREATE TABLE posts (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES users(id),
    title text NOT NULL,
    content text,
    published boolean DEFAULT false,
    created_at timestamp
);
```

#### JSON Schema
```json
{
  "tables": [
    {
      "name": "users",
      "columns": [
        { "name": "id", "type": "uuid", "primaryKey": true },
        { "name": "username", "type": "text" },
        { "name": "email", "type": "text" }
      ]
    },
    {
      "name": "posts",
      "columns": [
        { "name": "id", "type": "uuid", "primaryKey": true },
        { "name": "user_id", "type": "uuid", "foreignKey": { "table": "users", "column": "id" } }
      ]
    }
  ]
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd sql-schema-visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

This creates a `dist` folder with production-ready files.

## 🎮 User Guide

### Controls

| Action | Control |
|--------|---------|
| **Pan Canvas** | Left-click and drag on empty space |
| **Zoom In/Out** | Mouse wheel (zooms toward cursor) |
| **Move Table** | Drag table header |
| **Select Table** | Click on table card |
| **Navigate via Minimap** | Click or drag on minimap |

### Interface Elements

1. **Input Panel** (Top-left)
   - Toggle with "Open/Close Panel" button
   - Switch between SQL and JSON input modes
   - Load sample schemas for testing
   - Parse button to render diagrams
   - Export/Import diagram files

2. **Table Details Sidebar** (Right side)
   - Shows selected table information
   - Displays column list with constraints
   - Shows reconstructed CREATE TABLE SQL

3. **Minimap** (Bottom-left)
   - Overview of entire diagram
   - Click to navigate to different areas
   - Shows viewport position

4. **Zoom Controls** (Bottom-right)
   - Plus/minus buttons for zoom
   - Current zoom percentage display
   - Click percentage to reset to 100%

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **State Management**: React hooks (useState, useCallback, useEffect)
- **Pathfinding**: Custom A* implementation for smart line routing

## 📁 Project Structure

```
sql-schema-visualizer/
├── src/
│   ├── components/
│   │   ├── TableCard.tsx       # Draggable table component
│   │   ├── SVGLines.tsx        # Relationship line rendering
│   │   ├── Minimap.tsx         # Overview minimap
│   │   ├── InputPanel.tsx      # SQL/JSON input UI
│   │   └── TableDetails.tsx    # Table info sidebar
│   ├── parsers/
│   │   ├── sqlParser.ts        # CREATE TABLE parser
│   │   └── jsonParser.ts       # JSON schema parser
│   ├── utils/
│   │   ├── pathfinding.ts      # A* routing algorithm
│   │   └── exportImport.ts     # Save/load functionality
│   ├── types/
│   │   └── schema.ts           # TypeScript interfaces
│   ├── hooks/
│   │   └── useZoomPan.ts       # Zoom/pan state management
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind imports + custom styles
├── public/
│   └── vite.svg               # Favicon
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

### Tailwind Theme Colors

```javascript
colors: {
  dark: {
    bg: '#0f172a',      // Background
    card: '#1e293b',    // Card background
    border: '#334155',  // Borders
    text: '#f1f5f9',    // Primary text
    muted: '#94a3b8',   // Secondary text
  },
  accent: {
    blue: '#3b82f6',    // Primary accent
    amber: '#fbbf24',   // Primary key
    purple: '#a855f7',  // Foreign key
    line: '#64748b',    // Relationship lines
  }
}
```

### Canvas Settings

```typescript
const CANVAS_WIDTH = 3000;    // Canvas width in pixels
const CANVAS_HEIGHT = 2000;   // Canvas height in pixels
const MIN_ZOOM = 0.25;        // Minimum zoom (25%)
const MAX_ZOOM = 2.0;         // Maximum zoom (200%)
const GRID_SIZE = 20;         // Grid size for pathfinding
```

## 📝 Supported Data Types

The visualizer recognizes and displays these SQL data types:

- `int4` / `int`
- `text` / `varchar`
- `uuid`
- `float4` / `float` / `real`
- `boolean` / `bool`
- `timestamp` / `datetime`
- Any custom type (displayed as-is)

## 🐛 Error Handling

Errors are displayed as toast notifications in the input panel:

- **Parse Errors** - Invalid SQL/JSON syntax
- **Missing Tables** - Referenced tables not found
- **Import Errors** - Corrupted or invalid JSON files

## 🎯 Future Enhancements

Potential improvements for future versions:

- [ ] Multiple relationship types (one-to-one, many-to-many)
- [ ] Custom table colors/themes
- [ ] Export to PNG/SVG
- [ ] Undo/redo functionality
- [ ] Collaboration features
- [ ] More SQL dialect support (MySQL, PostgreSQL specific syntax)
- [ ] Index visualization
- [ ] Table grouping/layers

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👨‍💻 Author

Built with ❤️ using React and TypeScript.

---

**Happy Schema Designing! 🎨**
