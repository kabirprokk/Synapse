/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Waves, Activity, Cpu, Sparkles, Trophy } from 'lucide-react';
import { LakeTelemetry } from '../types';

interface AgentCardLakeProps {
  telemetry: LakeTelemetry;
  isActive: boolean;
}

export const AgentCardLake: React.FC<AgentCardLakeProps> = ({
  telemetry,
  isActive,
}) => {
  return (
    <div
      id="agent-card-lake"
      className={`relative rounded-3xl p-5 md:p-6 transition-all duration-300 backdrop-blur-2xl flex flex-col gap-4 border ${
        isActive
          ? 'bg-[#061224]/95 border-[#00f0ff] shadow-[0_0_35px_rgba(0,240,255,0.3)] ring-1 ring-[#00f0ff]/50'
          : 'bg-[#060e1d]/80 border-[#1a2e4d] hover:border-[#00f0ff]/40'
      }`}
    >
      {/* Corner cyber brackets (Skiper40 style) */}
      <span className="absolute top-2 left-2 font-mono text-[9px] text-[#00f0ff]/40 select-none">┌</span>
      <span className="absolute top-2 right-2 font-mono text-[9px] text-[#00f0ff]/40 select-none">┐</span>

      {/* Top Header: Model Identity */}
      <div className="flex items-center justify-between border-b border-[#1b3252] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <Waves className="w-5 h-5 text-[#00f0ff]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-lg font-bold text-[#dae2fd] tracking-tight">
                Ai Lake-1
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40">
                O
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#7df4ff] tracking-wide">
              Reinforcement Q-Learning
            </p>
          </div>
        </div>

        {/* Turn Status Beacon */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a1e38] border border-[#1b3252]">
          <span
            className={`w-2 h-2 rounded-full ${
              isActive
                ? 'bg-[#00f0ff] shadow-[0_0_8px_#00f0ff] animate-ping'
                : 'bg-[#405677]'
            }`}
          />
          <span className="font-mono text-[10px] text-[#7df4ff] font-medium uppercase">
            {isActive ? 'THINKING' : 'READY'}
          </span>
        </div>
      </div>

      {/* Fitness & Win Rate Counter */}
      <div className="grid grid-cols-2 gap-2 bg-[#09182d] p-3 rounded-2xl border border-[#1b3252]">
        <div className="flex flex-col">
          <span className="font-mono text-[10px] text-[#8899b7] uppercase">
            Recent Win Rate
          </span>
          <span className="font-headline text-2xl font-bold text-[#00f0ff]">
            {telemetry.fitness}%
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="font-mono text-[10px] text-[#8899b7] uppercase">
            Score (W / D / L)
          </span>
          <span className="font-mono text-xs font-semibold text-[#dae2fd] mt-1.5">
            <span className="text-[#00f0ff]">{telemetry.wins}W</span> •{' '}
            <span className="text-[#cbc3d7]">{telemetry.draws}D</span> •{' '}
            <span className="text-[#ff334b]">{telemetry.losses}L</span>
          </span>
        </div>
      </div>

      {/* Real Model Telemetry Metrics */}
      <div className="flex flex-col gap-2 font-mono text-xs text-[#8899b7]">
        <div className="flex items-center justify-between py-1 border-b border-[#1b3252]/50">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#00f0ff]" />
            Exploration Rate (&epsilon;):
          </span>
          <strong className="text-[#dae2fd]">
            {(telemetry.epsilon * 100).toFixed(1)}%
          </strong>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-[#1b3252]/50">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#7df4ff]" />
            Discount Factor (&gamma;):
          </span>
          <strong className="text-[#dae2fd]">{telemetry.discountFactor}</strong>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-[#1b3252]/50">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
            Learned Board States:
          </span>
          <strong className="text-[#00f0ff] font-bold">
            {telemetry.totalStates.toLocaleString()}
          </strong>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#7df4ff]" />
            Learning Rate (&alpha;):
          </span>
          <strong className="text-[#dae2fd]">{telemetry.learningRate}</strong>
        </div>
      </div>

      {/* Latest Move Decision */}
      <div className="bg-[#09182d] p-3 rounded-2xl border border-[#1b3252] flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#8899b7] uppercase">
            Latest Move Valuation
          </span>
          {telemetry.isExploratory && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] font-bold">
              EXPLORATORY MOVE
            </span>
          )}
        </div>
        <p className="font-mono text-xs text-[#dae2fd] truncate">
          {telemetry.lastMove}
        </p>
      </div>

      {/* 9-Cell Q-Distribution Mini Heatmap */}
      <div className="flex flex-col gap-1.5 bg-[#09182d] p-3 rounded-2xl border border-[#1b3252]">
        <div className="flex items-center justify-between font-mono text-[10px] text-[#8899b7]">
          <span>ACTIVE CELL VALUATIONS:</span>
          <span>9-Cell Grid</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {telemetry.qDistribution.map((val, idx) => {
            const intensity = Math.min(1, Math.max(0, (val + 1) / 2));
            return (
              <div
                key={idx}
                className="h-6 rounded bg-[#061224] border border-[#1b3252] flex items-center justify-center font-mono text-[9px]"
                style={{
                  backgroundColor: `rgba(0, 240, 255, ${0.1 + intensity * 0.35})`,
                  color: val > 0 ? '#00f0ff' : '#8899b7',
                }}
                title={`Cell ${idx}: Score ${(val >= 0 ? '+' : '') + val.toFixed(2)}`}
              >
                {(val >= 0 ? '+' : '') + val.toFixed(1)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
