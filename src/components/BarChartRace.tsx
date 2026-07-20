import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, X, BarChart2 } from 'lucide-react';
import { User, Match, Prediction } from '../types';
import { calculatePredictionPoints } from '../initialData';

function AnimatedCounter({ value, duration }: { value: number; duration: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    if (start === end) {
      setDisplayValue(value);
      return;
    }

    prevValueRef.current = value;
    const startTime = performance.now();

    let animFrameId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutQuad
      const easedProgress = progress * (2 - progress);
      const current = Math.round(start + (end - start) * easedProgress);
      
      setDisplayValue(current);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    animFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameId);
  }, [value, duration]);

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  return <>{displayValue}</>;
}

interface BarChartRaceProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  matches: Match[];
  predictions: Prediction[];
  currentUser: User | null;
}

export function BarChartRace({
  isOpen,
  onClose,
  users,
  matches,
  predictions,
  currentUser
}: BarChartRaceProps) {
  // Animating state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [speed, setSpeed] = useState<number>(900); // ms per frame
  const [showCount, setShowCount] = useState<number | 'all'>(10);
  const animationDuration = isPlaying ? speed : 100;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [finalistPredictions, setFinalistPredictions] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/finalists')
        .then((res) => {
          if (!res.ok) throw new Error('Erro ao carregar finalistas');
          return res.json();
        })
        .then((data) => setFinalistPredictions(data || []))
        .catch((err) => console.error('Erro ao buscar palpites de finalistas:', err));
    }
  }, [isOpen]);

  // 1. Get all completed matches sorted chronologically
  const completedMatches = useMemo(() => {
    return matches
      .filter((m) => m.status === 'completed')
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
  }, [matches]);

  // 2. Pre-calculate standing snapshots (frames)
  const frames = useMemo(() => {
    if (users.length === 0) return [];

    // Frame 0: Initialization (0 points, alphabetical)
    const initialStandings = users.map((u) => ({
      userId: u.id,
      userName: u.nome,
      avatarUrl: u.avatar_url,
      points: 0,
      exatos: 0,
      vencedores: 0,
      change: 0,
      rank: 1
    })).sort((a, b) => a.userName.localeCompare(b.userName));

    initialStandings.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    const list = [
      {
        match: null as Match | null,
        standings: initialStandings
      }
    ];

    // Tracking stats
    const userStats: {
      [id: string]: { points: number; exatos: number; vencedores: number; change: number };
    } = {};
    users.forEach((u) => {
      userStats[u.id] = { points: 0, exatos: 0, vencedores: 0, change: 0 };
    });

    // Populate successive matches
    completedMatches.forEach((match) => {
      users.forEach((u) => {
        userStats[u.id].change = 0;
      });

      users.forEach((user) => {
        const pred = predictions.find((p) => p.user_id === user.id && p.match_id === match.id);
        if (
          pred &&
          match.gols_casa !== null &&
          match.gols_casa !== undefined &&
          match.gols_fora !== null &&
          match.gols_fora !== undefined
        ) {
          const res = calculatePredictionPoints(
            pred.gols_casa,
            pred.gols_fora,
            match.gols_casa,
            match.gols_fora
          );
          userStats[user.id].points += res.points;
          userStats[user.id].change = res.points;
          if (res.category === 'exato') {
            userStats[user.id].exatos += 1;
          } else if (res.category === 'resultado') {
            userStats[user.id].vencedores += 1;
          }
        }
      });

      // Adicionar bônus de finalistas na Grande Final
      const isGrandFinal = match.fase === 'Grande Final';
      if (isGrandFinal && finalistPredictions.length > 0) {
        finalistPredictions.forEach((fp) => {
          if (userStats[fp.user_id]) {
            let bonus = 0;
            if (fp.campeao_team_id === 'Spain' || fp.campeao_team_id === 'Espanha') {
              bonus += 10;
            }
            if (fp.vice_team_id === 'Argentina') {
              bonus += 5;
            }
            userStats[fp.user_id].points += bonus;
            userStats[fp.user_id].change += bonus;
          }
        });
      }

      const standings = users.map((user) => ({
        userId: user.id,
        userName: user.nome,
        avatarUrl: user.avatar_url,
        points: userStats[user.id].points,
        exatos: userStats[user.id].exatos,
        vencedores: userStats[user.id].vencedores,
        change: userStats[user.id].change,
        rank: 1
      }));

      // Sort with tie breakers
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.exatos !== a.exatos) return b.exatos - a.exatos;
        if (b.vencedores !== a.vencedores) return b.vencedores - a.vencedores;
        return a.userName.localeCompare(b.userName);
      });

      // Assign rank index
      let currentRank = 1;
      for (let i = 0; i < standings.length; i++) {
        if (i > 0) {
          const prev = standings[i - 1];
          const curr = standings[i];
          const isTie =
            prev.points === curr.points &&
            prev.exatos === curr.exatos &&
            prev.vencedores === curr.vencedores;
          if (!isTie) {
            currentRank = i + 1;
          }
        }
        standings[i].rank = currentRank;
      }

      list.push({
        match,
        standings
      });
    });

    return list;
  }, [users, completedMatches, predictions, finalistPredictions]);

  // Max points scale: fixed at 600 points (or fallback to leader's points if it exceeds 600 in the future)
  const maxPoints = useMemo(() => {
    if (frames.length === 0) return 600;
    const finalFrame = frames[frames.length - 1];
    const finalLeaderPoints = finalFrame?.standings[0]?.points || 0;
    return Math.max(600, finalLeaderPoints);
  }, [frames]);

  const displayedStandings = useMemo(() => {
    if (frames.length === 0) return [];
    const currentFrame = frames[currentFrameIndex];
    const standings = currentFrame.standings;
    if (showCount === 'all') return standings;
    return standings.slice(0, showCount);
  }, [frames, currentFrameIndex, showCount]);

  // Manage playing interval
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, frames.length, speed]);

  // Restart trigger
  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowLeft') {
        setCurrentFrameIndex((prev) => Math.max(0, prev - 1));
      } else if (e.code === 'ArrowRight') {
        setCurrentFrameIndex((prev) => Math.min(frames.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, frames.length]);

  if (!isOpen || frames.length === 0) return null;

  const currentFrame = frames[currentFrameIndex];
  const currentMatch = currentFrame?.match;

  const barHeight = 40;
  const barGap = 8;
  const rowHeight = barHeight + barGap;

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-green-700 animate-pulse" size={20} />
            <div>
              <h3 className="font-display font-black text-slate-900 text-sm uppercase tracking-tight">
                Corrida de Barras: Evolução dos Pontos
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Acompanhe a trajetória dramática jogo a jogo do Gebolão
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-200/60 hover:bg-slate-200 p-1.5 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto bg-slate-50/50 flex flex-col select-none">
          
          {/* Scoreboard Widget */}
          {currentMatch ? (
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-emerald-950 shadow-md relative overflow-hidden mb-6 shrink-0 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/20 to-slate-950/20" />
              
              <div className="relative z-10 flex flex-col items-center md:items-start">
                <span className="text-[9px] bg-emerald-500/25 border border-emerald-500/20 text-emerald-300 font-black px-2 py-0.5 rounded uppercase tracking-wider italic mb-1">
                  {currentMatch.fase}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  Jogo {currentFrameIndex} de {frames.length - 1} • {new Date(currentMatch.data_hora).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Teams & Score */}
              <div className="relative z-10 flex items-center justify-center gap-5">
                <div className="flex items-center gap-1.5 text-right">
                  <span className="text-xs font-black uppercase italic tracking-wide hidden sm:inline">{currentMatch.time_casa}</span>
                  <span className="text-2xl" title={currentMatch.time_casa}>{currentMatch.bandeira_casa}</span>
                </div>

                <div className="bg-slate-950/80 border border-emerald-950/55 px-3 py-1.5 rounded-xl text-base font-black font-mono tracking-wider flex items-center gap-2.5">
                  <span className="text-white">{currentMatch.gols_casa}</span>
                  <span className="text-emerald-500 text-xs font-normal">X</span>
                  <span className="text-white">{currentMatch.gols_fora}</span>
                </div>

                <div className="flex items-center gap-1.5 text-left">
                  <span className="text-2xl" title={currentMatch.time_fora}>{currentMatch.bandeira_fora}</span>
                  <span className="text-xs font-black uppercase italic tracking-wide hidden sm:inline">{currentMatch.time_fora}</span>
                </div>
              </div>

              {/* Highlights */}
              <div className="relative z-10 hidden md:block text-right max-w-[240px] truncate">
                <span className="text-[9px] text-slate-450 uppercase block font-bold">Destaques do Confronto</span>
                <div className="text-[10px] text-emerald-400 font-extrabold mt-0.5">
                  {(() => {
                    const cravadores = currentFrame.standings
                      .filter((s) => s.change === 10)
                      .map((s) => s.userName.trim().split(' ')[0]);
                    if (cravadores.length > 0) {
                      return `🎯 Cravou: ${cravadores.slice(0, 2).join(', ')}${cravadores.length > 2 ? '...' : ''}`;
                    }
                    const acertadores = currentFrame.standings
                      .filter((s) => s.change === 5)
                      .map((s) => s.userName.trim().split(' ')[0]);
                    if (acertadores.length > 0) {
                      return `⭐ Acertou: ${acertadores.slice(0, 2).join(', ')}${acertadores.length > 2 ? '...' : ''}`;
                    }
                    return 'Nenhum acerto';
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-800 shadow-md relative overflow-hidden mb-6 text-center shrink-0 min-h-[90px]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-slate-950 to-slate-950" />
              <div className="relative z-10">
                <h3 className="text-xs font-black uppercase italic text-emerald-400 tracking-wider">Corrida de Barras Gebolão</h3>
                <p className="text-[10px] text-slate-450 mt-1 max-w-md mx-auto">
                  Aperte **Play** para ver a classificação se mover dinamicamente conforme os {frames.length - 1} jogos concluídos são processados!
                </p>
              </div>
            </div>
          )}

          {/* Race Graph Area */}
          <div className="flex-grow relative bg-white border border-slate-200 rounded-2xl p-4 pb-8 shadow-inner min-h-[300px]">
            
            {/* Background Grid Lines Layer */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 px-4 py-4 pb-8">
              <div className="flex items-center gap-3 w-full h-full">
                {/* Spacer for Rank */}
                <div className="w-7 shrink-0" />
                {/* Spacer for Name */}
                <div className="w-28 sm:w-36 shrink-0" />
                
                {/* Grid area matching the flex-1 bar container */}
                <div className="flex-1 h-full relative border-r border-slate-100/80">
                  {[0.25, 0.5, 0.75].map((ratio) => (
                    <div
                      key={ratio}
                      className="absolute top-0 bottom-0 border-l border-dashed border-slate-200"
                      style={{ left: `${ratio * 100}%` }}
                    />
                  ))}
                  
                  {/* Grid labels at the very bottom */}
                  <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-[8px] font-mono text-slate-400">
                    <span>0</span>
                    <span style={{ transform: 'translateX(-50%)' }}>{Math.round(maxPoints * 0.25)}</span>
                    <span style={{ transform: 'translateX(-50%)' }}>{Math.round(maxPoints * 0.5)}</span>
                    <span style={{ transform: 'translateX(-50%)' }}>{Math.round(maxPoints * 0.75)}</span>
                    <span className="absolute right-0 translate-x-1/2">{maxPoints}</span>
                  </div>
                </div>
                
                {/* Spacer for Points Tracker */}
                <div className="min-w-[65px] sm:min-w-[75px] shrink-0" />
              </div>
            </div>

            <div
              className="relative w-full transition-all duration-300 z-10"
              style={{ height: `${displayedStandings.length * rowHeight}px` }}
            >
              <AnimatePresence>
                {displayedStandings.map((standing, index) => {
                  const isCurrentUser = standing.userId === currentUser?.id;
                  
                  // Rank styling accents
                  let podStyle = 'border-slate-200 bg-slate-50';
                  let textRankColor = 'text-slate-400';
                  if (standing.rank === 1) {
                    podStyle = 'border-amber-400 bg-amber-50/20';
                    textRankColor = 'text-amber-500';
                  } else if (standing.rank === 2) {
                    podStyle = 'border-slate-350 bg-slate-100/30';
                    textRankColor = 'text-slate-500';
                  } else if (standing.rank === 3) {
                    podStyle = 'border-amber-700 bg-amber-700/5';
                    textRankColor = 'text-amber-700';
                  }

                  return (
                    <motion.div
                      key={standing.userId}
                      layout
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{
                        layout: { duration: animationDuration / 1000, ease: 'easeInOut' },
                        opacity: { duration: 0.25 },
                        x: { type: 'spring', stiffness: 140, damping: 22 }
                      }}
                      style={{
                        position: 'absolute',
                        top: index * rowHeight,
                        left: 0,
                        right: 0,
                        height: barHeight
                      }}
                      className="flex items-center gap-3 w-full"
                    >
                      {/* Rank Indicator */}
                      <div className={`w-7 text-center text-xs font-black italic shrink-0 ${textRankColor}`}>
                        {standing.rank}º
                      </div>



                      {/* Participant Name */}
                      <div className={`w-28 sm:w-36 shrink-0 truncate text-[10px] sm:text-xs font-bold uppercase tracking-wide ${
                        isCurrentUser ? 'text-green-800 font-extrabold' : 'text-slate-700'
                      }`}>
                        {standing.userName}
                      </div>

                      {/* Bar Container */}
                      <div className="flex-1 bg-slate-100 rounded-lg h-7 overflow-hidden relative border border-slate-200">
                        <motion.div
                          className={`h-full rounded-lg flex items-center justify-end pr-2.5 select-none ${
                            isCurrentUser
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-green-950 font-black shadow-inner border border-amber-300'
                              : standing.rank === 1
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-extrabold'
                              : standing.rank === 2
                              ? 'bg-gradient-to-r from-slate-400 to-slate-500 text-white font-extrabold'
                              : standing.rank === 3
                              ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white font-extrabold'
                              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold'
                          }`}
                          animate={{ width: `${(standing.points / maxPoints) * 100}%` }}
                          transition={{ duration: animationDuration / 1000, ease: 'easeInOut' }}
                        >
                          {/* Points overlay inside bar (if visible) */}
                          {standing.points > 0 && (standing.points / maxPoints) > 0.15 && (
                            <span className="text-[10px] font-mono font-black drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.45)]">
                              <AnimatedCounter value={standing.points} duration={animationDuration} />
                            </span>
                          )}
                        </motion.div>
                      </div>

                      {/* Points Tracker & Points Gained bubble */}
                      <div className="flex items-center gap-1.5 min-w-[65px] sm:min-w-[75px] shrink-0 font-mono text-[11px]">
                        <span className="font-extrabold text-slate-800 text-xs">
                          <AnimatedCounter value={standing.points} duration={animationDuration} /> pts
                        </span>
                        {standing.change > 0 && (
                          <motion.span
                            key={`${currentFrameIndex}-${standing.userId}`}
                            initial={{ scale: 0.4, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className={`text-[8.5px] font-black px-1 py-0.25 rounded shrink-0 ${
                              standing.change === 10
                                ? 'bg-amber-100 text-amber-800 border border-amber-250'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-250'
                            }`}
                          >
                            +{standing.change}
                          </motion.span>
                        )}
                      </div>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Control Center / Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-3 shrink-0">
          
          {/* Progress Timeline Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-450 font-bold font-mono">INÍCIO</span>
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={currentFrameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentFrameIndex(parseInt(e.target.value, 10));
              }}
              className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-700"
            />
            <span className="text-[10px] text-slate-450 font-bold font-mono">FIM</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Playback Button Group */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentFrameIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentFrameIndex === 0}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-200/50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition"
                title="Voltar um jogo"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={() => setIsPlaying((prev) => !prev)}
                className={`px-4 py-2 rounded-lg font-black uppercase italic tracking-wider flex items-center gap-1.5 cursor-pointer shadow transition-all ${
                  isPlaying
                    ? 'bg-amber-500 text-green-950 hover:bg-amber-450'
                    : 'bg-green-700 text-white hover:bg-green-600'
                }`}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Pausar' : 'Iniciar'}</span>
              </button>

              <button
                onClick={() => setCurrentFrameIndex((prev) => Math.min(frames.length - 1, prev + 1))}
                disabled={currentFrameIndex === frames.length - 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-200/50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition"
                title="Avançar um jogo"
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={handleRestart}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-200/50 text-slate-500 hover:text-slate-800 cursor-pointer transition"
                title="Recomeçar"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Config: Speed & Count Selection */}
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Playback speed selector */}
              <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg border border-slate-200/50">
                <button
                  onClick={() => setSpeed(1400)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                    speed === 1400 ? 'bg-white text-green-700 shadow-xs' : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  Lento
                </button>
                <button
                  onClick={() => setSpeed(900)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                    speed === 900 ? 'bg-white text-green-700 shadow-xs' : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setSpeed(500)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                    speed === 500 ? 'bg-white text-green-700 shadow-xs' : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  Rápido
                </button>
              </div>

              {/* View capacity selector */}
              <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg border border-slate-200/50">
                <button
                  onClick={() => setShowCount(10)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                    showCount === 10 ? 'bg-white text-green-700 shadow-xs' : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  Top 10
                </button>
                <button
                  onClick={() => setShowCount(15)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                    showCount === 15 ? 'bg-white text-green-700 shadow-xs' : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  Top 15
                </button>
                <button
                  onClick={() => setShowCount('all')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                    showCount === 'all' ? 'bg-white text-green-700 shadow-xs' : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  Todos
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
