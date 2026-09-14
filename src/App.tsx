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
import { IntroScreen } from './components/IntroScreen';
import { FaqSection } from './components/FaqSection';
import { CreditsSection } from './components/CreditsSection';
import { DissolveReveal } from './components/ui/dissolve-reveal';
import { AsciiGlitchRipple } from './components/ui/ascii-glitch-ripple';
import AnimatedButton from './components/ui/animated-button';
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
  const [introOpen, setIntroOpen] = useState<boolean>(() => {
    try {
      if (sessionStorage.getItem('synarena.intro.seen')) return false;
      if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
      return true;
    } catch {
      return true;
    }
  });

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

  const handleIntroEnter = useCallback(() => {
    setIntroOpen(false);
    try { sessionStorage.setItem('synarena.intro.seen', '1'); } catch { /* ignore */ }
  }, []);

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

  const handlePlayHuman = useCallback(() => {
    handleModeChange('human-lava');
    requestAnimationFrame(() => {
      document.getElementById('board-grid-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [handleModeChange, round]);

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
    const titles: Record<string, string> = {
      arena: 'Synarena — Arena',
      about: 'How It Works — Synarena',
      faq: 'FAQ — Synarena',
      credits: 'Credits — Synarena',
      contact: 'Feedback — Synarena',
    };
    document.title = titles[activeSection] ?? 'Synarena — Q-Learning vs Minimax Lab';
  }, [activeSection]);

  useEffect(() => {
    const sectionIds = ['arena', 'about', 'faq', 'credits', 'contact'];
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
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 relative overflow-x-hidden selection:bg-cyan-300 selection:text-slate-950 min-w-0">
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-white/5 pointer-events-none">
        <div className="h-full bg-white/30 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>
      <div className="fixed -top-48 left-1/2 -translate-x-1/2 w-[700px] h-[380px] rounded-full bg-cyan-400/[0.05] blur-[140px] pointer-events-none" />

      <Header round={round} viewerCount={1} activeSection={activeSection} onNavigate={handleNavigate} isMuted={isMuted} onToggleMute={handleToggleMute} onOpenInspector={() => setIsInspectorOpen(true)} />

      <main className="w-full pt-24 bg-transparent relative z-10 min-w-0">
        <section id="arena" className="relative w-full px-4 md:px-6 py-14 md:py-20 scroll-mt-24">
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-10 md:gap-14 min-w-0">
            {/* Hero — the game first */}
            <div className="text-center flex flex-col items-center gap-4 px-2">
              <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-slate-500">
                Seeded · Measurable · Human-playable
              </p>
              <h1 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tight text-white text-balance">
                Watch two algorithms <AsciiGlitchRipple as="span" className="text-cyan-200">learn.</AsciiGlitchRipple>
              </h1>
              <p className="text-sm md:text-base text-slate-400 max-w-xl text-balance">
                Lake-1 explores with Q-Learning. Lava-1 plans with Minimax. Play them, tune them, export the data.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                <AnimatedButton onClick={handlePlayHuman} className="px-7 py-2.5 text-sm font-semibold">
                  Play as human
                </AnimatedButton>
                <button
                  onClick={() => handleNavigate('about')}
                  className="px-6 py-2.5 rounded-full text-sm text-slate-300 border border-white/15 hover:border-white/40 hover:text-white transition-all cursor-pointer min-h-[2.75rem]"
                >
                  How it works
                </button>
              </div>
            </div>

            <LiveStreamHud
              round={round} uptimeSeconds={uptimeSeconds} viewerCount={1}
              speed={speed} isViewingPast={isViewingPast} viewingPly={viewingPly}
              totalPlies={pliesHistory.length} onSelectSpeed={setSpeed}
              onPrevPly={handlePrevPly} onNextPly={handleNextPly} onJumpToLive={handleJumpToLive}
            />

            {/* Session controls — one calm row */}
            <div className="w-full flex flex-wrap items-center gap-2 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3">
              {(['auto', 'human-lava', 'human-lake'] as PlayMode[]).map(m => (
                <button key={m} onClick={() => handleModeChange(m)}
                  className={`px-3.5 py-1.5 rounded-full text-sm transition-all cursor-pointer ${playMode === m ? 'bg-white text-slate-900 font-semibold' : 'text-slate-400 hover:text-white'}`}>
                  {m === 'auto' ? 'AI vs AI' : m === 'human-lava' ? 'You (O) vs Lava' : 'You (X) vs Lake'}
                </button>
              ))}
              <span className="flex items-center gap-1 ml-1">
                <button onClick={() => setIsPaused(p => !p)} className="px-3 py-1.5 rounded-full text-sm text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer">
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button onClick={() => { setIsPaused(true); executeStep(); }} className="px-3 py-1.5 rounded-full text-sm text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer" title="Advance one ply while paused">
                  Step
                </button>
              </span>
              <span className="font-mono text-xs text-slate-500 ml-auto">
                Seed {seed} · L {eloLake} · V {eloLava} · You {eloHuman} · {latencyMs}ms
              </span>
            </div>

            {/* Cloud status — single quiet line */}
            <div className="w-full flex items-center gap-2 px-1 font-mono text-[11px] text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${cloudUid ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span>
                {cloudUid ? `Synced · synarena.web.app` : 'Connecting…'}
                {cloudOk === false ? ' · write failed — check Auth + rules' : ''}
                {globalElo ? ` · global L:${globalElo.lake} V:${globalElo.lava} (${globalElo.matches})` : ''}
              </span>
            </div>

            <DissolveReveal>
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-start min-w-0">
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
            </DissolveReveal>

            {/* Lab controls live below the fold — first viewport stays clean */}
            <details className="w-full glass rounded-2xl px-5 py-4 group">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 min-h-[2.75rem]">
                <span className="font-headline text-sm font-semibold text-white">Lab controls</span>
                <span className="font-mono text-xs text-slate-500 group-open:hidden">Show seed, hyperparams, export ↓</span>
                <span className="font-mono text-xs text-slate-500 hidden group-open:inline">Hide ↑</span>
              </summary>
              <div className="pt-4">
                <ExperimentPanel
                  seed={seed} onApplySeed={handleApplySeed}
                  alpha={lakeRef.current?.alpha ?? 0.2} gamma={lakeRef.current?.gamma ?? 0.95}
                  epsilon={lakeRef.current?.epsilon ?? 0.05} mutationSigma={lavaRef.current?.mutationSigma ?? 0.035}
                  maxDepth={lavaRef.current?.maxDepth ?? 6}
                  onHyper={handleHyper} onExportCsv={handleExportCsv} onExportJson={handleExportJson}
                  onReset={handleResetExperiment} matchCount={matchHistory.length}
                  eloLake={eloLake} eloLava={eloLava} eloHuman={eloHuman} outcomes={outcomes}
                />
              </div>
            </details>

            <details className="w-full max-w-3xl mx-auto glass rounded-2xl px-5 py-4 group">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 min-h-[2.75rem]">
                <span className="font-headline text-sm font-semibold text-white">Session log</span>
                <span className="font-mono text-xs text-slate-500 group-open:hidden">Show experiment events ↓</span>
                <span className="font-mono text-xs text-slate-500 hidden group-open:inline">Hide ↑</span>
              </summary>
              <div className="pt-4">
                <LiveStreamChat comments={comments} onSendMessage={handleSendComment} viewerCount={1} />
              </div>
            </details>
          </div>
        </section>

        <ArchitectureSection />
        <FaqSection />
        <CreditsSection />
        <TransmissionSection />
      </main>

      {introOpen && <IntroScreen onEnter={handleIntroEnter} />}

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
