/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sliders, History, Database, Check, Waves, Flame } from 'lucide-react';
import { MatchLogItem } from '../types';

interface InspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  qTableSize: number;
  sampleQStates: { state: string; values: number[]; bestAction: number }[];
  genome: number[];
  onUpdateGenome: (newGenome: number[]) => void;
  matchHistory: MatchLogItem[];
  onClearHistory: () => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  isOpen,
  onClose,
  qTableSize,
  sampleQStates,
  genome,
  onUpdateGenome,
  matchHistory,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'weights' | 'history' | 'qtable'>('weights');
  const [tempGenome, setTempGenome] = useState<number[]>([...genome]);
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleWeightChange = (index: number, val: number) => {
    const updated = [...tempGenome];
    updated[index] = Number(val.toFixed(2));
    setTempGenome(updated);
  };

  const handleApplyGenome = () => {
    onUpdateGenome(tempGenome);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleResetGenome = () => {
    const def = [1.0, 0.5, 1.0, 0.5, 2.0, 0.5, 1.0, 0.5, 1.0];
    setTempGenome(def);
    onUpdateGenome(def);
  };

  const positionLabels = [
    'Top-Left (Corner)', 'Top-Center (Edge)', 'Top-Right (Corner)',
    'Middle-Left (Edge)', 'Center (Core)', 'Middle-Right (Edge)',
    'Bottom-Left (Corner)', 'Bottom-Center (Edge)', 'Bottom-Right (Corner)'
  ];

  return (
    <div
      id="inspector-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="inspector-modal"
        className="w-full max-w-2xl bg-[#060a14] border border-[#1e2c4a] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1b2742] bg-[#0a1224]">
          <div className="flex items-center gap-3">
            <Sliders className="w-5 h-5 text-[#00f0ff]" />
            <div>
              <h3 className="font-headline text-base font-bold text-[#dae2fd]">
                Real AI Model Inspector // Telemetry &amp; Memory
              </h3>
              <p className="text-xs text-[#8899b7]">
                Live inspection of Ai Lake-1 Q-table and Ai Lava-1 positional chromosomes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8899b7] hover:text-[#dae2fd] hover:bg-[#131d36] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1b2742] bg-[#060a14] px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('weights')}
            className={`flex items-center gap-2 px-4 py-2.5 font-headline text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'weights'
                ? 'bg-[#131d36] text-[#ff7b00] border-t-2 border-[#ff334b]'
                : 'text-[#8899b7] hover:text-[#dae2fd]'
            }`}
          >
            <Flame className="w-4 h-4 text-[#ff334b]" />
            <span>Ai Lava-1 Chromosome Weights</span>
          </button>

          <button
            onClick={() => setActiveTab('qtable')}
            className={`flex items-center gap-2 px-4 py-2.5 font-headline text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'qtable'
                ? 'bg-[#131d36] text-[#00f0ff] border-t-2 border-[#00f0ff]'
                : 'text-[#8899b7] hover:text-[#dae2fd]'
            }`}
          >
            <Waves className="w-4 h-4 text-[#00f0ff]" />
            <span>Ai Lake-1 Q-Learning Memory ({qTableSize})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 font-headline text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#131d36] text-[#dae2fd] border-t-2 border-[#00f0ff]'
                : 'text-[#8899b7] hover:text-[#dae2fd]'
            }`}
          >
            <History className="w-4 h-4 text-[#00f0ff]" />
            <span>Match Log Archive</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {activeTab === 'weights' && (
            <div className="flex flex-col gap-5">
              <div className="bg-[#12080a] p-4 rounded-xl border border-[#3d131b] flex flex-col gap-1">
                <span className="font-headline text-sm text-[#ff99a8] font-bold">
                  Positional Heuristic Weights (Ai Lava-1)
                </span>
                <p className="text-xs text-[#dae2fd]/80">
                  These weights define how Ai Lava-1 scores squares during minimax evaluations. Initial baseline is 100% symmetrical (corners 1.0, edges 0.5, center 2.0).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tempGenome.map((val, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-1.5 p-3 rounded-xl bg-[#0a1224] border border-[#1b2742]"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#8899b7]">{positionLabels[idx]}</span>
                      <strong className="text-[#ff7b00] font-bold">{val.toFixed(2)}</strong>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="5.0"
                      step="0.05"
                      value={val}
                      onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value))}
                      className="accent-[#ff334b] cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1b2742]">
                <button
                  onClick={handleResetGenome}
                  className="px-4 py-2 rounded-lg bg-[#131d36] hover:bg-[#1b2742] text-[#8899b7] hover:text-[#dae2fd] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset To Symmetrical Baseline
                </button>
                <button
                  onClick={handleApplyGenome}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#ff334b] text-white hover:bg-[#ff4d63] font-headline text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,51,75,0.4)] cursor-pointer"
                >
                  {saveFeedback ? <Check className="w-4 h-4" /> : null}
                  <span>{saveFeedback ? 'Applied!' : 'Save & Apply To Bot'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'qtable' && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#061224] p-4 rounded-xl border border-[#162d4d] flex flex-col gap-1">
                <span className="font-headline text-sm text-[#00f0ff] font-bold">
                  Active Q-Table State Memory ({qTableSize.toLocaleString()} states)
                </span>
                <p className="text-xs text-[#8899b7]">
                  Every visited board configuration is saved as a 9-cell key. The numbers represent the learned value of picking each square.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {sampleQStates.length === 0 ? (
                  <p className="text-xs text-[#8899b7] italic">
                    Waiting for matches to train initial states...
                  </p>
                ) : (
                  sampleQStates.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#0a1224] border border-[#1b2742] flex flex-col gap-2 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#00f0ff] font-bold">State: `{item.state}`</span>
                        <span className="text-[#8899b7]">
                          Best Pick: Square {item.bestAction}
                        </span>
                      </div>
                      <div className="grid grid-cols-9 gap-1 text-[10px] text-center">
                        {item.values.map((v, cIdx) => (
                          <div
                            key={cIdx}
                            className={`p-1 rounded ${
                              cIdx === item.bestAction
                                ? 'bg-[#00f0ff]/20 text-[#00f0ff] font-bold border border-[#00f0ff]/50'
                                : 'bg-[#060a14] text-[#8899b7]'
                            }`}
                          >
                            {(v >= 0 ? '+' : '') + v.toFixed(1)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#8899b7]">
                  {matchHistory.length} completed rounds logged
                </span>
                {matchHistory.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="text-xs font-mono text-[#ff334b] hover:text-[#ff6b7e] transition-colors cursor-pointer"
                  >
                    Clear Match Log
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 font-mono text-xs">
                {matchHistory.length === 0 ? (
                  <p className="text-xs text-[#8899b7] italic">
                    No matches recorded yet. The stream is running the first round!
                  </p>
                ) : (
                  matchHistory.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#0a1224] border border-[#1b2742]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#8899b7]">Round #{m.round}</span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-xs ${
                            m.winner === 'O'
                              ? 'bg-[#00f0ff]/20 text-[#00f0ff]'
                              : m.winner === 'X'
                              ? 'bg-[#ff334b]/20 text-[#ff334b]'
                              : 'bg-[#293b66] text-[#dae2fd]'
                          }`}
                        >
                          {m.winner === 'O' ? 'Ai Lake-1 Won' : m.winner === 'X' ? 'Ai Lava-1 Won' : 'Stalemate (Draw)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#8899b7]">
                        <span>{m.movesCount} plies</span>
                        <span>•</span>
                        <span>{(m.durationMs / 1000).toFixed(1)}s</span>
                        <span>•</span>
                        <span>{m.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
