/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect } from 'vitest';
import {
  checkWinner,
  LakeQLearningAgent,
  LavaGeneticAgent,
  mulberry32,
  expectedScore,
  updateElo,
  setGlobalSeed,
} from './aiEngine';
import type { BoardState } from '../types';

describe('checkWinner', () => {
  it('detects row win', () => {
    const b: BoardState = ['O', 'O', 'O', null, null, null, null, null, null];
    expect(checkWinner(b)?.winner).toBe('O');
  });
  it('detects draw', () => {
    const b: BoardState = ['O', 'X', 'O', 'O', 'X', 'X', 'X', 'O', 'O'];
    expect(checkWinner(b)?.winner).toBe('DRAW');
  });
  it('returns null mid-game', () => {
    const b: BoardState = Array(9).fill(null);
    expect(checkWinner(b)).toBeNull();
  });
});

describe('seeded RNG', () => {
  it('mulberry32 is deterministic', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    expect(a()).toBe(b());
  });
});

describe('LakeQLearningAgent', () => {
  it('starts unbiased and learns from win', () => {
    setGlobalSeed(7);
    const agent = new LakeQLearningAgent(7);
    agent.setHyperparams({ epsilon: 0 });
    const b: BoardState = Array(9).fill(null);
    const d = agent.chooseAction(b);
    expect(d).not.toBeNull();
    agent.updatePolicy(1.0);
    expect(agent.qTable.size).toBeGreaterThan(0);
    expect(agent.generation).toBe(2);
  });
  it('serializes round-trip', () => {
    const agent = new LakeQLearningAgent(1);
    agent.setHyperparams({ epsilon: 0 });
    agent.chooseAction(Array(9).fill(null));
    agent.updatePolicy(1.0);
    const json = agent.toJSON();
    const agent2 = new LakeQLearningAgent(999);
    agent2.fromJSON(json);
    expect(agent2.qTable.size).toBe(agent.qTable.size);
  });
});

describe('LavaGeneticAgent', () => {
  it('finds immediate win', () => {
    setGlobalSeed(11);
    const agent = new LavaGeneticAgent();
    agent.setSeed(11);
    // X has two in a row, should complete it
    const b: BoardState = ['X', 'X', null, 'O', 'O', null, null, null, null];
    // force deterministic (disable 3% explore by seeding loop until non-explore? run multiple)
    let found = false;
    for (let i = 0; i < 20; i++) {
      const d = agent.chooseAction([...b]);
      if (d && d.action === 2) { found = true; break; }
    }
    expect(found).toBe(true);
  });
  it('respects maxDepth config', () => {
    const agent = new LavaGeneticAgent();
    agent.setDepth(2);
    expect(agent.maxDepth).toBe(2);
  });
});

describe('elo', () => {
  it('favorite gains less than underdog', () => {
    const fav = updateElo(1600, 1200, 1);
    const upset = updateElo(1200, 1600, 1);
    expect(upset.newA - 1200).toBeGreaterThan(fav.newA - 1600);
  });
  it('draw moves ratings toward each other', () => {
    const { newA } = updateElo(1400, 1200, 0.5);
    expect(newA).toBeLessThan(1400);
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5);
  });
});
