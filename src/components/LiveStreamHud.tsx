/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Radio, Users, Clock, History, RotateCcw, FastForward, Play } from 'lucide-react';
import { ArenaSpeed } from '../types';

interface LiveStreamHudProps {
  round: number;
  uptimeSeconds: number;
  viewerCount: number;
  speed: ArenaSpeed;
  isViewingPast: boolean;
  viewingPly: number;
  totalPlies: number;
  onSelectSpeed: (speed: ArenaSpeed) => void;
  onPrevPly: () => void;
  onNextPly: () => void;
  onJumpToLive: () => void;
}

export const LiveStreamHud: React.FC<LiveStreamHudProps> = ({
  round,
  uptimeSeconds,
  viewerCount,
  speed,
  isViewingPast,
  viewingPly,
  totalPlies,
  onSelectSpeed,
  onPrevPly,
  onNextPly,
  onJumpToLive,
}) => {
  const formatUptime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="live-stream-hud"
      className="w-full flex flex-col lg:flex-row items-center justify-between gap-3 bg-[#060a14]/90 border border-[#222f4d] backdrop-blur-2xl rounded-2xl p-3 md:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_1px_1px_rgba(0,240,255,0.1)] relative overflow-hidden"
    >
      {/* Subtle Glowing Corner Cyber Reticles */}
      <span className="absolute top-1.5 left-1.5 font-mono text-[9px] text-[#00f0ff]/40 select-none">┌</span>
      <span className="absolute top-1.5 right-1.5 font-mono text-[9px] text-[#ff334b]/40 select-none">┐</span>
      <span className="absolute bottom-1.5 left-1.5 font-mono text-[9px] text-[#00f0ff]/40 select-none">└</span>
      <span className="absolute bottom-1.5 right-1.5 font-mono text-[9px] text-[#ff334b]/40 select-none">┘</span>

      {/* Left: 24/7 Broadcast Status & Telemetry */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Live Indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
            isViewingPast
              ? 'bg-[#ff7b00]/15 border-[#ff7b00]/60 shadow-[0_0_15px_rgba(255,123,0,0.3)]'
              : 'bg-[#ff334b]/15 border-[#ff334b]/60 shadow-[0_0_15px_rgba(255,51,75,0.4)]'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isViewingPast
                ? 'bg-[#ff7b00]'
                : 'bg-[#ff334b] animate-ping'
            }`}
          />
          <span
            className={`font-mono text-xs font-bold uppercase tracking-wider ${
              isViewingPast ? 'text-[#ffb74d]' : 'text-[#ff6b7e]'
            }`}
          >
            {isViewingPast ? 'DVR REPLAY MODE' : 'LOCAL LIVE'}
          </span>
        </div>

        {/* Viewers */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d162a]/80 border border-[#222f4d] text-[#dae2fd] font-mono text-xs">
          <Users className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="font-semibold text-[#00f0ff]">{viewerCount.toLocaleString()}</span>
          <span className="text-[#8899b7] hidden sm:inline">local</span>
        </div>

        {/* Uptime */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d162a]/80 border border-[#222f4d] text-[#8899b7] font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-[#a078ff]" />
          <span>Uptime:</span>
          <span className="text-[#dae2fd] font-semibold">{formatUptime(uptimeSeconds)}</span>
        </div>

        {/* Match Counter */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131d36] text-[#dae2fd] font-mono text-xs border border-[#293b66]">
          <span className="text-[#8899b7]">ROUND:</span>
          <span className="text-[#00f0ff] font-bold">#{round}</span>
        </div>
      </div>

      {/* Right: DVR Scrubber Controls & Replay Jump */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Past Move Scrubber */}
        <div className="flex items-center bg-[#0d162a] border border-[#222f4d] rounded-full p-0.5">
          <button
            onClick={onPrevPly}
            disabled={viewingPly <= 0}
            className="px-2.5 py-1 text-xs font-mono rounded-full text-[#8899b7] hover:text-[#dae2fd] hover:bg-[#1a2744] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Inspect previous move"
          >
            ◀ Prev
          </button>

          <span className="px-2 font-mono text-[11px] text-[#00f0ff]">
            {isViewingPast ? `Ply ${viewingPly + 1}/${totalPlies}` : `${totalPlies} Plies`}
          </span>

          <button
            onClick={onNextPly}
            disabled={!isViewingPast || viewingPly >= totalPlies - 1}
            className="px-2.5 py-1 text-xs font-mono rounded-full text-[#8899b7] hover:text-[#dae2fd] hover:bg-[#1a2744] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Inspect next move"
          >
            Next ▶
          </button>
        </div>

        {/* Jump To Live Button */}
        {isViewingPast ? (
          <button
            onClick={onJumpToLive}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ff334b] text-white hover:bg-[#ff4d63] shadow-[0_0_20px_rgba(255,51,75,0.7)] transition-all font-headline text-xs font-bold cursor-pointer active:scale-95 animate-pulse"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>JUMP TO LIVE</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] font-mono text-xs font-semibold">
            <Radio className="w-3 h-3 animate-ping" />
            <span>SYNCHRONIZED LIVE</span>
          </div>
        )}

        {/* Simulation Speed Controls */}
        <div className="hidden xl:flex items-center bg-[#0d162a] border border-[#222f4d] rounded-full p-0.5 text-xs font-mono">
          <span className="px-2 text-[10px] text-[#8899b7] uppercase">Speed:</span>
          {(
            [
              { label: '0.5x', value: 900 },
              { label: '1x', value: 400 },
              { label: '5x', value: 120 },
              { label: 'Max', value: 25 },
            ] as const
          ).map((s) => (
            <button
              key={s.value}
              onClick={() => onSelectSpeed(s.value)}
              className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                speed === s.value
                  ? 'bg-[#00f0ff] text-[#051b33] font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                  : 'text-[#8899b7] hover:text-[#dae2fd]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
