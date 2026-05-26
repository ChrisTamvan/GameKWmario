/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { TileType, PlayerPhysics, Enemy, Particle, LevelConfig } from '../types';
import { audioSynth } from '../audio';
import { ArrowLeft, Play, RotateCcw, Volume2, VolumeX, Shield, Award, Sparkles, HelpCircle } from 'lucide-react';

interface GameCanvasProps {
  currentLevel: LevelConfig;
  onGameOver: (score: number, coins: number) => void;
  onLevelComplete: (score: number, coins: number) => void;
  onBackToMenu: () => void;
  mobileControlState: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    jump: boolean;
    dash: boolean;
  };
  customLevelGrid?: number[][]; // If playing custom user editor map
}

export default function GameCanvas({
  currentLevel,
  onGameOver,
  onLevelComplete,
  onBackToMenu,
  mobileControlState,
  customLevelGrid
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Game metrics React side
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [hasKey, setHasKey] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [stamina, setStamina] = useState(100);
  const [dashCd, setDashCd] = useState(0);
  
  // Physics config
  const TILE_SIZE = 40;
  const GRAVITY = 0.5;
  const RUN_SPEED = 4;
  const JUMP_FORCE = -10.5;
  const DOUBLE_JUMP_FORCE = -8.5;
  const DASH_SPEED = 12;
  const DASH_DURATION = 10; // Frames
  const DASH_COOLDOWN_MAX = 50; // Frames
  const INVINCIBILITY_DURATION = 90; // Frames
  
  // Reference mutable state to avoid closure issues in key loops
  const levelGridRef = useRef<number[][]>([]);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const particlesRef = useRef<Particle[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const activePromptRef = useRef<string>("");
  const promptTimerRef = useRef<number>(0);
  
  const playerRef = useRef<PlayerPhysics>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: 24,
    height: 36,
    direction: 1,
    onGround: false,
    isJumping: false,
    isCrouching: false,
    isDashing: false,
    dashTime: 0,
    dashCooldown: 0,
    canDash: true,
    isClimbing: false,
    touchingWallLeft: false,
    touchingWallRight: false,
    climbSpeed: 2.5,
    wallClimbEnergy: 100,
    maxWallClimbEnergy: 100,
    invincibilityTime: 0,
    isDead: false,
    deathAnimationTime: 0
  });

  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const [hasDoubleJumped, setHasDoubleJumped] = useState(false);
  const doubleJumpRef = useRef<boolean>(false);
  const cameraXRef = useRef(0);
  const frameIdRef = useRef<number | null>(null);
  const tickRef = useRef(0);

  // Sync level layout with ref
  useEffect(() => {
    if (customLevelGrid) {
      levelGridRef.current = JSON.parse(JSON.stringify(customLevelGrid));
    } else {
      levelGridRef.current = JSON.parse(JSON.stringify(currentLevel.grid));
    }
    
    // Set initial player location
    const player = playerRef.current;
    player.x = currentLevel.startX || 80;
    player.y = currentLevel.startY || 400;
    player.vx = 0;
    player.vy = 0;
    player.isDead = false;
    player.isDashing = false;
    player.isClimbing = false;
    player.deathAnimationTime = 0;
    player.invincibilityTime = 0;
    player.wallClimbEnergy = 100;
    
    setScore(0);
    setCoins(0);
    setLives(3);
    setHasKey(false);
    doubleJumpRef.current = false;
    setHasDoubleJumped(false);
    
    // Generate enemies dynamically based on map structures
    const loadedEnemies: Enemy[] = [];
    const grid = levelGridRef.current;
    
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const xPos = c * TILE_SIZE;
        const yPos = r * TILE_SIZE;
        
        // Spawn Slimes on normal grounds, and beetles on high brick ledges
        if (grid[r][c] === TileType.GROUND && r > 1 && grid[r-1][c] === TileType.EMPTY && Math.random() < 0.08) {
          // Verify we aren't spawning directly on top of the starting spot
          if (xPos > 250) {
            loadedEnemies.push({
              id: `enemy-${r}-${c}`,
              x: xPos,
              y: yPos - 24,
              start_x: xPos,
              start_y: yPos - 24,
              width: 30,
              height: 24,
              vx: -(0.8 + Math.random() * 0.7),
              vy: 0,
              direction: -1,
              type: Math.random() > 0.6 ? 'beetle' : 'slime',
              patrolRange: 120 + Math.random() * 80,
              isDead: false,
              deathTimer: 0
            });
          }
        }
      }
    }
    enemiesRef.current = loadedEnemies;
    particlesRef.current = [];
    
    // Show prompt
    activePromptRef.current = currentLevel.storyHint || "Tuju petualangan Anda!";
    promptTimerRef.current = 180; // 3 seconds
    
    cameraXRef.current = 0;
  }, [currentLevel, customLevelGrid]);

  // Audio mute toggling
  useEffect(() => {
    audioSynth.setMute(isMuted);
  }, [isMuted]);

  // Handle window/container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(minWidth, rect.width),
          height: 480 // Clean set ratio for 2D scrolling
        });
      }
    };
    
    const minWidth = 600;
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      keysPressedRef.current[code] = true;
      
      // Prevent browser default scroll responses
      if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(code)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      keysPressedRef.current[code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Particle Spawner
  const spawnSparkles = (x: number, y: number, color = "#fbbf24", count = 5) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() * 2 - 1) * 2,
        vy: (Math.random() * 2 - 1) * 2 - 1,
        color,
        size: 2 + Math.random() * 3,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        type: 'sparkle'
      });
    }
  };

  const spawnBrickDebris = (gridX: number, gridY: number) => {
    const x = gridX * TILE_SIZE + TILE_SIZE / 2;
    const y = gridY * TILE_SIZE + TILE_SIZE / 2;
    const colors = ["#b45309", "#d97706", "#78350f"]; // Brick colors
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x: x + (Math.random() * 10 - 5),
        y: y + (Math.random() * 10 - 5),
        vx: (Math.random() * 2 - 1) * 4,
        vy: -3 - Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        life: 0,
        maxLife: 40,
        type: 'brick_shard'
      });
    }
  };

  const spawnDust = (x: number, y: number) => {
    particlesRef.current.push({
      x,
      y,
      vx: (Math.random() * 2 - 1) * 0.5,
      vy: -0.2 - Math.random() * 0.5,
      color: "rgba(255, 255, 255, 0.4)",
      size: 4 + Math.random() * 4,
      life: 0,
      maxLife: 15,
      type: 'dust'
    });
  };

  const triggerDamage = () => {
    const player = playerRef.current;
    if (player.isDead || player.invincibilityTime > 0) return;
    
    audioSynth.playHurt();
    
    setLives(prev => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        // Trigger death animation
        player.isDead = true;
        player.vy = -8.5; // Upward jump bounce on death screen
        player.deathAnimationTime = 120; // 2 seconds
        spawnSparkles(player.x + player.width / 2, player.y + player.height / 2, "#ef4444", 20);
      } else {
        player.invincibilityTime = INVINCIBILITY_DURATION;
        player.vy = -6; // Little bounce
        player.vx = player.direction * -4; // Knocks back
        // Create blood/impact sparks
        spawnSparkles(player.x + player.width / 2, player.y + player.height / 2, "#ff6b6b", 12);
      }
      return nextLives;
    });
  };

  // Main game loop logic
  useEffect(() => {
    let lastTime = 0;
    
    const gameLoop = () => {
      if (isPaused) {
        frameIdRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      tickRef.current++;
      const grid = levelGridRef.current;
      const player = playerRef.current;
      
      if (grid.length === 0) {
        frameIdRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const mapCols = grid[0].length;
      const totalMapWidth = mapCols * TILE_SIZE;

      const canvas = canvasRef.current;
      if (!canvas) {
        frameIdRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        frameIdRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Clear Screen
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0,0, canvas.width, canvas.height);

      // Assemble Control Keys (combining Keyboard and Virtual controller states)
      const moveLeft = keysPressedRef.current['ArrowLeft'] || keysPressedRef.current['KeyA'] || mobileControlState.left;
      const moveRight = keysPressedRef.current['ArrowRight'] || keysPressedRef.current['KeyD'] || mobileControlState.right;
      const moveUp = keysPressedRef.current['ArrowUp'] || keysPressedRef.current['KeyW'] || mobileControlState.up;
      const moveDown = keysPressedRef.current['ArrowDown'] || keysPressedRef.current['KeyS'] || mobileControlState.down;
      const keyJump = keysPressedRef.current['Space'] || keysPressedRef.current['KeyX'] || mobileControlState.jump;
      const keyDash = keysPressedRef.current['KeyZ'] || keysPressedRef.current['ShiftLeft'] || mobileControlState.dash;

      // ----------------------------------------------------
      // PLAYER ANIMATION & PHYISCS SIMULATION
      // ----------------------------------------------------
      if (player.isDead) {
        // Death state controls
        player.vy += 0.4; // Fall by fake gravity gravity
        player.y += player.vy;
        player.deathAnimationTime--;
        
        if (player.deathAnimationTime <= 0) {
          onGameOver(score, coins);
          cancelAnimationFrame(frameIdRef.current!);
          return;
        }
      } else {
        // Invincibility ticks
        if (player.invincibilityTime > 0) player.invincibilityTime--;

        // Crouching adjustments
        const wantedCrouch = (moveDown && player.onGround && !player.isClimbing);
        if (wantedCrouch && !player.isCrouching) {
          player.isCrouching = true;
          // Shrink collision box
          player.height = 22;
          player.y += 14; // Shift down
        } else if (!wantedCrouch && player.isCrouching) {
          // Check if there is room above to stand up!
          const tileAboveX1 = Math.floor(player.x / TILE_SIZE);
          const tileAboveX2 = Math.floor((player.x + player.width - 1) / TILE_SIZE);
          const tileAboveY = Math.floor((player.y - 14) / TILE_SIZE);
          
          let canStand = true;
          if (tileAboveY >= 0 && tileAboveY < grid.length) {
            const t1 = grid[tileAboveY][tileAboveX1];
            const t2 = grid[tileAboveY][tileAboveX2];
            if ((t1 !== TileType.EMPTY && t1 !== TileType.COIN && t1 !== TileType.GEMS && t1 !== TileType.KEY && t1 !== TileType.WALL_CLIMBABLE && t1 !== TileType.HEART && t1 !== TileType.SECRET_PASSAGE) ||
                (t2 !== TileType.EMPTY && t2 !== TileType.COIN && t2 !== TileType.GEMS && t2 !== TileType.KEY && t2 !== TileType.WALL_CLIMBABLE && t2 !== TileType.HEART && t2 !== TileType.SECRET_PASSAGE)) {
              canStand = false;
            }
          }
          
          if (canStand) {
            player.isCrouching = false;
            player.height = 36;
            player.y -= 14; // Unshrink up
          }
        }

        // Active Wall detection boundaries
        const boundXLeft = player.x - 4;
        const boundXRight = player.x + player.width + 4;
        const checkYTop = player.y + 4;
        const checkYBottom = player.y + player.height - 4;
        
        const gridColLeft = Math.floor(boundXLeft / TILE_SIZE);
        const gridColRight = Math.floor(boundXRight / TILE_SIZE);
        
        let onClimbWallLeft = false;
        let onClimbWallRight = false;
        let genericWallLeft = false;
        let genericWallRight = false;

        for (let th = checkYTop; th <= checkYBottom; th += TILE_SIZE / 2) {
          const row = Math.floor(th / TILE_SIZE);
          if (row >= 0 && row < grid.length) {
            if (gridColLeft >= 0 && gridColLeft < grid[0].length) {
              const tl = grid[row][gridColLeft];
              if (tl === TileType.WALL_CLIMBABLE) onClimbWallLeft = true;
              else if (tl === TileType.GROUND || tl === TileType.SOLID_BLOCK || tl === TileType.BRICK) genericWallLeft = true;
            }
            if (gridColRight >= 0 && gridColRight < grid[0].length) {
              const tr = grid[row][gridColRight];
              if (tr === TileType.WALL_CLIMBABLE) onClimbWallRight = true;
              else if (tr === TileType.GROUND || tr === TileType.SOLID_BLOCK || tr === TileType.BRICK) genericWallRight = true;
            }
          }
        }

        player.touchingWallLeft = onClimbWallLeft || genericWallLeft;
        player.touchingWallRight = onClimbWallRight || genericWallRight;
        
        const canClimbThisWall = onClimbWallLeft || onClimbWallRight;

        // Climbing state toggle
        if (canClimbThisWall && (moveUp || moveDown)) {
          if (!player.isClimbing) {
            player.isClimbing = true;
            player.vy = 0;
            player.vx = 0;
            audioSynth.playClimbStep();
          }
        }

        // Drop from Wall Climb if no longer near any climbing blocks
        if (player.isClimbing && !canClimbThisWall) {
          player.isClimbing = false;
        }

        // Handle Dashing
        if (player.dashCooldown > 0) {
          player.dashCooldown--;
          setDashCd(player.dashCooldown);
        } else {
          player.canDash = true;
        }

        if (keyDash && player.canDash && !player.isClimbing && !player.isDashing) {
          player.isDashing = true;
          player.dashTime = DASH_DURATION;
          player.dashCooldown = DASH_COOLDOWN_MAX;
          player.canDash = false;
          player.vy = 0; // Flat dash line
          audioSynth.playDash();
          
          spawnSparkles(player.x + player.width / 2, player.y + player.height / 2, "#60a5fa", 10);
        }

        // Stamina logic for Wall Climbing
        if (player.isClimbing) {
          // Drain stamina slowly on move
          if (moveUp || moveDown) {
            player.wallClimbEnergy = Math.max(0, player.wallClimbEnergy - 0.4);
            if (tickRef.current % 15 === 0) {
              audioSynth.playClimbStep();
              spawnDust(player.x + player.width/2, player.y + player.height);
            }
          } else {
            // Static hang drains extremely slowly
            player.wallClimbEnergy = Math.max(0, player.wallClimbEnergy - 0.08);
          }
          
          if (player.wallClimbEnergy <= 0) {
            player.isClimbing = false; // Fall down exhausted!
            activePromptRef.current = "Letih! Energi panjat dinding habis!";
            promptTimerRef.current = 100;
          }
          setStamina(Math.floor(player.wallClimbEnergy));
        } else if (player.onGround) {
          // Recharge stamina on ground
          player.wallClimbEnergy = Math.min(player.maxWallClimbEnergy, player.wallClimbEnergy + 1.5);
          setStamina(Math.floor(player.wallClimbEnergy));
        }

        // Apply velocities based on statuses
        if (player.isDashing) {
          player.vx = player.direction * DASH_SPEED;
          player.vy = 0;
          player.dashTime--;
          
          // Spawn swift ghost dash trails
          if (tickRef.current % 2 === 0) {
            particlesRef.current.push({
              x: player.x,
              y: player.y,
              vx: 0,
              vy: 0,
              color: "rgba(96, 165, 250, 0.5)",
              size: player.width,
              life: 0,
              maxLife: 12,
              type: 'dash_ghost'
            });
          }

          if (player.dashTime <= 0) {
            player.isDashing = false;
            player.vx = player.direction * RUN_SPEED;
          }
        } 
        else if (player.isClimbing) {
          player.vx = 0;
          if (moveUp) {
            player.vy = -player.climbSpeed;
          } else if (moveDown) {
            player.vy = player.climbSpeed;
          } else {
            player.vy = 0;
          }
        } 
        else {
          // Standard horizontal movement physics
          let targetVx = 0;
          if (moveLeft) {
            targetVx = -RUN_SPEED;
            player.direction = -1;
          } else if (moveRight) {
            targetVx = RUN_SPEED;
            player.direction = 1;
          }
          
          // Reduce speed when crouching
          if (player.isCrouching) {
            targetVx *= 0.5;
          }

          // Inertia sliding curves
          player.vx += (targetVx - player.vx) * 0.25;

          // Wall-slide friction when pushing against standard sides
          let isWallSliding = false;
          if (!player.onGround && player.vy > 0 && 
              ((moveLeft && player.touchingWallLeft) || (moveRight && player.touchingWallRight))) {
            isWallSliding = true;
            player.vy += (1.2 - player.vy) * 0.2; // Safe glide slide down
            if (tickRef.current % 8 === 0) {
              spawnDust(player.direction === 1 ? player.x + player.width : player.x, player.y + player.height / 2);
            }
          } else {
            // Apply standard environmental gravity
            player.vy += GRAVITY;
          }

          // Handle Jump inputs
          if (keyJump) {
            // Prevent holding key down from continuous trigger
            if (!keysPressedRef.current['SpaceTriggered']) {
              keysPressedRef.current['SpaceTriggered'] = true;
              
              if (player.onGround) {
                player.vy = JUMP_FORCE;
                player.onGround = false;
                audioSynth.playJump();
                spawnDust(player.x + player.width/2, player.y + player.height);
                doubleJumpRef.current = false;
                setHasDoubleJumped(false);
              } 
              // Wall jump action from climber vines or brick edges
              else if (canClimbThisWall || isWallSliding) {
                // Leap in opposing horizontal direction
                const pushDirection = player.touchingWallLeft ? 1 : -1;
                player.vy = JUMP_FORCE * 0.95;
                player.vx = pushDirection * RUN_SPEED * 1.5;
                player.direction = pushDirection as 1 | -1;
                player.isClimbing = false;
                audioSynth.playJump();
                spawnSparkles(player.x + player.width/2, player.y + player.height/2, "#22c55e", 8);
              }
              // Double jump ability to save players over gaps!
              else if (!doubleJumpRef.current) {
                doubleJumpRef.current = true;
                setHasDoubleJumped(true);
                player.vy = DOUBLE_JUMP_FORCE;
                audioSynth.playJump();
                spawnSparkles(player.x + player.width/2, player.y + player.height/2, "#a855f7", 12);
              }
            }
          } else {
            keysPressedRef.current['SpaceTriggered'] = false;
          }
        }

        // Apply displacements and handle sequential Tile-Grid AABB collisions
        // ----------------------------------------------------
        // 1. Move Horizontally
        player.x += player.vx;
        
        // Prevent player leaving left maps boundary
        if (player.x < 0) {
          player.x = 0;
          player.vx = 0;
        }

        if (player.x + player.width > totalMapWidth) {
          player.x = totalMapWidth - player.width;
          player.vx = 0;
        }

        // Resolve Horizontal Collisions with Tiles
        let tColStart = Math.floor(player.x / TILE_SIZE);
        let tColEnd = Math.floor((player.x + player.width - 0.1) / TILE_SIZE);
        let tRowStart = Math.floor(player.y / TILE_SIZE);
        let tRowEnd = Math.floor((player.y + player.height - 0.1) / TILE_SIZE);

        for (let r = tRowStart; r <= tRowEnd; r++) {
          for (let c = tColStart; c <= tColEnd; c++) {
            if (r >= 0 && r < grid.length && c >= 0 && c < mapCols) {
              const tile = grid[r][c];
              // Solid tile check
              if (tile === TileType.GROUND || tile === TileType.BRICK || tile === TileType.SOLID_BLOCK || tile === TileType.MYSTERY_BOX) {
                if (player.vx > 0) {
                  player.x = c * TILE_SIZE - player.width;
                  player.vx = 0;
                } else if (player.vx < 0) {
                  player.x = (c + 1) * TILE_SIZE;
                  player.vx = 0;
                }
              }
            }
          }
        }

        // 2. Move Vertically
        player.y += player.vy;
        
        tColStart = Math.floor(player.x / TILE_SIZE);
        tColEnd = Math.floor((player.x + player.width - 0.1) / TILE_SIZE);
        tRowStart = Math.floor(player.y / TILE_SIZE);
        tRowEnd = Math.floor((player.y + player.height - 0.1) / TILE_SIZE);

        player.onGround = false;

        for (let r = tRowStart; r <= tRowEnd; r++) {
          for (let c = tColStart; c <= tColEnd; c++) {
            if (r >= 0 && r < grid.length && c >= 0 && c < mapCols) {
              const tile = grid[r][c];
              if (tile === TileType.GROUND || tile === TileType.BRICK || tile === TileType.SOLID_BLOCK || tile === TileType.MYSTERY_BOX) {
                if (player.vy > 0) {
                  // Landing on top
                  player.y = r * TILE_SIZE - player.height;
                  player.vy = 0;
                  player.onGround = true;
                  doubleJumpRef.current = false;
                  setHasDoubleJumped(false);
                } 
                else if (player.vy < 0) {
                  // Hitting Head from underneath! (Mario block hit mechanic!)
                  player.y = (r + 1) * TILE_SIZE;
                  player.vy = 0;
                  
                  if (tile === TileType.BRICK) {
                    // Destroy block
                    grid[r][c] = TileType.EMPTY;
                    audioSynth.playBrickDestroy();
                    spawnBrickDebris(c, r);
                    setScore(prev => prev + 100);
                  } 
                  else if (tile === TileType.MYSTERY_BOX) {
                    // Collect Box Coin
                    grid[r][c] = TileType.SOLID_BLOCK; // Turns solid
                    audioSynth.playCoin();
                    setCoins(prev => prev + 1);
                    setScore(prev => prev + 200);
                    // Spawn rising coin sparkles
                    spawnSparkles(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE, "#fcd34d", 8);
                  }
                }
              }
            }
          }
        }

        // If player falls below the screen (deadly bottom pits)
        if (player.y > canvas.height + 100) {
          triggerDamage();
          if (!player.isDead) {
            // Teleport back near start or safe coordinate
            player.x = currentLevel.startX || 80;
            player.y = 100;
            player.vx = 0;
            player.vy = 0;
            player.isClimbing = false;
          }
        }

        // 3. Item & Hazard overlap detections (Overlap center calculations)
        // ----------------------------------------------------
        tColStart = Math.floor(player.x / TILE_SIZE);
        tColEnd = Math.floor((player.x + player.width - 0.1) / TILE_SIZE);
        tRowStart = Math.floor(player.y / TILE_SIZE);
        tRowEnd = Math.floor((player.y + player.height - 0.1) / TILE_SIZE);

        for (let r = tRowStart; r <= tRowEnd; r++) {
          for (let c = tColStart; c <= tColEnd; c++) {
            if (r >= 0 && r < grid.length && c >= 0 && c < mapCols) {
              const tile = grid[r][c];
              
              if (tile === TileType.COIN) {
                grid[r][c] = TileType.EMPTY;
                audioSynth.playCoin();
                setCoins(prev => prev + 1);
                setScore(prev => prev + 100);
                spawnSparkles(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, "#fcf151", 5);
              } 
              else if (tile === TileType.GEMS) {
                grid[r][c] = TileType.EMPTY;
                audioSynth.playCoin(); // High value chime!
                setScore(prev => prev + 500);
                spawnSparkles(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, "#3b82f6", 15);
                activePromptRef.current = "Permata Biru Tersembunyi! +500 Poin!";
                promptTimerRef.current = 120;
              } 
              else if (tile === TileType.KEY) {
                grid[r][c] = TileType.EMPTY;
                audioSynth.playKeyCollect();
                setHasKey(true);
                spawnSparkles(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, "#fcd34d", 12);
                activePromptRef.current = "Kunci Emas Diambil! Pintu Gerbang Terbuka!";
                promptTimerRef.current = 150;
              } 
              else if (tile === TileType.HEART) {
                grid[r][c] = TileType.EMPTY;
                audioSynth.playKeyCollect();
                setLives(prev => Math.min(5, prev + 1));
                spawnSparkles(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, "#ef4444", 8);
                activePromptRef.current = "Nyawa Tambahan Terkumpul!";
                promptTimerRef.current = 120;
              }
              else if (tile === TileType.PORTAL) {
                // To complete, must either have key or map doesn't strictly lock it
                if (!currentLevel.hasKey || hasKey) {
                  audioSynth.playVictory();
                  onLevelComplete(score + 1000, coins);
                  cancelAnimationFrame(frameIdRef.current!);
                  return;
                } else {
                  // Locked!
                  activePromptRef.current = "Portal Terkunci! Anda memerlukan Kunci Emas 'K'!";
                  promptTimerRef.current = 100;
                }
              }
              else if (tile === TileType.SPIKES || tile === TileType.SPIKES_UP) {
                triggerDamage();
              }
            }
          }
        }
      }

      // ----------------------------------------------------
      // ENEMY LOGIC & COLLISIONS
      // ----------------------------------------------------
      const activeEnemies = enemiesRef.current;
      for (let i = 0; i < activeEnemies.length; i++) {
        const enemy = activeEnemies[i];
        if (enemy.isDead) {
          enemy.deathTimer--;
          continue;
        }

        // Apply patrol run boundaries
        enemy.x += enemy.vx;
        const currentDist = Math.abs(enemy.x - enemy.start_x);
        if (currentDist >= enemy.patrolRange || enemy.x < TILE_SIZE || enemy.x > totalMapWidth - TILE_SIZE) {
          enemy.direction = (enemy.direction * -1) as 1 | -1;
          enemy.vx = Math.abs(enemy.vx) * enemy.direction;
        }

        // Basic falling gravity for slimes
        if (enemy.type === 'slime') {
          enemy.vy += GRAVITY;
          enemy.y += enemy.vy;

          // Check landing ground
          const eCol = Math.floor(enemy.x / TILE_SIZE);
          const eRow = Math.floor((enemy.y + enemy.height) / TILE_SIZE);
          if (eRow >= 0 && eRow < grid.length && eCol >= 0 && eCol < mapCols) {
            const floorTile = grid[eRow][eCol];
            if (floorTile === TileType.GROUND || floorTile === TileType.SOLID_BLOCK) {
              enemy.y = eRow * TILE_SIZE - enemy.height;
              enemy.vy = 0;
            }
          }
        }

        // Check contact overlap with Player
        if (!player.isDead) {
          const overlapX = player.x < enemy.x + enemy.width && player.x + player.width > enemy.x;
          const overlapY = player.y < enemy.y + enemy.height && player.y + player.height > enemy.y;

          if (overlapX && overlapY) {
            // Hit from top? (Mario landing squash head crush!)
            const footPos = player.y + player.height;
            const enemyHead = enemy.y + 10;
            
            if (player.vy > 0 && footPos <= enemyHead + 8 && !player.isClimbing) {
              // Squash enemy!
              enemy.isDead = true;
              enemy.deathTimer = 30; // Shorter decay
              player.vy = JUMP_FORCE * 0.8; // High spring retro jump bounce!
              audioSynth.playBrickDestroy();
              setScore(prev => prev + 300);
              spawnSparkles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, "#eab308", 12);
              
              // Floating text notification
              activePromptRef.current = "Musuh dikalahkan! +300 Poin!";
              promptTimerRef.current = 100;
            } else {
              // Hurt player
              triggerDamage();
            }
          }
        }
      }

      // ----------------------------------------------------
      // CAMERA SMOOTH SCROLLING
      // ----------------------------------------------------
      const cameraTargetX = player.x - canvas.width / 2;
      cameraXRef.current += (cameraTargetX - cameraXRef.current) * 0.08;
      // Clamp view constraints
      cameraXRef.current = Math.max(0, Math.min(cameraXRef.current, totalMapWidth - canvas.width));

      // ----------------------------------------------------
      // RENDER VISUALS (PARALLAX & TILE GRID)
      // ----------------------------------------------------
      const scrollX = cameraXRef.current;

      // Draw Parallax sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, currentLevel.skyColor);
      skyGrad.addColorStop(1, currentLevel.ambientType === 'sunny' ? '#ffffff' : '#020617');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0,0, canvas.width, canvas.height);

      // Procedural pixel clouds background (sunny)
      if (currentLevel.ambientType === 'sunny') {
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        for (let i = 0; i < 5; i++) {
          const cx = ((150 + i * 400) - scrollX * 0.15) % (totalMapWidth + 200) - 100;
          const cy = 60 + (i % 2) * 40;
          // Draw standard cloud bento squares style
          ctx.fillRect(cx, cy, 70, 20);
          ctx.fillRect(cx + 15, cy - 12, 40, 15);
        }
      } else if (currentLevel.ambientType === 'cave') {
        // Cave glowing Stalactites or background textures
        ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
        for (let i = 0; i < 8; i++) {
          const cx = ((80 + i * 360) - scrollX * 0.3) % (canvas.width + 100);
          ctx.beginPath();
          ctx.moveTo(cx, 0);
          ctx.lineTo(cx + 30, 0);
          ctx.lineTo(cx + 15, 60 + (i % 3) * 30);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Volcano embers floating upwards
        ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
        for (let i = 0; i < 15; i++) {
          const cx = (Math.sin(tickRef.current / 30 + i) * 30 + (i * 120) - scrollX * 0.2) % (canvas.width + 100);
          const cy = (canvas.height - (tickRef.current + i * 40) % canvas.height);
          ctx.fillRect(cx, cy, 4, 4);
        }
      }

      // Draw Hills (Parallax mountain backdrop scrolling at 30% speed)
      ctx.fillStyle = currentLevel.ambientType === 'sunny' ? "rgba(34, 197, 94, 0.15)" : "rgba(30, 41, 59, 0.4)";
      for (let i = 0; i < 6; i++) {
        const hillX = (i * 300 - scrollX * 0.3) % (totalMapWidth + 100);
        ctx.beginPath();
        ctx.moveTo(hillX, canvas.height);
        ctx.lineTo(hillX + 150, canvas.height - 150);
        ctx.lineTo(hillX + 300, canvas.height);
        ctx.closePath();
        ctx.fill();
      }

      // Draw Tiles (only within visible bounds for speed)
      const startVisibleCol = Math.floor(scrollX / TILE_SIZE);
      const endVisibleCol = Math.ceil((scrollX + canvas.width) / TILE_SIZE);

      for (let r = 0; r < grid.length; r++) {
        for (let c = startVisibleCol; c <= endVisibleCol; c++) {
          if (c >= 0 && c < mapCols) {
            const tile = grid[r][c];
            if (tile === TileType.EMPTY) continue;

            const tx = c * TILE_SIZE - scrollX;
            const ty = r * TILE_SIZE;

            // Draw Tile procedural pixel art blocks
            switch (tile) {
              case TileType.GROUND: {
                // Ground soil Block, top is green grass, side/bottom is brown soil
                ctx.fillStyle = currentLevel.groundColor;
                ctx.fillRect(tx, ty, TILE_SIZE, 8); // Grass top
                ctx.fillStyle = "#78350f"; // Brown dirt
                ctx.fillRect(tx, ty + 8, TILE_SIZE, TILE_SIZE - 8);
                // Soil pixel details
                ctx.fillStyle = "#451a03"; 
                ctx.fillRect(tx + 6, ty + 16, 4, 4);
                ctx.fillRect(tx + 22, ty + 24, 6, 4);
                ctx.fillRect(tx + 12, ty + 30, 4, 4);
                break;
              }
              case TileType.BRICK: {
                // Red breakable bricks with cement lines
                ctx.fillStyle = "#b45309"; 
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = "#451a03"; // Mortar line shadows
                ctx.fillRect(tx, ty + TILE_SIZE - 3, TILE_SIZE, 3);
                ctx.fillRect(tx + TILE_SIZE / 2, ty, 3, TILE_SIZE / 2);
                ctx.fillRect(tx, ty + TILE_SIZE / 2, TILE_SIZE, 3);
                ctx.fillRect(tx + 8, ty + TILE_SIZE / 2, 3, TILE_SIZE / 2);
                ctx.fillRect(tx + 28, ty + TILE_SIZE / 2, 3, TILE_SIZE / 2);
                // Brick highlights
                ctx.fillStyle = "#f59e0b";
                ctx.fillRect(tx + 2, ty + 2, 10, 3);
                ctx.fillRect(tx + 22, ty + 2, 12, 3);
                ctx.fillRect(tx + 2, ty + TILE_SIZE / 2 + 2, 4, 3);
                ctx.fillRect(tx + 12, ty + TILE_SIZE / 2 + 2, 12, 3);
                break;
              }
              case TileType.MYSTERY_BOX: {
                // Golden glowing question block (flashing frame)
                const isBright = Math.floor(tickRef.current / 10) % 2 === 0;
                ctx.fillStyle = isBright ? "#f59e0b" : "#b45309";
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                // Bezel
                ctx.strokeStyle = "#451a03";
                ctx.lineWidth = 3;
                ctx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                // Rivets in corners
                ctx.fillStyle = "#451a03";
                ctx.fillRect(tx + 4, ty + 4, 3, 3);
                ctx.fillRect(tx + TILE_SIZE - 8, ty + 4, 3, 3);
                ctx.fillRect(tx + 4, ty + TILE_SIZE - 8, 3, 3);
                ctx.fillRect(tx + TILE_SIZE - 8, ty + TILE_SIZE - 8, 3, 3);
                // Question Mark '?' in pixel letters
                ctx.fillStyle = isBright ? "#ffffff" : "#fcd34d";
                ctx.fillRect(tx + 16, ty + 10, 10, 4);
                ctx.fillRect(tx + 22, ty + 14, 4, 10);
                ctx.fillRect(tx + 18, ty + 20, 6, 4);
                ctx.fillRect(tx + 18, ty + 28, 4, 4);
                break;
              }
              case TileType.SOLID_BLOCK: {
                // Gray unbreakable high stone
                ctx.fillStyle = "#57534e"; 
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = "#292524"; // Shadow bottom
                ctx.fillRect(tx, ty + TILE_SIZE - 4, TILE_SIZE, 4);
                ctx.fillRect(tx + TILE_SIZE - 4, ty, 4, TILE_SIZE);
                ctx.fillStyle = "#78716c"; // highlight
                ctx.fillRect(tx, ty, TILE_SIZE, 4);
                ctx.fillRect(tx, ty, 4, TILE_SIZE);
                // Center cross carving
                ctx.strokeStyle = "rgba(0,0,0,0.3)";
                ctx.lineWidth = 1;
                ctx.strokeRect(tx + 8, ty + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                break;
              }
              case TileType.SPIKES: {
                // Floor metallic Spikes
                ctx.fillStyle = "#94a3b8";
                for (let i = 0; i < 4; i++) {
                  const spx = tx + i * 10;
                  ctx.beginPath();
                  ctx.moveTo(spx, ty + TILE_SIZE);
                  ctx.lineTo(spx + 5, ty + TILE_SIZE - 16);
                  ctx.lineTo(spx + 10, ty + TILE_SIZE);
                  ctx.closePath();
                  ctx.fill();
                  
                  // Highlight edge
                  ctx.fillStyle = "#e2e8f0";
                  ctx.fillRect(spx + 4, ty + TILE_SIZE - 10, 2, 8);
                  ctx.fillStyle = "#64748b";
                }
                break;
              }
              case TileType.SPIKES_UP: {
                // Hanging Ceiling Spikes
                ctx.fillStyle = "#94a3b8";
                for (let i = 0; i < 4; i++) {
                  const spx = tx + i * 10;
                  ctx.beginPath();
                  ctx.moveTo(spx, ty);
                  ctx.lineTo(spx + 5, ty + 16);
                  ctx.lineTo(spx + 10, ty);
                  ctx.closePath();
                  ctx.fill();
                }
                break;
              }
              case TileType.WALL_CLIMBABLE: {
                // Vine climb texture of wood and green leaves
                ctx.fillStyle = "#78350f"; // Vine spine
                ctx.fillRect(tx + 16, ty, 8, TILE_SIZE);
                // Large green leaves
                ctx.fillStyle = "#15803d";
                ctx.fillRect(tx + 6, ty + 6, 12, 8);
                ctx.fillRect(tx + 20, ty + 18, 14, 8);
                ctx.fillRect(tx + 4, ty + 26, 12, 8);
                // Highlights
                ctx.fillStyle = "#22c55e";
                ctx.fillRect(tx + 8, ty + 8, 4, 3);
                ctx.fillRect(tx + 24, ty + 20, 6, 3);
                break;
              }
              case TileType.SECRET_PASSAGE: {
                // Looks exactly like BRICK but semi-transparent in real-time or dotted
                ctx.fillStyle = "rgba(180, 83, 9, 0.4)"; // ghost brick
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
                ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
                break;
              }
              case TileType.COIN: {
                // Spinning golden coin physics
                const rot = (tickRef.current / 4) % 4;
                ctx.fillStyle = "#fbbf24";
                ctx.beginPath();
                if (rot === 0 || rot === 2) {
                  // Full oval
                  ctx.ellipse(tx + TILE_SIZE/2, ty + TILE_SIZE/2, 8, 12, 0, 0, Math.PI * 2);
                } else if (rot === 1) {
                  // Slim
                  ctx.ellipse(tx + TILE_SIZE/2, ty + TILE_SIZE/2, 3, 12, 0, 0, Math.PI * 2);
                } else {
                  // Extra slim
                  ctx.ellipse(tx + TILE_SIZE/2, ty + TILE_SIZE/2, 1, 12, 0, 0, Math.PI * 2);
                }
                ctx.fill();
                // inner sparkle
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(tx + TILE_SIZE/2 - 2, ty + TILE_SIZE/2 - 4, 3, 4);
                break;
              }
              case TileType.GEMS: {
                // Blue sapphire Gem
                const jumpOffset = Math.sin(tickRef.current / 10) * 3;
                ctx.fillStyle = "#2563eb"; // sapphire blue
                ctx.beginPath();
                ctx.moveTo(tx + 20, ty + 8 + jumpOffset);
                ctx.lineTo(tx + 30, ty + 16 + jumpOffset);
                ctx.lineTo(tx + 30, ty + 26 + jumpOffset);
                ctx.lineTo(tx + 20, ty + 34 + jumpOffset);
                ctx.lineTo(tx + 10, ty + 26 + jumpOffset);
                ctx.lineTo(tx + 10, ty + 16 + jumpOffset);
                ctx.closePath();
                ctx.fill();
                
                // Gem shine highlight
                ctx.fillStyle = "#60a5fa";
                ctx.fillRect(tx + 15, ty + 14 + jumpOffset, 6, 8);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(tx + 18, ty + 16 + jumpOffset, 3, 3);
                break;
              }
              case TileType.KEY: {
                // Golden Key
                const floatOffset = Math.sin(tickRef.current / 8) * 4;
                ctx.fillStyle = "#eab308";
                // Head ring
                ctx.beginPath();
                ctx.arc(tx + 14, ty + 18 + floatOffset, 6, 0, Math.PI*2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = currentLevel.backgroundColor; // Hole
                ctx.beginPath();
                ctx.arc(tx + 14, ty + 18 + floatOffset, 2, 0, Math.PI*2);
                ctx.closePath();
                ctx.fill();
                
                // Shaft
                ctx.fillStyle = "#eab308";
                ctx.fillRect(tx + 20, ty + 16 + floatOffset, 12, 4);
                // Teeth
                ctx.fillRect(tx + 26, ty + 20 + floatOffset, 3, 6);
                ctx.fillRect(tx + 30, ty + 20 + floatOffset, 3, 6);
                break;
              }
              case TileType.HEART: {
                // Heart life
                const pulse = 1 + Math.sin(tickRef.current / 8) * 0.1;
                ctx.save();
                ctx.translate(tx + TILE_SIZE/2, ty + TILE_SIZE/2);
                ctx.scale(pulse, pulse);
                ctx.fillStyle = "#ef4444";
                ctx.beginPath();
                ctx.moveTo(0, 8);
                ctx.bezierCurveTo(8, 0, 10, -10, 0, -14);
                ctx.bezierCurveTo(-10, -10, -8, 0, 0, 8);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                break;
              }
              case TileType.PORTAL: {
                // Ancient Stone Arch Exit portal
                ctx.fillStyle = "#44403c"; // Dark stone frame
                ctx.fillRect(tx, ty - TILE_SIZE, TILE_SIZE, TILE_SIZE * 2);
                
                // Portal opening swirling energy
                const portalColor = (!currentLevel.hasKey || hasKey) ? "rgba(59, 130, 246, 0.65)" : "rgba(239, 68, 68, 0.4)";
                ctx.fillStyle = portalColor;
                ctx.fillRect(tx + 6, ty - TILE_SIZE + 6, TILE_SIZE - 12, TILE_SIZE * 2 - 12);
                
                // Draws swirls
                ctx.fillStyle = "#ffffff";
                for (let n = 0; n < 3; n++) {
                  const sY = (ty - TILE_SIZE + 10 + (tickRef.current * 1.5 + n * 25) % (TILE_SIZE * 2 - 20));
                  const sX = tx + 10 + Math.sin(sY / 10 + tickRef.current / 8) * 8;
                  ctx.fillRect(sX, sY, 4, 4);
                }
                
                // Border light
                ctx.strokeStyle = "#fbbf24";
                ctx.lineWidth = 2;
                ctx.strokeRect(tx + 4, ty - TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE * 2 - 8);
                break;
              }
            }
          }
        }
      }

      // ----------------------------------------------------
      // DRAW DECORATION SECRETS & CLUES
      // ----------------------------------------------------
      // Add subtle glittering stars around secret blocks to aid the explorer!
      if (tickRef.current % 18 === 0) {
        for (let r = 0; r < grid.length; r++) {
          for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c] === TileType.SECRET_PASSAGE && Math.random() < 0.15) {
              spawnSparkles(c*TILE_SIZE + Math.random()*TILE_SIZE, r*TILE_SIZE + Math.random()*TILE_SIZE, "#60a5fa", 1);
            }
          }
        }
      }

      // ----------------------------------------------------
      // DRAW ACTIVE PARTICLES
      // ----------------------------------------------------
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        
        // Apply tiny gravity to shard debris
        if (p.type === 'brick_shard') {
          p.vy += 0.25;
        }

        // Render particles
        if (p.type === 'dash_ghost') {
          // Draw a fading rectangular blur representing player trail
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - scrollX, p.y, p.size, 36);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - scrollX, p.y, p.size, p.size);
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      // ----------------------------------------------------
      // DRAW ADVENTURER HERO (PROD-QUALITY SPRITE HAND DRAFTED)
      // ----------------------------------------------------
      if (!player.isDead || player.deathAnimationTime > 0) {
        // Blink rendering when player is recently damaged (invincible state)
        const isBlinking = player.invincibilityTime > 0 && Math.floor(player.invincibilityTime / 6) % 2 === 0;
        
        if (!isBlinking) {
          ctx.save();
          // Translate to player center to support clean flipping depending on movement direction
          const px = player.x - scrollX;
          const py = player.y;

          // Procedural Retro Sprite Drawing
          // Let's draw: Red Cap, Blue Overalls, Skin face, brown hair, mustache!
          ctx.fillStyle = "#ef4444"; // Red retro cap
          if (player.direction === 1) { // Facing Right
            ctx.fillRect(px + 4, py, 14, 5); // Main lid
            ctx.fillRect(px + 8, py + 5, 12, 2); // Cap visor
          } else { // Facing Left
            ctx.fillRect(px + 6, py, 14, 5);
            ctx.fillRect(px + 4, py + 5, 12, 2);
          }

          // Face & hair
          ctx.fillStyle = "#ffe4e6"; // Skin tone beige
          ctx.fillRect(px + 6, py + 7, 12, 8); // Face square
          ctx.fillStyle = "#78350f"; // Brown hair/mustache
          if (player.direction === 1) {
            ctx.fillRect(px + 4, py + 7, 4, 6); // hair back
            ctx.fillStyle = "#000000"; // Mini black eye
            ctx.fillRect(px + 14, py + 9, 2, 2);
            ctx.fillStyle = "#78350f"; // Mustache
            ctx.fillRect(px + 12, py + 11, 4, 2);
          } else {
            ctx.fillRect(px + 16, py + 7, 4, 6);
            ctx.fillStyle = "#000000";
            ctx.fillRect(px + 8, py + 9, 2, 2);
            ctx.fillStyle = "#78350f";
            ctx.fillRect(px + 8, py + 11, 4, 2);
          }

          // Overalls/Over shirt (Blue)
          ctx.fillStyle = "#2563eb"; // Blue overall pants
          if (player.isCrouching) {
            ctx.fillRect(px + 4, py + 15, 16, 7); // Shorter squat Overalls
          } else {
            ctx.fillRect(px + 4, py + 15, 16, 15); // Shirt and waist
          }

          // Red Shirt elements
          ctx.fillStyle = "#ef4444"; // Red shirt neck and sleeves
          ctx.fillRect(px + 6, py + 15, 12, 4);
          
          if (player.isClimbing) {
            // Draw arms grasping climbing surface
            ctx.fillStyle = "#ffe4e6";
            ctx.fillRect(px + 2, py + 12, 4, 4);
            ctx.fillRect(px + 18, py + 12, 4, 4);
          } else {
            // Swaying hands
            ctx.fillStyle = "#ffe4e6";
            const armSway = Math.sin(tickRef.current / 4) * 3;
            if (Math.abs(player.vx) > 0.5) {
              if (player.direction === 1) {
                ctx.fillRect(px - 1 + armSway/2, py + 18, 4, 4);
                ctx.fillRect(px + 18 - armSway/2, py + 18, 4, 4);
              } else {
                ctx.fillRect(px + 1 - armSway/2, py + 18, 4, 4);
                ctx.fillRect(px + 16 + armSway/2, py + 18, 4, 4);
              }
            } else {
              ctx.fillRect(px + 2, py + 18, 4, 4);
              ctx.fillRect(px + 18, py + 18, 4, 4);
            }
          }

          // Boots (Brown shoes)
          ctx.fillStyle = "#451a03"; // Brown boots
          if (player.isCrouching) {
            ctx.fillRect(px + 4, py + 22, 5, 2);
            ctx.fillRect(px + 15, py + 22, 5, 2);
          } else {
            // Animated walking boots
            const step = Math.floor(tickRef.current / 6) % 2 === 0;
            if (Math.abs(player.vx) > 0.5 && player.onGround) {
              ctx.fillRect(px + (step ? 2 : 4), py + 30, 6, 6);
              ctx.fillRect(px + (step ? 12 : 14), py + 30, 6, 6);
            } else {
              ctx.fillRect(px + 3, py + 30, 6, 6);
              ctx.fillRect(px + 15, py + 30, 6, 6);
            }
          }

          // Dashing indicator shroud
          if (player.isDashing) {
            ctx.fillStyle = "rgba(96, 165, 250, 0.4)";
            ctx.fillRect(px - 4, py - 2, player.width + 8, player.height + 4);
          }

          ctx.restore();
        }
      }

      // ----------------------------------------------------
      // DRAW ENEMIES
      // ----------------------------------------------------
      for (let i = 0; i < activeEnemies.length; i++) {
        const enemy = activeEnemies[i];
        if (enemy.isDead) continue;

        const ex = enemy.x - scrollX;
        const ey = enemy.y;

        if (enemy.type === 'slime') {
          // Green slimy blob with blinking eyes
          const squashHeight = 4 * Math.sin(tickRef.current / 12);
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(ex, ey + squashHeight, enemy.width, enemy.height - squashHeight);
          
          // Outer border
          ctx.strokeStyle = "#14532d";
          ctx.lineWidth = 1;
          ctx.strokeRect(ex, ey + squashHeight, enemy.width, enemy.height - squashHeight);

          // Slime face
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(ex + 6, ey + squashHeight + 6, 4, 4);
          ctx.fillRect(ex + 18, ey + squashHeight + 6, 4, 4);
          ctx.fillStyle = "#000000";
          ctx.fillRect(ex + 8, ey + squashHeight + 8, 2, 2);
          ctx.fillRect(ex + 20, ey + squashHeight + 8, 2, 2);
        } else {
          // Beetle: Orange armored retro shell crawling fast with legs
          ctx.fillStyle = "#f97316"; 
          ctx.fillRect(ex, ey, enemy.width, enemy.height);
          
          // Shell lines
          ctx.fillStyle = "#7c2d12"; 
          ctx.fillRect(ex + enemy.width - 6, ey + 4, 4, 4); // Eye
          ctx.fillRect(ex, ey + enemy.height - 4, enemy.width, 3); // Base
          
          // Moving legs
          const legSteward = Math.floor(tickRef.current / 4) % 2 === 0;
          ctx.fillStyle = "#1e293b";
          if (legSteward) {
            ctx.fillRect(ex + 4, ey + enemy.height, 4, 4);
            ctx.fillRect(ex + 18, ey + enemy.height, 4, 4);
          } else {
            ctx.fillRect(ex + 10, ey + enemy.height, 4, 4);
            ctx.fillRect(ex + 22, ey + enemy.height, 4, 4);
          }
        }
      }

      // ----------------------------------------------------
      // DRAW UPPER UI LABELS/MESSAGES
      // ----------------------------------------------------
      if (promptTimerRef.current > 0) {
        promptTimerRef.current--;
        
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fbbf24";
        
        const dialogW = 520;
        const dialogH = 48;
        const dialogX = (canvas.width - dialogW) / 2;
        const dialogY = 24;
        
        ctx.fillRect(dialogX, dialogY, dialogW, dialogH);
        ctx.strokeRect(dialogX, dialogY, dialogW, dialogH);
        
        // Render text
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(activePromptRef.current, canvas.width/2, dialogY + 28);
        ctx.restore();
      }

      // Check for level complete conditions or trigger deaths
      // Loop execution
      frameIdRef.current = requestAnimationFrame(gameLoop);
    };

    frameIdRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [currentLevel, isPaused, customLevelGrid, hasKey, score, coins]);

  // Handle manual pause toggling
  const handleTogglePause = () => {
    setIsPaused(prev => !prev);
  };

  return (
    <div className="flex flex-col items-center bg-[#2d1b10] rounded-2xl border-[12px] border-[#3e2723] overflow-hidden w-full relative shadow-2xl" id="game_arena_container" ref={containerRef}>
      
      {/* HUD Header Bar Overlay */}
      <div className="w-full bg-[#1a1a1a]/40 p-4 border-b-4 border-[#1a1a1a]/60 flex flex-wrap justify-between items-center text-white backdrop-blur-md" id="game_hud_top">
        <div className="flex items-center space-x-6">
          <button 
            onClick={onBackToMenu}
            className="flex items-center space-x-1 hover:text-[#ffd700] font-retro text-[9px] bg-[#3e2723] px-3 py-1.5 rounded-md border-2 border-[#1a1a1a] hover:border-[#ffd700] active:translate-y-0.5 transition cursor-pointer font-bold"
            id="back_to_menu"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#ffd700]" />
            <span>MENU</span>
          </button>
          
          <div className="flex flex-col">
            <span className="text-[9px] text-stone-400 font-retro">STAGE</span>
            <span className="font-retro text-xs text-[#ffd700] font-bold">{currentLevel.name}</span>
          </div>
        </div>

        {/* Dynamic score dashboard */}
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-stone-400 font-retro">SKOR</span>
            <span className="font-retro text-sm text-[#ffd700] font-bold">{score}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[8px] text-stone-400 font-retro">KOIN</span>
            <span className="font-retro text-sm text-amber-400 font-bold">🪙 {coins}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[8px] text-stone-400 font-retro">NYAWA</span>
            <div className="flex space-x-0.5 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span 
                  key={i} 
                  className={`text-xs ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-stone-700 opacity-40'}`}
                >
                  ❤️
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[8px] text-stone-400 font-retro">KUNCI</span>
            <span className={`text-sm ${hasKey ? 'text-[#ffd700] animate-pulse scale-110' : 'text-stone-600 opacity-35'}`}>
              🔑
            </span>
          </div>
        </div>

        {/* Audio / Control Toggles */}
        <div className="flex items-center space-x-2">
          {/* Mute button */}
          <button 
            onClick={() => setIsMuted(prev => !prev)}
            className="p-1 px-2.5 bg-[#3e2723] hover:bg-[#3e2723]/80 outline-none border border-[#1a1a1a] rounded transition cursor-pointer"
            id="mute_game_audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#00ffcc]" />}
          </button>
          <button 
            onClick={handleTogglePause}
            className="p-1 px-3 bg-[#3e2723] hover:bg-[#3e2723]/80 text-[10px] font-retro outline-none border border-[#1a1a1a] rounded text-[#ffd700] active:scale-95 transition cursor-pointer font-bold"
            id="pause_game"
          >
            {isPaused ? 'RESUME' : 'PAUS'}
          </button>
        </div>
      </div>

      {/* Actual HTML5 Canvas Area */}
      <div className="relative w-full flex justify-center bg-black/40 p-2" id="canvas_viewport_window">
        <canvas 
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="bg-black/98 max-w-full rounded border-2 border-slate-950 shadow-2xl overflow-hidden"
          id="retro_platformer_canvas"
        />

        {/* Custom Stamina stamina/energy details Overlay overlay on top-left of viewport */}
        <div className="absolute top-4 left-6 flex flex-col space-y-1.5 pointer-events-none bg-[#1a1a1a]/85 p-2.5 rounded border border-[#3e2723]" id="stamina_overlay">
          {/* Wall-climb energy */}
          <div className="flex items-center space-x-2">
            <span className="text-[7px] font-retro text-emerald-400 font-bold">ENERGI PANJAT:</span>
            <div className="w-20 bg-[#2d1b10] h-2.5 rounded-full overflow-hidden border border-[#1a1a1a]">
              <div 
                className={`h-full transition-all duration-100 ${stamina < 30 ? 'bg-rose-500 animate-pulse' : stamina < 65 ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                style={{ width: `${stamina}%` }} 
              />
            </div>
          </div>
          
          {/* Dash charge state */}
          <div className="flex items-center space-x-2">
            <span className="text-[7px] font-retro text-blue-400 font-bold">DASH CD:</span>
            <div className="w-20 bg-[#2d1b10] h-2.5 rounded-full overflow-hidden border border-[#1a1a1a] flex justify-end">
              <div 
                className={`h-full bg-blue-500 transition-all ${dashCd <= 0 ? 'bg-[#ffd700] w-full' : 'bg-[#3e2723]'}`} 
                style={{ width: `${Math.max(0, 100 - (dashCd / DASH_COOLDOWN_MAX) * 100)}%` }} 
              />
            </div>
            {dashCd <= 0 && <span className="text-[6px] font-retro text-[#ffd700] animate-ping font-bold">READY</span>}
          </div>

          {/* Jump indicator */}
          <div className="flex items-center space-x-2">
            <span className="text-[7px] font-retro text-purple-400 font-bold">DOUBLE JUMP:</span>
            <span className={`text-[7px] font-retro ${hasDoubleJumped ? 'text-stone-500' : 'text-purple-300 animate-pulse font-bold'}`}>
              {hasDoubleJumped ? 'TERPAKAI' : 'READY'}
            </span>
          </div>
        </div>

        {/* Absolute Game Paused Filter Panel */}
        {isPaused && (
          <div className="absolute inset-0 bg-[#1a1a1a]/90 flex flex-col justify-center items-center backdrop-blur-sm" id="paused_backdrop">
            <div className="bg-[#2d1b10] border-[12px] border-[#3e2723] p-8 rounded-2xl max-w-sm text-center shadow-2xl flex flex-col items-center">
              <Shield className="w-12 h-12 text-[#ffd700] mb-4 animate-bounce" />
              <h3 className="font-retro text-md text-white border-b-4 border-[#1a1a1a]/60 pb-2.5 w-full tracking-wider mb-4">GAME PAUS</h3>
              <p className="text-xs text-stone-350 mb-6">Petualang sedang beristirahat! Tekan tombol di bawah untuk melanjutkan perjalanan Anda.</p>
              <button 
                onClick={handleTogglePause}
                className="w-full bg-[#ffd700] hover:bg-[#ffd700]/90 text-[#3e2723] font-retro py-3 rounded-lg border-2 border-[#1a1a1a] hover:border-[#ffd700] active:translate-y-0.5 text-xs transition cursor-pointer font-bold"
                id="resume_game_from_modal"
              >
                MAINKAN LAGI
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Informative instruction overlay footer */}
      <div className="w-full bg-[#1a1a1a]/60 text-stone-300 text-[10px] p-3 text-center border-t border-[#1a1a1a]/80 font-sans flex flex-wrap justify-center items-center gap-4 py-3">
        <div className="flex items-center space-x-1.5">
          <span className="bg-[#3e2723] px-1.5 py-0.5 rounded text-white text-[9px] font-mono border border-[#1a1a1a]">← →</span>
          <span>Bergerak</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="bg-[#3e2723] px-1.5 py-0.5 rounded text-white text-[9px] font-mono border border-[#1a1a1a]">SPACE / X</span>
          <span>Jump (Double leap!)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="bg-[#3e2723] px-1.5 py-0.5 rounded text-white text-[9px] font-mono border border-[#1a1a1a]">↑ ↓</span>
          <span>Panjat dinding (W) / Turun</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="bg-[#3e2723] px-1.5 py-0.5 rounded text-white text-[9px] font-mono border border-[#1a1a1a]">Z / SHIFT</span>
          <span>Dash</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="bg-[#3e2723] px-1.5 py-0.5 rounded text-white text-[9px] font-mono border border-[#1a1a1a]">DOWN_ARROW</span>
          <span>Jongkok (Slide kolong)</span>
        </div>
      </div>
    </div>
  );
}
