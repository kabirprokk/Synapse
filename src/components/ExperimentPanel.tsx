/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ExperimentPanel — scientist controls: seed, hyperparams, Elo, export.
 */

import React, { useState } from 'react';
import { FlaskConical, Download, RotateCcw, Dna, CheckCircle2 } from 'lucide-react';

interface ExperimentPanelProps {
  seed: number;
  onApplySeed: (s: number) => void;
  alpha: number;
  gamma: number;
  epsilon: number;
  mutationSigma: number;
  maxDepth: number;
  onHyper: (p: { alpha?: number; gamma?: number; epsilon?: number; epsilonDecay?: number; mutationSigma?: number; maxDepth?: number }) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onReset: () => void;
  matchCount: number;
  eloLake: number;
  eloLava: number;
  eloHuman: number;
  outcomes: string[];
}

export const ExperimentPanel: React.FC<ExperimentPanelProps> = ({
  seed, onApplySeed, alpha, gamma, epsilon, mutationSigma, maxDepth,
  onHyper, onExportCsv, onExportJson, onReset, matchCount,
  eloLake, eloLava, eloHuman, outcomes,
}) => {
  const [seedInput, setSeedInput] = useState(String(seed));
  const [notice, setNotice] = useState('');

  const last20 = outcomes.slice(-20);
  const lakeWins = last20.filter(o => o === 'O').length;
  const lavaWins = last20.filter(o => o === 'X').length;
  const draws = last20.filter(o => o === 'D').length;

  return (
    <div className="w-full bg-[#060a14]/90 border border-[#222f4d] rounded-2xl p-4 md:p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-[#00f0ff]" />
          <h3 className="font-headline text-sm font-bold text-[#dae2fd]">Experiment Controls — reproducible, local, honest</h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-1 rounded bg-[#0a1b33] text-[#7df4ff] border border-[#1d3866]">Lake Elo {eloLake}</span>
          <span className="px-2 py-1 rounded bg-[#290d13] text-[#ff99a8] border border-[#591b26]">Lava Elo {eloLava}</span>
          <span className="px-2 py-1 rounded bg-[#131d36] text-[#dae2fd] border border-[#293b66]">You Elo {eloHuman}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
        <label className="flex flex-col gap-1.5 bg-[#0a1224] border border-[#1b2742] rounded-xl p-3">
          <span className="text-[#8899b7] uppercase text-[10px]">Random seed</span>
          <div className="flex gap-1.5">
            <input value={seedInput} onChange={e => setSeedInput(e.target.value)} inputMode="numeric"
              className="w-full bg-[#060a14] border border-[#222f4d] rounded-lg px-2 py-1.5 text-[#dae2fd] focus:border-[#00f0ff] outline-none" />
            <button onClick={() => onApplySeed(Number(seedInput))} className="px-3 py-1.5 rounded-lg bg-[#00f0ff] text-[#051b33] font-bold cursor-pointer">Set</button>
          </div>
          <span className="text-[10px] text-[#8899b7]/70">Same seed → same exploratory sequence.</span>
        </label>

        <label className="flex flex-col gap-1.5 bg-[#0a1224] border border-[#1b2742] rounded-xl p-3">
          <span className="text-[#8899b7] uppercase text-[10px]">Lake α (learn rate): {alpha.toFixed(3)}</span>
          <input type="range" min="0.01" max="1" step="0.01" value={alpha} onChange={e => onHyper({ alpha: Number(e.target.value) })} className="accent-[#00f0ff] cursor-pointer" />
          <span className="text-[#8899b7] uppercase text-[10px]">γ (discount): {gamma.toFixed(3)}</span>
          <input type="range" min="0.5" max="0.999" step="0.005" value={gamma} onChange={e => onHyper({ gamma: Number(e.target.value) })} className="accent-[#00f0ff] cursor-pointer" />
        </label>

        <label className="flex flex-col gap-1.5 bg-[#0a1224] border border-[#1b2742] rounded-xl p-3">
          <span className="text-[#8899b7] uppercase text-[10px]">Lake ε (explore): {(epsilon * 100).toFixed(1)}%</span>
          <input type="range" min="0" max="0.5" step="0.005" value={epsilon} onChange={e => onHyper({ epsilon: Number(e.target.value) })} className="accent-[#00f0ff] cursor-pointer" />
          <span className="text-[10px] text-[#8899b7]/70">Set 0 for deterministic evaluation.</span>
        </label>

        <label className="flex flex-col gap-1.5 bg-[#2a0b12] border border-[#471923] rounded-xl p-3">
          <span className="text-[#e099a8] uppercase text-[10px] flex items-center gap-1"><Dna className="w-3 h-3" /> Lava σ: {mutationSigma.toFixed(3)} • depth: {maxDepth}</span>
          <input type="range" min="0" max="0.3" step="0.005" value={mutationSigma} onChange={e => onHyper({ mutationSigma: Number(e.target.value) })} className="accent-[#ff334b] cursor-pointer" />
          <input type="range" min="1" max="9" step="1" value={maxDepth} onChange={e => onHyper({ maxDepth: Number(e.target.value) })} className="accent-[#ff334b] cursor-pointer" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="font-mono text-[11px] text-[#8899b7]">
          Last {last20.length}: <span className="text-[#00f0ff] font-bold">Lake {lakeWins}</span> • <span className="text-[#ff99a8] font-bold">Lava {lavaWins}</span> • <span className="text-[#dae2fd]">Draw {draws}</span> • total {matchCount}
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => { onExportCsv(); setNotice('Match log exported as CSV.'); setTimeout(() => setNotice(''), 4000); }} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#131d36] border border-[#293b66] hover:border-[#00f0ff] text-xs font-mono font-bold cursor-pointer min-h-[2.5rem]">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => { onExportJson(); setNotice('Full experiment exported as JSON.'); setTimeout(() => setNotice(''), 4000); }} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#131d36] border border-[#293b66] hover:border-[#00f0ff] text-xs font-mono font-bold cursor-pointer min-h-[2.5rem]">
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
          <button onClick={onReset} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3d161d] border border-[#591b26] hover:border-[#ff334b] text-xs font-mono font-bold text-[#ff99a8] cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" /> Reset experiment
          </button>
        </div>
      </div>
      {notice && (
        <p role="status" className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" /> {notice}
        </p>
      )}
      <p className="font-mono text-[10px] text-[#8899b7]/70">
        Methods: alternating starter (fair), Bellman Q-update on terminal reward, Gaussian genome mutation on loss only, Elo K=16. Timings measured with performance.now() in this tab. No network, no fake viewers.
      </p>
    </div>
  );
};
