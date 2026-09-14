/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Logo } from './Logo';
import { LineHoverLink } from './ui/line-hover-link';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const year = new Date().getFullYear();

  return (
    <footer
      id="main-footer"
      className="w-full border-t border-white/5 py-12 relative z-10 overflow-x-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <Logo size={30} />
          <span className="flex flex-col">
            <span className="font-headline text-sm font-bold text-white">Synarena</span>
            <span className="font-mono text-[11px] text-slate-500">
              © {year} Synarena lab · Q-Learning vs Minimax
            </span>
          </span>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-slate-400 min-w-0">
          <button onClick={() => onNavigate('arena')} className="hover:text-white transition-colors cursor-pointer min-h-[2.5rem]">
            Arena
          </button>
          <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer min-h-[2.5rem]">
            How It Works
          </button>
          <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer min-h-[2.5rem]">
            Feedback
          </button>
          <button onClick={() => onNavigate('faq')} className="hover:text-white transition-colors cursor-pointer min-h-[2.5rem]">
            FAQ
          </button>
          <button onClick={() => onNavigate('credits')} className="hover:text-white transition-colors cursor-pointer min-h-[2.5rem]">
            Credits
          </button>
          <LineHoverLink
            variant="arc"
            href="https://github.com/kabirprokk/Synapse"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors break-all"
          >
            GitHub
          </LineHoverLink>
          <LineHoverLink
            variant="arc"
            href="mailto:kabirsayed.k@gmail.com"
            className="hover:text-white transition-colors break-all"
          >
            kabirsayed.k@gmail.com
          </LineHoverLink>
        </nav>
      </div>
    </footer>
  );
};
