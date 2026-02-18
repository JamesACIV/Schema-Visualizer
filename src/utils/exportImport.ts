import { ExportData, DiagramState } from '../types/schema';

export function exportDiagram(state: DiagramState): string {
  const data: ExportData = {
    version: '1.0',
    schema: state.schema,
    positions: state.positions,
    viewState: {
      zoom: state.zoom,
      pan: state.pan
    }
  };
  
  return JSON.stringify(data, null, 2);
}

export function importDiagram(json: string): { data?: ExportData; error?: string } {
  try {
    const data: ExportData = JSON.parse(json);
    
    if (!data.version || !data.schema || !data.positions || !data.viewState) {
      return { error: 'Invalid export file format' };
    }
    
    return { data };
  } catch (err) {
    return { error: `Import error: ${err instanceof Error ? err.message : 'Invalid JSON'}` };
  }
}

export function downloadJSON(data: string, filename: string) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}
