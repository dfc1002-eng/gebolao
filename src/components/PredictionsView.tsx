import React, { useState } from 'react';
import { User, Match, Prediction } from '../types';
import { Calendar, MapPin, Check, Save, Lock, AlertCircle, Trophy, Search, Filter, HelpCircle, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { calculatePredictionPoints } from '../initialData';

interface PredictionsViewProps {
  currentUser: User | null;
  users: User[];
  matches: Match[];
  predictions: Prediction[];
  onSavePrediction: (matchId: string, golsCasa: number, golsFora: number) => Promise<void>;
  isLoading: boolean;
}

const phaseOrder: { [key: string]: number } = {
  'grupo a': 1,
  'grupo b': 2,
  'grupo c': 3,
  'grupo d': 4,
  'grupo e': 5,
  'grupo f': 6,
  'grupo g': 7,
  'grupo h': 8,
  'grupo i': 9,
  'grupo j': 10,
  'grupo k': 11,
  'grupo l': 12,
  'dezesseis-avos (32)': 13,
  'fase de 32': 13,
  'r32': 13,
  'oitavas de final': 14,
  'r16': 14,
  'quartas de final': 15,
  'qf': 15,
  'semifinal': 16,
  'sf': 16,
  'decisão 3º lugar': 17,
  '3rd': 17,
  'decisão de 3º lugar': 17,
  'grande final': 18,
  'final': 18
};

export function PredictionsView({
  currentUser,
  users,
  matches,
  predictions,
  onSavePrediction,
  isLoading
}: PredictionsViewProps) {
  // 1. Exclude Friendlies completely
  const worldCupMatches = matches.filter((m) => !m.fase.toLowerCase().includes('amistoso'));

  // 2. State controls
  const [mainTab, setMainTab] = useState<'grupos' | 'eliminatorias' | 'todos'>('grupos');
  const [selectedSubRound, setSelectedSubRound] = useState<string>('Grupo A');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [inputs, setInputs] = useState<{ [matchId: string]: { casa: string; fora: string } }>({});
  const [savingMatches, setSavingMatches] = useState<{ [matchId: string]: boolean }>({});
  const [feedback, setFeedback] = useState<{ [matchId: string]: { type: 'success' | 'error'; message: string } }>({});
  const [expandedMatches, setExpandedMatches] = useState<{ [matchId: string]: boolean }>({});

  const toggleExpandMatch = (matchId: string) => {
    setExpandedMatches((prev) => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // 3. Categorize phases
  const groupPhases = [
    'Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F',
    'Grupo G', 'Grupo H', 'Grupo I', 'Grupo J', 'Grupo K', 'Grupo L'
  ];

  const allAvailablePhases = Array.from(new Set(worldCupMatches.map((m) => m.fase)));
  const sortedGroupPhases = groupPhases.filter(p => allAvailablePhases.includes(p));
  const sortedKnockoutPhases = allAvailablePhases
    .filter(p => !groupPhases.includes(p))
    .sort((a, b) => (phaseOrder[a.toLowerCase()] || 99) - (phaseOrder[b.toLowerCase()] || 99));

  // Format date info in Portuguese locale
  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }) + ' (UTC)';
  };

  // Check if a match has started relative to the current real time
  const isMatchLocked = (match: Match) => {
    if (match.status === 'completed') return true;
    const matchTime = new Date(match.data_hora);
    return matchTime < new Date();
  };

  // Calculate pending guesses for a specific phase
  const getPendingCount = (phaseName: string) => {
    if (!currentUser) return 0;
    const phaseMatches = worldCupMatches.filter(m => m.fase === phaseName);
    const userPreds = predictions.filter(p => p.user_id === currentUser.id);
    
    let pending = 0;
    phaseMatches.forEach(m => {
      if (!isMatchLocked(m)) {
        const hasPred = userPreds.some(p => p.match_id === m.id);
        if (!hasPred) pending++;
      }
    });
    return pending;
  };

  // Calculate total pending guesses for a main tab category
  const getTabPendingCount = (category: 'grupos' | 'eliminatorias' | 'todos') => {
    if (!currentUser) return 0;
    const userPreds = predictions.filter(p => p.user_id === currentUser.id);
    let pending = 0;
    
    worldCupMatches.forEach(m => {
      const isGroup = groupPhases.includes(m.fase);
      const matchesCategory = 
        category === 'todos' ||
        (category === 'grupos' && isGroup) ||
        (category === 'eliminatorias' && !isGroup);

      if (matchesCategory && !isMatchLocked(m)) {
        const hasPred = userPreds.some(p => p.match_id === m.id);
        if (!hasPred) pending++;
      }
    });
    return pending;
  };

  // Handle main tab changes, auto-selecting first available sub-phase
  const handleMainTabChange = (tab: 'grupos' | 'eliminatorias' | 'todos') => {
    setMainTab(tab);
    if (tab === 'grupos') {
      setSelectedSubRound(sortedGroupPhases[0] || 'Grupo A');
    } else if (tab === 'eliminatorias') {
      setSelectedSubRound(sortedKnockoutPhases[0] || 'Oitavas de Final');
    } else {
      setSelectedSubRound('Todos');
    }
  };

  // Handle local state edit for goals input
  const handleInputChange = (matchId: string, team: 'casa' | 'fora', val: string) => {
    if (val !== '' && !/^\d+$/.test(val)) return;

    setInputs((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: val
      }
    }));
  };

  const handlePredictSubmit = async (matchId: string) => {
    if (!currentUser) return;

    const matchInput = inputs[matchId];
    if (!matchInput || matchInput.casa === '' || matchInput.fora === '') {
      setFeedback((prev) => ({
        ...prev,
        [matchId]: { type: 'error', message: 'Preencha ambos os placares!' }
      }));
      setTimeout(() => {
        setFeedback((prev) => {
          const c = { ...prev };
          delete c[matchId];
          return c;
        });
      }, 3000);
      return;
    }

    setSavingMatches((prev) => ({ ...prev, [matchId]: true }));
    try {
      const golsCasa = parseInt(matchInput.casa, 10);
      const golsFora = parseInt(matchInput.fora, 10);

      await onSavePrediction(matchId, golsCasa, golsFora);

      setFeedback((prev) => ({
        ...prev,
        [matchId]: { type: 'success', message: 'Palpite registrado!' }
      }));
    } catch (err: any) {
      setFeedback((prev) => ({
        ...prev,
        [matchId]: { type: 'error', message: err.message || 'Erro ao salvar.' }
      }));
    } finally {
      setSavingMatches((prev) => ({ ...prev, [matchId]: false }));
      setTimeout(() => {
        setFeedback((prev) => {
          const c = { ...prev };
          delete c[matchId];
          return c;
        });
      }, 3000);
    }
  };

  // --- FILTER & SORT MATCHES ---
  let filteredMatches = worldCupMatches.filter((m) => {
    if (mainTab === 'todos') return true;
    return m.fase === selectedSubRound;
  });

  // Filter by text search
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filteredMatches = filteredMatches.filter(m => 
      m.time_casa.toLowerCase().includes(q) || 
      m.time_fora.toLowerCase().includes(q) || 
      m.estadio.toLowerCase().includes(q)
    );
  }

  // Filter by pending predictions only
  if (showOnlyPending && currentUser) {
    const userPreds = predictions.filter(p => p.user_id === currentUser.id);
    filteredMatches = filteredMatches.filter(m => {
      if (isMatchLocked(m)) return false;
      return !userPreds.some(p => p.match_id === m.id);
    });
  }

  // Sort chronologically and by phase hierarchy if on "Todos"
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (mainTab === 'todos') {
      const orderA = phaseOrder[a.fase.toLowerCase()] || 99;
      const orderB = phaseOrder[b.fase.toLowerCase()] || 99;
      if (orderA !== orderB) return orderA - orderB;
    }
    return new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Banner explaining rules if logged out */}
      {!currentUser && (
        <div className="bg-amber-400/10 border border-amber-300 rounded-xl p-4 flex gap-3 text-slate-900 shadow-sm animate-in fade-in duration-300">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="text-xs">
            <span className="font-black text-green-950 block mb-0.5 uppercase italic">Visão de Visitante (Desconectado)</span>
            Você está visualizando a tabela de jogos disponível na Copa. Para registrar palpites, acompanhar seus pontos e obter conquistas customizadas, selecione um competidor de simulação no topo nas opções "Simular Competidor" ou use o botão "Unir-se ao Grupo"!
          </div>
        </div>
      )}

      {/* --- LEVEL 1 TABS (Main Categories) --- */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => handleMainTabChange('grupos')}
          className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            mainTab === 'grupos'
              ? 'bg-green-700 text-white shadow-md scale-[1.02]'
              : 'bg-white border border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>Fase de Grupos</span>
          {currentUser && getTabPendingCount('grupos') > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-green-950 rounded-full">
              {getTabPendingCount('grupos')}
            </span>
          )}
        </button>

        <button
          onClick={() => handleMainTabChange('eliminatorias')}
          className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            mainTab === 'eliminatorias'
              ? 'bg-green-700 text-white shadow-md scale-[1.02]'
              : 'bg-white border border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>Fase Eliminatória</span>
          {currentUser && getTabPendingCount('eliminatorias') > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-green-950 rounded-full">
              {getTabPendingCount('eliminatorias')}
            </span>
          )}
        </button>

        <button
          onClick={() => handleMainTabChange('todos')}
          className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            mainTab === 'todos'
              ? 'bg-green-700 text-white shadow-md scale-[1.02]'
              : 'bg-white border border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span>Todos os Jogos</span>
          {currentUser && getTabPendingCount('todos') > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-400 text-green-950 rounded-full">
              {getTabPendingCount('todos')}
            </span>
          )}
        </button>
      </div>

      {/* --- LEVEL 2 TABS (Sub-categories based on Level 1) --- */}
      {mainTab !== 'todos' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 italic">
            Selecione o Grupo ou Fase Específica:
          </span>
          
          {mainTab === 'grupos' && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
              {sortedGroupPhases.map((phase) => {
                const pending = getPendingCount(phase);
                const letter = phase.replace('Grupo ', '');
                const isSelected = selectedSubRound === phase;
                return (
                  <button
                    key={phase}
                    onClick={() => setSelectedSubRound(phase)}
                    className={`relative py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center border ${
                      isSelected
                        ? 'bg-green-700 text-white border-green-700 shadow-md scale-[1.05]'
                        : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400/80 -mb-0.5">Grupo</span>
                    <span className="text-sm">{letter}</span>
                    {currentUser && pending > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-400 text-green-950 text-[9px] font-black rounded-full flex items-center justify-center shadow">
                        {pending}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {mainTab === 'eliminatorias' && (
            <div className="flex flex-wrap gap-2">
              {sortedKnockoutPhases.map((phase) => {
                const pending = getPendingCount(phase);
                const isSelected = selectedSubRound === phase;
                
                // Friendly short names
                let displayName = phase;
                if (phase === 'Dezesseis-avos (32)') displayName = 'Fase de 32 (1/16)';
                
                return (
                  <button
                    key={phase}
                    onClick={() => setSelectedSubRound(phase)}
                    className={`relative px-4 py-2.5 rounded-xl text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-green-700 text-white border-green-700 shadow-md scale-[1.02]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{displayName}</span>
                    {currentUser && pending > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-400 text-green-950 rounded-full shadow">
                        {pending}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- FILTERS & SEARCH BAR --- */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por seleção (ex: Brasil, França, México)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-green-700 focus:ring-1 focus:ring-green-700 outline-none transition duration-200"
          />
        </div>

        {/* Pending filters checkbox */}
        {currentUser && (
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <label className="relative flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlyPending}
                onChange={(e) => setShowOnlyPending(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-700"></div>
              <span className="text-xs font-extrabold text-slate-600 uppercase italic tracking-wide flex items-center gap-1.5">
                <Filter size={13} className="text-slate-400" />
                <span>Mostrar Apenas Pendentes</span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* --- MATCHES GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedMatches.map((match) => {
          const isLocked = isMatchLocked(match);

          // Find current user's prediction for this match
          let userPred = currentUser
            ? predictions.find((p) => p.user_id === currentUser.id && p.match_id === match.id)
            : null;

          // Sync default values for inputs from current prediction
          const localVal = inputs[match.id];
          const displayGolsCasa = localVal?.casa !== undefined ? localVal.casa : (userPred ? String(userPred.gols_casa) : '');
          const displayGolsFora = localVal?.fora !== undefined ? localVal.fora : (userPred ? String(userPred.gols_fora) : '');

          // Calculate points awarded if completed
          let pointsAwarded = 0;
          let pointsCategory: 'exato' | 'resultado' | 'gols_um_time' | 'erro' | null = null;

          if (match.status === 'completed' && userPred) {
            const evaluation = calculatePredictionPoints(
              userPred.gols_casa,
              userPred.gols_fora,
              match.gols_casa!,
              match.gols_fora!
            );
            pointsAwarded = evaluation.points;
            pointsCategory = evaluation.category;
          }

          return (
            <div
              key={match.id}
              className={`bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative group hover:border-slate-350 hover:shadow-md transition-all duration-200 overflow-hidden ${
                match.status === 'completed' ? 'border-l-4 border-l-green-700' : ''
              }`}
            >
              {/* Card Ribbon / Score Detail if completed */}
              {match.status === 'completed' && (
                <div className="absolute top-0 right-0 bg-green-700 text-white font-black px-3.5 py-1.5 text-[9px] uppercase tracking-widest rounded-bl-xl italic">
                  Resultado Oficial
                </div>
              )}
              {isLocked && match.status !== 'completed' && (
                <div className="absolute top-0 right-0 bg-slate-100 text-slate-650 border-l border-b border-slate-200 font-extrabold px-3 py-1.5 text-[9px] uppercase tracking-wider rounded-bl-xl flex items-center gap-1 italic">
                  <Lock size={10} />
                  <span>Em Jogo</span>
                </div>
              )}

              {/* Match Header meta info */}
              <div className="flex flex-col gap-1 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-green-700 font-black uppercase tracking-widest italic bg-green-50 px-2.5 py-0.5 rounded border border-green-150">
                    {match.fase}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-1">
                  <Calendar size={12} className="text-slate-400" />
                  <span>{formatDate(match.data_hora)}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 min-h-4">
                  <MapPin size={11} className="text-slate-400" />
                  <span className="truncate max-w-[250px]">{match.estadio}</span>
                </div>
              </div>

              {/* Core Match Predictor Layout */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center my-3.5 gap-2 transition-colors group-hover:bg-slate-100/40">
                {/* Home Team */}
                <div className="flex flex-col items-center flex-1 text-center">
                  <span className="text-3xl mb-1.5 filter drop-shadow-sm select-none" role="img" aria-label={match.time_casa}>
                    {match.bandeira_casa}
                  </span>
                  <span className="font-black text-xs text-slate-900 truncate w-full max-w-[95px] uppercase italic tracking-wide">
                    {match.time_casa}
                  </span>
                </div>

                {/* Scores & Predict Inputs */}
                <div className="flex items-center gap-2.5 justify-center">
                  {/* Home Input / Score representation */}
                  {isLocked ? (
                    <div className="bg-slate-200 font-black text-sm text-slate-800 w-11 h-11 border border-slate-300 rounded-xl flex items-center justify-center shadow-inner">
                      {userPred ? userPred.gols_casa : '-'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled={!currentUser || isLoading}
                      value={displayGolsCasa}
                      onChange={(e) => handleInputChange(match.id, 'casa', e.target.value)}
                      placeholder="-"
                      className="bg-white font-black text-center text-sm text-slate-900 focus:border-green-700 focus:ring-2 focus:ring-green-700/20 w-11 h-11 border border-slate-300 rounded-xl outline-none transition duration-150 shadow-sm"
                    />
                  )}

                  {/* VS Divider or Actual score multiplier */}
                  <div className="flex flex-col items-center justify-center px-1">
                    {match.status === 'completed' ? (
                      <div className="flex flex-col items-center min-w-[45px]">
                        <span className="text-green-700 font-black text-sm tracking-tight">
                          {match.gols_casa} x {match.gols_fora}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Final</span>
                      </div>
                    ) : (
                      <span className="font-black text-green-700 text-sm">x</span>
                    )}
                  </div>

                  {/* Away Input / Score representation */}
                  {isLocked ? (
                    <div className="bg-slate-200 font-black text-sm text-slate-800 w-11 h-11 border border-slate-300 rounded-xl flex items-center justify-center shadow-inner">
                      {userPred ? userPred.gols_fora : '-'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled={!currentUser || isLoading}
                      value={displayGolsFora}
                      onChange={(e) => handleInputChange(match.id, 'fora', e.target.value)}
                      placeholder="-"
                      className="bg-white font-black text-center text-sm text-slate-900 focus:border-green-700 focus:ring-2 focus:ring-green-700/20 w-11 h-11 border border-slate-300 rounded-xl outline-none transition duration-150 shadow-sm"
                    />
                  )}
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center flex-1 text-center">
                  <span className="text-3xl mb-1.5 filter drop-shadow-sm select-none" role="img" aria-label={match.time_fora}>
                    {match.bandeira_fora}
                  </span>
                  <span className="font-black text-xs text-slate-900 truncate w-full max-w-[95px] uppercase italic tracking-wide">
                    {match.time_fora}
                  </span>
                </div>
              </div>

              {/* Bottom footer: user results or register actions */}
              <div className="mt-2 text-xs flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl">
                {/* Left Area (Feedback status or helper string) */}
                <div className="flex-1 min-w-0 pr-2">
                  {feedback[match.id] ? (
                    <span
                      className={`text-[10px] font-black uppercase italic truncate block ${
                        feedback[match.id].type === 'success' ? 'text-green-700 animate-pulse' : 'text-red-600'
                      }`}
                    >
                      {feedback[match.id].message}
                    </span>
                  ) : isLocked ? (
                    userPred ? (
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wide flex items-center gap-1">
                        <Lock size={9} /> Palpite trancado
                      </span>
                    ) : (
                      <span className="text-orange-700 text-[9px] font-black flex items-center gap-1 bg-orange-100/50 px-2 py-0.5 rounded border border-orange-200 uppercase italic">
                        <Lock size={9} /> Geb, o virgem (+0)
                      </span>
                    )
                  ) : currentUser ? (
                    userPred ? (
                      <span className="text-green-700 font-black text-[10px] uppercase italic flex items-center gap-1">
                        <Check size={11} className="stroke-[3]" /> Palpite registrado!
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[9px] italic font-semibold uppercase tracking-wider block">Ainda sem palpite</span>
                    )
                  ) : (
                    <span className="text-slate-400 text-[9px] italic">Selecione simular ou junte-se</span>
                  )}
                </div>

                {/* Right Area (Points awarded badge or palpite submit button) */}
                <div className="shrink-0">
                  {match.status === 'completed' && userPred ? (
                    <div className="flex items-center gap-1.5">
                      {pointsCategory === 'exato' && (
                        <div className="bg-amber-400 text-green-950 font-black px-2.5 py-1 rounded-lg text-[9px] flex items-center gap-1 uppercase italic tracking-wider shadow-sm animate-bounce">
                          <Trophy size={11} />
                          <span>+10 pts (Exato)</span>
                        </div>
                      )}
                      {pointsCategory === 'resultado' && (
                        <div className="bg-green-700 text-white font-black px-2.5 py-1 rounded-lg text-[9px] flex items-center gap-1 uppercase italic tracking-wider shadow-sm">
                          <Check size={11} />
                          <span>+5 pts (Resultado)</span>
                        </div>
                      )}
                      {pointsCategory === 'gols_um_time' && (
                        <div className="bg-blue-600 text-white font-black px-2.5 py-1 rounded-lg text-[9px] uppercase italic tracking-wider shadow-sm">
                          <span>+2 pts (Gols parcial)</span>
                        </div>
                      )}
                      {pointsCategory === 'erro' && (
                        <div className="bg-slate-200 text-slate-500 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase italic tracking-wider">
                          <span>0 pts (Errou tudo)</span>
                        </div>
                      )}
                    </div>
                  ) : !isLocked && currentUser ? (
                    <button
                      onClick={() => handlePredictSubmit(match.id)}
                      disabled={savingMatches[match.id] || isLoading}
                      className="bg-green-700 hover:bg-green-600 active:scale-95 text-white text-[10px] px-4 py-2 font-black uppercase italic tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 shadow-sm"
                    >
                      <Save size={11} />
                      <span>{savingMatches[match.id] ? 'Salvando...' : 'Palpitar'}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Collapsible Predictions Drawer for Locked Matches */}
              {isLocked && (
                <div className="mt-4 border-t border-slate-100 pt-3.5">
                  <button
                    onClick={() => toggleExpandMatch(match.id)}
                    className="w-full text-center py-2.5 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-[10px] font-black uppercase italic tracking-wider text-green-700 hover:text-green-600 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Users size={12} className="text-green-700 animate-pulse" />
                    <span>{expandedMatches[match.id] ? 'Esconder Palpites dos Amigos' : 'Ver Palpites dos Amigos'}</span>
                    <span className="bg-green-100 text-green-800 px-2 py-0.2 rounded-full text-[9px] font-bold">
                      {predictions.filter(p => p.match_id === match.id).length}
                    </span>
                    {expandedMatches[match.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {expandedMatches[match.id] && (
                    <div className="mt-3.5 space-y-2 animate-in slide-in-from-top-2 duration-250">
                      <div className="text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1">
                        Palpites do Grupo:
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                        {users.map(u => {
                          const pred = predictions.find(p => p.user_id === u.id && p.match_id === match.id);
                          let pointsEarned = 0;
                          let hasPoints = false;
                          if (match.status === 'completed' && pred) {
                            const evalResult = calculatePredictionPoints(
                              pred.gols_casa,
                              pred.gols_fora,
                              match.gols_casa!,
                              match.gols_fora!
                            );
                            pointsEarned = evalResult.points;
                            hasPoints = true;
                          }

                          return (
                            <div
                              key={u.id}
                              className={`flex justify-between items-center text-xs px-3 py-2 rounded-xl border transition-all ${
                                u.id === currentUser?.id
                                  ? 'bg-green-50 border-green-200 font-extrabold text-green-950'
                                  : 'bg-slate-50 border-slate-150 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-650 flex items-center justify-center font-display font-black text-[9px] uppercase shrink-0 border border-slate-350">
                                  {getInitials(u.nome)}
                                </span>
                                <span className="truncate max-w-[130px] font-semibold">{u.nome} {u.isAdmin ? '👑' : ''}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {pred ? (
                                  <span className="font-mono font-extrabold text-slate-900 bg-slate-200/60 px-2 py-0.5 rounded text-[11px] border border-slate-300/40">
                                    {pred.gols_casa} x {pred.gols_fora}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider italic">Sem palpite</span>
                                )}

                                {hasPoints && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wider ${
                                      pointsEarned === 10
                                        ? 'bg-amber-400 text-green-950 shadow-xs ring-1 ring-amber-300'
                                        : pointsEarned === 5
                                        ? 'bg-green-700 text-white shadow-xs'
                                        : pointsEarned === 2
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-200 text-slate-500'
                                    }`}
                                  >
                                    +{pointsEarned} pts
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sortedMatches.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 p-12 rounded-2xl text-center flex flex-col items-center justify-center shadow-sm">
            <AlertCircle className="text-slate-400 mb-3" size={32} />
            <h4 className="font-extrabold text-sm text-slate-800 uppercase italic tracking-wide">Nenhum jogo encontrado</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Não existem jogos que atendam aos filtros selecionados (busca, pendências ou fase ativa) neste momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
