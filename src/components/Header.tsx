/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Sliders, Menu, X } from 'lucide-react';
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

const NAV: { id: string; label: string }[] = [
  { id: 'arena', label: 'Arena' },
  { id: 'about', label: 'How It Works' },
  { id: 'contact', label: 'Feedback' },
];

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onNavigate,
  isMuted,
  onToggleMute,
  onOpenInspector,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (id: string) => {
    setMenuOpen(false);
    onNavigate(id);
  };

  return (
    <header
      id="main-header"
      className="fixed top-0 left-0 right-0 z-40 bg-[#020617]/70 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-6xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between gap-4 min-w-0">
        <button
          onClick={() => go('arena')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none min-w-0"
          id="brand-logo-btn"
          aria-label="Synarena — back to arena"
        >
          <Logo size={34} />
          <span className="flex flex-col leading-none">
            <span className="font-headline text-lg font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              Synarena
            </span>
            <span className="font-mono text-[10px] text-slate-500 tracking-[0.18em] uppercase mt-1">
              Research Arena
            </span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav
          id="main-nav"
          aria-label="Primary"
          className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/5"
        >
          {NAV.map(n => (
            <button
              key={n.id}
              id={`nav-btn-${n.id}`}
              onClick={() => go(n.id)}
              aria-current={activeSection === n.id ? 'page' : undefined}
              className={`px-4 py-1.5 transition-all text-sm rounded-full cursor-pointer ${
                activeSection === n.id
                  ? 'bg-white text-slate-900 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            id="btn-sound-toggle"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="min-w-[2.5rem] min-h-[2.5rem] w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-white/25 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            id="btn-open-inspector"
            onClick={onOpenInspector}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-slate-900 hover:bg-slate-200 transition-all font-headline text-xs font-semibold cursor-pointer min-h-[2.5rem]"
            title="Inspect Q-table and genome weights"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>
          {/* Mobile menu toggle */}
          <button
            className="md:hidden min-w-[2.5rem] min-h-[2.5rem] w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 cursor-pointer"
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav aria-label="Mobile" className="md:hidden border-t border-white/5 bg-[#020617]/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`text-left px-4 py-3 rounded-xl text-base cursor-pointer min-h-[3rem] ${
                activeSection === n.id ? 'bg-white text-slate-900 font-semibold' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              {n.label}
            </button>
          ))}
          <button
            onClick={() => { setMenuOpen(false); onOpenInspector(); }}
            className="text-left px-4 py-3 rounded-xl text-base text-slate-300 hover:bg-white/5 cursor-pointer sm:hidden min-h-[3rem]"
          >
            Inspector
          </button>
        </nav>
      )}
    </header>
  );
};
