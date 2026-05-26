/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowBigLeft, ArrowBigRight, ArrowBigUp, ArrowBigDown, Zap, ArrowUp } from 'lucide-react';
import { audioSynth } from '../audio';

interface VirtualControllerProps {
  onControlChange: (control: string, state: boolean) => void;
}

export default function VirtualController({ onControlChange }: VirtualControllerProps) {
  
  // Handles binds smoothly for both touch screens and cursor mice clicking
  const handlePress = (control: string) => {
    onControlChange(control, true);
    if (control === 'jump') {
      audioSynth.playClimbStep();
    }
  };

  const handleRelease = (control: string) => {
    onControlChange(control, false);
  };

  return (
    <div className="w-full max-w-lg bg-[#2d1b10] p-4 border-[10px] border-[#3e2723] rounded-2xl select-none mt-2 flex justify-between items-center text-white shadow-xl" id="game_virtual_keyboard_gamepad">
      
      {/* 1. D-PAD SIDE (Movement and climbing / squatting) */}
      <div className="relative w-36 h-36 flex items-center justify-center bg-[#1a1a1a]/40 border-2 border-[#1a1a1a]/60 rounded-full shadow-inner" id="game_dpad_wrapper">
        
        {/* UP BUTTON (Glides player upwards onto climbable vines W) */}
        <button
          onTouchStart={() => handlePress('up')}
          onTouchEnd={() => handleRelease('up')}
          onMouseDown={() => handlePress('up')}
          onMouseUp={() => handleRelease('up')}
          onMouseLeave={() => handleRelease('up')}
          className="absolute top-1 w-11 h-11 bg-[#3e2723] hover:bg-[#3e2723]/90 active:bg-[#ffd700] text-stone-250 font-bold border border-[#1a1a1a] flex items-center justify-center shadow rounded-lg touch-none cursor-pointer"
          title="Panjat Dinding (W/Up)"
          id="dpad_up"
        >
          <ArrowBigUp className="w-6 h-6 fill-stone-300" />
        </button>

        {/* LEFT BUTTON (Runs Left) */}
        <button
          onTouchStart={() => handlePress('left')}
          onTouchEnd={() => handleRelease('left')}
          onMouseDown={() => handlePress('left')}
          onMouseUp={() => handleRelease('left')}
          onMouseLeave={() => handleRelease('left')}
          className="absolute left-1 w-11 h-11 bg-[#3e2723] hover:bg-[#3e2723]/90 active:bg-[#ffd700] text-stone-250 font-bold border border-[#1a1a1a] flex items-center justify-center shadow rounded-lg touch-none cursor-pointer"
          title="Lari Kiri"
          id="dpad_left"
        >
          <ArrowBigLeft className="w-6 h-6 fill-stone-300" />
        </button>

        {/* RIGHT BUTTON (Runs Right) */}
        <button
          onTouchStart={() => handlePress('right')}
          onTouchEnd={() => handleRelease('right')}
          onMouseDown={() => handlePress('right')}
          onMouseUp={() => handleRelease('right')}
          onMouseLeave={() => handleRelease('right')}
          className="absolute right-1 w-11 h-11 bg-[#3e2723] hover:bg-[#3e2723]/90 active:bg-[#ffd700] text-stone-250 font-bold border border-[#1a1a1a] flex items-center justify-center shadow rounded-lg touch-none cursor-pointer"
          title="Lari Kanan"
          id="dpad_right"
        >
          <ArrowBigRight className="w-6 h-6 fill-stone-300" />
        </button>

        {/* DOWN BUTTON (Crouches the player shorter) */}
        <button
          onTouchStart={() => handlePress('down')}
          onTouchEnd={() => handleRelease('down')}
          onMouseDown={() => handlePress('down')}
          onMouseUp={() => handleRelease('down')}
          onMouseLeave={() => handleRelease('down')}
          className="absolute bottom-1 w-11 h-11 bg-[#3e2723] hover:bg-[#3e2723]/90 active:bg-[#ffd700] text-stone-250 font-bold border border-[#1a1a1a] flex items-center justify-center shadow rounded-lg touch-none cursor-pointer"
          title="Jongkok / Turun"
          id="dpad_down"
        >
          <ArrowBigDown className="w-6 h-6 fill-stone-300" />
        </button>

        <div className="w-8 h-8 rounded-full bg-[#2d1b10] border-2 border-[#1a1a1a] shadow" />
      </div>

      <div className="text-center font-retro text-[7px] text-stone-400 select-none flex flex-col justify-center items-center">
        <span>VIRTUAL</span>
        <span>GAMEPAD</span>
        <span className="text-[#00ffcc] mt-1 font-bold">● ACTIVE</span>
      </div>

      {/* 2. ACTION BUTTONS SIDE (A/B style Jump and Dash) */}
      <div className="flex space-x-6 items-center pr-3" id="gamepad_action_buttons">
        
        {/* ACTION B: DASH SPEED (Z button) */}
        <div className="flex flex-col items-center space-y-1">
          <button
            onTouchStart={() => handlePress('dash')}
            onTouchEnd={() => handleRelease('dash')}
            onMouseDown={() => handlePress('dash')}
            onMouseUp={() => handleRelease('dash')}
            onMouseLeave={() => handleRelease('dash')}
            className="w-14 h-14 bg-[#ffd700] hover:bg-[#ffd700]/95 active:bg-[#00ffcc] border-4 border-[#3e2723] active:border-white text-[#3e2723] font-bold rounded-full flex items-center justify-center shadow-lg active:scale-95 touch-none relative cursor-pointer"
            title="Sabet Dash Petir (Shift)"
            id="action_btn_dash"
          >
            <Zap className="w-6 h-6 fill-[#3e2723] text-[#3e2723]" />
            <span className="absolute bottom-0 text-[6px] font-retro bg-[#3e2723] text-[#ffd700] px-1 rounded">B-DASH</span>
          </button>
        </div>

        {/* ACTION A: JUMP & CLIMB OFF (W/Space list button) */}
        <div className="flex flex-col items-center space-y-1">
          <button
            onTouchStart={() => handlePress('jump')}
            onTouchEnd={() => handleRelease('jump')}
            onMouseDown={() => handlePress('jump')}
            onMouseUp={() => handleRelease('jump')}
            onMouseLeave={() => handleRelease('jump')}
            className="w-16 h-16 bg-[#00ffcc] hover:bg-[#00ffcc]/95 active:bg-[#ffd700] border-4 border-[#3e2723] active:border-white text-[#2d1b10] font-bold rounded-full flex items-center justify-center shadow-lg active:scale-95 touch-none relative cursor-pointer"
            title="Lompat Tinggi (Space)"
            id="action_btn_jump"
          >
            <ArrowUp className="w-7 h-7" />
            <span className="absolute bottom-0.5 text-[6px] font-retro bg-[#3e2723] text-[#00ffcc] px-1 rounded">A-JUMP</span>
          </button>
        </div>

      </div>

    </div>
  );
}
