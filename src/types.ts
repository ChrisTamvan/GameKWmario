/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TileType {
  EMPTY = 0,
  GROUND = 1,        // Normal solid ground
  BRICK = 2,         // Breakable brick (destroyable from bottom)
  MYSTERY_BOX = 3,   // Question block with coin
  SOLID_BLOCK = 4,   // Unbreakable retro solid block
  SPIKES = 5,        // Spikes on the floor (damage)
  SPIKES_UP = 6,     // Spikes hanging from ceiling (damage)
  WALL_CLIMBABLE = 7,// Highlighted vine or brick texture designed for vertical climbing
  SECRET_PASSAGE = 8,// Looks like solid brick, but player can walk/hide inside (reveals hidden chest)
  COIN = 9,          // Floating collectible coin
  GEMS = 10,         // Rare blue gem (gives 500 points)
  LADDER = 11,       // Classic vertical climber
  KEY = 12,          // Golden key to unlock the portal
  PORTAL = 13,       // Level exit gate (requires key if locked)
  HEART = 14,        // Extra life item
  MOVING_BLOCK = 15, // Moving platforms
}

export interface PlayerStats {
  score: number;
  coins: number;
  lives: number;
  level: number;
  completedLevels: number[];
}

export interface PlayerPhysics {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  direction: 1 | -1; // 1 = right, -1 = left
  
  // Basic states
  onGround: boolean;
  isJumping: boolean;
  isCrouching: boolean;
  
  // Dashing mechanics
  isDashing: boolean;
  dashTime: number;
  dashCooldown: number;
  canDash: boolean;
  
  // Wall-climbing mechanics
  isClimbing: boolean;
  touchingWallLeft: boolean;
  touchingWallRight: boolean;
  climbSpeed: number;
  wallClimbEnergy: number; // Max wall-climb stamina/energy to avoid infinite cheese
  maxWallClimbEnergy: number;
  
  // State timers
  invincibilityTime: number; // For taking damage
  isDead: boolean;
  deathAnimationTime: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  start_x: number; // For patrol boundaries
  start_y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  type: 'slime' | 'beetle' | 'ghost'; // Ghost can float, beetle is faster, slime is simple
  direction: 1 | -1;
  patrolRange: number;
  isDead: boolean;
  deathTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'sparkle' | 'brick_shard' | 'dust' | 'dash_ghost';
}

export interface LevelConfig {
  id: number;
  name: string;
  grid: number[][]; // 2D layout grid
  backgroundColor: string;
  skyColor: string;
  groundColor: string;
  ambientType: 'sunny' | 'cave' | 'volcano';
  startX: number;
  startY: number;
  hasKey: boolean;
  keyPos?: { x: number; y: number };
  portalPos: { x: number; y: number };
  storyHint: string;
}

export interface HighScore {
  name: string;
  score: number;
  coins: number;
  time: string;
}
