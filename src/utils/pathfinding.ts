export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent?: Node;
}

const GRID_SIZE = 20;

export function findPath(
  start: Point,
  end: Point,
  obstacles: Rect[],
  canvasBounds: { width: number; height: number }
): Point[] {
  // Convert to grid coordinates
  const startNode = createNode(
    Math.round(start.x / GRID_SIZE) * GRID_SIZE,
    Math.round(start.y / GRID_SIZE) * GRID_SIZE
  );
  const endNode = createNode(
    Math.round(end.x / GRID_SIZE) * GRID_SIZE,
    Math.round(end.y / GRID_SIZE) * GRID_SIZE
  );
  
  const openList: Node[] = [startNode];
  const closedList: Set<string> = new Set();
  
  while (openList.length > 0) {
    // Get node with lowest f score
    let currentIndex = 0;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < openList[currentIndex].f) {
        currentIndex = i;
      }
    }
    
    const current = openList[currentIndex];
    
    // Check if we reached the goal
    if (Math.abs(current.x - endNode.x) < GRID_SIZE && Math.abs(current.y - endNode.y) < GRID_SIZE) {
      return reconstructPath(current);
    }
    
    openList.splice(currentIndex, 1);
    closedList.add(`${current.x},${current.y}`);
    
    // Get neighbors (4-directional)
    const neighbors = [
      { x: current.x + GRID_SIZE, y: current.y },
      { x: current.x - GRID_SIZE, y: current.y },
      { x: current.x, y: current.y + GRID_SIZE },
      { x: current.x, y: current.y - GRID_SIZE }
    ];
    
    for (const neighbor of neighbors) {
      const key = `${neighbor.x},${neighbor.y}`;
      
      if (closedList.has(key)) continue;
      if (isObstacle(neighbor.x, neighbor.y, obstacles)) continue;
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x > canvasBounds.width || neighbor.y > canvasBounds.height) continue;
      
      const g = current.g + GRID_SIZE;
      const h = Math.abs(neighbor.x - endNode.x) + Math.abs(neighbor.y - endNode.y);
      const f = g + h;
      
      const existingNode = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);
      
      if (!existingNode) {
        openList.push({
          ...neighbor,
          g,
          h,
          f,
          parent: current
        });
      } else if (g < existingNode.g) {
        existingNode.g = g;
        existingNode.f = f;
        existingNode.parent = current;
      }
    }
  }
  
  // If no path found, return direct line
  return [start, end];
}

function createNode(x: number, y: number): Node {
  return { x, y, g: 0, h: 0, f: 0 };
}

function isObstacle(x: number, y: number, obstacles: Rect[]): boolean {
  const buffer = GRID_SIZE;
  for (const obs of obstacles) {
    if (
      x >= obs.x - buffer &&
      x <= obs.x + obs.width + buffer &&
      y >= obs.y - buffer &&
      y <= obs.y + obs.height + buffer
    ) {
      return true;
    }
  }
  return false;
}

function reconstructPath(node: Node): Point[] {
  const path: Point[] = [];
  let current: Node | undefined = node;
  
  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }
  
  return path;
}

export function smoothPath(path: Point[]): Point[] {
  if (path.length < 3) return path;
  
  const smoothed: Point[] = [path[0]];
  
  for (let i = 1; i < path.length - 1; i++) {
    const prev = smoothed[smoothed.length - 1];
    const curr = path[i];
    const next = path[i + 1];
    
    // Check if we can skip this point (same direction)
    const dx1 = Math.sign(curr.x - prev.x);
    const dy1 = Math.sign(curr.y - prev.y);
    const dx2 = Math.sign(next.x - curr.x);
    const dy2 = Math.sign(next.y - curr.y);

    if (dx1 === dx2 && dy1 === dy2) {
      // Same direction, skip this point
      continue;
    }
    
    smoothed.push(curr);
  }
  
  smoothed.push(path[path.length - 1]);
  return smoothed;
}

export function generateSVGPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  
  return path;
}
