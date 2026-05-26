/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HighScore } from '../types';
import { audioSynth } from '../audio';
import { Award, Trash2, Trophy, Star, RefreshCw } from 'lucide-react';

interface LeaderboardProps {
  finalScoreToSubmit?: number;
  finalCoinsToSubmit?: number;
  onScoreSubmitted?: () => void;
}

export default function Leaderboard({ finalScoreToSubmit, finalCoinsToSubmit, onScoreSubmitted }: LeaderboardProps) {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Prepopulate legendary lists if empty
  useEffect(() => {
    const raw = localStorage.getItem('petualangan_pixel_high_scores');
    if (raw) {
      setScores(JSON.parse(raw));
    } else {
      const defaultScores: HighScore[] = [
        { name: 'KAPE', score: 8400, coins: 42, time: '2026-05-25' },
        { name: 'MARIO', score: 6200, coins: 31, time: '2026-05-24' },
        { name: 'LUIGI', score: 4800, coins: 21, time: '2026-05-24' },
        { name: 'ADVENTURER', score: 3200, coins: 15, time: '2026-05-23' },
        { name: 'YOSHI', score: 1500, coins: 8, time: '2026-05-26' }
      ];
      localStorage.setItem('petualangan_pixel_high_scores', JSON.stringify(defaultScores));
      setScores(defaultScores);
    }
  }, []);

  const handleClearScores = () => {
    if (confirm("Hapus semua daftar skor terbaik?")) {
      localStorage.removeItem('petualangan_pixel_high_scores');
      setScores([]);
      audioSynth.playBrickDestroy();
    }
  };

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    const formattedName = playerName.trim().toUpperCase().substring(0, 10);
    const newEntry: HighScore = {
      name: formattedName,
      score: finalScoreToSubmit || 0,
      coins: finalCoinsToSubmit || 0,
      time: new Date().toISOString().split('T')[0]
    };

    const nextScores = [...scores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Keep top 8 scores

    localStorage.setItem('petualangan_pixel_high_scores', JSON.stringify(nextScores));
    setScores(nextScores);
    setSubmitted(true);
    audioSynth.playVictory();

    if (onScoreSubmitted) {
      onScoreSubmitted();
    }
  };

  return (
    <div className="bg-[#2d1b10] border-[12px] border-[#3e2723] p-6 rounded-2xl max-w-md w-full mx-auto relative text-white shadow-xl" id="leaderboard_cabinet_view">
      
      {/* Title block */}
      <div className="flex flex-col items-center border-b-4 border-[#1a1a1a]/60 pb-4 mb-4 text-center">
        <Trophy className="w-10 h-10 text-[#ffd700] mb-2 animate-bounce animate-duration-1000" />
        <h2 className="font-retro text-sm text-[#ffd700]">SKOR TERBAIK</h2>
        <span className="text-[9px] text-[#00ffcc] font-retro mt-1 font-bold">SISTEM KABINET PETUALANG</span>
      </div>

      {/* Input Form for submitting after a game-over or completeness */}
      {finalScoreToSubmit !== undefined && finalScoreToSubmit > 0 && !submitted && (
        <form onSubmit={handleSubmitScore} className="mb-6 p-4 bg-[#3e2723]/90 border-2 border-[#ffd700] rounded-xl flex flex-col space-y-3" id="submit_score_form">
          <div className="flex justify-between items-center text-xs">
            <span className="font-retro text-[8px] text-[#ffd700]">SKOR BARU ANDA:</span>
            <span className="font-retro text-[#00ffcc] font-bold">{finalScoreToSubmit} Poin (🪙 {finalCoinsToSubmit} koin)</span>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] text-stone-300 font-sans">Masukkan Nama Petualang (Max 10 Huruf):</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.replace(/[^a-zA-Z0-9 ]/g, ""))}
                placeholder="NAMA"
                maxLength={10}
                required
                className="bg-black/40 border-2 border-[#2d1b10] focus:border-[#ffd700] focus:bg-[#2d1b10]/90 text-[#ffd700] font-retro tracking-widest text-xs px-3 py-2 rounded-lg grow outline-none text-center"
                id="player_score_name"
              />
              <button 
                type="submit"
                className="bg-[#ffd700] hover:bg-[#ffd700]/90 text-[#3e2723] font-retro px-4 py-2 text-[10px] rounded border border-[#1a1a1a] active:translate-y-0.5 transition cursor-pointer font-bold"
                id="confirm_score_submission"
              >
                SUBMIT
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Score lists */}
      <div className="space-y-1.5 font-retro text-[9px] mb-4" id="leaderboard_rows">
        {scores.length === 0 ? (
          <p className="text-center text-stone-400 py-6 font-sans">Belum ada daftar skor terbaik. Jadilah yang pertama!</p>
        ) : (
          scores.map((s, index) => {
            const isLatest = s.score === finalScoreToSubmit && s.name === playerName.toUpperCase().substring(0, 10);
            return (
              <div 
                key={index} 
                className={`flex justify-between p-2 rounded-lg border items-center ${isLatest ? 'bg-[#ffd700]/10 border-[#ffd700]' : 'bg-[#3e2723]/60 border-[#1a1a1a]'}`}
                id={`score_record_${index}`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className={`w-4 text-center font-bold ${index === 0 ? 'text-[#ffd700]' : index === 1 ? 'text-[#00ffcc]' : 'text-stone-300'}`}>
                    {index + 1}.
                  </span>
                  <span className="text-stone-100 font-bold tracking-wider">{s.name}</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-amber-400">🪙 {s.coins}</span>
                  <span className="text-[#ffd700] font-bold">{s.score} PTS</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Button tools */}
      {scores.length > 0 && (
        <div className="flex justify-end pt-2 border-t border-[#1a1a1a]" id="leaderboard_controls">
          <button 
            type="button"
            onClick={handleClearScores}
            className="flex items-center space-x-1.5 text-rose-400 hover:text-rose-300 font-sans text-xs transition active:scale-95 py-1 px-2.5 bg-[#3e2723] border border-[#1a1a1a] hover:border-[#ffd700] rounded-lg cursor-pointer"
            id="clear_scores_board"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset High Scores</span>
          </button>
        </div>
      )}

    </div>
  );
}
