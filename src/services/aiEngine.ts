/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Synapse AI engines — deterministic, serializable, benchmark-ready.
 * - Seeded RNG (mulberry32) for reproducible experiments
 * - Q-learning agent with decay schedule + JSON export/import
 * - Minimax agent with configurable depth + JSON export/import
 * - Elo ratings + decision-time measurement helpers
 */

import { BoardState, WinningCombo } from '../types';

export const WINNING_COMBOS: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export const CELL_PERCENT_COORDS = [
  { x: 17, y: 17 }, { x: 50, y: 17 }, { x: 83, y: 17 },
  { x: 17, y: 50 }, { x: 50, y: 50 }, { x: 83, y: 50 },
  { x: 17, y: 83 }, { x: 50, y: 83 }, { x: 83, y: 83 }
];

export function checkWinner(board: BoardState): WinningCombo | null {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as 'O' | 'X', combo };
    }
  }
  if (board.every(cell => cell !== null)) {
    return { winner: 'DRAW', combo: null };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32) — scientists can set a seed and replay runs.
// ---------------------------------------------------------------------------

export type RandomFn = () => number;

export function mulberry32(seed: number): RandomFn {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let globalSeed = 42;
let globalRng: RandomFn = mulberry32(globalSeed);

export function setGlobalSeed(seed: number): void {
  globalSeed = seed >>> 0;
  globalRng = mulberry32(globalSeed);
}

export function getGlobalSeed(): number {
  return globalSeed;
}

export function globalRandom(): number {
  return globalRng();
}

// ---------------------------------------------------------------------------
// Elo ratings — standard zero-sum skill tracking (K=16).
// ---------------------------------------------------------------------------

export const ELO_INITIAL = 1200;
export const ELO_K = 16;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function updateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number // 1 = A wins, 0.5 = draw, 0 = B wins
): { newA: number; newB: number } {
  const ea = expectedScore(ratingA, ratingB);
  const eb = 1 - ea;
  const newA = ratingA + ELO_K * (scoreA - ea);
  const newB = ratingB + ELO_K * ((1 - scoreA) - eb);
  return { newA: Math.round(newA * 10) / 10, newB: Math.round(newB * 10) / 10 };
}

export interface QDecision {
  action: number;
  qValue: number;
  isExploratory: boolean;
  qDistribution: number[];
}

/**
 * Ai Lake-1: Unbiased Reinforcement Learning Q-Agent (O)
 * Learns exclusively through trial-and-error reward backpropagation (Bellman Equation).
 */
export class LakeQLearningAgent {
  public name = 'Ai Lake-1';
  public qTable: Map<string, Float64Array> = new Map();
  public alpha: number = 0.20; // Learning rate
  public gamma: number = 0.95; // Discount factor
  public epsilon: number = 0.05; // Exploration rate
  public epsilonMin: number = 0.01;
  public epsilonDecay: number = 0.9995; // applied per finished game
  public generation: number = 1;
  public wins: number = 0;
  public draws: number = 0;
  public losses: number = 0;
  public history: { stateKey: string; action: number }[] = [];
  public lastActionDesc: string = 'System online';
  public lastQVal: number = 0.0;
  public lastExploratory: boolean = false;
  public rng: RandomFn = () => globalRandom();

  constructor(seed?: number) {
    // Unbiased start: completely empty Q-table. All actions start at 0.0
    if (typeof seed === 'number') this.setSeed(seed);
  }

  public setSeed(seed: number): void {
    this.rng = mulberry32(seed >>> 0);
  }

  public setHyperparams(p: { alpha?: number; gamma?: number; epsilon?: number; epsilonMin?: number; epsilonDecay?: number }): void {
    if (typeof p.alpha === 'number') this.alpha = p.alpha;
    if (typeof p.gamma === 'number') this.gamma = p.gamma;
    if (typeof p.epsilon === 'number') this.epsilon = p.epsilon;
    if (typeof p.epsilonMin === 'number') this.epsilonMin = p.epsilonMin;
    if (typeof p.epsilonDecay === 'number') this.epsilonDecay = p.epsilonDecay;
  }

  public getStateKey(b: BoardState): string {
    return b.map(v => (v === null ? '_' : v)).join('');
  }

  public getQValues(stateKey: string): Float64Array {
    let q = this.qTable.get(stateKey);
    if (!q) {
      q = new Float64Array(9); // Unbiased 0.0 initial values
      this.qTable.set(stateKey, q);
    }
    return q;
  }

  public chooseAction(b: BoardState): QDecision | null {
    const available: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (b[i] === null) available.push(i);
    }
    if (available.length === 0) return null;

    const stateKey = this.getStateKey(b);
    const qValues = this.getQValues(stateKey);

