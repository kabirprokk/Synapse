/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CellValue = 'O' | 'X' | null;
export type BoardState = CellValue[];

export interface WinningCombo {
  winner: 'O' | 'X' | 'DRAW';
  combo: [number, number, number] | null;
}

export type ArenaSpeed = 900 | 400 | 120 | 25;

export type PlayMode = 'auto' | 'human-lake' | 'human-lava';

export interface LakeTelemetry {
  generation: number;
  epsilon: number;
  discountFactor: number;
  learningRate: number;
  fitness: number;
  totalStates: number;
  lastMove: string;
  lastQValue: number;
  isExploratory: boolean;
  qDistribution: number[];
  wins: number;
  draws: number;
  losses: number;
}

export interface LavaTelemetry {
  generation: number;
  mutationSigma: number;
  fitness: number;
  genome: number[];
  centerWeight: number;
  lastMove: string;
  lastEvalScore: number;
  nodesEvaluated: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface PlyRecord {
  plyNumber: number;
  round: number;
  player: 'O' | 'X';
  playerName: string;
  cellIndex: number;
  boardSnapshot: BoardState;
  actionDesc: string;
  evalMetric: string;
  timestamp: string;
}

export interface MatchLogItem {
  round: number;
  winner: 'O' | 'X' | 'DRAW';
  winnerName: string;
  movesCount: number;
  lakeMoveCount: number;
  lavaMoveCount: number;
  durationMs: number;
  timestamp: string;
}

export interface StreamCommentary {
  id: string;
  timestamp: string;
  user: string;
  message: string;
  badge?: string;
  badgeColor?: string;
  isSystem?: boolean;
}

export interface StoredTransmission {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
  status: 'Delivered' | 'In Review';
}
