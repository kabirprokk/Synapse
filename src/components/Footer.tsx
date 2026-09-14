/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Waves, Flame } from 'lucide-react';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer
      id="main-footer"
      className="w-full bg-[#03060d] border-t border-[#1e2c4a] py-8 relative z-10"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Waves className="w-4 h-4 text-[#00f0ff]" />
            <Flame className="w-4 h-4 text-[#ff334b]" />
          </div>
          <span className="font-headline text-sm font-bold tracking-wider">
            <span className="text-[#00f0ff]">Ai Lake-1</span>{' '}
            <span className="text-[#8899b7]">vs</span>{' '}
            <span className="text-[#ff334b]">Ai Lava-1</span>
          </span>
          <span className="font-mono text-xs text-[#8899b7]">
            • Local experiment build
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs text-[#8899b7]">
          <button
            onClick={() => onNavigate('arena')}
            className="hover:text-[#00f0ff] transition-colors cursor-pointer"
          >
            Live Stream
          </button>
          <span>•</span>
          <button
            onClick={() => onNavigate('about')}
            className="hover:text-[#ff334b] transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <span>•</span>
          <button
            onClick={() => onNavigate('contact')}
            className="hover:text-[#dae2fd] transition-colors cursor-pointer"
          >
            Feedback
          </button>
        </div>

        <div className="text-xs text-[#8899b7]/70">
          Continuous zero-sum autonomous reinforcement learning &amp; genetic minimax stream.
        </div>
      </div>
    </footer>
  );
};
