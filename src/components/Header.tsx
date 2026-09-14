/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Radio, Volume2, VolumeX, Sliders, Users, Flame, Waves } from 'lucide-react';

interface HeaderProps {
  round: number;
  viewerCount: number;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInspector: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  round,
  viewerCount,
  activeSection,
  onNavigate,
  isMuted,
  onToggleMute,
  onOpenInspector,
}) => {
  return (
    <header
      id="main-header"
      className="fixed top-0 left-0 right-0 z-40 bg-[#060a14]/90 backdrop-blur-2xl border-b border-[#1e2c4a] shadow-[0_4px_30px_rgba(0,0,0,0.8)] transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto h-20 px-4 md:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand & Stream Status */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => onNavigate('arena')}
            className="flex flex-col text-left group cursor-pointer focus:outline-none"
            id="brand-logo-btn"
          >
            <div className="flex items-center gap-2">
              <span className="font-headline text-lg sm:text-xl text-[#dae2fd] tracking-tight font-extrabold leading-none group-hover:text-[#00f0ff] transition-colors flex items-center gap-1.5">
                <Waves className="w-5 h-5 text-[#00f0ff]" />
                <span className="text-[#00f0ff]">Ai Lake-1</span>
                <span className="text-[#8899b7] font-normal text-sm">vs</span>
                <span className="text-[#ff334b]">Ai Lava-1</span>
                <Flame className="w-5 h-5 text-[#ff334b]" />
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#8899b7] tracking-widest uppercase mt-0.5">
              LOCAL EXPERIMENT SESSION • REAL TIMINGS
            </span>
          </button>

          {/* YouTube-Live Style Stream Pill */}
          <div
            id="stream-live-pill"
            className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#11192e] border border-[#222f4d]"
          >
            <span className="w-2 h-2 rounded-full bg-[#ff334b] animate-ping" />
            <span className="font-mono text-[11px] text-[#ff6b7e] font-bold tracking-wide">
              LOCAL SESSION
            </span>
            <span className="font-mono text-[11px] text-[#8899b7]">
              • {viewerCount.toLocaleString()} here (you)
            </span>
          </div>
        </div>

        {/* Global Navigation Pills */}
        <nav
          id="main-nav"
          className="flex items-center gap-1 sm:gap-2 p-1 rounded-full bg-[#060a14] border border-[#1e2c4a] backdrop-blur-md"
        >
          <button
            id="nav-btn-arena"
            onClick={() => onNavigate('arena')}
            className={`px-3.5 sm:px-4 py-1.5 transition-all text-xs sm:text-sm font-medium rounded-full cursor-pointer ${
              activeSection === 'arena'
                ? 'bg-[#00f0ff] text-[#051b33] font-bold shadow-[0_0_16px_rgba(0,240,255,0.4)]'
                : 'text-[#8899b7] hover:text-[#dae2fd] hover:bg-[#131d36]/60'
            }`}
          >
            Live Stream
          </button>

          <button
            id="nav-btn-about"
            onClick={() => onNavigate('about')}
            className={`px-3.5 sm:px-4 py-1.5 transition-all text-xs sm:text-sm font-medium rounded-full cursor-pointer ${
              activeSection === 'about'
                ? 'bg-[#00f0ff] text-[#051b33] font-bold shadow-[0_0_16px_rgba(0,240,255,0.4)]'
                : 'text-[#8899b7] hover:text-[#dae2fd] hover:bg-[#131d36]/60'
            }`}
          >
            How It Works
          </button>

          <button
            id="nav-btn-contact"
            onClick={() => onNavigate('contact')}
            className={`px-3.5 sm:px-4 py-1.5 transition-all text-xs sm:text-sm font-medium rounded-full cursor-pointer ${
              activeSection === 'contact'
                ? 'bg-[#00f0ff] text-[#051b33] font-bold shadow-[0_0_16px_rgba(0,240,255,0.4)]'
                : 'text-[#8899b7] hover:text-[#dae2fd] hover:bg-[#131d36]/60'
            }`}
          >
            Feedback
          </button>
        </nav>

        {/* Audio & Live AI Inspector Tools */}
        <div className="flex items-center gap-2">
          {/* Audio Synthesizer Mute/Unmute */}
          <button
            id="btn-sound-toggle"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute live synthesis' : 'Mute live synthesis'}
            title={isMuted ? 'Unmute Live Audio' : 'Mute Live Audio'}
            className="w-9 h-9 rounded-full bg-[#0d162a] border border-[#222f4d] flex items-center justify-center text-[#dae2fd] hover:text-[#00f0ff] hover:border-[#00f0ff]/50 transition-all cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#ff334b]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#00f0ff]" />
            )}
          </button>

          {/* Inspect AI Data */}
          <button
            id="btn-open-inspector"
            onClick={onOpenInspector}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#131d36] hover:bg-[#1e2c4a] text-[#dae2fd] hover:text-[#00f0ff] border border-[#222f4d] hover:border-[#00f0ff]/50 transition-all font-headline text-xs font-semibold cursor-pointer shadow-sm"
            title="Inspect Q-Table memory and genetic chromosome weights"
          >
            <Sliders className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>INSPECT AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
