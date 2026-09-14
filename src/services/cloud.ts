/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cloud sync — anonymous auth + Firestore matches + Elo leaderboard.
 * Collections:
 *   matches/{autoId} { round, winner, winnerName, moves, lakeMoves, lavaMoves, durationMs, mode, seed, createdAt, uid }
 *   leaderboard/global { lake, lava, human, updatedAt, matches }
 * Everything degrades gracefully offline (local-first).
 */

import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { MatchLogItem } from '../types';

export function ensureAnonymousAuth(onUser: (u: User | null) => void): () => void {
  signInAnonymously(auth).catch(() => { /* offline or disabled — stay local */ });
  return onAuthStateChanged(auth, onUser);
}

export interface CloudMatch {
  round: number;
  winner: 'O' | 'X' | 'DRAW';
  winnerName: string;
  moves: number;
  lakeMoves: number;
  lavaMoves: number;
  durationMs: number;
  mode: string;
  seed: number;
  uid: string | null;
  createdAt: unknown;
  timestamp: string;
}

export async function pushMatchCloud(m: MatchLogItem, mode: string, seed: number): Promise<boolean> {
  try {
    const uid = auth.currentUser?.uid ?? null;
    await addDoc(collection(db, 'matches'), {
      round: m.round,
      winner: m.winner,
      winnerName: m.winnerName,
      moves: m.movesCount,
      lakeMoves: m.lakeMoveCount,
      lavaMoves: m.lavaMoveCount,
      durationMs: m.durationMs,
      timestamp: m.timestamp,
      mode,
      seed,
      uid,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchRecentCloudMatches(n = 10): Promise<CloudMatch[]> {
  try {
    const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'), limit(n));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as CloudMatch);
  } catch {
    return [];
  }
}

export interface CloudElo {
  lake: number;
  lava: number;
  human: number;
  matches: number;
}

export async function fetchGlobalElo(): Promise<CloudElo | null> {
  try {
    const s = await getDoc(doc(db, 'leaderboard', 'global'));
    if (!s.exists()) return null;
    return s.data() as CloudElo;
  } catch {
    return null;
  }
}

export async function pushGlobalElo(e: CloudElo): Promise<boolean> {
  try {
    await setDoc(doc(db, 'leaderboard', 'global'), { ...e, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch {
    return false;
  }
}
