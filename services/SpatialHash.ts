import { Vector2 } from '../types';

export class SpatialHash<T> {
  private cellSize: number;
  private grid: Map<string, T[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  private getKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  public clear(): void {
    this.grid.clear();
  }

  public insert(x: number, y: number, item: T): void {
    const key = this.getKey(x, y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(item);
  }

  // Insert an item that spans a bounding box (for snake segments)
  public insertBox(minX: number, minY: number, maxX: number, maxY: number, item: T): void {
    const minCx = Math.floor(minX / this.cellSize);
    const minCy = Math.floor(minY / this.cellSize);
    const maxCx = Math.floor(maxX / this.cellSize);
    const maxCy = Math.floor(maxY / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = `${cx},${cy}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        // Avoid duplicates in the same cell if using references
        const cell = this.grid.get(key)!;
        if (!cell.includes(item)) {
          cell.push(item);
        }
      }
    }
  }

  public query(x: number, y: number, radius: number = 0): T[] {
    const items: Set<T> = new Set();
    const range = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);

    for (let dx = -range; dx <= range; dx++) {
      for (let dy = -range; dy <= range; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        const cellItems = this.grid.get(key);
        if (cellItems) {
          for (const item of cellItems) {
            items.add(item);
          }
        }
      }
    }
    return Array.from(items);
  }
}