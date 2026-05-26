/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TileType } from '../types';
import { audioSynth } from '../audio';
import { Play, RotateCcw, Save, Trash2, HelpCircle, Layers, Paintbrush, Eraser, Check } from 'lucide-react';

interface MapEditorProps {
  onPlayCustomLevel: (grid: number[][]) => void;
  onClose: () => void;
}

export default function MapEditor({ onPlayCustomLevel, onClose }: MapEditorProps) {
  const ROWS = 15;
  const COLS = 50;
  
  // Set default blank-ish grid with border and simple structures
  const [grid, setGrid] = useState<number[][]>([]);
  const [activeTile, setActiveTile] = useState<number>(TileType.GROUND);
  const [activeTab, setActiveTab] = useState<'paint' | 'help'>('paint');

  const tilePalette = [
    { type: TileType.GROUND, label: "Rumput", icon: "🌱", color: "#22c55e", desc: "Tanah keras kokoh bagian atas" },
    { type: TileType.BRICK, label: "Batu Hancur", icon: "🧱", color: "#b45309", desc: "Dapat dihancurkan sundul dari bawah" },
    { type: TileType.MYSTERY_BOX, label: "Tanya ?", icon: "❓", color: "#f59e0b", desc: "Memberikan koin emas " },
    { type: TileType.SOLID_BLOCK, label: "Batu Baja", icon: "⬛", color: "#57534e", desc: "Tembok baja tidak bisa hancur" },
    { type: TileType.WALL_CLIMBABLE, label: "Dinding Rambat", icon: "🌿", color: "#16a34a", desc: "Bisa dipanjat ke atas/bawah (W)" },
    { type: TileType.SECRET_PASSAGE, label: "Lorong Rahasia", icon: "👁️", color: "rgba(180, 83, 9, 0.4)", desc: "Tembok ilusi yang bisa dimasuki" },
    { type: TileType.SPIKES, label: "Duri Lantai", icon: "⚠️", color: "#94a3b8", desc: "Bahaya menusuk kaki petualang" },
    { type: TileType.SPIKES_UP, label: "Duri Atap", icon: "🔺", color: "#64748b", desc: "Duri dipasang menggantung" },
    { type: TileType.COIN, label: "Koin Emas", icon: "🪙", color: "#fbbf24", desc: "Kumpulkan koin +100 skor" },
    { type: TileType.GEMS, label: "Permata Biru", icon: "💎", color: "#2563eb", desc: "Mencapai tempat rahasia! +500 skor" },
    { type: TileType.KEY, label: "Kunci Emas", icon: "🔑", color: "#eab308", desc: "Syarat membuka Portal menuju misi berikutnya" },
    { type: TileType.HEART, label: "Nyawa ❤️", icon: "💖", color: "#ef4444", desc: "Menambahkan nyawa tambahan" },
    { type: TileType.PORTAL, label: "Gerbang", icon: "🌀", color: "#ef4444", desc: "Pintu akhir level misi rahasia" },
  ];

  // Initialize fresh map
  useEffect(() => {
    resetToTemplate();
  }, []);

  const resetToTemplate = () => {
    const tempGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(TileType.EMPTY));
    
    // Add outer boundary borders
    for (let c = 0; c < COLS; c++) {
      tempGrid[0][c] = TileType.SOLID_BLOCK;  // Ceiling restriction
      tempGrid[ROWS - 1][c] = TileType.SOLID_BLOCK; // Pit protective bases
    }
    for (let r = 0; r < ROWS; r++) {
      tempGrid[r][0] = TileType.SOLID_BLOCK;
      tempGrid[r][COLS - 1] = TileType.SOLID_BLOCK;
    }

    // Design a mini sample level layout
    // Landing pad
    for (let c = 1; c < 10; c++) tempGrid[ROWS - 2][c] = TileType.GROUND;
    
    // Some brick block climb challenges
    tempGrid[ROWS - 5][6] = TileType.MYSTERY_BOX;
    tempGrid[ROWS - 5][7] = TileType.BRICK;
    tempGrid[ROWS - 5][8] = TileType.BRICK;
    tempGrid[ROWS - 6][7] = TileType.COIN;
    
    // Vertical climb walls (W)
    for (let r = ROWS - 7; r <= ROWS - 3; r++) {
      tempGrid[r][14] = TileType.WALL_CLIMBABLE;
    }
    tempGrid[ROWS - 8][14] = TileType.GEMS;
    
    // Spikes pit
    tempGrid[ROWS - 2][18] = TileType.SPIKES;
    tempGrid[ROWS - 2][19] = TileType.SPIKES;
    for (let c = 12; c < 18; c++) tempGrid[ROWS - 2][c] = TileType.GROUND;
    for (let c = 20; c < 30; c++) tempGrid[ROWS - 2][c] = TileType.GROUND;
    
    // Secrets hideout block
    tempGrid[ROWS - 2][35] = TileType.SECRET_PASSAGE;
    tempGrid[ROWS - 3][35] = TileType.SECRET_PASSAGE;
    tempGrid[ROWS - 4][35] = TileType.SECRET_PASSAGE;
    tempGrid[ROWS - 3][36] = TileType.GEMS; // inside!
    
    // Finish portal gate
    tempGrid[ROWS - 2][45] = TileType.KEY;
    tempGrid[ROWS - 2][47] = TileType.PORTAL;
    tempGrid[ROWS - 3][47] = TileType.PORTAL; // double stack height

    setGrid(tempGrid);
    audioSynth.playClimbStep();
  };

  const handleClearGrid = () => {
    if (confirm("Hapus semua kreasi map untuk mulai dari baru?")) {
      const tempGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(TileType.EMPTY));
      // Keep outer borders active
      for (let c = 0; c < COLS; c++) {
        tempGrid[0][c] = TileType.SOLID_BLOCK;
        tempGrid[ROWS - 1][c] = TileType.SOLID_BLOCK;
      }
      for (let r = 0; r < ROWS; r++) {
        tempGrid[r][0] = TileType.SOLID_BLOCK;
        tempGrid[r][COLS - 1] = TileType.SOLID_BLOCK;
      }
      setGrid(tempGrid);
      audioSynth.playBrickDestroy();
    }
  };

  const handleTileClick = (r: number, c: number) => {
    // Avoid editing outer safety borders
    if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) return;
    
    const nextGrid = [...grid];
    // If painting the same tile, toggle erase it
    if (nextGrid[r][c] === activeTile) {
      nextGrid[r][c] = TileType.EMPTY;
    } else {
      nextGrid[r][c] = activeTile;
    }
    setGrid(nextGrid);
    audioSynth.playClimbStep();
  };

  const handlePaletteSelect = (type: number) => {
    setActiveTile(type);
    audioSynth.playJump();
  };

  const handleLaunchTest = () => {
    // Verify a portal exists to ensure complete playability!
    let hasPortal = false;
    let hasKey = false;
    
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === TileType.PORTAL) hasPortal = true;
        if (grid[r][c] === TileType.KEY) hasKey = true;
      }
    }

    if (!hasPortal) {
      alert("Peringatan! Letakkan minimal 1 buah 'Gerbang Akhir' (🌀) agar level bisa diselesaikan!");
      return;
    }

    audioSynth.playVictory();
    onPlayCustomLevel(grid);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto p-4 w-full" id="map_editor_view">
      
      {/* LEFT COLUMN: Paintbrush Palette options */}
      <div className="w-full lg:w-1/4 flex flex-col space-y-4">
        
        <div className="bg-[#3e2723] border-[6px] border-[#2d1b10] p-4 rounded-xl text-white shadow-2xl flex flex-col space-y-4">
          <div className="flex items-center space-x-2 border-b-2 border-[#2d1b10] pb-2">
            <Layers className="w-5 h-5 text-[#ffd700]" />
            <h3 className="font-retro text-xs text-stone-100">PALET BLOK</h3>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 overflow-y-auto max-h-[380px] pr-1" id="tile_palette_buttons">
            {tilePalette.map((t) => {
              const isActive = activeTile === t.type;
              return (
                <button
                  key={t.type}
                  onClick={() => handlePaletteSelect(t.type)}
                  className={`flex items-center space-x-3 p-2 rounded-lg border-2 text-left text-xs transition duration-150 relative cursor-pointer ${isActive ? 'bg-[#ffd700]/20 border-[#ffd700] font-bold' : 'bg-[#2d1b10] border-[#1a1a1a] text-stone-200 hover:border-[#ffd700]'}`}
                  id={`palette_item_${t.type}`}
                >
                  <span className="text-lg bg-[#3e2723] p-1.5 rounded-md leading-none flex items-center justify-center border border-[#1a1a1a]">
                    {t.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-sans text-[11px] leading-tight text-white">{t.label}</span>
                    <span className="font-sans text-[8px] leading-tight text-stone-300 hidden lg:block overflow-hidden text-ellipsis whitespace-nowrap max-w-[130px]">{t.desc}</span>
                  </div>
                  {isActive && (
                    <span className="absolute right-2 top-2 text-[#ffd700]">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePaletteSelect(TileType.EMPTY)}
            className={`w-full py-2.5 rounded-lg border-2 text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${activeTile === TileType.EMPTY ? 'bg-rose-500/20 border-rose-400 font-bold text-white' : 'bg-[#2d1b10] border-[#1a1a1a] text-[#ffd700] hover:border-rose-700'}`}
            id="eraser_selection"
          >
            <Eraser className="w-4 h-4" />
            <span>Penghapus (Kosongkan)</span>
          </button>
        </div>

        {/* Map Guidelines and Instructions */}
        <div className="bg-[#3e2723] border-[6px] border-[#2d1b10] p-4 rounded-xl text-xs text-stone-200 space-y-2.5 shadow-2xl">
          <h4 className="font-retro text-[9px] text-[#ffd700] flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>PANDUAN CREATOR</span>
          </h4>
          <ul className="list-disc pl-4 space-y-1.5 font-sans leading-relaxed">
            <li>Karakter petualang akan otomatis muncul di koordinat bagian kiri bawah pada awal permainan.</li>
            <li>Letakkan <b>Dinding Rambat (🌿)</b> agar karakter bisa memanjat dinding mencapai atap.</li>
            <li>Letakkan <b>Laci Tanya (?)</b> atau <b>Koin (🪙)</b> sebagai harta karun berharga.</li>
            <li>Gunakan <b>Lorong Ilusi (👁️)</b> untuk menyembunyikan item rahasia berharga di balik tembok palsu!</li>
            <li>Letakkan <b>Kunci (🔑)</b> dan <b>Gerbang Akhir (🌀)</b> untuk menyelesaikan tantangan map Anda!</li>
          </ul>
        </div>
      </div>

      {/* RIGHT COLUMN: Grid Designer Canvas layout with side scrolling capabilities */}
      <div className="w-full lg:w-3/4 flex flex-col space-y-4">
        
        {/* Editor Controls strip */}
        <div className="bg-[#2d1b10] p-4 border-[6px] border-[#3e2723] rounded-xl flex flex-wrap justify-between items-center gap-3 text-white shadow-xl" id="editor_tools">
          <div className="flex items-center space-x-2">
            <Paintbrush className="w-4 h-4 text-[#ffd700] animate-pulse" />
            <h2 className="font-retro text-xs text-[#ffd700]">RETR0 MAP BUILDER</h2>
            <span className="text-[9px] text-[#00ffcc] border border-[#00ffcc] rounded px-1.5 py-0.5 ml-2">50 x 15 GRID</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={resetToTemplate}
              className="flex items-center space-x-1 hover:text-white text-stone-300 bg-[#3e2723] p-2 rounded border border-[#1a1a1a] hover:border-[#ffd700] font-sans text-xs transition cursor-pointer"
              id="reset_to_preset"
              title="Reset ke template standar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Template</span>
            </button>
            
            <button
              onClick={handleClearGrid}
              className="flex items-center space-x-1 text-rose-400 hover:text-rose-350 bg-[#3e2723] p-2 rounded border border-[#1a1a1a] hover:border-rose-905 font-sans text-xs transition cursor-pointer"
              id="clear_whole_map"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>

            <button
              onClick={handleLaunchTest}
              className="flex items-center space-x-2 bg-[#ffd700] hover:bg-[#ffd700]/90 text-[#3e2723] font-retro px-4 py-2.5 rounded border-2 border-[#1a1a1a] hover:border-[#ffd700] shadow-lg font-bold text-xs active:translate-y-0.5 transition cursor-pointer"
              id="test_play_custom_level"
            >
              <Play className="w-4 h-4 fill-[#3e2723] text-[#3e2723]" />
              <span>TEST MAP</span>
            </button>
          </div>
        </div>

        {/* Scrollable grid container paint sheet */}
        <div className="w-full bg-[#1a1a1a]/80 border-[6px] border-[#3e2723] rounded-xl overflow-x-auto p-4 flex justify-start select-none shadow-inner" id="grid_scroll_shell">
          <div className="flex flex-col gap-1 min-w-[1200px]" id="paint_columns">
            {grid.map((row, r) => (
              <div key={r} className="flex gap-1">
                {row.map((tile, c) => {
                  let visualText = "";
                  let cellBg = "bg-[#2d1b10] border-[#1a1a1a]/40";
                  
                  // Identify visual styles inside editor cells
                  switch(tile) {
                    case TileType.GROUND: visualText = "🌱"; cellBg = "bg-green-950/40 border-green-850/60"; break;
                    case TileType.BRICK: visualText = "🧱"; cellBg = "bg-amber-955/40 border-amber-900"; break;
                    case TileType.MYSTERY_BOX: visualText = "❓"; cellBg = "bg-[#ffd700]/25 border-[#ffd700]"; break;
                    case TileType.SOLID_BLOCK: visualText = "⬛"; cellBg = "bg-[#3e2723] border-[#2d1b10]"; break;
                    case TileType.WALL_CLIMBABLE: visualText = "🌿"; cellBg = "bg-[#00ffcc]/10 border-[#00ffcc]/40"; break;
                    case TileType.SECRET_PASSAGE: visualText = "👁️"; cellBg = "bg-[#ffd700]/10 border-[#ffd700]/40"; break;
                    case TileType.SPIKES: visualText = "⚠️"; cellBg = "bg-black/60 border-red-900"; break;
                    case TileType.SPIKES_UP: visualText = "🔺"; cellBg = "bg-black/60 border-red-900"; break;
                    case TileType.COIN: visualText = "🪙"; cellBg = "bg-yellow-500/10 border-yellow-500/30 animate-pulse"; break;
                    case TileType.GEMS: visualText = "💎"; cellBg = "bg-blue-500/10 border-blue-500/30"; break;
                    case TileType.KEY: visualText = "🔑"; cellBg = "bg-[#ffd700]/20 border-[#ffd700]"; break;
                    case TileType.PORTAL: visualText = "🌀"; cellBg = "bg-[#00ffcc]/15 border-[#00ffcc]"; break;
                    case TileType.HEART: visualText = "💖"; cellBg = "bg-rose-500/10 border-rose-400/50"; break;
                  }

                  const isBorder = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;

                  return (
                    <div
                      key={c}
                      onClick={() => handleTileClick(r, c)}
                      className={`w-6 h-6 flex items-center justify-center text-xs border rounded-sm cursor-pointer transition ${isBorder ? 'bg-black/30 border-stone-800 cursor-not-allowed opacity-50' : cellBg} hover:opacity-100 hover:border-[#ffd700] active:scale-95`}
                      title={`Baris ${r}, Kolom ${c}`}
                      id={`cell_${r}_${c}`}
                    >
                      {visualText}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer controls layout */}
        <div className="flex justify-between items-center bg-[#2d1b10] border-2 border-[#1a1a1a]/80 p-3 rounded-lg text-xs text-stone-300 w-full" id="editor_footer">
          <span>Geser horizontal untuk melukis ujung map sebelah kanan. Karakter spawn otomatis di sebelah kiri bawah.</span>
          <button 
            onClick={onClose}
            className="text-white hover:text-[#ffd700] font-bold bg-[#3e2723] px-4 py-1.5 rounded hover:border-[#ffd700] border border-[#1a1a1a] transition cursor-pointer"
            id="exit_editor"
          >
            KEMBALI KE MENU
          </button>
        </div>

      </div>

    </div>
  );
}
