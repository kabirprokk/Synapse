/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IntroScreen — full-screen Synarena entry.
 * AnimatedRays bg + FlipFadeText "SYNARENA" + AnimatedButton enter.
 */

import React, { useEffect, useState } from 'react';
import { AnimatedRays } from './ui/animated-rays';
import { FlipFadeText } from './ui/flip-fade-text';
import AnimatedButton from './ui/animated-button';
import { Logo } from './Logo';

interface IntroScreenProps {
  onEnter: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onEnter }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setLeaving(true);
      setTimeout(onEnter, 450);
    }, 3200);
    return () => clearTimeout(t);
  }, [onEnter]);

  const handleEnter = () => {
    setLeaving(true);
    setTimeout(onEnter, 350);
  };

  return (
    <div
      role="dialog"
      aria-label="Synarena intro"
      className={`fixed inset-0 z-[100] bg-slate-950 transition-opacity duration-500 ${leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <AnimatedRays className="absolute inset-0 opacity-60">
        <div className="flex flex-col items-center gap-6 px-6 text-center">
          <Logo size={64} />
          <FlipFadeText
            words={['SYNARENA']}
            loop={false}
            className="min-h-[120px]"
            textClassName="text-white text-5xl md:text-7xl tracking-[0.12em]"
          />
          <p className="font-mono text-xs md:text-sm tracking-[0.3em] uppercase text-slate-400">
            Q-Learning vs Minimax Lab
          </p>
          <AnimatedButton onClick={handleEnter} className="mt-2 px-8 py-3 text-sm font-semibold">
            Enter Arena
          </AnimatedButton>
          <button
            onClick={handleEnter}
            className="font-mono text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer underline underline-offset-4"
          >
            skip
          </button>
        </div>
      </AnimatedRays>
    </div>
  );
};

export default IntroScreen;
