/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Synapse — scientist-ready arena:
 * - Real session timing (no fake viewers/uptime)
 * - Human play mode (you vs Lake / you vs Lava)
 * - Seeded RNG, Elo, persistence, CSV/JSON export
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BoardState,
  ArenaSpeed,
  PlayMode,
  WinningCombo,
  LakeTelemetry,
  LavaTelemetry,
  PlyRecord,
  MatchLogItem,
  StreamCommentary,
} from './types';
import {
  LakeQLearningAgent,
  LavaGeneticAgent,
  checkWinner,
  setGlobalSeed,
  getGlobalSeed,
  ELO_INITIAL,
  updateElo,
} from './services/aiEngine';
import { soundManager } from './services/audio';
import {
  lsKeys,
  loadJSON,
  saveJSON,
  matchLogToCsv,
  downloadText,
  DEFAULT_CONFIG,
} from './services/experiment';
import { initAnalytics } from './services/firebase';
import {
  ensureAnonymousAuth,
  pushMatchCloud,
  pushGlobalElo,
  fetchGlobalElo,
  type CloudElo,
} from './services/cloud';

import { Header } from './components/Header';
import { LiveStreamHud } from './components/LiveStreamHud';
import { AgentCardLake } from './components/AgentCardLake';
import { TactileMatrix } from './components/TactileMatrix';
import { AgentCardLava } from './components/AgentCardLava';
import { LiveStreamChat } from './components/LiveStreamChat';
import { ArchitectureSection } from './components/ArchitectureSection';
import { TransmissionSection } from './components/TransmissionSection';
import { AiNavigatorHud } from './components/AiNavigatorHud';
import { InspectorModal } from './components/InspectorModal';
import { ExperimentPanel } from './components/ExperimentPanel';
import { Footer } from './components/Footer';

