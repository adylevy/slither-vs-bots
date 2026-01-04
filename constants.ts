export const CONFIG = {
  ARENA_SIZE: 3000,
  GRID_SIZE: 100, // For spatial hash
  
  BASE_SPEED: 2.5,
  BOOST_SPEED: 5.0,
  TURN_SPEED: 0.06,
  
  START_LENGTH: 20,
  MIN_LENGTH: 10,
  
  // Snake Body Dimensions
  SNAKE_RADIUS: 12,       // Starting radius
  RADIUS_GROWTH_FACTOR: 0.06, // Reduced to make them less puffy initially
  MAX_SNAKE_RADIUS: 45,   // Cap on how fat they can get
  
  PELLET_RADIUS: 5,
  PELLET_VALUE_SMALL: 1.0, // Each pellet counts as 1 point
  PELLET_VALUE_LARGE: 20.0, // Large pellets from killed snakes
  
  MAX_PELLETS: 1200,
  
  // Visual multiplier: How many pixels of snake body per 1 unit of Length score?
  LENGTH_MULTIPLIER: 8, // Increased slightly so snakes are visually a bit longer per unit
  
  // Nitro / Boost settings
  MAX_BOOST_ENERGY: 100,
  BOOST_DRAIN_RATE: 40, // Drains in ~2.5 seconds
  BOOST_RECHARGE_RATE: 15, // Recharges fully in ~6 seconds
  
  COLORS: [
    '#00ff00', // Neon Green
    '#00ffff', // Cyan
    '#ff00ff', // Magenta
    '#ffff00', // Yellow
    '#ff0000', // Red
    '#ff9900', // Orange
    '#9d4edd', // Purple
    '#39ff14', // Neon Green 2
    '#ff1493', // Deep Pink
  ],
  
  BOT_NAMES: [
    "Viper", "Cobra", "Python", "Mamba", "Sidewinder", 
    "Anaconda", "Boa", "Rattler", "Krait", "Taipan", 
    "Fang", "Venom", "Sly", "Coil", "Hiss"
  ]
};