/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Experiment utilities: persistence, CSV/JSON export, deterministic eval.
 */

import { MatchLogItem } from '../types';

const LS_KEYS = {
  lake: 'synapse.lake.v1',
  lava: 'synapse.lava.v1',
  matches: 'synapse.matches.v1',
  outcomes: 'synapse.outcomes.v1',
  config: 'synapse.config.v1',
} as const;

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage full / private mode */ }
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const lsKeys = LS_KEYS;

export function matchLogToCsv(matches: MatchLogItem[]): string {
  const header = 'round,winner,winnerName,movesCount,lakeMoveCount,lavaMoveCount,durationMs,timestamp';
  const rows = [...matches].reverse().map(m =>
    [m.round, m.winner, `"${m.winnerName}"`, m.movesCount, m.lakeMoveCount, m.lavaMoveCount, m.durationMs, `"${m.timestamp}"`].join(',')
  );
  return [header, ...rows].join('\n');
}

export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ExperimentConfig {
  seed: number;
  alpha: number;
  gamma: number;
  epsilon: number;
  epsilonDecay: number;
  mutationSigma: number;
  maxDepth: number;
  speed: number;
}

export const DEFAULT_CONFIG: ExperimentConfig = {
  seed: 42,
  alpha: 0.2,
  gamma: 0.95,
  epsilon: 0.05,
  epsilonDecay: 0.9995,
  mutationSigma: 0.035,
  maxDepth: 6,
  speed: 400,
};
