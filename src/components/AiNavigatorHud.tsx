/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bot, ChevronDown, Radio, Flame, Waves } from 'lucide-react';
import { soundManager } from '../services/audio';

interface AiNavigatorHudProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const AiNavigatorHud: React.FC<AiNavigatorHudProps> = ({
  activeSection,
  onNavigate,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getHudContent = () => {
    switch (activeSection) {
      case 'about':
        return {
          badge: 'ALGORITHM ARCHITECTURE',
          tag: 'HOW IT WORKS',
          text: '💡 Unbiased AI battle: Ai Lake-1 discovers strategies via Bellman Q-Learning rewards, while Ai Lava-1 calculates future lines via Minimax search.',
        };
      case 'contact':
        return {
          badge: 'GLOBAL FEEDBACK STATION',
          tag: 'COMMUNITY INBOX',
          text: '📬 Submit viewer feedback or algorithm ideas to the transmission hub below.',
        };
      case 'arena':
      default:
        return {
          badge: 'LOCAL EXPERIMENT SESSION',
          tag: 'PAUSE • STEP • PLAY',
          text: '🔬 This is a real local run — timings measured here, seed-controlled, no fake viewers. Pick AI vs AI or play yourself, then export CSV/JSON for analysis.',
        };
    }
  };

  const current = getHudContent();

  const handleOrbClick = () => {
    soundManager.playTone(950, 'sine', 0.1, 0.03);
    setIsExpanded(!isExpanded);
  };

  return (
    <aside
      id="ai-navigator-hud"
      aria-label="Synapse AI Live Stream Companion Guide"
      className="fixed bottom-6 right-6 z-50 flex items-end gap-3 pointer-events-none"
    >
      {/* Speech Card */}
      {isExpanded && (
        <div className="pointer-events-auto max-w-[320px] sm:max-w-[360px] bg-[#060a14]/95 border border-[#1e2c4a] backdrop-blur-2xl rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(0,240,255,0.15)] flex flex-col gap-2.5 transition-all duration-300 hover:border-[#00f0ff]/50">
          <div className="flex items-center justify-between gap-2 border-b border-[#1b2742] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff334b] shadow-[0_0_8px_#ff334b] animate-ping" />
              <span className="font-headline text-[11px] font-bold tracking-wider text-[#00f0ff] uppercase">
                {current.badge}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#8899b7]">
                {current.tag}
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-[#8899b7] hover:text-[#dae2fd] p-0.5 rounded cursor-pointer"
                title="Minimize Guide"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="font-sans text-[#dae2fd] text-xs leading-relaxed">
            {current.text}
          </p>

          <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
            <span className="text-[#8899b7] text-[10px]">NAVIGATION:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onNavigate('arena')}
                className="px-2.5 py-0.5 rounded-full bg-[#0d162a] hover:bg-[#00f0ff]/20 text-[#00f0ff] hover:text-[#dae2fd] text-[10px] font-semibold transition-colors cursor-pointer"
              >
                Live Stream
              </button>
              <button
                onClick={() => onNavigate('about')}
                className="px-2.5 py-0.5 rounded-full bg-[#0d162a] hover:bg-[#ff334b]/20 text-[#ff99a8] hover:text-[#dae2fd] text-[10px] font-semibold transition-colors cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="px-2.5 py-0.5 rounded-full bg-[#0d162a] hover:bg-[#a078ff]/20 text-[#d0bcff] hover:text-[#dae2fd] text-[10px] font-semibold transition-colors cursor-pointer"
              >
                Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Holographic Companion Orb Trigger */}
      <button
        id="ai-orb-trigger"
        onClick={handleOrbClick}
        title={isExpanded ? 'Minimize Guide' : 'Open Stream Guide'}
        className="pointer-events-auto relative w-12 h-12 rounded-full bg-[#060a14] border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.6)] flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform group"
      >
        <Radio className="w-6 h-6 text-[#00f0ff] group-hover:scale-110 transition-transform" />
        <span className="absolute inset-0 rounded-full border border-[#ff334b]/50 animate-ping opacity-60 pointer-events-none" />
        {!isExpanded && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#ff334b] shadow-[0_0_8px_#ff334b]" />
        )}
      </button>
    </aside>
  );
};