    let selectedAction: number;
    let isExploratory = false;

    if (this.rng() < this.epsilon) {
      selectedAction = available[Math.floor(this.rng() * available.length)];
      isExploratory = true;
    } else {
      let bestVal = -Infinity;
      let bestMoves: number[] = [];
      for (const action of available) {
        const val = qValues[action];
        if (val > bestVal) {
          bestVal = val;
          bestMoves = [action];
        } else if (Math.abs(val - bestVal) < 1e-6) {
          bestMoves.push(action);
        }
      }
      selectedAction = bestMoves[Math.floor(this.rng() * bestMoves.length)];
    }

    this.history.push({ stateKey, action: selectedAction });
    this.lastQVal = qValues[selectedAction];
    this.lastExploratory = isExploratory;

    const r = Math.floor(selectedAction / 3);
    const c = selectedAction % 3;
    const qStr = (this.lastQVal >= 0 ? '+' : '') + this.lastQVal.toFixed(2);
    this.lastActionDesc = `Cell (${r},${c}) • Q: ${qStr}${isExploratory ? ' [Explore]' : ''}`;

    return {
      action: selectedAction,
      qValue: this.lastQVal,
      isExploratory,
      qDistribution: Array.from(qValues)
    };
  }

  public updatePolicy(finalReward: number): void {
    // Bellman backprop: each step's target uses the NEXT state's best legal
    // Q-value. Previous code used max over the CURRENT state's 9 cells
    // (including occupied cells stuck at 0.0), which inflated targets and
    // stalled learning vs minimax.
    let nextMaxQ = 0;
    for (let i = this.history.length - 1; i >= 0; i--) {
      const { stateKey, action } = this.history[i];
      const qVals = this.getQValues(stateKey);
      const oldQ = qVals[action];
      const target = (i === this.history.length - 1) ? finalReward : -0.01 + this.gamma * nextMaxQ;
      qVals[action] = oldQ + this.alpha * (target - oldQ);
      // Best legal value in THIS state becomes nextMaxQ for the previous step.
      let best = -Infinity;
      for (let a = 0; a < 9; a++) {
        if (stateKey[a] === '_') {
          if (qVals[a] > best) best = qVals[a];
        }
      }
      nextMaxQ = best === -Infinity ? 0 : best;
    }
    this.history = [];
    this.generation++;
    // Epsilon decay for reproducible learning schedules
    this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
  }

  /** Export Q-table to plain JSON for download / versioning. */
  public toJSON(): { alpha: number; gamma: number; epsilon: number; generation: number; wins: number; draws: number; losses: number; table: Record<string, number[]> } {
    const table: Record<string, number[]> = {};
    for (const [k, v] of this.qTable.entries()) table[k] = Array.from(v);
    return { alpha: this.alpha, gamma: this.gamma, epsilon: this.epsilon, generation: this.generation, wins: this.wins, draws: this.draws, losses: this.losses, table };
  }

  public fromJSON(data: { alpha?: number; gamma?: number; epsilon?: number; generation?: number; wins?: number; draws?: number; losses?: number; table?: Record<string, number[]> }): void {
    if (typeof data.alpha === 'number') this.alpha = data.alpha;
    if (typeof data.gamma === 'number') this.gamma = data.gamma;
    if (typeof data.epsilon === 'number') this.epsilon = data.epsilon;
    if (typeof data.generation === 'number') this.generation = data.generation;
    if (typeof data.wins === 'number') this.wins = data.wins;
    if (typeof data.draws === 'number') this.draws = data.draws;
    if (typeof data.losses === 'number') this.losses = data.losses;
    if (data.table) {
      this.qTable.clear();
      for (const [k, arr] of Object.entries(data.table)) {
        const v = new Float64Array(9);
        arr.slice(0, 9).forEach((x, i) => { v[i] = Number(x) || 0; });
        this.qTable.set(k, v);
      }
    }
  }

  public resetStats(): void {
    this.wins = 0; this.draws = 0; this.losses = 0; this.generation = 1; this.history = [];
  }
}

export interface MinimaxDecision {
  action: number;
  evalScore: number;
  nodes: number;
}

/**
 * Ai Lava-1: Symmetrical Adversarial Search & Genetic Evolution Agent (X)
 * Searches future branches using Minimax + Alpha-Beta Pruning with a symmetrical positional genome.
 */
