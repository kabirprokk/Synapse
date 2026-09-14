/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Sliders } from 'lucide-react';
import { Logo } from './Logo';

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
  activeSection,
  onNavigate,
  isMuted,
  onToggleMute,
  onOpenInspector,
}) => {
  return (
    <header
      id="main-header"
      className="fixed top-0 left-0 right-0 z-40 bg-[#060a14]/85 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-6xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={() => onNavigate('arena')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          id="brand-logo-btn"
        >
          <Logo size={34} />
          <span className="flex flex-col leading-none">
            <span className="font-headline text-lg font-extrabold tracking-tight text-white group-hover:text-[#22d3ee] transition-colors">
              Synarena
            </span>
            <span className="font-mono text-[10px] text-slate-400 tracking-[0.18em] uppercase mt-1">
              Research Arena
            </span>
          </span>
        </button>

        {/* Nav */}
        <nav
          id="main-nav"
          className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/5"
        >
          {([
            ['arena', 'Arena'],
            ['about', 'How It Works'],
            ['contact', 'Feedback'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              id={`nav-btn-${id}`}
              onClick={() => onNavigate(id)}
              className={`px-4 py-1.5 transition-all text-sm rounded-full cursor-pointer ${
                activeSection === id
                  ? 'bg-white text-slate-900 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Tools */}
        <div className="flex items-center gap-2">
          <button
            id="btn-sound-toggle"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-white/25 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            id="btn-open-inspector"
            onClick={onOpenInspector}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-slate-900 hover:bg-slate-200 transition-all font-headline text-xs font-semibold cursor-pointer"
            title="Inspect Q-table and genome weights"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>
        </div>
      </div>
    </header>
  );
};
