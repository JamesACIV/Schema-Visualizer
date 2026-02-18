import { useState, useCallback, useRef } from 'react';

interface ZoomPanState {
  zoom: number;
  pan: { x: number; y: number };
}

interface UseZoomPanReturn {
  zoom: number;
  pan: { x: number; y: number };
  handleZoom: (delta: number, mouseX: number, mouseY: number) => void;
  handlePan: (deltaX: number, deltaY: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
  canvasToScreen: (canvasX: number, canvasY: number) => { x: number; y: number };
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.0;

export function useZoomPan(containerRef: React.RefObject<HTMLElement | null>): UseZoomPanReturn {
  const [zoom, setZoomState] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const handleZoom = useCallback((delta: number, mouseX: number, mouseY: number) => {
    setZoomState(prevZoom => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prevZoom + delta));
      
      if (newZoom !== prevZoom) {
        // Zoom toward mouse pointer
        setPan(prevPan => ({
          x: mouseX - (mouseX - prevPan.x) * (newZoom / prevZoom),
          y: mouseY - (mouseY - prevPan.y) * (newZoom / prevZoom)
        }));
      }
      
      return newZoom;
    });
  }, []);
  
  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    setPan(prevPan => ({
      x: prevPan.x + deltaX,
      y: prevPan.y + deltaY
    }));
  }, []);
  
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    };
  }, [zoom, pan]);
  
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * zoom + pan.x,
      y: canvasY * zoom + pan.y
    };
  }, [zoom, pan]);
  
  return {
    zoom,
    pan,
    handleZoom,
    handlePan,
    setZoom: setZoomState,
    setPan,
    screenToCanvas,
    canvasToScreen
  };
}
