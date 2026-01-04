import { Camera, Pellet, Snake, Vector2 } from '../types';
import { CONFIG } from '../constants';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  public setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public clear() {
    this.ctx.fillStyle = '#0f172a'; // Deep dark blue/gray
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  public drawGrid(camera: Camera) {
    this.ctx.save();
    this.ctx.strokeStyle = '#1e293b'; // Lighter gray for grid
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.3;

    const gridSize = 100;
    
    // Calculate offset based on camera position
    const offsetX = -camera.x + this.width / 2;
    const offsetY = -camera.y + this.height / 2;

    // Determine visible grid range
    const startX = Math.floor((camera.x - this.width / 2) / gridSize) * gridSize;
    const endX = Math.ceil((camera.x + this.width / 2) / gridSize) * gridSize;
    const startY = Math.floor((camera.y - this.height / 2) / gridSize) * gridSize;
    const endY = Math.ceil((camera.y + this.height / 2) / gridSize) * gridSize;

    this.ctx.beginPath();
    
    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      this.ctx.moveTo((x - camera.x) * camera.zoom + this.width / 2, 0);
      this.ctx.lineTo((x - camera.x) * camera.zoom + this.width / 2, this.height);
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      this.ctx.moveTo(0, (y - camera.y) * camera.zoom + this.height / 2);
      this.ctx.lineTo(this.width, (y - camera.y) * camera.zoom + this.height / 2);
    }

    this.ctx.stroke();
    
    // Draw Arena Bounds
    // Important: Align stroke so the inner edge represents 0 and outer edge is outside, or centered.
    // Physics check is: if (pos - radius < 0), dead.
    // So the wall visual should exist at 0.
    this.ctx.strokeStyle = '#ef4444'; // Red boundary
    this.ctx.lineWidth = 4; // 4px width centered on 0, means from -2 to +2.
    this.ctx.globalAlpha = 0.8;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#ef4444';
    
    this.ctx.strokeRect(
      (0 - camera.x) * camera.zoom + this.width / 2, 
      (0 - camera.y) * camera.zoom + this.height / 2, 
      CONFIG.ARENA_SIZE * camera.zoom, 
      CONFIG.ARENA_SIZE * camera.zoom
    );

    this.ctx.restore();
  }

  public drawPellets(pellets: Pellet[], camera: Camera) {
    this.ctx.save();
    
    // Optimization: Only draw pellets inside viewport
    const viewL = camera.x - (this.width / 2) / camera.zoom;
    const viewR = camera.x + (this.width / 2) / camera.zoom;
    const viewT = camera.y - (this.height / 2) / camera.zoom;
    const viewB = camera.y + (this.height / 2) / camera.zoom;

    for (const p of pellets) {
      if (p.x < viewL - p.radius || p.x > viewR + p.radius || 
          p.y < viewT - p.radius || p.y > viewB + p.radius) continue;

      const screenX = (p.x - camera.x) * camera.zoom + this.width / 2;
      const screenY = (p.y - camera.y) * camera.zoom + this.height / 2;
      const radius = p.radius * camera.zoom;

      this.ctx.beginPath();
      this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  public drawSnake(snake: Snake, camera: Camera, isKing: boolean = false) {
    if (snake.dead) return;

    this.ctx.save();

    // Transform points to screen space
    const points = [snake.head, ...snake.path].map(p => ({
      x: (p.x - camera.x) * camera.zoom + this.width / 2,
      y: (p.y - camera.y) * camera.zoom + this.height / 2
    }));

    if (points.length < 2) {
      this.ctx.restore();
      return;
    }

    const radius = snake.radius * camera.zoom;

    // Draw Body
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = radius * 2;
    this.ctx.strokeStyle = snake.color;
    this.ctx.shadowColor = snake.color;
    this.ctx.shadowBlur = 15;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    // Quadratic Bezier smoothing for natural snake look
    // We only draw up to a certain point based on actual visual length logic if we were strict,
    // but here we render the whole path array which is managed by the engine.
    for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    // Connect to last point
    if (points.length > 1) {
       this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    }
    this.ctx.stroke();

    // Draw Inner Body (Highlights)
    this.ctx.lineWidth = radius * 0.8;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.shadowBlur = 0;
    this.ctx.stroke();

    // Draw Head Detail
    const headX = points[0].x;
    const headY = points[0].y;
    
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    // Eyes
    const eyeOffset = radius * 0.6;
    const eyeSize = radius * 0.4;
    
    const eyeX1 = headX + Math.cos(snake.angle - 0.5) * eyeOffset;
    const eyeY1 = headY + Math.sin(snake.angle - 0.5) * eyeOffset;
    
    const eyeX2 = headX + Math.cos(snake.angle + 0.5) * eyeOffset;
    const eyeY2 = headY + Math.sin(snake.angle + 0.5) * eyeOffset;

    this.ctx.moveTo(eyeX1 + eyeSize, eyeY1);
    this.ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
    this.ctx.moveTo(eyeX2 + eyeSize, eyeY2);
    this.ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw Crown for King Snake
    if (isKing) {
      this.drawCrown(headX, headY, radius, camera.zoom);
    }
    
    // Name Tag
    if (camera.zoom > 0.4) {
      this.ctx.fillStyle = '#fff';
      this.ctx.textAlign = 'center';
      this.ctx.font = `bold ${12 * camera.zoom}px monospace`;
      this.ctx.shadowColor = '#000';
      this.ctx.shadowBlur = 4;
      const nameY = isKing ? headY - radius - 25 : headY - radius - 5;
      this.ctx.fillText(snake.name, headX, nameY);
    }

    this.ctx.restore();
  }

  private drawCrown(x: number, y: number, snakeRadius: number, zoom: number) {
    this.ctx.save();
    
    const crownSize = Math.max(20, snakeRadius * 1.5) * zoom;
    const crownY = y - snakeRadius - crownSize * 0.6;
    
    // Crown base
    this.ctx.fillStyle = '#FFD700'; // Gold
    this.ctx.strokeStyle = '#FFA500'; // Darker gold for outline
    this.ctx.lineWidth = 2 * zoom;
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 15 * zoom;
    
    // Draw crown shape with 5 points
    this.ctx.beginPath();
    const baseWidth = crownSize * 0.8;
    const pointHeight = crownSize * 0.6;
    
    // Start from left base
    this.ctx.moveTo(x - baseWidth / 2, crownY);
    
    // Draw 5 points
    const points = 5;
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const px = x - baseWidth / 2 + baseWidth * t;
      const py = crownY + (i % 2 === 0 ? 0 : -pointHeight);
      this.ctx.lineTo(px, py);
    }
    
    // Close the crown
    this.ctx.lineTo(x + baseWidth / 2, crownY);
    this.ctx.closePath();
    
    this.ctx.fill();
    this.ctx.stroke();
    
    // Add jewels/sparkles
    this.ctx.fillStyle = '#FF1493'; // Deep pink
    this.ctx.shadowBlur = 8 * zoom;
    this.ctx.shadowColor = '#FF1493';
    
    // Draw small circles for jewels
    const jewelSize = crownSize * 0.15;
    this.ctx.beginPath();
    this.ctx.arc(x - baseWidth * 0.25, crownY - pointHeight * 0.3, jewelSize, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(x, crownY - pointHeight * 0.5, jewelSize * 1.2, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(x + baseWidth * 0.25, crownY - pointHeight * 0.3, jewelSize, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
}