export class LavaGeneticAgent {
  public name = 'Ai Lava-1';
  // Perfectly symmetrical baseline: corners 1.0, edges 0.5, center 2.0. No positional bias.
  public genome: number[] = [1.0, 0.5, 1.0, 0.5, 2.0, 0.5, 1.0, 0.5, 1.0];
  public generation: number = 1;
  public mutationSigma: number = 0.035;
  public maxDepth: number = 6;
  public nodesEvaluated: number = 0;
  public wins: number = 0;
  public draws: number = 0;
  public losses: number = 0;
  public lastActionDesc: string = 'System online';
  public lastEvalScore: number = 0.0;
  public rng: RandomFn = () => globalRandom();

  public setSeed(seed: number): void {
    this.rng = mulberry32(seed >>> 0);
  }

  public setDepth(d: number): void {
    this.maxDepth = Math.max(1, Math.min(9, Math.floor(d)));
  }

  public mutate(): void {
    for (let i = 0; i < this.genome.length; i++) {
      // Box-Muller Gaussian mutation using seeded RNG
      const u1 = this.rng() || 1e-7;
      const u2 = this.rng() || 1e-7;
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      this.genome[i] = Math.max(0.1, Number((this.genome[i] + z0 * this.mutationSigma).toFixed(3)));
    }
    this.generation++;
  }

  public evaluateState(b: BoardState, depth: number): number {
    let score = 0;
    for (let i = 0; i < 9; i++) {
      if (b[i] === 'X') score += this.genome[i];
      else if (b[i] === 'O') score -= this.genome[i];
    }
    return score - depth * 0.05;
  }

  public minimax(
    b: BoardState,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number
  ): number {
    this.nodesEvaluated++;
    const res = checkWinner(b);
    if (res) {
      if (res.winner === 'X') return 100 - depth;
      if (res.winner === 'O') return depth - 100;
      if (res.winner === 'DRAW') return 0;
    }
    if (depth >= this.maxDepth) return this.evaluateState(b, depth);

    const available: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (b[i] === null) available.push(i);
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const idx of available) {
        b[idx] = 'X';
        const ev = this.minimax(b, depth + 1, false, alpha, beta);
        b[idx] = null;
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const idx of available) {
        b[idx] = 'O';
        const ev = this.minimax(b, depth + 1, true, alpha, beta);
        b[idx] = null;
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  public chooseAction(b: BoardState): MinimaxDecision | null {
    this.nodesEvaluated = 0;
    const available: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (b[i] === null) available.push(i);
    }
    if (available.length === 0) return null;

    let bestScore = -Infinity;
    let bestMoves: number[] = [];

    // Stochastic exploration element (3%) so matches don't lock into identical loops
    if (this.rng() < 0.03) {
      const randMove = available[Math.floor(this.rng() * available.length)];
      this.lastEvalScore = 0.0;
      this.lastActionDesc = `Cell (${Math.floor(randMove / 3)},${randMove % 3}) • Explore`;
      return { action: randMove, evalScore: 0.0, nodes: 1 };
    }

    for (const idx of available) {
      b[idx] = 'X';
      const score = this.minimax(b, 0, false, -Infinity, Infinity);
      b[idx] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [idx];
      } else if (Math.abs(score - bestScore) < 1e-6) {
        bestMoves.push(idx);
      }
    }

    const selectedMove = bestMoves[Math.floor(this.rng() * bestMoves.length)];
    this.lastEvalScore = bestScore;
    const r = Math.floor(selectedMove / 3);
    const c = selectedMove % 3;
    const evalStr = (bestScore >= 0 ? '+' : '') + bestScore.toFixed(2);
    this.lastActionDesc = `Cell (${r},${c}) • Eval: ${evalStr}`;

    return {
      action: selectedMove,
      evalScore: bestScore,
      nodes: this.nodesEvaluated
    };
  }

  public toJSON(): { genome: number[]; generation: number; mutationSigma: number; maxDepth: number; wins: number; draws: number; losses: number } {
    return { genome: [...this.genome], generation: this.generation, mutationSigma: this.mutationSigma, maxDepth: this.maxDepth, wins: this.wins, draws: this.draws, losses: this.losses };
  }

  public fromJSON(data: Partial<{ genome: number[]; generation: number; mutationSigma: number; maxDepth: number; wins: number; draws: number; losses: number }>): void {
    if (Array.isArray(data.genome) && data.genome.length === 9) this.genome = data.genome.map(Number);
    if (typeof data.generation === 'number') this.generation = data.generation;
    if (typeof data.mutationSigma === 'number') this.mutationSigma = data.mutationSigma;
    if (typeof data.maxDepth === 'number') this.setDepth(data.maxDepth);
    if (typeof data.wins === 'number') this.wins = data.wins;
    if (typeof data.draws === 'number') this.draws = data.draws;
    if (typeof data.losses === 'number') this.losses = data.losses;
  }

  public resetStats(): void {
    this.wins = 0; this.draws = 0; this.losses = 0; this.generation = 1;
  }
}
