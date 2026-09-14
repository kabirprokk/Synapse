/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Waves, Flame, Sparkles, Network, Scale, Activity, ArrowRight, ShieldAlert } from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  return (
    <section
      id="about"
      className="w-full py-16 px-4 md:px-6 lg:px-8 border-t border-[#1e2c4a] relative scroll-mt-24 z-10 bg-[#040812]/95"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d162a] border border-[#222f4d] text-[#00f0ff] font-mono text-xs">
            <Scale className="w-3.5 h-3.5" />
            <span>UNBIASED ZERO-SUM CO-EVOLUTION</span>
          </div>
          <h2 className="font-headline text-3xl sm:text-4xl font-extrabold text-[#dae2fd] tracking-tight">
            How The Live Models Compete &amp; Evolve
          </h2>
          <p className="font-sans text-sm sm:text-base text-[#8899b7] leading-relaxed">
            Ai Lake-1 and Ai Lava-1 start with completely unbiased initial baselines. They play in an unbroken 24/7 live stream, learning and mutating directly in your browser.
          </p>
        </div>

        {/* 2-Column Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Ai Lake-1 */}
          <div className="relative rounded-3xl p-6 md:p-8 bg-[#061224]/80 border border-[#00f0ff]/30 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,240,255,0.15)] flex flex-col gap-5 overflow-hidden">
            <span className="absolute top-3 left-3 font-mono text-[9px] text-[#00f0ff]/30 select-none">┌</span>
            <span className="absolute top-3 right-3 font-mono text-[9px] text-[#00f0ff]/30 select-none">┐</span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 flex items-center justify-center shadow-[0_0_16px_rgba(0,240,255,0.4)]">
                <Waves className="w-6 h-6 text-[#00f0ff]" />
              </div>
              <div>
                <span className="font-mono text-xs text-[#00f0ff] font-bold uppercase tracking-wider">
                  MODEL ALPHA (BLUE)
                </span>
                <h3 className="font-headline text-xl font-bold text-[#dae2fd]">
                  Ai Lake-1 // Reinforcement Q-Learning
                </h3>
              </div>
            </div>

            <p className="font-sans text-xs sm:text-sm text-[#8899b7] leading-relaxed">
              Ai Lake-1 has <strong>no pre-programmed rules</strong>. It starts with an empty memory and discovers strategy purely through trial-and-error environmental rewards.
            </p>

            <div className="flex flex-col gap-3 font-mono text-xs bg-[#09182d] p-4 rounded-2xl border border-[#1b3252]">
              <div className="text-[11px] text-[#00f0ff] font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                THE BELLMAN LEARNING UPDATE:
              </div>
              <div className="bg-[#040c17] p-2.5 rounded-lg border border-[#1b3252] text-[#7df4ff] text-[11px] overflow-x-auto">
                Q(s,a) &larr; Q(s,a) + &alpha; [ R + &gamma; max Q(s&prime;,a&prime;) - Q(s,a) ]
              </div>
              <ul className="flex flex-col gap-1.5 text-[#8899b7] text-[11px]">
                <li>• <strong>Win Reward (+1.0):</strong> Backpropagates confidence to winning moves.</li>
                <li>• <strong>Loss Penalty (-1.0):</strong> Immediately suppresses blunder paths.</li>
                <li>• <strong>Exploration (&epsilon; = 5%):</strong> Probes non-standard open squares.</li>
              </ul>
            </div>
          </div>

          {/* Card 2: Ai Lava-1 */}
          <div className="relative rounded-3xl p-6 md:p-8 bg-[#1f090d]/80 border border-[#ff334b]/30 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(255,51,75,0.15)] flex flex-col gap-5 overflow-hidden">
            <span className="absolute top-3 left-3 font-mono text-[9px] text-[#ff334b]/30 select-none">┌</span>
            <span className="absolute top-3 right-3 font-mono text-[9px] text-[#ff334b]/30 select-none">┐</span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#ff334b]/15 border border-[#ff334b]/40 flex items-center justify-center shadow-[0_0_16px_rgba(255,51,75,0.4)]">
                <Flame className="w-6 h-6 text-[#ff334b]" />
              </div>
              <div>
                <span className="font-mono text-xs text-[#ff334b] font-bold uppercase tracking-wider">
                  MODEL BETA (RED)
                </span>
                <h3 className="font-headline text-xl font-bold text-[#dae2fd]">
                  Ai Lava-1 // Minimax &amp; Genetic Evolution
                </h3>
              </div>
            </div>

            <p className="font-sans text-xs sm:text-sm text-[#e099a8] leading-relaxed">
              Ai Lava-1 simulates future moves up to <strong>6 plies deep</strong> using Minimax search with Alpha-Beta pruning, guided by a 9-chromosome positional genome.
            </p>

            <div className="flex flex-col gap-3 font-mono text-xs bg-[#2b0c12] p-4 rounded-2xl border border-[#4a1822]">
              <div className="text-[11px] text-[#ff7b00] font-bold flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5" />
                SYMMETRICAL GENETIC SEARCH:
              </div>
              <div className="bg-[#170508] p-2.5 rounded-lg border border-[#4a1822] text-[#ff99a8] text-[11px] overflow-x-auto">
                Genome = [1.0, 0.5, 1.0, 0.5, 2.0, 0.5, 1.0, 0.5, 1.0] (Corners: 1.0, Edges: 0.5)
              </div>
              <ul className="flex flex-col gap-1.5 text-[#e099a8] text-[11px]">
                <li>• <strong>Alpha-Beta Pruning:</strong> Discards branches that cannot affect the outcome.</li>
                <li>• <strong>Gaussian Mutation:</strong> Evolves chromosome weights upon defeat.</li>
                <li>• <strong>Zero Starting Bias:</strong> Completely balanced 4 corners and 4 edges.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Co-evolution Equilibrium Explanation Banner */}
        <div className="w-full bg-[#060a14] border border-[#1e2c4a] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <span className="font-mono text-xs text-[#00f0ff] uppercase font-bold tracking-wider">
              24/7 UNSTOPPABLE LIVE BROADCAST
            </span>
            <h4 className="font-headline text-lg sm:text-xl font-bold text-[#dae2fd]">
              Why You Can Only Review Past Moves, Never Pause
            </h4>
            <p className="font-sans text-xs sm:text-sm text-[#8899b7] leading-relaxed">
              Just like a live satellite or YouTube stream broadcast, the match engine runs perpetually without interruption. Spectators can review historical plies using the DVR timeline, then instantly jump back to real-time sync with one click.
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0e172a] border border-[#222f4d] shrink-0">
            <span className="w-3 h-3 rounded-full bg-[#ff334b] animate-ping" />
            <div className="flex flex-col font-mono text-xs">
              <span className="font-bold text-[#dae2fd]">STREAM RUNTIME</span>
              <span className="text-[#00f0ff]">Perpetual Autonomous Loop</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
