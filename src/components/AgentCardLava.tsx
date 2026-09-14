/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Flame, GitFork, Dna, Activity, Trophy } from 'lucide-react';
import { LavaTelemetry } from '../types';

interface AgentCardLavaProps {
  telemetry: LavaTelemetry;
  isActive: boolean;
}

export const AgentCardLava: React.FC<AgentCardLavaProps> = ({
  telemetry,
  isActive,
}) => {
  return (
    <div
      id="agent-card-lava"
      className={`relative rounded-3xl p-5 md:p-6 transition-all duration-300 backdrop-blur-2xl flex flex-col gap-4 border ${
        isActive
          ? 'bg-[#21090d]/95 border-[#ff334b] shadow-[0_0_35px_rgba(255,51,75,0.3)] ring-1 ring-[#ff334b]/50'
          : 'bg-[#15070a]/80 border-[#3d161d] hover:border-[#ff334b]/40'
      }`}
    >
      {/* Corner cyber brackets */}
      <span className="absolute top-2 left-2 font-mono text-[9px] text-[#ff334b]/40 select-none">┌</span>
      <span className="absolute top-2 right-2 font-mono text-[9px] text-[#ff334b]/40 select-none">┐</span>

      {/* Top Header: Model Identity */}
      <div className="flex items-center justify-between border-b border-[#471923] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ff334b]/15 border border-[#ff334b]/40 flex items-center justify-center shadow-[0_0_15px_rgba(255,51,75,0.4)]">
            <Flame className="w-5 h-5 text-[#ff334b]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-lg font-bold text-[#dae2fd] tracking-tight">
                Ai Lava-1
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#ff334b]/20 text-[#ff334b] border border-[#ff334b]/40">
                X
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#ff99a8] tracking-wide">
              Minimax Search &amp; Genetic
            </p>
          </div>
        </div>

        {/* Turn Status Beacon */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2a0b12] border border-[#471923]">
          <span
            className={`w-2 h-2 rounded-full ${
              isActive
                ? 'bg-[#ff334b] shadow-[0_0_8px_#ff334b] animate-ping'
                : 'bg-[#5c232e]'
            }`}
          />
          <span className="font-mono text-[10px] text-[#ff99a8] font-medium uppercase">
            {isActive ? 'SEARCHING' : 'READY'}
          </span>
        </div>
      </div>

      {/* Fitness & Win Rate Counter */}
      <div className="grid grid-cols-2 gap-2 bg-[#2a0b12] p-3 rounded-2xl border border-[#471923]">
        <div className="flex flex-col">
          <span className="font-mono text-[10px] text-[#e099a8] uppercase">
            Recent Win Rate
          </span>
          <span className="font-headline text-2xl font-bold text-[#ff334b]">
            {telemetry.fitness}%
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="font-mono text-[10px] text-[#e099a8] uppercase">
            Score (W / D / L)
          </span>
          <span className="font-mono text-xs font-semibold text-[#dae2fd] mt-1.5">
            <span className="text-[#ff334b]">{telemetry.wins}W</span> •{' '}
            <span className="text-[#cbc3d7]">{telemetry.draws}D</span> •{' '}
            <span className="text-[#00f0ff]">{telemetry.losses}L</span>
          </span>
        </div>
      </div>

      {/* Real Model Telemetry Metrics */}
      <div className="flex flex-col gap-2 font-mono text-xs text-[#e099a8]">
        <div className="flex items-center justify-between py-1 border-b border-[#471923]/50">
          <span className="flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-[#ff334b]" />
            Search Tree Depth:
          </span>
          <strong className="text-[#dae2fd]">6 Plies (Alpha-Beta)</strong>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-[#471923]/50">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#ff7b00]" />
            Nodes Evaluated:
          </span>
          <strong className="text-[#ff7b00] font-bold">
            {telemetry.nodesEvaluated} Branches
          </strong>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-[#471923]/50">
          <span className="flex items-center gap-1.5">
            <Dna className="w-3.5 h-3.5 text-[#ff334b]" />
            Mutation Step (&sigma;):
          </span>
          <strong className="text-[#dae2fd]">{telemetry.mutationSigma}</strong>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#ff7b00]" />
            Center Gene Weight:
          </span>
          <strong className="text-[#dae2fd]">{telemetry.centerWeight}</strong>
        </div>
      </div>

      {/* Latest Move Decision */}
      <div className="bg-[#2a0b12] p-3 rounded-2xl border border-[#471923] flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#e099a8] uppercase">
            Minimax Optimal Path
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#ff334b]/20 text-[#ff334b] font-bold">
            ALPHA-BETA PRUNED
          </span>
        </div>
        <p className="font-mono text-xs text-[#dae2fd] truncate">
          {telemetry.lastMove}
        </p>
      </div>

      {/* 9-Cell Symmetrical Positional Chromosome Heatmap */}
      <div className="flex flex-col gap-1.5 bg-[#2a0b12] p-3 rounded-2xl border border-[#471923]">
        <div className="flex items-center justify-between font-mono text-[10px] text-[#e099a8]">
          <span>POSITION GENES (CHROMOSOME):</span>
          <span>Symmetrical</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {telemetry.genome.map((weight, idx) => {
            const intensity = Math.min(1, Math.max(0, weight / 4));
            return (
              <div
                key={idx}
                className="h-6 rounded bg-[#18070a] border border-[#471923] flex items-center justify-center font-mono text-[9px]"
                style={{
                  backgroundColor: `rgba(255, 51, 75, ${0.1 + intensity * 0.4})`,
                  color: weight > 1.5 ? '#ff7b00' : '#ff99a8',
                }}
                title={`Cell ${idx}: Weight ${weight.toFixed(2)}`}
              >
                {weight.toFixed(1)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
