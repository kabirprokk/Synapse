/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BoardState, ArenaSpeed, WinningCombo, PlyRecord } from '../types';
import { CELL_PERCENT_COORDS } from '../services/aiEngine';
import { Radio, RotateCcw, Sparkles } from 'lucide-react';

interface TactileMatrixProps {
  board: BoardState;
  round: number;
  currentPlayer: 'O' | 'X';
  statusText: string;
  latencyMs: number;
  lakeEvalRatio: number;
  lavaEvalRatio: number;
  speed: ArenaSpeed;
  winningResult: WinningCombo | null;
  isViewingPast: boolean;
  viewingPly: number;
  pliesHistory: PlyRecord[];
  onSelectPly: (plyIndex: number) => void;
  onJumpToLive: () => void;
  onSelectSpeed: (speed: ArenaSpeed) => void;
  isHumanTurn?: boolean;
  onHumanMove?: (cell: number) => void;
}

export const TactileMatrix: React.FC<TactileMatrixProps> = ({
  board,
  round,
  currentPlayer,
  statusText,
  latencyMs,
  lakeEvalRatio,
  lavaEvalRatio,
  speed,
  winningResult,
  isViewingPast,
  viewingPly,
  pliesHistory,
  onSelectPly,
  onJumpToLive,
  onSelectSpeed,
  isHumanTurn,
  onHumanMove,
}) => {
  const isWinningCell = (index: number) => {
    return winningResult?.combo?.includes(index) ?? false;
  };

  const getLaserCoordinates = () => {
    if (!winningResult?.combo) return null;
    const [startIdx, , endIdx] = winningResult.combo;
    const start = CELL_PERCENT_COORDS[startIdx];
    const end = CELL_PERCENT_COORDS[endIdx];

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;

    const ext = 8;
    return {
      x1: start.x - (dx / len) * ext,
      y1: start.y - (dy / len) * ext,
      x2: end.x + (dx / len) * ext,
      y2: end.y + (dy / len) * ext,
      winner: winningResult.winner,
    };
  };

  const laser = getLaserCoordinates();

  // Find cell touched in current viewing ply
  const highlightedPastCell =
    isViewingPast && pliesHistory[viewingPly] ? pliesHistory[viewingPly].cellIndex : null;

  return (
    <div
      id="tactile-matrix-container"
      className="w-full max-w-[500px] flex flex-col items-center gap-4"
    >
      {/* Top Stream Header Ticker */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-[#8899b7] px-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#dae2fd]">ARENA BROADCAST</span>
          <span>•</span>
          <span className="text-[#00f0ff] font-semibold">
            {currentPlayer === 'O' ? 'Ai Lake-1 (O)' : 'Ai Lava-1 (X)'} Turn
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
          <span className="text-[11px] text-[#8899b7]">
            Latency: <strong className="text-[#dae2fd]">{latencyMs}ms</strong>
          </span>
        </div>
      </div>

      {/* Replay Notice Floating Banner if viewing past */}
      {isViewingPast && (
        <div className="w-full flex items-center justify-between bg-[#ff7b00]/15 border border-[#ff7b00]/50 rounded-xl px-3.5 py-2 shadow-[0_0_20px_rgba(255,123,0,0.25)] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#ffb74d] font-bold">
              ⏪ REPLAYING PLY #{viewingPly + 1} OF {pliesHistory.length}
            </span>
            {pliesHistory[viewingPly] && (
              <span className="hidden sm:inline font-mono text-[11px] text-[#ffcc80]">
                ({pliesHistory[viewingPly].playerName})
              </span>
            )}
          </div>
          <button
            onClick={onJumpToLive}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff334b] text-white text-xs font-bold shadow-[0_0_12px_rgba(255,51,75,0.7)] hover:bg-[#ff4d63] cursor-pointer transition-all active:scale-95"
          >
            <Radio className="w-3 h-3" />
            <span>RETURN TO LIVE</span>
          </button>
        </div>
      )}

      {/* 3x3 Tactile Grid Stage */}
      <div
        id="board-grid-wrapper"
        className="relative w-full aspect-square bg-[#060a14]/95 rounded-3xl border-2 border-[#1e2c4a] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center backdrop-blur-2xl overflow-hidden group"
      >
        {/* Subtle Cyber Corner Reticles */}
        <div className="absolute top-2 left-2 font-mono text-[10px] text-[#00f0ff]/50 select-none">
          [+ 0.0]
        </div>
        <div className="absolute top-2 right-2 font-mono text-[10px] text-[#ff334b]/50 select-none">
          [+ 0.1]
        </div>
        <div className="absolute bottom-2 left-2 font-mono text-[10px] text-[#00f0ff]/50 select-none">
          [- 1.0]
        </div>
        <div className="absolute bottom-2 right-2 font-mono text-[10px] text-[#ff334b]/50 select-none">
          [- 1.1]
        </div>

        {/* Ambient Radial Radiance: Lake Cyan vs Lava Red */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff]/10 via-transparent to-[#ff334b]/10 pointer-events-none" />

        {/* 3x3 Cells — clickable on human turn */}
        <div className="w-full h-full grid grid-cols-3 gap-3 relative z-10">
          {board.map((cell, index) => {
            const isWinner = isWinningCell(index);
            const isJustPlaced = highlightedPastCell === index;
            const clickable = isHumanTurn && cell === null && !winningResult && !isViewingPast;

            return (
              <button
                key={index}
                id={`cell-${index}`}
                disabled={!clickable}
                onClick={() => onHumanMove?.(index)}
                className={`relative rounded-2xl flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-300 ${
                  cell !== null
                    ? 'bg-[#0a1224] border border-[#27385e] shadow-inner'
                    : clickable
                      ? 'bg-[#0a1224] border border-[#00f0ff]/60 hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 cursor-pointer shadow-[0_0_16px_rgba(0,240,255,0.25)]'
                      : 'bg-[#0a1224]/50 border border-[#1b2742]'
                } ${
                  isWinner
                    ? cell === 'O'
                      ? 'border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.9)] scale-[1.03] z-20 bg-[#00f0ff]/10'
                      : 'border-[#ff334b] shadow-[0_0_30px_rgba(255,51,75,0.9)] scale-[1.03] z-20 bg-[#ff334b]/10'
                    : ''
                } ${
                  isJustPlaced
                    ? 'ring-2 ring-[#ffb74d] shadow-[0_0_20px_rgba(255,183,77,0.8)] scale-[1.02]'
                    : ''
                }`}
              >
                {/* Cell Coordinates */}
                <span className="absolute top-2 left-2 font-mono text-[9px] text-[#8899b7]/40 tracking-tighter pointer-events-none">
                  {Math.floor(index / 3)},{index % 3}
                </span>

                {/* Symbol: Ai Lake-1 (O) */}
                {cell === 'O' && (
                  <div className="relative w-16 h-16 flex items-center justify-center animate-in zoom-in-75 duration-200">
                    <svg className="w-full h-full" viewBox="0 0 64 64">
                      {/* Outer ripple ring */}
                      <circle
                        cx="32"
                        cy="32"
                        r="25"
                        fill="none"
                        stroke="#00f0ff"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        opacity="0.4"
                      />
                      {/* Main Lake Core */}
                      <circle
                        cx="32"
                        cy="32"
                        r="20"
                        fill="none"
                        stroke="#00f0ff"
                        strokeWidth="5"
                        className="drop-shadow-[0_0_12px_#00f0ff]"
                      />
                      {/* Center droplet */}
                      <circle cx="32" cy="32" r="3" fill="#00f0ff" opacity="0.8" />
                    </svg>
                  </div>
                )}

                {/* Symbol: Ai Lava-1 (X) */}
                {cell === 'X' && (
                  <div className="relative w-16 h-16 flex items-center justify-center animate-in zoom-in-75 duration-200">
                    <svg className="w-full h-full" viewBox="0 0 64 64">
                      {/* Outer Magma Ember Orbit */}
                      <rect
                        x="10"
                        y="10"
                        width="44"
                        height="44"
                        fill="none"
                        stroke="#ff7b00"
                        strokeWidth="1"
                        strokeDasharray="3 5"
                        opacity="0.3"
                      />
                      {/* Molten Cross */}
                      <line
                        x1="16"
                        y1="16"
                        x2="48"
                        y2="48"
                        stroke="#ff334b"
                        strokeWidth="5.5"
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_12px_#ff334b]"
                      />
                      <line
                        x1="48"
                        y1="16"
                        x2="16"
                        y2="48"
                        stroke="#ff7b00"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_8px_#ff7b00]"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Laser Beam on Winning Line */}
        {laser && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
            <line
              x1={`${laser.x1}%`}
              y1={`${laser.y1}%`}
              x2={`${laser.x2}%`}
              y2={`${laser.y2}%`}
              stroke={laser.winner === 'O' ? '#00f0ff' : '#ff334b'}
              strokeWidth="6"
              strokeLinecap="round"
              className={laser.winner === 'O' ? 'drop-shadow-[0_0_16px_#00f0ff]' : 'drop-shadow-[0_0_16px_#ff334b]'}
            />
          </svg>
        )}
      </div>

      {/* Match Status & Decision Line */}
      <div className="w-full text-center px-2 py-1.5 bg-[#0a1224] rounded-xl border border-[#222f4d] shadow-sm">
        <p className="font-mono text-xs text-[#dae2fd] font-medium tracking-wide">
          {statusText}
        </p>
      </div>

      {/* Move Timeline Scrubber (Click any ply to view past move) */}
      <div className="w-full flex flex-col gap-1.5 bg-[#060a14] border border-[#222f4d] rounded-2xl p-3 shadow-md">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#8899b7]">
          <span>MATCH PLY TIMELINE:</span>
          <span>Click any move to review</span>
        </div>

        <div className="w-full flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
          {pliesHistory.length === 0 ? (
            <span className="font-mono text-xs text-[#8899b7]/60 italic py-1">
              Waiting for round to open...
            </span>
          ) : (
            pliesHistory.map((ply, idx) => {
              const isSelected = isViewingPast && viewingPly === idx;
              const isCurrent = !isViewingPast && idx === pliesHistory.length - 1;

              return (
                <button
                  key={idx}
                  onClick={() => onSelectPly(idx)}
                  className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#ff7b00] text-black border-[#ffb74d] shadow-[0_0_12px_rgba(255,123,0,0.6)]'
                      : isCurrent
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/60 shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                      : ply.player === 'O'
                      ? 'bg-[#0a1b33] text-[#7df4ff] border-[#1d3866] hover:border-[#00f0ff]/40'
                      : 'bg-[#290d13] text-[#ff99a8] border-[#591b26] hover:border-[#ff334b]/40'
                  }`}
                  title={`${ply.playerName}: ${ply.actionDesc}`}
                >
                  {idx + 1}: {ply.player === 'O' ? 'Lake' : 'Lava'}
                </button>
              );
            })
          )}

          {/* Jump to Live pill */}
          <button
            onClick={onJumpToLive}
            className={`shrink-0 px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer border ${
              !isViewingPast
                ? 'bg-[#ff334b] text-white border-[#ff6b7e] shadow-[0_0_10px_rgba(255,51,75,0.5)]'
                : 'bg-[#1b2742] text-[#8899b7] border-[#293b66] hover:text-white'
            }`}
          >
            🔴 LIVE
          </button>
        </div>
      </div>

      {/* Dynamic Evaluation Ratio Bar (Lake vs Lava) */}
      <div className="w-full flex flex-col gap-1.5 px-2">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-[#00f0ff] font-semibold">Ai Lake-1 ({lakeEvalRatio}%)</span>
          <span className="text-[#8899b7]">BOARD CONTROL BALANCE</span>
          <span className="text-[#ff334b] font-semibold">Ai Lava-1 ({lavaEvalRatio}%)</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#131d36] overflow-hidden flex border border-[#222f4d]">
          <div
            className="h-full bg-gradient-to-r from-[#0088cc] to-[#00f0ff] transition-all duration-300 shadow-[0_0_8px_#00f0ff]"
            style={{ width: `${lakeEvalRatio}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-[#ff334b] to-[#ff7b00] transition-all duration-300 shadow-[0_0_8px_#ff334b]"
            style={{ width: `${lavaEvalRatio}%` }}
          />
        </div>
      </div>
    </div>
  );
};
