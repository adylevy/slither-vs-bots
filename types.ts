export enum GameState {
  MENU,
  PLAYING,
  GAME_OVER
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Pellet {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  radius: number;
  consumed?: boolean; // New flag to handle frame-sync eating
}

export enum BotType {
  GRAZER = 'Grazer',
  AGGRESSIVE = 'Aggressive',
  CAUTIOUS = 'Cautious',
  OPPORTUNIST = 'Opportunist'
}

export interface Snake {
  id: string;
  name: string;
  isBot: boolean;
  botType?: BotType;
  
  // Physics
  head: Vector2;
  path: Vector2[]; // History of positions
  angle: number;
  targetAngle: number;
  speed: number;
  radius: number;
  
  // Game logic
  length: number;      // Current visual length (not array length, but logical length)
  targetLength: number; // Length snake wants to be (grows towards this)
  score: number;
  
  // Visuals
  color: string;
  hue: number;
  
  // State
  dead: boolean;
  boosting: boolean;
  boostEnergy: number;

  // AI State
  wanderAngle: number;
  lastWanderChange: number;
}

export interface GameConfig {
  arenaSize: number;
  baseSpeed: number;
  boostSpeed: number;
  turnSpeed: number;
  startLength: number;
  pelletValue: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}