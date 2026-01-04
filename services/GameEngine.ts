import { CONFIG } from '../constants';
import { BotType, GameConfig, GameState, Pellet, Snake, Vector2 } from '../types';
import { Renderer } from './Renderer';
import { SpatialHash } from './SpatialHash';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private animationId: number | null = null;
  private lastTime: number = 0;

  // Game Data
  private snakes: Snake[] = [];
  private pellets: Pellet[] = [];
  private player: Snake | null = null;
  private camera: { x: number, y: number, zoom: number } = { x: 0, y: 0, zoom: 1 };
  
  // Spawning Control
  private targetBotCount: number = 0;
  private respawnTimer: number = 0;
  
  // Systems
  private pelletHash: SpatialHash<Pellet>;
  private snakeBodyHash: SpatialHash<{snakeId: string, segmentIndex: number, p1: Vector2, p2: Vector2}>;

  // Inputs
  private mousePos: Vector2 = { x: 0, y: 0 };
  private mouseDown: boolean = false;
  private spaceDown: boolean = false;

  // Callbacks
  private onGameOver: (score: number) => void;
  private onUpdateUI: (score: number, leaderboard: {name: string, score: number}[], boostEnergy: number) => void;

  constructor(
    canvas: HTMLCanvasElement, 
    onGameOver: (score: number) => void,
    onUpdateUI: (score: number, leaderboard: {name: string, score: number}[], boostEnergy: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.renderer = new Renderer(this.ctx, canvas.width, canvas.height);
    this.onGameOver = onGameOver;
    this.onUpdateUI = onUpdateUI;
    
    this.pelletHash = new SpatialHash(CONFIG.GRID_SIZE);
    this.snakeBodyHash = new SpatialHash(CONFIG.GRID_SIZE);

    // Initial setup listeners
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    
    // Input listeners
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    });
    
    this.canvas.addEventListener('mousedown', () => this.mouseDown = true);
    this.canvas.addEventListener('mouseup', () => this.mouseDown = false);
    
    // Keyboard listeners for Nitro
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') this.spaceDown = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') this.spaceDown = false;
    });

    // Touch support
    this.canvas.addEventListener('touchstart', () => this.mouseDown = true);
    this.canvas.addEventListener('touchend', () => this.mouseDown = false);
    this.canvas.addEventListener('touchmove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
      e.preventDefault();
    }, { passive: false });
  }

  private handleResize = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.renderer.setDimensions(this.canvas.width, this.canvas.height);
  };

  public initGame(botCount: number, difficulty: string) {
    this.targetBotCount = botCount;
    this.snakes = [];
    this.pellets = [];
    this.pelletHash.clear();
    this.snakeBodyHash.clear();

    // Create Player
    this.player = this.createSnake('You', false);
    this.snakes.push(this.player);

    // Create Bots
    for (let i = 0; i < botCount; i++) {
      this.spawnBot();
    }

    // Initial Pellets
    for (let i = 0; i < 500; i++) {
      this.spawnPellet();
    }
  }

  private spawnBot() {
    const name = CONFIG.BOT_NAMES[Math.floor(Math.random() * CONFIG.BOT_NAMES.length)];
    this.snakes.push(this.createSnake(name, true));
  }

  private createSnake(name: string, isBot: boolean): Snake {
    const x = Math.random() * (CONFIG.ARENA_SIZE - 200) + 100;
    const y = Math.random() * (CONFIG.ARENA_SIZE - 200) + 100;
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 100%, 50%)`;
    
    // Assign random bot type
    const botTypes = Object.values(BotType);
    const botType = isBot ? botTypes[Math.floor(Math.random() * botTypes.length)] : undefined;

    // Fully initialize path to prevent "uncoiling" growth effect
    const startPath: Vector2[] = [];
    const startAngle = Math.random() * Math.PI * 2;
    const startPixelLength = CONFIG.START_LENGTH * CONFIG.LENGTH_MULTIPLIER;
    const segments = Math.ceil(startPixelLength / 5); // Rough estimation of segment count

    for(let i = 1; i <= segments; i++) {
        startPath.push({
            x: x - Math.cos(startAngle) * (i * 5),
            y: y - Math.sin(startAngle) * (i * 5)
        });
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      name,
      isBot,
      botType,
      head: { x, y },
      path: startPath,
      angle: startAngle,
      targetAngle: startAngle,
      speed: CONFIG.BASE_SPEED,
      radius: CONFIG.SNAKE_RADIUS,
      length: CONFIG.START_LENGTH,
      targetLength: CONFIG.START_LENGTH,
      score: 0,
      color,
      hue,
      dead: false,
      boosting: false,
      boostEnergy: CONFIG.MAX_BOOST_ENERGY,
      wanderAngle: Math.random() * Math.PI * 2,
      lastWanderChange: 0
    };
  }

  private spawnPellet(fromSnake?: Snake) {
    if (this.pellets.length >= CONFIG.MAX_PELLETS) return;

    let x, y, value, color, radius;

    if (fromSnake) {
      // Boosting trail: Spawn at tail, small value
      const tailIndex = fromSnake.path.length - 1;
      const spawnPos = tailIndex >= 0 ? fromSnake.path[tailIndex] : fromSnake.head;
      
      x = spawnPos.x + (Math.random() - 0.5) * 10;
      y = spawnPos.y + (Math.random() - 0.5) * 10;
      value = CONFIG.PELLET_VALUE_SMALL;
      color = fromSnake.color;
      radius = CONFIG.PELLET_RADIUS;
    } else {
      // Random world spawn
      x = Math.random() * CONFIG.ARENA_SIZE;
      y = Math.random() * CONFIG.ARENA_SIZE;
      value = CONFIG.PELLET_VALUE_SMALL;
      // Neon colors for pellets
      const colors = CONFIG.COLORS;
      color = colors[Math.floor(Math.random() * colors.length)];
      radius = CONFIG.PELLET_RADIUS;
    }

    // Clamp to Arena - Padding
    const padding = 10;
    x = Math.max(padding, Math.min(CONFIG.ARENA_SIZE - padding, x));
    y = Math.max(padding, Math.min(CONFIG.ARENA_SIZE - padding, y));

    const pellet: Pellet = {
      id: Math.random().toString(36).substr(2, 9),
      x, y, value, color, radius
    };

    this.pellets.push(pellet);
    this.pelletHash.insert(x, y, pellet);
  }

  public start() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.lastTime = performance.now();
    this.gameLoop();
  }

  public stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  private gameLoop = () => {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Cap dt to prevent huge jumps if tab was inactive
    const safeDt = Math.min(dt, 0.1);

    this.update(safeDt);
    this.renderer.clear();
    this.renderer.drawGrid(this.camera);
    this.renderer.drawPellets(this.pellets, this.camera);
    
    // Determine king snake (highest score)
    const aliveSnakes = this.snakes.filter(s => !s.dead);
    const kingSnake = aliveSnakes.length > 0 
      ? aliveSnakes.reduce((king, snake) => snake.score > king.score ? snake : king)
      : null;
    
    // Render living snakes
    // Sort so player is on top
    const sortedSnakes = [...this.snakes].sort((a, b) => (a === this.player ? 1 : -1));
    sortedSnakes.forEach(snake => {
      const isKing = kingSnake && snake.id === kingSnake.id;
      this.renderer.drawSnake(snake, this.camera, isKing);
    });

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(dt: number) {
    // 1. Spawning Logic (Controlled Population)
    // Check how many bots are alive
    const activeBots = this.snakes.filter(s => !s.dead && s.isBot).length;
    
    if (activeBots < this.targetBotCount) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
            this.spawnBot();
            this.respawnTimer = 1.0 + Math.random(); // Delay between spawns
        }
    }

    // 2. Rebuild Physics Hashes
    this.snakeBodyHash.clear();
    this.pelletHash.clear(); 
    // Only insert non-consumed pellets
    this.pellets.forEach(p => {
      if (!p.consumed) {
        this.pelletHash.insert(p.x, p.y, p);
      }
    });

    // Insert snake bodies into hash
    this.snakes.forEach(snake => {
      if (snake.dead) return;
      
      let prev = snake.head;
      snake.path.forEach((curr, index) => {
        // We add all segments. Logic to ignore "self" happens in collision check.
        this.snakeBodyHash.insertBox(
           Math.min(prev.x, curr.x), Math.min(prev.y, curr.y),
           Math.max(prev.x, curr.x), Math.max(prev.y, curr.y),
           { snakeId: snake.id, segmentIndex: index, p1: prev, p2: curr }
        );
        prev = curr;
      });
    });

    // 3. Update Snakes
    this.snakes.forEach(snake => {
      if (snake.dead) return;

      // AI or Input Logic
      if (snake.isBot) {
        this.updateBotAI(snake, dt);
      } else {
        this.updatePlayerInput(snake);
      }

      // Movement Physics
      this.moveSnake(snake, dt);

      // Boundaries - STRICT
      if (snake.head.x - snake.radius <= 0 || 
          snake.head.x + snake.radius >= CONFIG.ARENA_SIZE || 
          snake.head.y - snake.radius <= 0 || 
          snake.head.y + snake.radius >= CONFIG.ARENA_SIZE) {
        this.killSnake(snake);
      }

      // Collisions
      this.checkCollisions(snake);
    });

    // Clean up consumed pellets
    // We do this after all snakes have updated to handle the 'consumed' flag
    this.pellets = this.pellets.filter(p => !p.consumed);

    // 4. Camera Follow Player
    if (this.player && !this.player.dead) {
      // Smooth camera
      const targetX = this.player.head.x;
      const targetY = this.player.head.y;
      
      this.camera.x += (targetX - this.camera.x) * 0.1;
      this.camera.y += (targetY - this.camera.y) * 0.1;
      
      // Zoom based on size
      // Slower zoom out effect, related to snake.radius instead of just length?
      // Length is fine, but adjusted for larger numbers.
      const targetZoom = Math.max(0.3, 1 - (this.player.length / 1500));
      this.camera.zoom += (targetZoom - this.camera.zoom) * 0.05;
    }

    // 5. Update UI Data
    const leaderboard = this.snakes
      .filter(s => !s.dead)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => ({ name: s.name, score: Math.floor(s.score) }));
    
    this.onUpdateUI(
      this.player ? Math.floor(this.player.score) : 0, 
      leaderboard,
      this.player ? this.player.boostEnergy : 0
    );

    // 6. Cleanup Dead Entities and Spawn Pellets
    this.snakes = this.snakes.filter(s => !s.dead || s === this.player);
    
    // Repopulate pellets
    if (this.pellets.length < 500) {
      this.spawnPellet();
    }
  }

  private updatePlayerInput(snake: Snake) {
    const screenCenterX = this.canvas.width / 2;
    const screenCenterY = this.canvas.height / 2;
    const dx = this.mousePos.x - screenCenterX;
    const dy = this.mousePos.y - screenCenterY;
    
    snake.targetAngle = Math.atan2(dy, dx);
    
    // Check boost triggers and energy available
    const wantsBoost = this.mouseDown || this.spaceDown;
    snake.boosting = wantsBoost && snake.boostEnergy > 0;
  }

  private updateBotAI(bot: Snake, dt: number) {
    // Update Wander State
    bot.lastWanderChange += dt;
    if (bot.lastWanderChange > 2 + Math.random() * 3) {
        // Change wander direction naturally (relative to current)
        // prevents rapid 180 flips which caused loops
        bot.wanderAngle = bot.angle + (Math.random() - 0.5) * 2.5;
        bot.lastWanderChange = 0;
    }

    // 1. Find Interest (Pellet or Prey)
    const scanRadius = 400;
    const nearbyPellets = this.pelletHash.query(bot.head.x, bot.head.y, scanRadius);
    let targetX = bot.head.x + Math.cos(bot.wanderAngle) * 100;
    let targetY = bot.head.y + Math.sin(bot.wanderAngle) * 100;
    let hasTarget = false;
    let targetValue = 0;

    // Look for pellets
    let bestScore = -Infinity;
    
    // Calculate heading once
    const headingX = Math.cos(bot.angle);
    const headingY = Math.sin(bot.angle);

    nearbyPellets.forEach(p => {
        if (p.consumed) return; // Skip eaten pellets in logic
        
        const dx = p.x - bot.head.x;
        const dy = p.y - bot.head.y;
        const distSq = dx*dx + dy*dy;
        
        // Dot product to check if in front
        // Normalize vector to pellet
        const dist = Math.sqrt(distSq);
        const dirX = dx / dist;
        const dirY = dy / dist;
        const dot = headingX * dirX + headingY * dirY;
        
        let score = p.value / (distSq + 1);
        
        // STRICT Penalty for things behind or to the steep side.
        // If dot < 0.25, it means the target is more than ~75 degrees to the side.
        // We ignore it to prevent the snake from spinning to get it.
        if (dot < 0.25) {
             score = -1; // Effectively ignore
        }

        if (score > bestScore) {
            bestScore = score;
            targetX = p.x;
            targetY = p.y;
            hasTarget = true;
            targetValue = p.value;
        }
    });
    
    // Determine Base Desired Angle
    let desiredAngle = Math.atan2(targetY - bot.head.y, targetX - bot.head.x);

    // 2. Raycast for safety (Collision Avoidance)
    // Increased ray count and FOV to 180 degrees (PI) to detect side escapes better
    const rayCount = 11;
    const fov = Math.PI; 
    let bestAngle = desiredAngle;
    let maxSafetyScore = -Infinity;
    
    for (let i = 0; i < rayCount; i++) {
        const angleOffset = -fov/2 + (i / (rayCount - 1)) * fov;
        const testAngle = bot.angle + angleOffset; // Relative to current heading
        
        let score = 0;
        
        // Guidance score (steer towards target)
        if (hasTarget) {
            let angleDiff = testAngle - desiredAngle;
            while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            score -= Math.abs(angleDiff) * 150; 
        } else {
             // If wandering, stick somewhat to current heading to avoid jitter
             // unless wander angle pulls us
             let angleDiff = testAngle - bot.wanderAngle;
             while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
             while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
             score -= Math.abs(angleDiff) * 50;
        }

        // Safety Check
        const checkDist = 180; // Increased lookahead distance
        const checkX = bot.head.x + Math.cos(testAngle) * checkDist;
        const checkY = bot.head.y + Math.sin(testAngle) * checkDist;
        
        // Wall Avoidance
        if (checkX < 40 || checkX > CONFIG.ARENA_SIZE - 40 || 
            checkY < 40 || checkY > CONFIG.ARENA_SIZE - 40) {
            score -= 10000;
        }
        
        // Snake Body Avoidance
        const threats = this.snakeBodyHash.query(checkX, checkY, 80); // Increased threat radius check
        let hitThreat = false;
        for (const t of threats) {
            if (t.snakeId !== bot.id) { 
                hitThreat = true;
                break;
            }
        }
        
        if (hitThreat) score -= 5000;
        
        // Bias towards current angle to prevent jitter if scores are similar
        const persistenceScore = -Math.abs(angleOffset) * 10;
        score += persistenceScore;
        
        if (score > maxSafetyScore) {
            maxSafetyScore = score;
            bestAngle = testAngle;
        }
    }

    bot.targetAngle = bestAngle;
    
    // 3. AI Nitro Logic
    const isEmergency = maxSafetyScore < -2000;
    const isChasingGoodFood = hasTarget && targetValue > 3 && bot.boostEnergy > 40;
    const isRacing = hasTarget && bot.boostEnergy > 80;

    bot.boosting = (isEmergency || isChasingGoodFood || isRacing) && bot.boostEnergy > 5;
  }

  private moveSnake(snake: Snake, dt: number) {
    // Dynamic Radius Growth
    // Grows with length, capped at MAX_SNAKE_RADIUS
    const growth = (snake.length - CONFIG.START_LENGTH) * CONFIG.RADIUS_GROWTH_FACTOR;
    snake.radius = Math.min(CONFIG.MAX_SNAKE_RADIUS, CONFIG.SNAKE_RADIUS + Math.max(0, growth));

    // Turn logic
    let diff = snake.targetAngle - snake.angle;
    while (diff <= -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    
    // Turn radius slightly slower for big snakes
    const sizeInertia = 1 - (snake.radius - CONFIG.SNAKE_RADIUS) / 100; // 0.6 to 1.0
    // Normalize turn speed with dt (approximate to previous tuning)
    // Previous was 0.06 per frame at ~60fps -> 3.6 rad/sec
    const turnRate = (CONFIG.TURN_SPEED * 60 * dt) * sizeInertia * (snake.boosting ? 0.7 : 1.0);
    
    if (Math.abs(diff) > turnRate) {
      snake.angle += Math.sign(diff) * turnRate;
    } else {
      snake.angle = snake.targetAngle;
    }

    // Energy Management
    if (snake.boosting) {
      snake.boostEnergy -= CONFIG.BOOST_DRAIN_RATE * dt;
      if (snake.boostEnergy <= 0) {
        snake.boostEnergy = 0;
        snake.boosting = false; // Force stop boost
      }
    } else {
      snake.boostEnergy += CONFIG.BOOST_RECHARGE_RATE * dt;
      if (snake.boostEnergy > CONFIG.MAX_BOOST_ENERGY) {
        snake.boostEnergy = CONFIG.MAX_BOOST_ENERGY;
      }
    }

    // Speed logic (Pixels per frame -> Pixels per second)
    const baseSpeed = snake.boosting && snake.length > CONFIG.MIN_LENGTH
      ? CONFIG.BOOST_SPEED 
      : CONFIG.BASE_SPEED;
    
    // IMPORTANT: Normalize speed by Delta Time to handle 144hz/60hz differences
    // Previous base speed was ~2.5 per frame @ 60fps = 150 px/sec
    const moveDistance = baseSpeed * 60 * dt;
      
    // Move Head
    const newHead = {
      x: snake.head.x + Math.cos(snake.angle) * moveDistance,
      y: snake.head.y + Math.sin(snake.angle) * moveDistance
    };

    // Add current head to path (history)
    snake.path.unshift({ ...snake.head });
    snake.head = newHead;

    // Path management (Length)
    let currentPathLength = 0;
    const maxPixels = snake.targetLength * CONFIG.LENGTH_MULTIPLIER;

    for (let i = 0; i < snake.path.length - 1; i++) {
      const p1 = snake.path[i];
      const p2 = snake.path[i+1];
      const d = Math.hypot(p2.x-p1.x, p2.y-p1.y);
      currentPathLength += d;
      
      if (currentPathLength > maxPixels) { 
        snake.path.splice(i + 1);
        break;
      }
    }
    
    // Smooth growth of the visual score number
    if (snake.length < snake.targetLength) {
      // Proportional growth without forced minimum to prevent jitter/overshoot
      const diff = snake.targetLength - snake.length;
      snake.length += diff * 5 * dt; // Lerp over time
    } else if (snake.length > snake.targetLength) {
      snake.length = snake.targetLength;
    }

    // Boosting cost (Length)
    if (snake.boosting && snake.length > CONFIG.MIN_LENGTH) {
      // Cost per second
      snake.targetLength -= 3.0 * dt; 
      
      // Drop pellets
      // Probability scaled by dt to be consistent
      if (Math.random() < 6.0 * dt) {
        this.spawnPellet(snake);
      }
    }
  }

  private checkCollisions(snake: Snake) {
    // 1. Pellets
    const nearbyPellets = this.pelletHash.query(snake.head.x, snake.head.y, snake.radius * 2);
    
    for (const p of nearbyPellets) {
      if (p.consumed) continue;

      const dx = snake.head.x - p.x;
      const dy = snake.head.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Pickup radius accounts for snake size
      if (dist < snake.radius + p.radius) {
        // Eat
        p.consumed = true; // Mark as eaten for this frame
        snake.targetLength += p.value;
        snake.score += p.value;
        // Don't remove from this.pellets here, do it in batch
      }
    }

    // 2. Snake Bodies
    const nearbySegments = this.snakeBodyHash.query(snake.head.x, snake.head.y, snake.radius);
    
    for (const segment of nearbySegments) {
      if (segment.snakeId === snake.id) continue;

      const collision = this.lineCircleCollision(
        segment.p1, segment.p2, snake.head, snake.radius * 0.9
      );

      if (collision) {
        this.killSnake(snake);
        break;
      }
    }
  }

  private lineCircleCollision(p1: Vector2, p2: Vector2, circle: Vector2, r: number): boolean {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx*dx + dy*dy;
    const t = ((circle.x - p1.x) * dx + (circle.y - p1.y) * dy) / lenSq;
    
    const tClamped = Math.max(0, Math.min(1, t));
    const closestX = p1.x + tClamped * dx;
    const closestY = p1.y + tClamped * dy;
    
    const distX = circle.x - closestX;
    const distY = circle.y - closestY;
    
    return (distX*distX + distY*distY) < (r*r);
  }

  private killSnake(snake: Snake) {
    if (snake.dead) return;
    snake.dead = true;

    // Drop pellets dramatically reduced
    // Max pellets per kill: 12 (drastically reduced from 40 to prevent clutter)
    // Calculate step based on path length to distribute them evenly
    const maxPellets = 12;
    const step = Math.ceil(Math.max(30, snake.path.length / maxPellets));

    for (let i = 0; i < snake.path.length; i += step) {
      const p = snake.path[i];
      const dropX = Math.max(10, Math.min(CONFIG.ARENA_SIZE - 10, p.x + (Math.random() - 0.5) * 10));
      const dropY = Math.max(10, Math.min(CONFIG.ARENA_SIZE - 10, p.y + (Math.random() - 0.5) * 10));

      const pellet: Pellet = {
        id: Math.random().toString(36).substr(2, 9),
        x: dropX,
        y: dropY,
        value: CONFIG.PELLET_VALUE_LARGE,
        color: snake.color,
        radius: CONFIG.PELLET_RADIUS * 1.5
      };
      this.pellets.push(pellet);
      this.pelletHash.insert(pellet.x, pellet.y, pellet);
    }

    if (snake === this.player) {
      this.onGameOver(snake.length);
    }
    // Note: Bot respawn is handled in update() loop via targetBotCount check
  }
}