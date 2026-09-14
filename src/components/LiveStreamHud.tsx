/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Radio } from 'lucide-react';
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
  speed,
  isViewingPast,
  viewingPly,
  totalPlies,
  onSelectSpeed,
  onPrevPly,
  onNextPly,
  onJumpToLive,
}) => {
  const mm = String(Math.floor(uptimeSeconds / 60)).padStart(2, '0');
  const ss = String(uptimeSeconds % 60).padStart(2, '0');

  return (
    <div
      id="live-stream-hud"
      className="w-full flex flex-wrap items-center gap-x-5 gap-y-2 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-white">
        <span className={`w-2 h-2 rounded-full ${isViewingPast ? 'bg-amber-400' : 'bg-emerald-400'}`} />
        {isViewingPast ? `Replay · ply ${viewingPly + 1}/${totalPlies}` : 'Live'}
      </span>
      <span className="font-mono text-xs text-slate-400">
        Round <strong className="text-white">#{round}</strong>
      </span>
      <span className="font-mono text-xs text-slate-400">
        {mm}:{ss}
      </span>

      <span className="flex items-center gap-1 ml-auto">
        <button onClick={onPrevPly} className="px-2 py-1 text-xs text-slate-400 hover:text-white cursor-pointer">‹ Prev</button>
        <button onClick={onNextPly} className="px-2 py-1 text-xs text-slate-400 hover:text-white cursor-pointer">Next ›</button>
        {isViewingPast && (
          <button onClick={onJumpToLive} className="ml-1 px-3 py-1 rounded-full bg-white text-slate-900 text-xs font-semibold cursor-pointer">
            Back to live
          </button>
        )}
        {!isViewingPast && (
          <span className="ml-1 flex items-center gap-1.5 text-xs text-emerald-300">
            <Radio className="w-3 h-3" /> Synced
          </span>
        )}
      </span>

      <span className="flex items-center gap-1 text-xs">
        {([{ label: '0.5×', value: 900 }, { label: '1×', value: 400 }, { label: '5×', value: 120 }, { label: 'Max', value: 25 }] as const).map(s => (
          <button
            key={s.value}
            onClick={() => onSelectSpeed(s.value)}
            className={`px-2.5 py-1 rounded-full cursor-pointer ${speed === s.value ? 'bg-white text-slate-900 font-semibold' : 'text-slate-400 hover:text-white'}`}
          >
            {s.label}
          </button>
        ))}
      </span>
    </div>
  );
};
