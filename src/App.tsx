/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BoardState,
  ArenaSpeed,
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
} from './services/aiEngine';
import { soundManager } from './services/audio';

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
import { Footer } from './components/Footer';

export default function App() {
  // Unbiased 0-bias AI Model instances
  const lakeRef = useRef<LakeQLearningAgent>(new LakeQLearningAgent());
  const lavaRef = useRef<LavaGeneticAgent>(new LavaGeneticAgent());

  // Game Board & 24/7 Autonomous Live Stream State
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'O' | 'X'>('O');
  const [round, setRound] = useState<number>(1);
  const [speed, setSpeed] = useState<ArenaSpeed>(400);
  const [winningResult, setWinningResult] = useState<WinningCombo | null>(null);
  const [statusText, setStatusText] = useState<string>(
    'Ai Lake-1 is evaluating opening move...'
  );
  const [latencyMs, setLatencyMs] = useState<number>(6);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('arena');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // 24/7 Live Broadcast Metrics
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(3742);
  const [viewerCount, setViewerCount] = useState<number>(1428);

  // Match statistics & history tracking
  const matchStartTimeRef = useRef<number>(Date.now());
  const movesCountRef = useRef<number>(0);
  const lakeMovesRef = useRef<number>(0);
  const lavaMovesRef = useRef<number>(0);

  const [matchHistory, setMatchHistory] = useState<MatchLogItem[]>([]);
  const [outcomes, setOutcomes] = useState<string[]>([]);

  // DVR / Move History Timeline Scrubbing
  const [pliesHistory, setPliesHistory] = useState<PlyRecord[]>([]);
  const [isViewingPast, setIsViewingPast] = useState<boolean>(false);
  const [viewingPly, setViewingPly] = useState<number>(0);

  // Cinematic scroll progress percentage
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Stream Chat & Real-Time Commentary
  const [comments, setComments] = useState<StreamCommentary[]>([
    {
      id: 'c1',
      timestamp: 'Just now',
      user: 'StreamReferee',
      message: '🔴 24/7 Global broadcast online. Both models initialized with 0 bias and symmetrical baseline.',
      isSystem: true,
    },
    {
      id: 'c2',
      timestamp: '1m ago',
      user: 'NovaCoder',
      badge: 'PRO',
      badgeColor: '#00f0ff',
      message: 'Ai Lake-1 is starting from a blank Q-table! Excited to see how fast it learns the corners.',
    },
    {
      id: 'c3',
      timestamp: '45s ago',
      user: 'MagmaFan',
      badge: 'TOP FAN',
      badgeColor: '#ff334b',
      message: 'Ai Lava-1 has that 6-ply minimax depth. Tough defense to break.',
    },
  ]);

  // Telemetry snapshots for reactive UI rendering (Zero bias starting baselines)
  const [lakeTelemetry, setLakeTelemetry] = useState<LakeTelemetry>({
    generation: 1,
    epsilon: 0.05,
    discountFactor: 0.95,
    learningRate: 0.2,
    fitness: 50.0,
    totalStates: 0,
    lastMove: 'Unbiased baseline',
    lastQValue: 0.0,
    isExploratory: false,
    qDistribution: Array(9).fill(0),
    wins: 0,
    draws: 0,
    losses: 0,
  });

  const [lavaTelemetry, setLavaTelemetry] = useState<LavaTelemetry>({
    generation: 1,
    mutationSigma: 0.035,
    fitness: 50.0,
    genome: [1.0, 0.5, 1.0, 0.5, 2.0, 0.5, 1.0, 0.5, 1.0],
    centerWeight: 2.0,
    lastMove: 'Symmetrical baseline',
    lastEvalScore: 0.0,
    nodesEvaluated: 0,
    wins: 0,
    draws: 0,
    losses: 0,
  });

  // Track scroll position for cinematic progress bar and ambient lighting
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 24/7 Live Stream Uptime & Viewer Fluctuations
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
      // Subtle organic viewer count oscillation
      if (Math.random() < 0.25) {
        const delta = Math.floor(Math.random() * 5) - 2;
        setViewerCount((prev) => Math.max(1200, prev + delta));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate rolling win rates (last 24 matches)
  const calculateFitness = useCallback((recentOutcomes: string[]) => {
    if (recentOutcomes.length === 0) return { lake: 50.0, lava: 50.0 };
    let lakePts = 0;
    let lavaPts = 0;
    for (const out of recentOutcomes) {
      if (out === 'O') lakePts += 1.0;
      else if (out === 'X') lavaPts += 1.0;
      else {
        lakePts += 0.5;
        lavaPts += 0.5;
      }
    }
    return {
      lake: Number(((lakePts / recentOutcomes.length) * 100).toFixed(1)),
      lava: Number(((lavaPts / recentOutcomes.length) * 100).toFixed(1)),
    };
  }, []);

  // Sync telemetry state with agent models
  const syncTelemetry = useCallback(
    (newOutcomes: string[]) => {
      const lAgent = lakeRef.current;
      const vAgent = lavaRef.current;
      const fit = calculateFitness(newOutcomes);

      setLakeTelemetry({
        generation: lAgent.generation,
        epsilon: lAgent.epsilon,
        discountFactor: lAgent.gamma,
        learningRate: lAgent.alpha,
        fitness: fit.lake,
        totalStates: lAgent.qTable.size,
        lastMove: lAgent.lastActionDesc,
        lastQValue: lAgent.lastQVal,
        isExploratory: lAgent.lastExploratory,
        qDistribution: Array.from(lAgent.getQValues(lAgent.getStateKey(board))),
        wins: lAgent.wins,
        draws: lAgent.draws,
        losses: lAgent.losses,
      });

      setLavaTelemetry({
        generation: vAgent.generation,
        mutationSigma: vAgent.mutationSigma,
        fitness: fit.lava,
        genome: [...vAgent.genome],
        centerWeight: vAgent.genome[4],
        lastMove: vAgent.lastActionDesc,
        lastEvalScore: vAgent.lastEvalScore,
        nodesEvaluated: vAgent.nodesEvaluated,
        wins: vAgent.wins,
        draws: vAgent.draws,
        losses: vAgent.losses,
      });
    },
    [board, calculateFitness]
  );

  // Handle game completion
  const handleGameOver = useCallback(
    (result: WinningCombo) => {
      setWinningResult(result);
      const lAgent = lakeRef.current;
      const vAgent = lavaRef.current;

      const durationMs = Date.now() - matchStartTimeRef.current;
      let matchOutcome = 'D';
      let outcomeDesc = 'Stalemate (Draw)';

      if (result.winner === 'O') {
        matchOutcome = 'O';
        outcomeDesc = 'Ai Lake-1 Won';
        lAgent.wins++;
        vAgent.losses++;
        lAgent.updatePolicy(1.0);
        vAgent.mutate();
        soundManager.playWin('O');
        setStatusText('Ai Lake-1 takes the round with high-confidence Q-moves!');
      } else if (result.winner === 'X') {
        matchOutcome = 'X';
        outcomeDesc = 'Ai Lava-1 Won';
        vAgent.wins++;
        lAgent.losses++;
        lAgent.updatePolicy(-1.0);
        soundManager.playWin('X');
        setStatusText('Ai Lava-1 secures victory using 6-ply minimax search!');
      } else {
        matchOutcome = 'D';
        outcomeDesc = 'Stalemate (Draw)';
        lAgent.draws++;
        vAgent.draws++;
        lAgent.updatePolicy(0.3);
        soundManager.playDraw();
        setStatusText('Stalemate! Both models played optimal zero-sum lines.');
      }

      // Record in real match history log
      const logEntry: MatchLogItem = {
        round,
        winner: result.winner,
        winnerName: result.winner === 'O' ? 'Ai Lake-1' : result.winner === 'X' ? 'Ai Lava-1' : 'Stalemate',
        movesCount: movesCountRef.current,
        lakeMoveCount: lakeMovesRef.current,
        lavaMoveCount: lavaMovesRef.current,
        durationMs,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setMatchHistory((prev) => [logEntry, ...prev].slice(0, 50));

      // Append System Stream Commentary
      setComments((prev) => [
        ...prev,
        {
          id: `match-end-${round}-${Date.now()}`,
          timestamp: 'Just now',
          user: 'Referee',
          message: `Round #${round} concluded: ${outcomeDesc} (${movesCountRef.current} plies, ${(durationMs / 1000).toFixed(1)}s).`,
          isSystem: true,
        },
      ].slice(-60));

      setOutcomes((prev) => {
        const next = [...prev, matchOutcome].slice(-24);
        syncTelemetry(next);
        return next;
      });

      // Smooth, perpetual 24/7 match loop (No user pause or stop)
      const delay = Math.max(350, Math.min(speed * 1.5, 1100));
      setTimeout(() => {
        setBoard(Array(9).fill(null));
        setWinningResult(null);
        setPliesHistory([]);
        setIsViewingPast(false);
        movesCountRef.current = 0;
        lakeMovesRef.current = 0;
        lavaMovesRef.current = 0;
        matchStartTimeRef.current = Date.now();

        // 100% Symmetrical Unbiased turn alternation:
        // Round 1 starts with 'O', Round 2 starts with 'X', Round 3 starts with 'O'...
        setRound((r) => {
          const nextR = r + 1;
          const nextStarter = nextR % 2 === 1 ? 'O' : 'X';
          setCurrentPlayer(nextStarter);
          setStatusText(
            nextStarter === 'O'
              ? 'Ai Lake-1 opening round...'
              : 'Ai Lava-1 opening round with counter-lines...'
          );
          return nextR;
        });
      }, delay);
    },
    [round, speed, syncTelemetry]
  );

  // Execute single AI move in the 24/7 stream
  const executeStep = useCallback(() => {
    if (winningResult) return;

    if (currentPlayer === 'O') {
      const decision = lakeRef.current.chooseAction(board);
      if (!decision) return;

      const nextBoard = [...board];
      nextBoard[decision.action] = 'O';
      movesCountRef.current++;
      lakeMovesRef.current++;
      setBoard(nextBoard);
      soundManager.playMove('O');
      setLatencyMs(Math.floor(4 + Math.random() * 5));

      // Append to Ply DVR History
      const ply: PlyRecord = {
        plyNumber: movesCountRef.current,
        round,
        player: 'O',
        playerName: 'Ai Lake-1',
        cellIndex: decision.action,
        boardSnapshot: [...nextBoard],
        actionDesc: lakeRef.current.lastActionDesc,
        evalMetric: `Q: ${(decision.qValue >= 0 ? '+' : '') + decision.qValue.toFixed(2)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setPliesHistory((prev) => [...prev, ply]);

      const res = checkWinner(nextBoard);
      if (res) {
        handleGameOver(res);
      } else {
        setCurrentPlayer('X');
        setStatusText('Ai Lava-1 evaluating tree branches...');
        syncTelemetry(outcomes);
      }
    } else if (currentPlayer === 'X') {
      const decision = lavaRef.current.chooseAction(board);
      if (!decision) return;

      const nextBoard = [...board];
      nextBoard[decision.action] = 'X';
      movesCountRef.current++;
      lavaMovesRef.current++;
      setBoard(nextBoard);
      soundManager.playMove('X');
      setLatencyMs(Math.floor(6 + Math.random() * 6));

      // Append to Ply DVR History
      const ply: PlyRecord = {
        plyNumber: movesCountRef.current,
        round,
        player: 'X',
        playerName: 'Ai Lava-1',
        cellIndex: decision.action,
        boardSnapshot: [...nextBoard],
        actionDesc: lavaRef.current.lastActionDesc,
        evalMetric: `Eval: ${(decision.evalScore >= 0 ? '+' : '') + decision.evalScore.toFixed(2)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setPliesHistory((prev) => [...prev, ply]);

      const res = checkWinner(nextBoard);
      if (res) {
        handleGameOver(res);
      } else {
        setCurrentPlayer('O');
        setStatusText('Ai Lake-1 calculating Q-value distribution...');
        syncTelemetry(outcomes);
      }
    }
  }, [board, currentPlayer, handleGameOver, outcomes, round, syncTelemetry, winningResult]);

  // Perpetual 24/7 Autonomous Stream Loop (Never paused, never stopped)
  useEffect(() => {
    if (winningResult) return;

    const timer = setTimeout(() => {
      executeStep();
    }, speed);

    return () => clearTimeout(timer);
  }, [winningResult, speed, executeStep]);

  // DVR Timeline Controls
  const handleSelectPly = (plyIndex: number) => {
    soundManager.playUiClick();
    if (plyIndex >= 0 && plyIndex < pliesHistory.length) {
      setIsViewingPast(true);
      setViewingPly(plyIndex);
    }
  };

  const handlePrevPly = () => {
    soundManager.playUiClick();
    if (pliesHistory.length === 0) return;
    if (!isViewingPast) {
      setIsViewingPast(true);
      setViewingPly(pliesHistory.length - 1);
    } else if (viewingPly > 0) {
      setViewingPly((prev) => prev - 1);
    }
  };

  const handleNextPly = () => {
    soundManager.playUiClick();
    if (!isViewingPast) return;
    if (viewingPly < pliesHistory.length - 1) {
      setViewingPly((prev) => prev + 1);
    } else {
      // Reached latest live move
      setIsViewingPast(false);
    }
  };

  const handleJumpToLive = () => {
    soundManager.playUiClick();
    setIsViewingPast(false);
  };

  // Toggle Sound Mute
  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Smooth scroll navigation
  const handleNavigate = (sectionId: string) => {
    soundManager.playUiClick();
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Update genome weights directly from the Inspector Modal
  const handleUpdateGenome = (newGenome: number[]) => {
    lavaRef.current.genome = [...newGenome];
    syncTelemetry(outcomes);
  };

  // Clear match history
  const handleClearHistory = () => {
    setMatchHistory([]);
    syncTelemetry([]);
  };

  // User chat message
  const handleSendComment = (msg: string) => {
    soundManager.playUiClick();
    const newComment: StreamCommentary = {
      id: `user-${Date.now()}`,
      timestamp: 'Just now',
      user: 'You (Spectator)',
      badge: 'VIEWER',
      badgeColor: '#00f0ff',
      message: msg,
    };
    setComments((prev) => [...prev, newComment].slice(-60));
  };

  // Collect sample Q-states for the inspector
  const getSampleQStates = () => {
    const samples: { state: string; values: number[]; bestAction: number }[] = [];
    const qMap = lakeRef.current.qTable;
    let count = 0;
    for (const [key, values] of qMap.entries()) {
      if (count >= 12) break;
      const arr: number[] = Array.from(values as Float64Array).map(Number);
      let bestAct = 0;
      let maxV = -Infinity;
      arr.forEach((v: number, idx: number) => {
        if (v > maxV) {
          maxV = v;
          bestAct = idx;
        }
      });
      samples.push({ state: key, values: arr, bestAction: bestAct });
      count++;
    }
    return samples;
  };

  // Section observer
  useEffect(() => {
    const sectionIds = ['arena', 'about', 'contact'];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -30% 0px', threshold: 0.2 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Compute active board to display: current live board or rewound DVR board
  const displayedBoard =
    isViewingPast && pliesHistory[viewingPly]
      ? pliesHistory[viewingPly].boardSnapshot
      : board;

  const lakeEvalRatio = currentPlayer === 'O' ? 55 : 45;
  const lavaEvalRatio = 100 - lakeEvalRatio;

  return (
    <div className="min-h-screen bg-[#040812] font-sans text-[#dae2fd] relative selection:bg-[#00f0ff] selection:text-[#040812]">
      {/* Top Cinematic Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-[#0d162a] pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#00f0ff] via-[#a078ff] to-[#ff334b] transition-all duration-150 shadow-[0_0_10px_#00f0ff]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating Cinematic Ambient Glow Spheres (Lake Cyan & Lava Crimson) */}
      <div className="fixed -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-[#00f0ff]/10 blur-[180px] pointer-events-none animate-float-slow" />
      <div className="fixed top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-[#ff334b]/10 blur-[180px] pointer-events-none animate-float-reverse" />
      <div className="fixed -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-[#0088cc]/10 blur-[180px] pointer-events-none animate-float-slow" />

      {/* Global Navigation Header */}
      <Header
        round={round}
        viewerCount={viewerCount}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />

      <main className="w-full pt-20 bg-transparent relative z-10">
        {/* SECTION 1: LIVE 24/7 BROADCAST ARENA */}
        <section
          id="arena"
          className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-center px-4 md:px-6 lg:px-8 py-6 scroll-mt-24"
        >
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-5">
            {/* 24/7 Live Stream Broadcast Bar */}
            <LiveStreamHud
              round={round}
              uptimeSeconds={uptimeSeconds}
              viewerCount={viewerCount}
              speed={speed}
              isViewingPast={isViewingPast}
              viewingPly={viewingPly}
              totalPlies={pliesHistory.length}
              onSelectSpeed={setSpeed}
              onPrevPly={handlePrevPly}
              onNextPly={handleNextPly}
              onJumpToLive={handleJumpToLive}
            />

            {/* Main Arena 3-Column Grid */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Agent: Ai Lake-1 */}
              <div className="lg:col-span-3 flex flex-col order-2 lg:order-1">
                <AgentCardLake
                  telemetry={lakeTelemetry}
                  isActive={currentPlayer === 'O'}
                />
              </div>

              {/* Center Matrix */}
              <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
                <TactileMatrix
                  board={displayedBoard}
                  round={round}
                  currentPlayer={currentPlayer}
                  statusText={statusText}
                  latencyMs={latencyMs}
                  lakeEvalRatio={lakeEvalRatio}
                  lavaEvalRatio={lavaEvalRatio}
                  speed={speed}
                  winningResult={winningResult}
                  isViewingPast={isViewingPast}
                  viewingPly={viewingPly}
                  pliesHistory={pliesHistory}
                  onSelectPly={handleSelectPly}
                  onJumpToLive={handleJumpToLive}
                  onSelectSpeed={setSpeed}
                />
              </div>

              {/* Right Agent: Ai Lava-1 */}
              <div className="lg:col-span-3 flex flex-col order-3">
                <AgentCardLava
                  telemetry={lavaTelemetry}
                  isActive={currentPlayer === 'X'}
                />
              </div>
            </div>

            {/* Live Stream Chat and Match Event Ticker */}
            <div className="w-full max-w-4xl mx-auto mt-2">
              <LiveStreamChat
                comments={comments}
                onSendMessage={handleSendComment}
                viewerCount={viewerCount}
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: HOW IT WORKS */}
        <ArchitectureSection />

        {/* SECTION 3: REAL TRANSMISSION & FEEDBACK */}
        <TransmissionSection />
      </main>

      {/* Floating AI Companion Guide */}
      <AiNavigatorHud
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Real AI Inspector & Settings Modal */}
      <InspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        qTableSize={lakeTelemetry.totalStates}
        sampleQStates={getSampleQStates()}
        genome={lavaTelemetry.genome}
        onUpdateGenome={handleUpdateGenome}
        matchHistory={matchHistory}
        onClearHistory={handleClearHistory}
      />

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
