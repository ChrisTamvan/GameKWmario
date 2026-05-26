/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelConfig, TileType } from './types';

// Legendary ASCII Characters to Map Tile IDs
// . = Empty (0)
// # = Normal Ground block (1)
// [ = Breakable Brick (2)
// ? = Mystery Question Box with a Coin (3)
// X = Unbreakable Solid Brick Block (4)
// S = Spikes (Floor) (5)
// U = Ceiling Spikes (6)
// W = Climbing Wall (Vines/Veneer - 7)
// H = Hidden block (walkable, displays as Brick but transparent for player) (8)
// C = Coin (9)
// G = Blue Gem (10)
// K = Golden Key (12)
// P = Portal (Level Exit - 13)
// h = Heart (14)

const LEVEL_1_ASCII = [
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "X..................................................................................X",
  "X................................................W.................................X",
  "X........C.C.....................................W....G.G..........................X",
  "X...K...[?]?].........C..C.......................W...WWWWW.........................X",
  "X.....................####.......................W.................................X",
  "X......................................###.......W..........[?][?].C...C...........X",
  "X...###.......CC......................####.......WWWWW.............######..........X",
  "X............####....................................W.............................X",
  "X.......................W........[?]..SS..##.........W.............................X",
  "X.........C............WWWW..........#######.........W.....................P.......X",
  "X.......#####...........W............XhhhhX.........W....................#####.....X",
  "X.......................W...........................W...................X...XXX....X",
  "XHHH..................S.W........................S..W..................SX...XXXX...X",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
];

const LEVEL_2_ASCII = [
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "X..................................................................................X",
  "X.......C.C.C.........................W......................W.................K...X",
  "X......[?][?][?]......................W......................W................#####.X",
  "X.....................................W.............C.C......W.....................X",
  "X.......................WWW...........W............#####.....W.....................X",
  "X.......................W.............W......................W.....................X",
  "X...........CC..........W......C.C....W......S..................SS................X",
  "X..........####.........W.....#####...WWWWWWWWW................####................X",
  "X.......................W.....................W................X..X................X",
  "X......G................WW....................W................Xhhh................X",
  "X....#####...............W...................W................X..X.........P.......X",
  "X.......................W....................W....SS..........X..X.......#####.....X",
  "XHHHH.................S.W................S...W...####...S...S.X..X......SXXXXX.....X",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
];

// Level 3 is the ultimate Lava Castle themed challenge
const LEVEL_3_ASCII = [
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "X..................................................................................X",
  "X............C..C..C...WWW..............C.C........................................X",
  "X...........#########...W..............[?][?]...........................GGGGGG....X",
  "X.......................W..............................................WWWWWWWW....X",
  "X.......................W.......C.C............##.......................W....W.....X",
  "X.....X?X...............W......####.....................................W....W.....X",
  "X.......................W............................SS.................W....W.....X",
  "X............[?]........WS...........SS...S.........####................W.hh.W.....X",
  "X.......................W#####......####.###................C...........WWWWWW.....X",
  "X....###................W..................................###.....................X",
  "X.......................W......................WWWWWW..............................X",
  "X.......................W........S...S...S.....W....W......................P.......X",
  "XHHHH..K..............S.W.......##########....W.h.h.W....................#####.....X",
  "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
];

function parseAsciiMap(ascii: string[]): number[][] {
  const numRows = ascii.length;
  const numCols = ascii[0].length;
  const grid: number[][] = [];

  for (let r = 0; r < numRows; r++) {
    const row: number[] = [];
    for (let c = 0; c < numCols; c++) {
      const char = ascii[r][c];
      switch (char) {
        case '#': row.push(TileType.GROUND); break;
        case '[': row.push(TileType.BRICK); break;
        case '?': row.push(TileType.MYSTERY_BOX); break;
        case 'X': row.push(TileType.SOLID_BLOCK); break;
        case 'S': row.push(TileType.SPIKES); break;
        case 'U': row.push(TileType.SPIKES_UP); break;
        case 'W': row.push(TileType.WALL_CLIMBABLE); break;
        case 'H': row.push(TileType.SECRET_PASSAGE); break;
        case 'C': row.push(TileType.COIN); break;
        case 'G': row.push(TileType.GEMS); break;
        case 'K': row.push(TileType.KEY); break;
        case 'P': row.push(TileType.PORTAL); break;
        case 'h': row.push(TileType.HEART); break;
        default: row.push(TileType.EMPTY); break;
      }
    }
    grid.push(row);
  }
  return grid;
}

export function getDefaultLevels(): LevelConfig[] {
  return [
    {
      id: 1,
      name: "Greenwood Forest",
      grid: parseAsciiMap(LEVEL_1_ASCII),
      backgroundColor: "#e0f2fe", // Soft sky blue
      skyColor: "#bae6fd",
      groundColor: "#22c55e", // Greenwood Grass
      ambientType: "sunny",
      startX: 80,
      startY: 400,
      hasKey: true,
      keyPos: { x: 120, y: 160 },
      portalPos: { x: 3000, y: 400 },
      storyHint: "Lompat & cari Kunci Emas 'K' lalu panjat dinding tanaman hijau (vines/W) ke atas untuk mengambil Gem Rahasia!"
    },
    {
      id: 2,
      name: "Deep Crystal Cave",
      grid: parseAsciiMap(LEVEL_2_ASCII),
      backgroundColor: "#0f172a", // Dark night slate
      skyColor: "#1e293b",
      groundColor: "#3b82f6", // Neon blue crystals
      ambientType: "cave",
      startX: 80,
      startY: 440,
      hasKey: true,
      keyPos: { x: 3240, y: 80 },
      portalPos: { x: 3040, y: 440 },
      storyHint: "Gunakan DASH (tombol Z / Cepat melesat) melewati duri berbahaya dan panjat celah dinding meluncur!"
    },
    {
      id: 3,
      name: "Volcano Lava Castle",
      grid: parseAsciiMap(LEVEL_3_ASCII),
      backgroundColor: "#180505", // Deep scorched red-black
      skyColor: "#2d0808",
      groundColor: "#ef4444", // Scorching Lava orange-red
      ambientType: "volcano",
      startX: 80,
      startY: 440,
      hasKey: true,
      keyPos: { x: 320, y: 520 },
      portalPos: { x: 3040, y: 440 },
      storyHint: "Kastil Bara Api! Panjat cerobong dinding, waspadai duri, dan temukan celah rahasia di sebelah kiri!"
    }
  ];
}
