/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getDefaultLevels } from './levels';
import { LevelConfig } from './types';
import GameCanvas from './components/GameCanvas';
import MapEditor from './components/MapEditor';
import Leaderboard from './components/Leaderboard';
import VirtualController from './components/VirtualController';
import { audioSynth } from './audio';
import { 
  Trophy, 
  Play, 
  Map, 
  Gamepad2, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Clock, 
  Heart, 
  ChevronRight, 
  Star, 
  Compass, 
  User, 
  Sparkles,
  RefreshCcw,
  ArrowLeft
} from 'lucide-react';

export default function App() {
  const [gameMode, setGameMode] = useState<'menu' | 'playing' | 'editing' | 'gameover' | 'complete' | 'leaderboard'>('menu');
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [customGrid, setCustomGrid] = useState<number[][] | undefined>(undefined);
  
  // Game scores session
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);
  
  // Mobile virtual controller states
  const [mobileControlState, setMobileControlState] = useState({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    dash: false
  });

  const [activeTab, setActiveTab] = useState<'levels' | 'controls' | 'story'>('levels');
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Load default levels
    setLevels(getDefaultLevels());
  }, []);

  const handleControlChange = (control: string, state: boolean) => {
    setMobileControlState(prev => ({
      ...prev,
      [control]: state
    }));
  };

  const handleStartLevel = (index: number) => {
    setSelectedLevelIndex(index);
    setCustomGrid(undefined);
    setGameMode('playing');
    audioSynth.playJump();
  };

  const handleStartCustomLevel = (grid: number[][]) => {
    setCustomGrid(grid);
    setGameMode('playing');
    audioSynth.playJump();
  };

  const handleGameOver = (finalScore: number, finalCoins: number) => {
    setSessionScore(finalScore);
    setSessionCoins(finalCoins);
    setGameMode('gameover');
    audioSynth.playHurt();
  };

  const handleLevelComplete = (finalScore: number, finalCoins: number) => {
    // Calculate complete score (bonus keys/hearts!)
    setSessionScore(finalScore);
    setSessionCoins(finalCoins);
    setGameMode('complete');
    audioSynth.playVictory();
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioSynth.setMute(nextMuted);
  };

  return (
    <div className="min-h-screen bg-[#2d1b10] font-sans text-stone-100 flex flex-col justify-between" id="app_root_frame">
      
      {/* 1. Header Navigation Wrapper */}
      <header className="bg-[#1a1a1a]/40 border-b-4 border-[#1a1a1a]/60 p-4 shadow-md sticky top-0 z-50 flex justify-between items-center" id="main_navigation_bar">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#ffd700] rounded-lg flex items-center justify-center border-2 border-white font-retro text-[#2d1b10] text-xl font-bold shadow animate-pulse">
            P
          </div>
          <div>
            <h1 className="font-retro text-xs md:text-sm tracking-widest text-[#ffd700]">PETUALANGAN RETRO PIXEL</h1>
            <p className="text-[10px] text-stone-400 hidden sm:block">Explore, Climb & Dash Over Hazardous Lands in classic 8-Bit Pixel style</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleMute}
            className="p-2 bg-[#3e2723] hover:bg-[#3e2723]/80 outline-none border border-[#2d1b10] hover:border-[#ffd700] rounded-lg text-slate-300 transition"
            id="nav_audio_mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#00ffcc]" />}
          </button>
          
          <button
            onClick={() => setGameMode('menu')}
            className={`font-retro text-[9px] px-3.5 py-2 border-2 rounded-lg transition active:scale-95 ${gameMode === 'menu' ? 'bg-[#ffd700]/20 border-[#ffd700] text-[#ffd700]' : 'bg-[#3e2723] border-[#2d1b10] hover:border-[#ffd700] text-stone-200'}`}
            id="nav_menu"
          >
            MENU UTAMA
          </button>
        </div>
      </header>

      {/* 2. Main Content Screens Switchboards */}
      <main className="grow flex flex-col items-center justify-center p-4 md:p-6" id="app_main_content">
        
        {/* ==================== SCREEN A: MENU UTAMA ==================== */}
        {gameMode === 'menu' && (
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6" id="main_menu_grid">
            
            {/* Left: Arcade Machine details & Controls Setup */}
            <div className="md:col-span-2 flex flex-col space-y-6">
              
              {/* Retro Billboard Cover card */}
              <div className="bg-gradient-to-b from-[#5c94fc] to-[#a0d0f8] border-[12px] border-[#3e2723] rounded-2xl p-6 relative overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.4)]" id="retro_hero_board">
                {/* Floating Natural Tones Cloud Graphics from design template */}
                <div className="absolute top-4 left-10 w-48 h-12 bg-white rounded-full opacity-40 blur-sm pointer-events-none animate-pulse"></div>
                <div className="absolute top-12 left-52 w-32 h-8 bg-white rounded-full opacity-30 blur-sm pointer-events-none"></div>
                <div className="absolute top-2 right-12 w-44 h-10 bg-white rounded-full opacity-20 blur-sm pointer-events-none"></div>

                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <Gamepad2 className="w-48 h-48 text-[#ffd700]" />
                </div>
                
                <span className="bg-[#1a1a1a]/40 border border-[#1a1a1a]/60 text-[#ffd700] text-[9px] font-retro rounded px-2.5 py-1 z-10 relative" id="hero_retro_indicator">
                  EDISI RETRO PLATFORMER v1.2
                </span>
                <h2 className="font-retro text-md md:text-lg text-[#2d1b10] mt-4 tracking-wider leading-relaxed z-10 relative font-bold">
                  Lompat, Jongkok & Panjat Dinding Rahasia!
                </h2>
                <p className="text-xs text-[#2d1b10]/90 leading-relaxed mt-2 max-w-lg mb-6 z-10 relative font-medium">
                  Nikmati petualangan platformer retro bergaya klasik mirip Mario Bros dengan kontrol modern! Kendalikan karakter laki-laki tangguh melewati duri, hancurkan bata, panjat tebing tanaman hijau, dan cari lorong rahasia tersembunyi berharga.
                </p>

                <div className="flex flex-wrap gap-3 z-10 relative">
                  <button
                    onClick={() => handleStartLevel(0)}
                    className="flex items-center space-x-2 bg-[#ffd700] hover:bg-[#ffd700]/90 text-[#3e2723] font-retro px-6 py-3.5 rounded-lg border-2 border-[#2d1b10] hover:border-[#ffd700] shadow-md font-bold text-xs active:translate-y-0.5 transition cursor-pointer"
                    id="quick_play_first_stage"
                  >
                    <Play className="w-4 h-4 fill-[#3e2723] text-[#3e2723]" />
                    <span>MULAI PETUALANGAN</span>
                  </button>

                  <button
                    onClick={() => setGameMode('editing')}
                    className="flex items-center space-x-2 bg-[#3e2723] hover:bg-[#2d1b10] text-[#f5deb3] font-sans px-5 py-3.5 rounded-lg border-2 border-[#1a1a1a] hover:border-[#ffd700] text-xs active:translate-y-0.5 transition cursor-pointer"
                    id="enter_editor_mode"
                  >
                    <Map className="w-4 h-4 text-[#ffd700]" />
                    <span>BUAT MAP SENDIRI (EDITOR)</span>
                  </button>
                </div>
              </div>

              {/* Levels Selection / Controls Info Area Tabs */}
              <div className="bg-[#3e2723] border-[6px] border-[#2d1b10] p-5 rounded-2xl flex flex-col space-y-4 shadow-2xl" id="info_tabs_card">
                
                <div className="flex border-b-2 border-[#2d1b10] pb-1 gap-2 text-xs font-semibold">
                  <button 
                    onClick={() => { setActiveTab('levels'); audioSynth.playClimbStep(); }}
                    className={`pb-2 px-3 transition-colors duration-150 cursor-pointer ${activeTab === 'levels' ? 'border-b-2 border-[#ffd700] text-[#ffd700] font-bold' : 'text-stone-300 hover:text-white'}`}
                  >
                    PILIH STAGE ({levels.length})
                  </button>
                  <button 
                    onClick={() => { setActiveTab('controls'); audioSynth.playClimbStep(); }}
                    className={`pb-2 px-3 transition-colors duration-150 cursor-pointer ${activeTab === 'controls' ? 'border-b-2 border-[#ffd700] text-[#ffd700] font-bold' : 'text-stone-300 hover:text-white'}`}
                  >
                    PANDUAN KONTROL & HERO
                  </button>
                  <button 
                    onClick={() => { setActiveTab('story'); audioSynth.playClimbStep(); }}
                    className={`pb-2 px-3 transition-colors duration-150 cursor-pointer ${activeTab === 'story' ? 'border-b-2 border-[#ffd700] text-[#ffd700] font-bold' : 'text-stone-300 hover:text-white'}`}
                  >
                    FITUR SPESIAL
                  </button>
                </div>

                {/* Tab Content A: Preset Levels */}
                {activeTab === 'levels' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="level_selector_grid">
                    {levels.map((lvl, idx) => (
                      <div 
                        key={lvl.id}
                        className="bg-[#2d1b10] border-2 border-[#1a1a1a]/80 hover:border-[#ffd700] p-4 rounded-xl flex flex-col justify-between group transition relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[8px] font-retro text-stone-400 bg-[#3e2723] px-1.5 py-0.5 rounded border border-[#1a1a1a]">
                            STAGE 0{lvl.id}
                          </span>
                          <span className="text-[10px] text-[#ffd700] font-bold">
                            {lvl.ambientType === 'sunny' ? '🌲 Hutan' : lvl.ambientType === 'cave' ? '💎 Gua' : '🌋 Lahar'}
                          </span>
                        </div>
                        
                        <h4 className="font-sans font-bold text-sm text-[#ffd700] group-hover:text-[#00ffcc] transition mb-3">{lvl.name}</h4>
                        
                        <p className="text-[10px] text-stone-300 leading-normal mb-4 font-sans line-clamp-3 h-12">
                          {lvl.storyHint}
                        </p>

                        <button
                          onClick={() => handleStartLevel(idx)}
                          className="w-full bg-[#3e2723] border border-[#1a1a1a] group-hover:bg-[#ffd700] group-hover:text-[#2d1b10] font-retro text-[8px] py-2 rounded transition active:scale-95 text-stone-200 font-bold cursor-pointer"
                          id={`play_stage_${lvl.id}`}
                        >
                          MAIN STAGE 0{lvl.id}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab Content B: Controls Info */}
                {activeTab === 'controls' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-stone-200" id="controls_guide_tab">
                    
                    <div className="space-y-2 bg-[#2d1b10] p-4 rounded-xl border border-[#1a1a1a]">
                      <h4 className="font-retro text-[9px] text-[#ffd700] flex items-center mb-2">
                        <Star className="w-3.5 h-3.5 mr-1" />
                        <span>KONTROL TEKAN KEYBOARD</span>
                      </h4>
                      <p className="flex justify-between border-b border-[#3e2723]/30 pb-1.5"><span className="text-stone-400 font-mono">Gerak Kiri-Kanan</span> <span className="text-[#ffd700] font-bold bg-[#3e2723] px-1.5 py-0.5 rounded border border-[#1a1a1a]">← Kiri | → Kanan</span></p>
                      <p className="flex justify-between border-b border-[#3e2723]/30 pb-1.5"><span className="text-stone-400 font-mono">Lompat Tinggi</span> <span className="text-[#ffd700] font-bold bg-[#3e2723] px-1.5 py-0.5 rounded border border-[#1a1a1a]">SPACEBAR / Tombol X</span></p>
                      <p className="flex justify-between border-b border-[#3e2723]/30 pb-1.5"><span className="text-stone-400 font-mono">Lompat Ganda (Double)</span> <span className="text-[#ffd700] font-bold bg-[#3e2723] px-1.5 py-0.5 rounded border border-[#1a1a1a]">Space 2 Kali</span></p>
                      <p className="flex justify-between border-b border-[#3e2723]/30 pb-1.5"><span className="text-stone-400 font-mono">Panjat Dinding (Vines)</span> <span className="text-[#ffd700] font-bold bg-[#3e2723] px-1.5 py-0.5 rounded border border-[#1a1a1a]">Tombol ↑ Naik | ↓ Turun</span></p>
                      <p className="flex justify-between border-b border-[#3e2723]/30 pb-1.5"><span className="text-stone-400 font-mono">Dash Kilat (Melesat)</span> <span className="text-[#ffd700] font-bold bg-[#3e2723] px-1.5 py-0.5 rounded border border-[#1a1a1a]">Tombol Z / SHIFT Kiri</span></p>
                      <p className="flex justify-between"><span className="text-stone-400 font-mono">Jongkok di Kolong</span> <span className="text-[#ffd700] font-bold bg-[#3e2723] px-1.5 py-0.5 rounded border border-[#1a1a1a]">Tombol ↓ (Tahan)</span></p>
                    </div>

                    <div className="space-y-3 p-4 bg-[#2d1b10] rounded-xl border border-[#1a1a1a] flex flex-col justify-between">
                      <div>
                        <h4 className="font-retro text-[9px] text-[#00ffcc] flex items-center mb-2">
                          <User className="w-3.5 h-3.5 mr-1" />
                          <span>FITUR KARAKTER PIXEL MAN</span>
                        </h4>
                        <p className="text-[11px] leading-relaxed text-stone-300">
                          Karakter laki-laki pengembara tangguh memakai topi petualang merah. Dia dapat menyusut pendek saat <b>Jongkok</b> untuk melewati lubang setinggi 1 blok, memiliki energi terbatas untuk <b>Panjat Dinding</b> (hijau merambat) agar tidak jatuh ke jurang, dan dapat meluncur <b>Dash kilat</b> horizontal menembus area berbahaya!
                        </p>
                      </div>
                      <div className="bg-[#3e2723] p-2 text-center rounded text-[10px] text-stone-200 border border-[#1a1a1a]">
                        ⭐ <b>Tips:</b> Sundul blok batu bertanda tanya (?) untuk mengumpulkan koin bonus rahasia!
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content C: Spec capabilities */}
                {activeTab === 'story' && (
                  <div className="bg-[#2d1b10] p-4 rounded-xl border border-[#1a1a1a] text-xs text-stone-300 leading-relaxed font-sans" id="special_features_tab">
                    <h4 className="font-retro text-[9px] text-[#ffd700] mb-3 flex items-center">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      <span>FITUR UTAMA GAME ENGINE</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[#3e2723]/60 p-3 rounded-lg border border-[#1a1a1a]">
                        <b className="text-white block mb-1">🎮 Canvas 60 FPS</b>
                        Render pixel-art tajam tanpa lemot dengan sistem kamera scrolling horizontal mengikuti petualang.
                      </div>
                      <div className="bg-[#3e2723]/60 p-3 rounded-lg border border-[#1a1a1a]">
                        <b className="text-white block mb-1">🎵 Suara Retro 8-Bit</b>
                        Sintesis audio retro bertenaga Web Audio API untuk koin, jump, hancur batu, dsb secara native.
                      </div>
                      <div className="bg-[#3e2723]/60 p-3 rounded-lg border border-[#1a1a1a]">
                        <b className="text-white block mb-1">🌿 Area Rahasia (Secrets)</b>
                        Blok tembok berbayang yang bisa dilewati untuk menemukan gem biru langka terselubung!
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Right: Traditional Cabin High Scores List Board */}
            <div className="md:col-span-1 flex justify-center" id="menu_leaderboard_panel">
              <Leaderboard />
            </div>

          </div>
        )}

        {/* ==================== SCREEN B: SEDANG BERMAIN (GAMEPLAY) ==================== */}
        {gameMode === 'playing' && (
          <div className="w-full flex flex-col items-center space-y-4" id="game_active_stage_shell">
            
            <GameCanvas
              currentLevel={levels[selectedLevelIndex] || levels[0]}
              customLevelGrid={customGrid}
              onGameOver={handleGameOver}
              onLevelComplete={handleLevelComplete}
              onBackToMenu={() => setGameMode('menu')}
              mobileControlState={mobileControlState}
            />

            {/* Always mount visual virtual screen controller layout so anyone can play via clicks/touches! */}
            <VirtualController onControlChange={handleControlChange} />
          </div>
        )}

        {/* ==================== SCREEN C: MAP DESIGNER EDITOR ==================== */}
        {gameMode === 'editing' && (
          <div className="w-full" id="map_designer_editor_shell">
            <MapEditor 
              onPlayCustomLevel={handleStartCustomLevel}
              onClose={() => setGameMode('menu')}
            />
          </div>
        )}

        {/* ==================== SCREEN D: GAME OVER SCREEN ==================== */}
        {gameMode === 'gameover' && (
          <div className="max-w-md w-full" id="game_over_block">
            <div className="bg-[#2d1b10] border-[12px] border-[#3e2723] p-8 rounded-2xl max-w-sm text-center shadow-2xl flex flex-col items-center mx-auto text-white" id="game_over_card">
              <div className="w-16 h-16 bg-[#3e2723] rounded-full flex items-center justify-center border-2 border-rose-500 text-rose-500 text-3xl font-bold animate-pulse mb-4 shadow">
                ☠️
              </div>
              
              <h3 className="font-retro text-sm text-rose-500 border-b-4 border-[#1a1a1a] pb-3 w-full tracking-widest mb-4">PETUALANGAN GAGAL</h3>
              
              <p className="text-xs text-stone-300 leading-relaxed mb-6">
                Nyawa petualang Anda telah habis! Jangan menyerah! Berlari, lompat jauh, panjat tanaman hijau, serta cari perisai/nyawa ❤️ tambahan di tempat rahasia.
              </p>

              <div className="w-full space-y-2 mb-6 text-xs text-left bg-[#3e2723] p-4 rounded-lg border border-[#2d1b10] font-mono">
                <div className="flex justify-between"><span>Skor Anda:</span><span className="text-[#ffd700] font-bold">{sessionScore} Poin</span></div>
                <div className="flex justify-between"><span>Koin Emas:</span><span className="text-amber-400 font-bold">🪙 {sessionCoins} koin</span></div>
              </div>

              {/* Submit to highscores card overlay */}
              <Leaderboard 
                finalScoreToSubmit={sessionScore}
                finalCoinsToSubmit={sessionCoins}
                onScoreSubmitted={() => {}}
              />

              <div className="flex space-x-2 w-full mt-4">
                <button
                  onClick={() => handleStartLevel(selectedLevelIndex)}
                  className="w-1/2 bg-[#ffd700] hover:bg-[#ffd700]/90 text-[#3e2723] font-retro px-4 py-3 rounded text-[10px] border-2 border-[#1a1a1a] active:translate-y-0.5 transition cursor-pointer font-bold"
                  id="restart_failed_level"
                >
                  ULANG STAGE
                </button>
                <button
                  onClick={() => setGameMode('menu')}
                  className="w-1/2 bg-[#3e2723] hover:bg-[#2d1b10] text-[#f5deb3] font-sans px-4 py-3 rounded text-xs border-2 border-[#1a1a1a] transition cursor-pointer"
                  id="fail_screen_to_menu"
                >
                  KEMBALI MENU
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCREEN E: LEVEL COMPLETED HERO TRANSITIONS ==================== */}
        {gameMode === 'complete' && (
          <div className="max-w-md w-full" id="game_complete_block">
            <div className="bg-[#2d1b10] border-[12px] border-[#3e2723] p-8 rounded-2xl max-w-sm text-center shadow-2xl flex flex-col items-center mx-auto text-white" id="game_complete_card">
              <div className="w-16 h-16 bg-[#3e2723] rounded-full flex items-center justify-center border-2 border-[#ffd700] text-[#ffd700] text-3xl font-bold animate-bounce mb-4 shadow">
                🏆
              </div>
              
              <h3 className="font-retro text-sm text-[#00ffcc] border-b-4 border-[#1a1a1a] pb-3 w-full tracking-widest mb-4">STAGE SELESAI!</h3>
              
              <p className="text-xs text-stone-300 leading-relaxed mb-6 font-sans">
                Selamat! Petualang tangguh Anda sukses melewati rintangan berbahaya, memanjat tebing terjal tinggi, mengumpulkan kunci emas, dan mencapai Portal Akhir kemenangan!
              </p>

              <div className="w-full space-y-2 mb-6 text-xs text-left bg-[#3e2723] p-4 rounded-lg border border-[#2d1b10] font-mono">
                <div className="flex justify-between"><span>Skor Anda:</span><span className="text-[#ffd700] font-bold">{sessionScore} Poin</span></div>
                <div className="flex justify-between"><span>Bonus Koin:</span><span className="text-amber-400 font-bold">🪙 {sessionCoins} koin</span></div>
                <div className="flex justify-between"><span>Misi Diselesaikan:</span><span className="text-[#00ffcc] font-bold">100% SUKSES</span></div>
              </div>

              {/* High Score Submit form */}
              <Leaderboard 
                finalScoreToSubmit={sessionScore}
                finalCoinsToSubmit={sessionCoins}
                onScoreSubmitted={() => {}}
              />

              <div className="flex space-x-2 w-full mt-4">
                {selectedLevelIndex < levels.length - 1 ? (
                  <button
                    onClick={() => handleStartLevel(selectedLevelIndex + 1)}
                    className="w-1/2 bg-[#00ffcc] hover:bg-[#00ffcc]/90 text-[#3e2723] font-retro px-4 py-3 rounded text-[9px] border-2 border-[#1a1a1a] active:translate-y-0.5 transition font-bold cursor-pointer"
                    id="play_next_level"
                  >
                    LANJUT STAGE {selectedLevelIndex + 2} →
                  </button>
                ) : (
                  <button
                    onClick={() => setGameMode('menu')}
                    className="w-1/2 bg-[#ffd700] hover:bg-[#ffd700]/90 text-[#3e2723] font-retro px-4 py-3 rounded text-[9px] border-2 border-[#1a1a1a] active:translate-y-0.5 transition font-bold cursor-pointer"
                    id="win_to_menu_home"
                  >
                    KEMBALI KE MENU
                  </button>
                )}
                <button
                  onClick={() => setGameMode('menu')}
                  className="w-1/2 bg-[#3e2723] hover:bg-[#2d1b10] text-[#f5deb3] font-sans px-4 py-3 rounded text-xs border-2 border-[#1a1a1a] transition cursor-pointer"
                  id="win_back_to_menu"
                >
                  PILIH STAGE
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 3. Footer and Credits */}
      <footer className="bg-[#1a1a1a]/40 border-t-4 border-[#1a1a1a]/60 p-4 text-center text-xs text-stone-400" id="main_credits_footer">
        <p className="font-sans">© 2026 Petualangan Retro Pixel. Dikembangkan dengan penuh ketelatenan dalam visual 8-bit retro arcade.</p>
      </footer>

    </div>
  );
}