export default function App() {
  const lakeRef = useRef<LakeQLearningAgent | null>(null);
  const lavaRef = useRef<LavaGeneticAgent | null>(null);
  if (!lakeRef.current) lakeRef.current = new LakeQLearningAgent(DEFAULT_CONFIG.seed);
  if (!lavaRef.current) lavaRef.current = new LavaGeneticAgent();

  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'O' | 'X'>('O');
  const [round, setRound] = useState<number>(1);
  const [speed, setSpeed] = useState<ArenaSpeed>(400);
  const [playMode, setPlayMode] = useState<PlayMode>('auto');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [winningResult, setWinningResult] = useState<WinningCombo | null>(null);
  const [statusText, setStatusText] = useState<string>('Ai Lake-1 is evaluating opening move...');
  const [latencyMs, setLatencyMs] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('arena');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // Real session metrics (honest: starts at 0, counts this tab only)
  const sessionStartRef = useRef<number>(Date.now());
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(0);
  const [seed, setSeed] = useState<number>(() => loadJSON<number>('synapse.seed.v1', DEFAULT_CONFIG.seed));
  const [eloLake, setEloLake] = useState<number>(() => loadJSON<number>('synapse.elo.lake', ELO_INITIAL));
  const [eloLava, setEloLava] = useState<number>(() => loadJSON<number>('synapse.elo.lava', ELO_INITIAL));
  const [eloHuman, setEloHuman] = useState<number>(() => loadJSON<number>('synapse.elo.human', ELO_INITIAL));

  // Firebase cloud state (local-first, syncs when online)
  const [cloudUid, setCloudUid] = useState<string | null>(null);
  const [cloudOk, setCloudOk] = useState<boolean | null>(null);
  const [globalElo, setGlobalElo] = useState<CloudElo | null>(null);

  const matchStartTimeRef = useRef<number>(Date.now());
  const movesCountRef = useRef<number>(0);
  const lakeMovesRef = useRef<number>(0);
  const lavaMovesRef = useRef<number>(0);

  const [matchHistory, setMatchHistory] = useState<MatchLogItem[]>(() => loadJSON<MatchLogItem[]>(lsKeys.matches, []));
  const [outcomes, setOutcomes] = useState<string[]>(() => loadJSON<string[]>(lsKeys.outcomes, []));

  const [pliesHistory, setPliesHistory] = useState<PlyRecord[]>([]);
  const [isViewingPast, setIsViewingPast] = useState<boolean>(false);
  const [viewingPly, setViewingPly] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const [comments, setComments] = useState<StreamCommentary[]>([
    {
      id: 'sys-boot',
      timestamp: new Date().toLocaleTimeString(),
      user: 'ExperimentLog',
      message: `Session started. Seed=${loadJSON<number>('synapse.seed.v1', DEFAULT_CONFIG.seed)}. Local run — no fake viewers. All timings measured in this tab.`,
      isSystem: true,
    },
  ]);

  const [lakeTelemetry, setLakeTelemetry] = useState<LakeTelemetry>({
    generation: 1, epsilon: 0.05, discountFactor: 0.95, learningRate: 0.2,
    fitness: 50.0, totalStates: 0, lastMove: 'Unbiased baseline', lastQValue: 0.0,
    isExploratory: false, qDistribution: Array(9).fill(0), wins: 0, draws: 0, losses: 0,
  });

  const [lavaTelemetry, setLavaTelemetry] = useState<LavaTelemetry>({
    generation: 1, mutationSigma: 0.035, fitness: 50.0,
    genome: [1.0, 0.5, 1.0, 0.5, 2.0, 0.5, 1.0, 0.5, 1.0], centerWeight: 2.0,
    lastMove: 'Symmetrical baseline', lastEvalScore: 0.0, nodesEvaluated: 0, wins: 0, draws: 0, losses: 0,
  });

  // Apply seed + persisted models once
  useEffect(() => {
    setGlobalSeed(seed);
    lakeRef.current!.setSeed(seed);
    lavaRef.current!.setSeed(seed + 1);
    try {
      const lakeData = loadJSON<Record<string, unknown>>(lsKeys.lake, null as unknown as Record<string, unknown>);
      const lavaData = loadJSON<Record<string, unknown>>(lsKeys.lava, null as unknown as Record<string, unknown>);
      if (lakeData && typeof lakeData === 'object' && 'table' in lakeData) {
        lakeRef.current!.fromJSON(lakeData as Parameters<LakeQLearningAgent['fromJSON']>[0]);
      }
      if (lavaData && typeof lavaData === 'object' && 'genome' in lavaData) {
        lavaRef.current!.fromJSON(lavaData as Parameters<LavaGeneticAgent['fromJSON']>[0]);
      }
      const cfg = loadJSON(lsKeys.config, null as unknown as typeof DEFAULT_CONFIG | null);
      if (cfg) {
        lakeRef.current!.setHyperparams({ alpha: cfg.alpha, gamma: cfg.gamma, epsilon: cfg.epsilon, epsilonDecay: cfg.epsilonDecay });
        lavaRef.current!.mutationSigma = cfg.mutationSigma;
        lavaRef.current!.setDepth(cfg.maxDepth);
        if (cfg.speed) setSpeed(cfg.speed as ArenaSpeed);
      }
    } catch { /* fresh start */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) setScrollProgress((window.scrollY / totalScroll) * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Real session uptime
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Firebase: analytics + anonymous auth + global Elo (non-blocking, local-first)
  useEffect(() => {
    initAnalytics();
    const off = ensureAnonymousAuth(u => setCloudUid(u?.uid ?? null));
    fetchGlobalElo().then(g => {
      if (g) { setGlobalElo(g); setCloudOk(true); }
    }).catch(() => setCloudOk(false));
    return off;
  }, []);

  const calculateFitness = useCallback((recentOutcomes: string[]) => {
    if (recentOutcomes.length === 0) return { lake: 50.0, lava: 50.0 };
    let lakePts = 0; let lavaPts = 0;
    for (const out of recentOutcomes) {
      if (out === 'O') lakePts += 1.0;
      else if (out === 'X') lavaPts += 1.0;
      else { lakePts += 0.5; lavaPts += 0.5; }
    }
    return {
      lake: Number(((lakePts / recentOutcomes.length) * 100).toFixed(1)),
      lava: Number(((lavaPts / recentOutcomes.length) * 100).toFixed(1)),
    };
  }, []);

  const syncTelemetry = useCallback((newOutcomes: string[]) => {
    const lAgent = lakeRef.current!; const vAgent = lavaRef.current!;
    const fit = calculateFitness(newOutcomes);
    setLakeTelemetry({
      generation: lAgent.generation, epsilon: lAgent.epsilon, discountFactor: lAgent.gamma,
      learningRate: lAgent.alpha, fitness: fit.lake, totalStates: lAgent.qTable.size,
      lastMove: lAgent.lastActionDesc, lastQValue: lAgent.lastQVal, isExploratory: lAgent.lastExploratory,
      qDistribution: Array.from(lAgent.getQValues(lAgent.getStateKey(board))),
      wins: lAgent.wins, draws: lAgent.draws, losses: lAgent.losses,
    });
    setLavaTelemetry({
      generation: vAgent.generation, mutationSigma: vAgent.mutationSigma, fitness: fit.lava,
      genome: [...vAgent.genome], centerWeight: vAgent.genome[4], lastMove: vAgent.lastActionDesc,
      lastEvalScore: vAgent.lastEvalScore, nodesEvaluated: vAgent.nodesEvaluated,
      wins: vAgent.wins, draws: vAgent.draws, losses: vAgent.losses,
    });
  }, [board, calculateFitness]);

  // Persist models + history
  useEffect(() => {
    saveJSON(lsKeys.lake, lakeRef.current!.toJSON());
    saveJSON(lsKeys.lava, lavaRef.current!.toJSON());
  }, [lakeTelemetry.generation, lavaTelemetry.generation]);
  useEffect(() => { saveJSON(lsKeys.matches, matchHistory.slice(0, 50)); }, [matchHistory]);
  useEffect(() => { saveJSON(lsKeys.outcomes, outcomes.slice(-24)); }, [outcomes]);
  useEffect(() => { saveJSON('synapse.elo.lake', eloLake); saveJSON('synapse.elo.lava', eloLava); saveJSON('synapse.elo.human', eloHuman); }, [eloLake, eloLava, eloHuman]);
  useEffect(() => { saveJSON('synapse.seed.v1', seed); }, [seed]);

  const pushLog = useCallback((message: string) => {
    setComments(prev => [...prev, {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toLocaleTimeString(),
      user: 'ExperimentLog', message, isSystem: true,
    }].slice(-80));
  }, []);

  const isHumanTurn = useCallback((player: 'O' | 'X', mode: PlayMode) => {
    if (mode === 'human-lake') return player === 'X'; // human is X vs Lake(O)
    if (mode === 'human-lava') return player === 'O'; // human is O vs Lava(X)
    return false;
  }, []);

  const handleGameOver = useCallback((result: WinningCombo) => {
    setWinningResult(result);
    const lAgent = lakeRef.current!; const vAgent = lavaRef.current!;
    const durationMs = Date.now() - matchStartTimeRef.current;
    let matchOutcome: string = 'D';
    let outcomeDesc = 'Draw';

    if (result.winner === 'O') {
      matchOutcome = 'O';
      if (playMode === 'human-lava') {
        outcomeDesc = 'You (O) beat Lava-1';
        vAgent.losses++; vAgent.mutate();
        lAgent.draws += 0;
        const { newA, newB } = updateElo(eloHuman, eloLava, 1);
        setEloHuman(newA); setEloLava(newB);
        soundManager.playWin('O');
      } else {
        outcomeDesc = 'Ai Lake-1 Won';
        lAgent.wins++; vAgent.losses++;
        lAgent.updatePolicy(1.0); vAgent.mutate();
        const { newA, newB } = updateElo(eloLake, eloLava, 1);
        setEloLake(newA); setEloLava(newB);
        soundManager.playWin('O');
      }
      setStatusText(playMode === 'auto' ? 'Ai Lake-1 takes the round!' : `${outcomeDesc}!`);
    } else if (result.winner === 'X') {
      matchOutcome = 'X';
      if (playMode === 'human-lake') {
        outcomeDesc = 'You (X) beat Lake-1';
        lAgent.losses++; lAgent.updatePolicy(-1.0);
        const { newA, newB } = updateElo(eloLake, eloHuman, 0);
        setEloLake(newA); setEloHuman(newB);
        soundManager.playWin('X');
      } else {
        outcomeDesc = 'Ai Lava-1 Won';
        vAgent.wins++; lAgent.losses++;
        lAgent.updatePolicy(-1.0);
        const { newA, newB } = updateElo(eloLake, eloLava, 0);
        setEloLake(newA); setEloLava(newB);
        soundManager.playWin('X');
      }
      setStatusText(playMode === 'auto' ? 'Ai Lava-1 secures victory!' : `${outcomeDesc}!`);
    } else {
      matchOutcome = 'D';
      outcomeDesc = 'Draw';
      lAgent.draws++; vAgent.draws++; lAgent.updatePolicy(0.3);
      if (playMode === 'human-lake') {
        const { newA, newB } = updateElo(eloLake, eloHuman, 0.5);
        setEloLake(newA); setEloHuman(newB);
      } else if (playMode === 'human-lava') {
        const { newA, newB } = updateElo(eloHuman, eloLava, 0.5);
        setEloHuman(newA); setEloLava(newB);
      } else {
        const { newA, newB } = updateElo(eloLake, eloLava, 0.5);
        setEloLake(newA); setEloLava(newB);
      }
      soundManager.playDraw();
      setStatusText('Draw — optimal lines from both sides.');
    }

    const winnerName = result.winner === 'O'
      ? (playMode === 'human-lava' ? 'You (O)' : 'Ai Lake-1')
      : result.winner === 'X'
        ? (playMode === 'human-lake' ? 'You (X)' : 'Ai Lava-1')
        : 'Draw';

    const logEntry: MatchLogItem = {
      round, winner: result.winner, winnerName,
      movesCount: movesCountRef.current, lakeMoveCount: lakeMovesRef.current,
      lavaMoveCount: lavaMovesRef.current, durationMs,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setMatchHistory(prev => [logEntry, ...prev].slice(0, 100));
    pushLog(`Round #${round}: ${outcomeDesc} (${movesCountRef.current} plies, ${(durationMs / 1000).toFixed(1)}s, mode=${playMode}).`);

    // Cloud sync (fire-and-forget, local-first). Requires Firestore + Anonymous Auth enabled.
    pushMatchCloud(logEntry, playMode, getGlobalSeed()).then(ok => setCloudOk(ok));
    // Throttle global Elo writes: every 5th round to save Firestore writes.
    if ((round + 1) % 5 === 0) {
      pushGlobalElo({ lake: eloLake, lava: eloLava, human: eloHuman, matches: round + 1 }).then(ok => {
        if (ok) setGlobalElo({ lake: eloLake, lava: eloLava, human: eloHuman, matches: round + 1 });
      });
    }

    setOutcomes(prev => {
      const next = [...prev, matchOutcome].slice(-24);
      syncTelemetry(next);
      return next;
    });

    const delay = playMode === 'auto' ? Math.max(350, Math.min(speed * 1.5, 1100)) : 1400;
    setTimeout(() => {
      setBoard(Array(9).fill(null));
      setWinningResult(null);
      setPliesHistory([]);
      setIsViewingPast(false);
      movesCountRef.current = 0; lakeMovesRef.current = 0; lavaMovesRef.current = 0;
      matchStartTimeRef.current = Date.now();
      setRound(r => {
        const nextR = r + 1;
        if (playMode === 'auto') {
          const nextStarter = nextR % 2 === 1 ? 'O' : 'X';
          setCurrentPlayer(nextStarter);
          setStatusText(nextStarter === 'O' ? 'Ai Lake-1 opening round...' : 'Ai Lava-1 opening round...');
        } else if (playMode === 'human-lake') {
          setCurrentPlayer('O');
          setStatusText('Your turn? No — Lake-1 (O) moves first. You are X.');
        } else {
          setCurrentPlayer('O');
          setStatusText('Your move (O) — you open vs Lava-1.');
        }
        return nextR;
      });
    }, delay);
  }, [round, speed, syncTelemetry, playMode, eloLake, eloLava, eloHuman, pushLog]);

  const executeStep = useCallback(() => {
    if (winningResult || isPaused) return;
    if (isHumanTurn(currentPlayer, playMode)) return; // wait for click

    if (currentPlayer === 'O') {
      const t0 = performance.now();
      const decision = lakeRef.current!.chooseAction(board);
      const dt = performance.now() - t0;
      if (!decision) return;
      const nextBoard = [...board];
      nextBoard[decision.action] = 'O';
      movesCountRef.current++; lakeMovesRef.current++;
      setBoard(nextBoard);
      soundManager.playMove('O');
      setLatencyMs(Math.max(1, Math.round(dt)));
      const ply: PlyRecord = {
        plyNumber: movesCountRef.current, round, player: 'O',
        playerName: playMode === 'human-lava' ? 'You' : 'Ai Lake-1',
        cellIndex: decision.action, boardSnapshot: [...nextBoard],
        actionDesc: lakeRef.current!.lastActionDesc,
        evalMetric: `Q: ${(decision.qValue >= 0 ? '+' : '') + decision.qValue.toFixed(2)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setPliesHistory(prev => [...prev, ply]);
      const res = checkWinner(nextBoard);
      if (res) handleGameOver(res);
      else { setCurrentPlayer('X'); setStatusText(playMode === 'human-lake' ? 'Your move (X).' : 'Ai Lava-1 evaluating...'); syncTelemetry(outcomes); }
    } else {
      const t0 = performance.now();
      const decision = lavaRef.current!.chooseAction(board);
      const dt = performance.now() - t0;
      if (!decision) return;
      const nextBoard = [...board];
      nextBoard[decision.action] = 'X';
      movesCountRef.current++; lavaMovesRef.current++;
      setBoard(nextBoard);
      soundManager.playMove('X');
      setLatencyMs(Math.max(1, Math.round(dt)));
      const ply: PlyRecord = {
        plyNumber: movesCountRef.current, round, player: 'X',
        playerName: playMode === 'human-lake' ? 'You' : 'Ai Lava-1',
        cellIndex: decision.action, boardSnapshot: [...nextBoard],
        actionDesc: lavaRef.current!.lastActionDesc,
        evalMetric: `Eval: ${(decision.evalScore >= 0 ? '+' : '') + decision.evalScore.toFixed(2)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setPliesHistory(prev => [...prev, ply]);
      const res = checkWinner(nextBoard);
      if (res) handleGameOver(res);
      else { setCurrentPlayer('O'); setStatusText(playMode === 'human-lava' ? 'Your move (O).' : 'Ai Lake-1 calculating...'); syncTelemetry(outcomes); }
    }
  }, [board, currentPlayer, handleGameOver, outcomes, round, syncTelemetry, winningResult, isPaused, playMode, isHumanTurn]);

  useEffect(() => {
    if (winningResult || isPaused) return;
    if (isHumanTurn(currentPlayer, playMode)) return;
    const timer = setTimeout(() => { executeStep(); }, speed);
    return () => clearTimeout(timer);
  }, [winningResult, speed, executeStep, isPaused, currentPlayer, playMode, isHumanTurn]);

  const handleHumanMove = useCallback((cell: number) => {
    if (winningResult || isPaused) return;
    if (!isHumanTurn(currentPlayer, playMode)) return;
    if (board[cell] !== null) return;
    soundManager.playUiClick();
    const symbol = playMode === 'human-lake' ? 'X' : 'O';
    if ((currentPlayer === 'X' && symbol !== 'X') || (currentPlayer === 'O' && symbol !== 'O')) return;
    const nextBoard = [...board];
    nextBoard[cell] = symbol;
    movesCountRef.current++;
    if (symbol === 'O') lakeMovesRef.current++; else lavaMovesRef.current++;
    setBoard(nextBoard);
    soundManager.playMove(symbol);
    const ply: PlyRecord = {
      plyNumber: movesCountRef.current, round, player: symbol, playerName: 'You',
      cellIndex: cell, boardSnapshot: [...nextBoard], actionDesc: `Human ${symbol} → cell ${cell}`,
      evalMetric: 'Human', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setPliesHistory(prev => [...prev, ply]);
    const res = checkWinner(nextBoard);
    if (res) handleGameOver(res);
    else {
      setCurrentPlayer(symbol === 'O' ? 'X' : 'O');
      setStatusText(symbol === 'O' ? 'Ai Lava-1 evaluating...' : 'Ai Lake-1 calculating...');
      syncTelemetry(outcomes);
    }
  }, [board, currentPlayer, playMode, winningResult, isPaused, isHumanTurn, round, handleGameOver, syncTelemetry, outcomes]);

  const handleSelectPly = (plyIndex: number) => {
    soundManager.playUiClick();
    if (plyIndex >= 0 && plyIndex < pliesHistory.length) { setIsViewingPast(true); setViewingPly(plyIndex); }
  };
  const handlePrevPly = () => {
    soundManager.playUiClick();
    if (pliesHistory.length === 0) return;
    if (!isViewingPast) { setIsViewingPast(true); setViewingPly(pliesHistory.length - 1); }
    else if (viewingPly > 0) setViewingPly(prev => prev - 1);
  };
  const handleNextPly = () => {
    soundManager.playUiClick();
    if (!isViewingPast) return;
    if (viewingPly < pliesHistory.length - 1) setViewingPly(prev => prev + 1);
    else setIsViewingPast(false);
  };
  const handleJumpToLive = () => { soundManager.playUiClick(); setIsViewingPast(false); };
  const handleToggleMute = () => { const muted = soundManager.toggleMute(); setIsMuted(muted); };
  const handleNavigate = (sectionId: string) => {
    soundManager.playUiClick(); setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  const handleUpdateGenome = (newGenome: number[]) => { lavaRef.current!.genome = [...newGenome]; syncTelemetry(outcomes); };
  const handleClearHistory = () => { setMatchHistory([]); syncTelemetry([]); };
  const handleSendComment = (msg: string) => {
    soundManager.playUiClick();
    const newComment: StreamCommentary = {
      id: `user-${Date.now()}`, timestamp: new Date().toLocaleTimeString(),
      user: 'You (local)', badge: 'LOCAL', badgeColor: '#00f0ff', message: msg,
    };
    setComments(prev => [...prev, newComment].slice(-80));
  };

  const handleModeChange = (m: PlayMode) => {
    soundManager.playUiClick();
    setPlayMode(m);
    setBoard(Array(9).fill(null)); setWinningResult(null); setPliesHistory([]); setIsViewingPast(false);
    movesCountRef.current = 0; lakeMovesRef.current = 0; lavaMovesRef.current = 0;
    matchStartTimeRef.current = Date.now();
    lakeRef.current!.history = [];
    if (m === 'auto') { setCurrentPlayer(round % 2 === 1 ? 'O' : 'X'); setStatusText('Auto mode: AI vs AI.'); }
    else if (m === 'human-lake') { setCurrentPlayer('O'); setStatusText('You are X vs Lake-1 (O). Lake moves first.'); }
    else { setCurrentPlayer('O'); setStatusText('You are O vs Lava-1 (X). Your move first.'); }
    pushLog(`Mode switched to ${m}. Board reset.`);
  };

  const handleApplySeed = (s: number) => {
    const clean = Math.max(0, Math.floor(s)) || 0;
    setSeed(clean); setGlobalSeed(clean);
    lakeRef.current!.setSeed(clean); lavaRef.current!.setSeed(clean + 1);
    pushLog(`Seed set to ${clean}. RNG re-initialized (Lake=${clean}, Lava=${clean + 1}).`);
  };

  const handleHyper = (patch: { alpha?: number; gamma?: number; epsilon?: number; epsilonDecay?: number; mutationSigma?: number; maxDepth?: number }) => {
    if (patch.alpha !== undefined || patch.gamma !== undefined || patch.epsilon !== undefined || patch.epsilonDecay !== undefined) {
      lakeRef.current!.setHyperparams(patch);
    }
    if (patch.mutationSigma !== undefined) lavaRef.current!.mutationSigma = patch.mutationSigma;
    if (patch.maxDepth !== undefined) lavaRef.current!.setDepth(patch.maxDepth);
    saveJSON(lsKeys.config, {
      seed, alpha: lakeRef.current!.alpha, gamma: lakeRef.current!.gamma,
      epsilon: lakeRef.current!.epsilon, epsilonDecay: lakeRef.current!.epsilonDecay,
      mutationSigma: lavaRef.current!.mutationSigma, maxDepth: lavaRef.current!.maxDepth, speed,
    });
    syncTelemetry(outcomes);
  };

  const handleExportCsv = () => { downloadText(`synapse-matches-round${round}.csv`, matchLogToCsv(matchHistory), 'text/csv'); };
  const handleExportJson = () => {
    downloadText(`synapse-experiment-round${round}.json`, JSON.stringify({
      exportedAt: new Date().toISOString(), seed: getGlobalSeed(), playMode,
      elo: { lake: eloLake, lava: eloLava, human: eloHuman },
      lake: lakeRef.current!.toJSON(), lava: lavaRef.current!.toJSON(),
      matches: matchHistory, outcomes,
    }, null, 2), 'application/json');
  };
  const handleResetExperiment = () => {
    lakeRef.current!.qTable.clear(); lakeRef.current!.resetStats();
    lakeRef.current!.epsilon = DEFAULT_CONFIG.epsilon;
    lavaRef.current!.genome = [1.0, 0.5, 1.0, 0.5, 2.0, 0.5, 1.0, 0.5, 1.0];
    lavaRef.current!.resetStats();
    setEloLake(ELO_INITIAL); setEloLava(ELO_INITIAL); setEloHuman(ELO_INITIAL);
    setMatchHistory([]); setOutcomes([]); setRound(1);
    setBoard(Array(9).fill(null)); setWinningResult(null); setPliesHistory([]);
    movesCountRef.current = 0; lakeMovesRef.current = 0; lavaMovesRef.current = 0;
    setCurrentPlayer('O');
    syncTelemetry([]);
    pushLog('Experiment reset: Q-table cleared, genome restored to symmetric baseline, Elo reset to 1200.');
  };

  const getSampleQStates = () => {
    const samples: { state: string; values: number[]; bestAction: number }[] = [];
    const qMap = lakeRef.current!.qTable;
    let count = 0;
    for (const [key, values] of qMap.entries()) {
      if (count >= 12) break;
      const arr: number[] = Array.from(values as Float64Array).map(Number);
      let bestAct = 0; let maxV = -Infinity;
      arr.forEach((v: number, idx: number) => { if (v > maxV) { maxV = v; bestAct = idx; } });
      samples.push({ state: key, values: arr, bestAction: bestAct });
      count++;
    }
    return samples;
  };

  useEffect(() => {
    const sectionIds = ['arena', 'about', 'contact'];
    const elements = sectionIds.map(id => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: '-30% 0px -30% 0px', threshold: 0.2 });
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const displayedBoard = isViewingPast && pliesHistory[viewingPly] ? pliesHistory[viewingPly].boardSnapshot : board;
  const lakeEvalRatio = currentPlayer === 'O' ? 55 : 45;
  const lavaEvalRatio = 100 - lakeEvalRatio;
  const humanTurnNow = isHumanTurn(currentPlayer, playMode) && !winningResult;

  return (
    <div className="min-h-screen bg-[#040812] font-sans text-[#dae2fd] relative selection:bg-[#00f0ff] selection:text-[#040812]">
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-[#0d162a] pointer-events-none">
        <div className="h-full bg-gradient-to-r from-[#00f0ff] via-[#a078ff] to-[#ff334b] transition-all duration-150 shadow-[0_0_10px_#00f0ff]" style={{ width: `${scrollProgress}%` }} />
      </div>
      <div className="fixed -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-[#00f0ff]/10 blur-[180px] pointer-events-none animate-float-slow" />
      <div className="fixed top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-[#ff334b]/10 blur-[180px] pointer-events-none animate-float-reverse" />
      <div className="fixed -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-[#0088cc]/10 blur-[180px] pointer-events-none animate-float-slow" />

      <Header round={round} viewerCount={1} activeSection={activeSection} onNavigate={handleNavigate} isMuted={isMuted} onToggleMute={handleToggleMute} onOpenInspector={() => setIsInspectorOpen(true)} />

      <main className="w-full pt-20 bg-transparent relative z-10">
        <section id="arena" className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-center px-4 md:px-6 lg:px-8 py-6 scroll-mt-24">
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-5">
            <LiveStreamHud
              round={round} uptimeSeconds={uptimeSeconds} viewerCount={1}
              speed={speed} isViewingPast={isViewingPast} viewingPly={viewingPly}
              totalPlies={pliesHistory.length} onSelectSpeed={setSpeed}
              onPrevPly={handlePrevPly} onNextPly={handleNextPly} onJumpToLive={handleJumpToLive}
            />

            {/* Mode + transport controls (real experiment controls) */}
            <div className="w-full flex flex-wrap items-center gap-2 bg-[#060a14]/90 border border-[#222f4d] rounded-2xl p-3">
              <span className="font-mono text-[11px] text-[#8899b7] uppercase">Mode:</span>
              {(['auto', 'human-lava', 'human-lake'] as PlayMode[]).map(m => (
                <button key={m} onClick={() => handleModeChange(m)}
                  className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold transition-all cursor-pointer border ${playMode === m ? 'bg-[#00f0ff] text-[#051b33] border-[#00f0ff]' : 'bg-[#0d162a] text-[#8899b7] border-[#222f4d] hover:text-white'}`}>
                  {m === 'auto' ? 'AI vs AI' : m === 'human-lava' ? 'You (O) vs Lava' : 'You (X) vs Lake'}
                </button>
              ))}
              <span className="w-px h-5 bg-[#222f4d] mx-1" />
              <button onClick={() => setIsPaused(p => !p)} className="px-3 py-1.5 rounded-full font-mono text-xs font-bold bg-[#131d36] text-[#dae2fd] border border-[#293b66] hover:border-[#00f0ff] cursor-pointer">
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button onClick={() => { setIsPaused(true); executeStep(); }} className="px-3 py-1.5 rounded-full font-mono text-xs font-bold bg-[#131d36] text-[#dae2fd] border border-[#293b66] hover:border-[#00f0ff] cursor-pointer" title="Advance one ply while paused">
                Step once
              </button>
              <span className="font-mono text-[11px] text-[#8899b7] ml-auto">
                Session {Math.floor(uptimeSeconds / 60)}m {uptimeSeconds % 60}s • Seed {seed} • Elo L:{eloLake} V:{eloLava} H:{eloHuman} • {latencyMs}ms last decision (measured)
              </span>
            </div>

            {/* Firebase cloud status — synapse-ai-inovation */}
            <div className="w-full flex flex-wrap items-center gap-2 bg-[#060a14]/90 border border-[#222f4d] rounded-2xl px-3 py-2 font-mono text-[11px]">
              <span className={`w-2 h-2 rounded-full ${cloudUid ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-[#dae2fd] font-bold">
                {cloudUid ? `Firebase connected • anon ${cloudUid.slice(0, 6)}…` : 'Firebase connecting… (enable Anonymous Auth)'}
              </span>
              <span className="text-[#8899b7]">
                project: synapse-ai-inovation • {cloudOk === true ? 'last cloud write OK' : cloudOk === false ? 'local only (check Firestore rules)' : 'sync pending'} • live at synapse-ai-inovation.web.app after deploy
              </span>
              {globalElo && (
                <span className="ml-auto text-[#7df4ff]">
                  Global Elo L:{globalElo.lake} V:{globalElo.lava} H:{globalElo.human} ({globalElo.matches} matches)
                </span>
              )}
            </div>

            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-3 flex flex-col order-2 lg:order-1">
                <AgentCardLake telemetry={lakeTelemetry} isActive={currentPlayer === 'O'} />
              </div>
              <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
                <TactileMatrix
                  board={displayedBoard} round={round} currentPlayer={currentPlayer}
                  statusText={humanTurnNow ? `Your move (${currentPlayer}) — click an empty cell.` : statusText}
                  latencyMs={latencyMs} lakeEvalRatio={lakeEvalRatio} lavaEvalRatio={lavaEvalRatio}
                  speed={speed} winningResult={winningResult} isViewingPast={isViewingPast}
                  viewingPly={viewingPly} pliesHistory={pliesHistory} onSelectPly={handleSelectPly}
                  onJumpToLive={handleJumpToLive} onSelectSpeed={setSpeed}
                  isHumanTurn={humanTurnNow} onHumanMove={handleHumanMove}
                />
              </div>
              <div className="lg:col-span-3 flex flex-col order-3">
                <AgentCardLava telemetry={lavaTelemetry} isActive={currentPlayer === 'X'} />
              </div>
            </div>

            <ExperimentPanel
              seed={seed} onApplySeed={handleApplySeed}
              alpha={lakeRef.current?.alpha ?? 0.2} gamma={lakeRef.current?.gamma ?? 0.95}
              epsilon={lakeRef.current?.epsilon ?? 0.05} mutationSigma={lavaRef.current?.mutationSigma ?? 0.035}
              maxDepth={lavaRef.current?.maxDepth ?? 6}
              onHyper={handleHyper} onExportCsv={handleExportCsv} onExportJson={handleExportJson}
              onReset={handleResetExperiment} matchCount={matchHistory.length}
              eloLake={eloLake} eloLava={eloLava} eloHuman={eloHuman} outcomes={outcomes}
            />

            <div className="w-full max-w-4xl mx-auto mt-2">
              <LiveStreamChat comments={comments} onSendMessage={handleSendComment} viewerCount={1} />
            </div>
          </div>
        </section>

        <ArchitectureSection />
        <TransmissionSection />
      </main>

      <AiNavigatorHud activeSection={activeSection} onNavigate={handleNavigate} />

      <InspectorModal
        isOpen={isInspectorOpen} onClose={() => setIsInspectorOpen(false)}
        qTableSize={lakeTelemetry.totalStates} sampleQStates={getSampleQStates()}
        genome={lavaTelemetry.genome} onUpdateGenome={handleUpdateGenome}
        matchHistory={matchHistory} onClearHistory={handleClearHistory}
      />

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
