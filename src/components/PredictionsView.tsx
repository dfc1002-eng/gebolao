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
  const [minimizePassedMatches, setMinimizePassedMatches] = useState(true);
  const [expandedPassedMatches, setExpandedPassedMatches] = useState<{ [matchId: string]: boolean }>({});
  const [inputs, setInputs] = useState<{ [matchId: string]: { casa: string; fora: string } }>({});
  const [savingMatches, setSavingMatches] = useState<{ [matchId: string]: boolean }>({});
  const [feedback, setFeedback] = useState<{ [matchId: string]: { type: 'success' | 'error'; message: string } }>({});
  const [expandedMatches, setExpandedMatches] = useState<{ [matchId: string]: boolean }>({});
  const [viewMode, setViewMode] = useState<'grupos' | 'cronologico'>('cronologico');
  const [collapsedDays, setCollapsedDays] = useState<{ [dateLabel: string]: boolean }>({});

  const [finalistPrediction, setFinalistPrediction] = useState<{ campeao_team_id: string; vice_team_id: string } | null>(null);
  const [selCampeao, setSelCampeao] = useState<string>('');
  const [selVice, setSelVice] = useState<string>('');
  const [loadingFinalists, setLoadingFinalists] = useState(false);
  const [savingFinalists, setSavingFinalists] = useState(false);
  const [finalistsError, setFinalistsError] = useState<string | null>(null);
  const [finalistsSuccess, setFinalistsSuccess] = useState(false);
  const [showFinalistsPopup, setShowFinalistsPopup] = useState(false);

  const teamsList = Array.from(
    new Set(
      worldCupMatches
        .flatMap(m => [m.time_casa, m.time_fora])
        .filter(t => t && !t.startsWith('Time A ') && !t.startsWith('Time B '))
    )
  ).sort();
  const teamFlags: { [teamName: string]: string } = {};
  worldCupMatches.forEach(m => {
    if (m.time_casa) teamFlags[m.time_casa] = m.bandeira_casa;
    if (m.time_fora) teamFlags[m.time_fora] = m.bandeira_fora;
  });

  const LEFT_SIDE_TEAMS = [
    'África do Sul', 'Canadá', 'Alemanha', 'Paraguai', 'Holanda', 'Marrocos',
    'França', 'Suécia', 'Portugal', 'Croácia', 'Espanha', 'EUA',
    'Bósnia e Herzegovina', 'Bélgica', 'Senegal'
  ];

  const RIGHT_SIDE_TEAMS = [
    'Brasil', 'Japão', 'Costa do Marfim', 'Noruega', 'México', 'Equador',
    'Inglaterra', 'RD do Congo', 'Argentina', 'Cabo Verde', 'Austrália',
    'Egito', 'Suíça', 'Colômbia', 'Gana'
  ];

  const getTeamSide = (teamName: string): 'left' | 'right' | null => {
    if (!teamName) return null;
    const name = teamName.trim();
    if (LEFT_SIDE_TEAMS.includes(name)) return 'left';
    if (RIGHT_SIDE_TEAMS.includes(name)) return 'right';
    return null;
  };

  const getTeamIdFromPortugueseName = (portugueseName: string): string => {
    if (!portugueseName) return '';
    const norm = portugueseName.trim();
    if (norm === 'Brasil') return 'Brazil';
    if (norm === 'Japão') return 'Japan';
    if (norm === 'África do Sul') return 'South Africa';
    if (norm === 'Canadá') return 'Canada';
    if (norm === 'Alemanha') return 'Germany';
    if (norm === 'Paraguai') return 'Paraguay';
    if (norm === 'Suíça') return 'Switzerland';
    if (norm === 'Argentina') return 'Argentina';
    if (norm === 'Cabo Verde') return 'Cape Verde';
    if (norm === 'Austrália') return 'Australia';
    if (norm === 'Egito') return 'Egypt';
    if (norm === 'França') return 'France';
    if (norm === 'EUA') return 'United States';
    if (norm === 'Bósnia e Herzegovina') return 'Bosnia and Herzegovina';
    if (norm === 'Bélgica') return 'Belgium';
    if (norm === 'Irã') return 'Iran';
    if (norm === 'Espanha') return 'Spain';
    if (norm === 'Arábia Saudita') return 'Saudi Arabia';
    if (norm === 'Uruguai') return 'Uruguay';
    if (norm === 'Jordânia') return 'Jordan';
    if (norm === 'Argélia') return 'Algeria';
    if (norm === 'Áustria') return 'Austria';
    if (norm === 'Portugal') return 'Portugal';
    if (norm === 'Uzbequistão') return 'Uzbekistan';
    if (norm === 'Colômbia') return 'Colombia';
    if (norm === 'RD do Congo') return 'Democratic Republic of the Congo';
    if (norm === 'Panamá') return 'Panama';
    if (norm === 'Croácia') return 'Croatia';
    if (norm === 'Gana') return 'Ghana';
    if (norm === 'Nova Zelândia') return 'New Zealand';
    if (norm === 'Marrocos') return 'Morocco';
    if (norm === 'Haiti') return 'Haiti';
    if (norm === 'Escócia') return 'Scotland';
    if (norm === 'México') return 'Mexico';
    if (norm === 'Coreia do Sul') return 'South Korea';
    if (norm === 'República Tcheca') return 'Czech Republic';
    if (norm === 'Tunísia') return 'Tunisia';
    if (norm === 'Iraque') return 'Iraq';
    if (norm === 'Noruega') return 'Norway';
    if (norm === 'Senegal') return 'Senegal';
    if (norm === 'Curaçao') return 'Curaçao';
    if (norm === 'Costa do Marfim') return 'Ivory Coast';
    if (norm === 'Equador') return 'Ecuador';
    if (norm === 'Suécia') return 'Sweden';
    if (norm === 'Turquia') return 'Turkey';
    return portugueseName;
  };

  const getPortugueseNameFromTeamId = (teamId: string): string => {
    if (!teamId) return '';
    const norm = teamId.trim();
    if (norm === 'Brazil') return 'Brasil';
    if (norm === 'Japan') return 'Japão';
    if (norm === 'South Africa') return 'África do Sul';
    if (norm === 'Canada') return 'Canadá';
    if (norm === 'Germany') return 'Alemanha';
    if (norm === 'Paraguay') return 'Paraguai';
    if (norm === 'Switzerland') return 'Suíça';
    if (norm === 'Argentina') return 'Argentina';
    if (norm === 'Cape Verde') return 'Cabo Verde';
    if (norm === 'Australia') return 'Austrália';
    if (norm === 'Egypt') return 'Egito';
    if (norm === 'France') return 'França';
    if (norm === 'United States') return 'EUA';
    if (norm === 'Bosnia and Herzegovina') return 'Bósnia e Herzegovina';
    if (norm === 'Belgium') return 'Bélgica';
    if (norm === 'Iran') return 'Irã';
    if (norm === 'Spain') return 'Espanha';
    if (norm === 'Saudi Arabia') return 'Arábia Saudita';
    if (norm === 'Uruguay') return 'Uruguai';
    if (norm === 'Jordan') return 'Jordânia';
    if (norm === 'Algeria') return 'Argélia';
    if (norm === 'Austria') return 'Áustria';
    if (norm === 'Portugal') return 'Portugal';
    if (norm === 'Uzbekistan') return 'Uzbequistão';
    if (norm === 'Colombia') return 'Colômbia';
    if (norm === 'Democratic Republic of the Congo') return 'RD do Congo';
    if (norm === 'Panama') return 'Panamá';
    if (norm === 'Croatia') return 'Croácia';
    if (norm === 'Ghana') return 'Gana';
    if (norm === 'New Zealand') return 'Nova Zelândia';
    if (norm === 'Morocco') return 'Marrocos';
    if (norm === 'Haiti') return 'Haiti';
    if (norm === 'Scotland') return 'Escócia';
    if (norm === 'Mexico') return 'México';
    if (norm === 'South Korea') return 'Coreia do Sul';
    if (norm === 'Czech Republic') return 'República Tcheca';
    if (norm === 'Tunisia') return 'Tunísia';
    if (norm === 'Iraq') return 'Iraque';
    if (norm === 'Norway') return 'Noruega';
    if (norm === 'Senegal') return 'Senegal';
    if (norm === 'Curaçao') return 'Curaçao';
    if (norm === 'Ivory Coast') return 'Costa do Marfim';
    if (norm === 'Ecuador') return 'Equador';
    if (norm === 'Sweden') return 'Suécia';
    if (norm === 'Turkey') return 'Turquia';
    return teamId;
  };

  const isFinalistsLocked = new Date() >= new Date('2026-06-28T19:00:00Z');

  React.useEffect(() => {
    if (!currentUser) return;
    const fetchFinalist = async () => {
      setLoadingFinalists(true);
      try {
        const res = await fetch('/api/finalists');
        if (res.ok) {
          const data = await res.json();
          const userPred = data.find((p: any) => p.user_id === currentUser.id);
          if (userPred) {
            setFinalistPrediction({
              campeao_team_id: userPred.campeao_team_id,
              vice_team_id: userPred.vice_team_id
            });
            setSelCampeao(getPortugueseNameFromTeamId(userPred.campeao_team_id));
            setSelVice(getPortugueseNameFromTeamId(userPred.vice_team_id));
          } else {
            const hasSeen = sessionStorage.getItem('gebolao_finalists_popup_seen');
            if (!hasSeen && !isFinalistsLocked) {
              setShowFinalistsPopup(true);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFinalists(false);
      }
    };
    fetchFinalist();
  }, [currentUser]);

  const handleSaveFinalists = async () => {
    if (!currentUser || !selCampeao || !selVice) return;
    setSavingFinalists(true);
    setFinalistsError(null);
    setFinalistsSuccess(false);
    try {
      const res = await fetch('/api/finalists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          campeao_team_id: getTeamIdFromPortugueseName(selCampeao),
          vice_team_id: getTeamIdFromPortugueseName(selVice)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar aposta bônus.');
      }

      setFinalistPrediction({
        campeao_team_id: getTeamIdFromPortugueseName(selCampeao),
        vice_team_id: getTeamIdFromPortugueseName(selVice)
      });
      setFinalistsSuccess(true);
    } catch (err: any) {
      setFinalistsError(err.message || 'Falha ao salvar.');
    } finally {
      setSavingFinalists(false);
    }
  };


  const toggleCollapseDay = (dateLabel: string, defaultCollapsed: boolean) => {
    setCollapsedDays((prev) => {
      const isCollapsedNow = prev[dateLabel] !== undefined ? prev[dateLabel] : defaultCollapsed;
      return {
        ...prev,
        [dateLabel]: !isCollapsedNow
      };
    });
  };

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
      minute: '2-digit'
    });
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
    const userPred = predictions.find((p) => p.user_id === currentUser.id && p.match_id === matchId);

    const casaStr = matchInput?.casa !== undefined ? matchInput.casa : (userPred ? String(userPred.gols_casa) : '');
    const foraStr = matchInput?.fora !== undefined ? matchInput.fora : (userPred ? String(userPred.gols_fora) : '');

    if (casaStr === '' || foraStr === '') {
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
      const golsCasa = parseInt(casaStr, 10);
      const golsFora = parseInt(foraStr, 10);

      await onSavePrediction(matchId, golsCasa, golsFora);

      // Clear local input override so it falls back to the updated prediction state
      setInputs((prev) => {
        const c = { ...prev };
        delete c[matchId];
        return c;
      });

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

  const renderMatchCard = (match: Match) => {
    const isLocked = isMatchLocked(match);
    const matchPreds = predictions.filter((p) => p.match_id === match.id);
    const missingCount = Math.max(0, users.length - matchPreds.length);

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

    const isCompleted = match.status === 'completed';
    const isPassed = isLocked || isCompleted;
    const isMinimized = minimizePassedMatches && isPassed && !expandedPassedMatches[match.id];

    if (isMinimized) {
      return (
        <div
          key={match.id}
          onClick={() => {
            setExpandedPassedMatches((prev) => ({ ...prev, [match.id]: true }));
          }}
          className={`lg:col-span-2 bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between shadow-sm hover:border-slate-350 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ${
            isCompleted ? 'border-l-4 border-l-green-700' : 'border-l-4 border-l-slate-400'
          }`}
        >
          {/* Left Part: Phase & Teams */}
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
            <span className="text-[9px] text-green-700 font-black uppercase tracking-widest italic bg-green-50 px-2 py-0.5 rounded border border-green-150 shrink-0">
              {match.fase}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl filter drop-shadow-sm select-none shrink-0" role="img" aria-label={match.time_casa}>
                {match.bandeira_casa}
              </span>
              <span className="font-black text-xs text-slate-800 truncate uppercase italic tracking-wide max-w-[80px] sm:max-w-[120px]">
                {match.time_casa}
              </span>
              
              {isCompleted ? (
                <span className="bg-slate-100 font-black text-xs text-green-700 px-2 py-0.5 rounded-lg border border-slate-200 min-w-[45px] text-center shrink-0">
                  {match.gols_casa} x {match.gols_fora}
                </span>
              ) : (
                <span className="font-black text-green-700 text-xs px-1 shrink-0">x</span>
              )}
              
              <span className="font-black text-xs text-slate-800 truncate uppercase italic tracking-wide max-w-[80px] sm:max-w-[120px]">
                {match.time_fora}
              </span>
              <span className="text-2xl filter drop-shadow-sm select-none shrink-0" role="img" aria-label={match.time_fora}>
                {match.bandeira_fora}
              </span>
            </div>
          </div>

          {/* Right Part: Prediction Summary / Points / Chevron */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Prediction Label */}
            <div className="text-right hidden sm:block">
              {userPred ? (
                <span className="text-[10px] text-slate-500 font-semibold">
                  Seu palpite: <strong className="font-extrabold text-slate-700">{userPred.gols_casa} x {userPred.gols_fora}</strong>
                </span>
              ) : (
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider italic">Sem palpite</span>
              )}
            </div>

            {/* Points Category */}
            {isCompleted && userPred && (
              <div className="shrink-0 scale-90 sm:scale-100">
                {pointsCategory === 'exato' && (
                  <span className="bg-amber-400 text-green-950 font-black px-2 py-0.5 rounded-lg text-[9px] uppercase italic tracking-wider shadow-xs">
                    +10 pts
                  </span>
                )}
                {pointsCategory === 'resultado' && (
                  <span className="bg-green-700 text-white font-black px-2 py-0.5 rounded-lg text-[9px] uppercase italic tracking-wider shadow-xs">
                    +5 pts
                  </span>
                )}
                {pointsCategory === 'gols_um_time' && (
                  <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded-lg text-[9px] uppercase italic tracking-wider shadow-xs">
                    +2 pts
                  </span>
                )}
                {pointsCategory === 'erro' && (
                  <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase italic tracking-wider">
                    0 pts
                  </span>
                )}
              </div>
            )}

            {/* Chevron down to indicate expansion is possible */}
            <div className="text-slate-400 hover:text-green-700 transition flex items-center justify-center p-1 rounded-lg hover:bg-slate-100">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      );
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
          <div className="absolute top-0 right-0 bg-slate-100 text-slate-655 border-l border-b border-slate-200 font-extrabold px-3 py-1.5 text-[9px] uppercase tracking-wider rounded-bl-xl flex items-center gap-1 italic">
            <Lock size={10} />
            <span>Em Jogo</span>
          </div>
        )}

        {/* Match Header meta info */}
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-green-700 font-black uppercase tracking-widest italic bg-green-50 px-2.5 py-0.5 rounded border border-green-150">
              {match.fase}
            </span>
            {currentUser?.isAdmin && match.status === 'unplayed' && (
              <>
                {missingCount > 0 ? (
                  <span className="text-[9px] bg-amber-500/10 text-amber-700 border border-amber-500/20 font-black px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                    <span>⚠️ Faltam {missingCount} {missingCount === 1 ? 'palpite' : 'palpites'}</span>
                  </span>
                ) : (
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-black px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                    <span>✅ 100% palpitado</span>
                  </span>
                )}
              </>
            )}
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
              <span className="text-slate-400 text-[9px] italic">Faça login para palpitar</span>
            )}
          </div>

          {/* Right Area (Points awarded badge or palpite submit button) */}
          <div className="shrink-0 flex items-center gap-2">
            {isPassed && minimizePassedMatches && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedPassedMatches((prev) => ({ ...prev, [match.id]: false }));
                }}
                className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-655 hover:text-slate-800 text-[10px] px-2.5 py-1.5 font-extrabold uppercase italic tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-slate-200"
              >
                <ChevronUp size={11} />
                <span>Minimizar</span>
              </button>
            )}

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
  };

  // --- FILTER & SORT MATCHES ---
  let filteredMatches = worldCupMatches.filter((m) => {
    if (mainTab === 'todos') return true;
    if (viewMode === 'cronologico') {
      const isGroup = groupPhases.includes(m.fase);
      return mainTab === 'grupos' ? isGroup : !isGroup;
    }
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

  // Sort matches
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (viewMode === 'grupos' && mainTab === 'todos') {
      const orderA = phaseOrder[a.fase.toLowerCase()] || 99;
      const orderB = phaseOrder[b.fase.toLowerCase()] || 99;
      if (orderA !== orderB) return orderA - orderB;
    }
    return new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
  });

  // Group sortedMatches by date (pt-BR locale) while preserving chronological order
  const matchesByDate: { dateLabel: string; matches: Match[] }[] = [];
  sortedMatches.forEach((match) => {
    const date = new Date(match.data_hora);
    const dateLabel = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    // Capitalize first letter
    const capitalizedLabel = dateLabel ? dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1) : '';
    
    const existingGroup = matchesByDate.find(g => g.dateLabel === capitalizedLabel);
    if (existingGroup) {
      existingGroup.matches.push(match);
    } else {
      matchesByDate.push({ dateLabel: capitalizedLabel, matches: [match] });
    }
  });

  return (
    <div className="space-y-6">
      {/* Banner explaining rules if logged out */}
      {!currentUser && (
        <div className="bg-amber-400/10 border border-amber-300 rounded-xl p-4 flex gap-3 text-slate-900 shadow-sm animate-in fade-in duration-300">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="text-xs">
            <span className="font-black text-green-950 block mb-0.5 uppercase italic">Visão de Visitante (Desconectado)</span>
            Você está visualizando a tabela de jogos disponível na Copa. Para registrar palpites, acompanhar seus pontos e obter conquistas customizadas, use o botão "Entrar / Cadastrar" no topo para entrar na sua conta!
          </div>
        </div>
      )}

      {/* Aposta Bônus dos Finalistas */}
      {currentUser && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-900/50 rounded-2xl p-5 text-slate-100 shadow-md animate-in fade-in duration-300 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase tracking-tight text-white flex items-center gap-1.5">
                Aposta Bônus: Campeão e Vice
                {isFinalistsLocked && <span className="bg-red-500/10 text-red-400 border border-red-900/40 text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1"><Lock size={8}/> Bloqueado</span>}
              </h3>
              <p className="text-[11px] text-slate-400">
                Escolha quem vencerá a grande final! +10 pontos se acertar o Campeão, +5 pontos para o Vice.
              </p>
            </div>
          </div>

          {finalistsError && (
            <div className="bg-red-950/20 border border-red-900/40 text-red-400 text-xs px-3 py-2 rounded-lg">
              {finalistsError}
            </div>
          )}

          {finalistsSuccess && (
            <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs px-3 py-2 rounded-lg">
              Palpite de finalistas salvo com sucesso!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Campeão Select */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">Campeão (+10 pts)</label>
              <div className="relative">
                <select
                  disabled={isFinalistsLocked || savingFinalists}
                  value={selCampeao}
                  onChange={(e) => {
                    const newChamp = e.target.value;
                    setSelCampeao(newChamp);
                    
                    // Reset vice if it is on the same side as the new champion
                    if (newChamp) {
                      const champSide = getTeamSide(newChamp);
                      const viceSide = getTeamSide(selVice);
                      if (newChamp === selVice || (champSide && viceSide && champSide === viceSide)) {
                        setSelVice('');
                      }
                    }
                    
                    setFinalistsSuccess(false);
                    setFinalistsError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-3 pr-9 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-60 appearance-none"
                >
                  <option value="">Selecione o Campeão...</option>
                  {teamsList
                    .filter((t) => {
                      const isReal = t && !t.startsWith('Time ') && !t.startsWith('Vencedor ') && !t.startsWith('2º ') && !t.startsWith('3º ') && !t.startsWith('Perdedor ');
                      if (!isReal) return false;
                      if (selVice) {
                        const viceSide = getTeamSide(selVice);
                        const currentSide = getTeamSide(t);
                        if (viceSide && currentSide && viceSide === currentSide) return false;
                      }
                      return true;
                    })
                    .map((t) => (
                      <option key={t} value={t}>
                        {teamFlags[t]} {t}
                      </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Vice Select */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">Vice-Campeão (+5 pts)</label>
              <div className="relative">
                <select
                  disabled={isFinalistsLocked || savingFinalists}
                  value={selVice}
                  onChange={(e) => {
                    const newVice = e.target.value;
                    setSelVice(newVice);
                    
                    // Reset champion if it is on the same side as the new vice
                    if (newVice) {
                      const viceSide = getTeamSide(newVice);
                      const champSide = getTeamSide(selCampeao);
                      if (newVice === selCampeao || (viceSide && champSide && viceSide === champSide)) {
                        setSelCampeao('');
                      }
                    }
                    
                    setFinalistsSuccess(false);
                    setFinalistsError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-3 pr-9 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-60 appearance-none"
                >
                  <option value="">Selecione o Vice-Campeão...</option>
                  {teamsList
                    .filter((t) => {
                      const isReal = t && !t.startsWith('Time ') && !t.startsWith('Vencedor ') && !t.startsWith('2º ') && !t.startsWith('3º ') && !t.startsWith('Perdedor ');
                      if (!isReal) return false;
                      if (selCampeao) {
                        const champSide = getTeamSide(selCampeao);
                        const currentSide = getTeamSide(t);
                        if (champSide && currentSide && champSide === currentSide) return false;
                      }
                      return true;
                    })
                    .map((t) => (
                      <option key={t} value={t} disabled={t === selCampeao}>
                        {teamFlags[t]} {t}
                      </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>

          {!isFinalistsLocked && (
            <div className="flex justify-between items-center pt-2 border-t border-slate-800/40 flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg text-[10px] font-bold">
                <Calendar className="shrink-0" size={12} />
                <span>Prazo Limite: 28/06/2026 às 16:00 (Brasília) — Antes do Mata-mata</span>
              </div>
              <button
                onClick={handleSaveFinalists}
                disabled={savingFinalists || !selCampeao || !selVice}
                className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition duration-150 cursor-pointer shadow-sm active:scale-[0.98] flex items-center text-center self-end"
              >
                {savingFinalists ? 'Salvando...' : 'Salvar Aposta Bônus'}
              </button>
            </div>
          )}
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

      {/* --- VIEW MODE SELECTOR (Grupos vs Cronológico) --- */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1.5 italic">
          Organizar partidas por:
        </span>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setViewMode('cronologico')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'cronologico'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📅 Ordem Cronológica (Dias)</span>
          </button>
          <button
            onClick={() => setViewMode('grupos')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'grupos'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📂 Fases & Grupos</span>
          </button>
        </div>
      </div>

      {/* --- LEVEL 2 TABS (Sub-categories based on Level 1) --- */}
      {mainTab !== 'todos' && viewMode === 'grupos' && (
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

        {/* Toggles Container */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
          {/* Minimize passed matches toggle */}
          <label className="relative flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={minimizePassedMatches}
              onChange={(e) => setMinimizePassedMatches(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-700"></div>
            <span className="text-xs font-extrabold text-slate-600 uppercase italic tracking-wide flex items-center gap-1.5">
              <Filter size={13} className="text-slate-400" />
              <span>Minimizar Jogos Passados</span>
            </span>
          </label>

          {currentUser && (
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
          )}
        </div>
      </div>

      {/* --- MATCHES GRID --- */}
      {viewMode === 'cronologico' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {matchesByDate.map((group) => {
            const allCompleted = group.matches.every((m) => m.status === 'completed');
            const allLocked = group.matches.every(isMatchLocked);
            const defaultCollapsed = allCompleted;
            const isCollapsed = collapsedDays[group.dateLabel] !== undefined
              ? collapsedDays[group.dateLabel]
              : defaultCollapsed;

            return (
              <div key={group.dateLabel} className="space-y-4">
                <div
                  onClick={() => toggleCollapseDay(group.dateLabel, defaultCollapsed)}
                  className="flex items-center justify-between border-b border-slate-200 pb-2 cursor-pointer hover:bg-slate-100/50 transition px-2 rounded-lg group/day select-none"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className={allCompleted ? 'text-slate-400' : 'text-green-700'} size={16} />
                    <h3 className={`font-extrabold text-sm uppercase italic tracking-wider ${allCompleted ? 'text-slate-500 font-bold' : 'text-slate-800'}`}>
                      {group.dateLabel}
                    </h3>
                    {allCompleted && (
                      <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 italic">
                        <Lock size={9} /> Finalizado
                      </span>
                    )}
                    {!allCompleted && allLocked && (
                      <span className="text-[9px] bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1 italic animate-pulse">
                        <Lock size={9} /> Em Jogo
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${allCompleted ? 'bg-slate-200 text-slate-600' : 'bg-green-100 text-green-800'}`}>
                      {group.matches.length} {group.matches.length === 1 ? 'jogo' : 'jogos'}
                    </span>
                  </div>
                  <div className="text-slate-400 group-hover/day:text-green-700 transition flex items-center gap-1 text-[10px] font-black uppercase tracking-wider italic">
                    <span>{isCollapsed ? 'Mostrar jogos' : 'Esconder'}</span>
                    {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-1 duration-200">
                    {group.matches.map((match) => renderMatchCard(match))}
                  </div>
                )}
              </div>
            );
          })}
          {sortedMatches.length === 0 && (
            <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center flex flex-col items-center justify-center shadow-sm">
              <AlertCircle className="text-slate-400 mb-3" size={32} />
              <h4 className="font-extrabold text-sm text-slate-800 uppercase italic tracking-wide">Nenhum jogo encontrado</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Não existem jogos que atendam aos filtros selecionados (busca, pendências ou fase ativa) neste momento.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {sortedMatches.map((match) => renderMatchCard(match))}
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
      )}

      {showFinalistsPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[110] backdrop-blur-xs">
          <div className="bg-slate-900 border border-indigo-900 p-6 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 text-slate-100 font-sans space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Trophy size={24} />
              </div>
              <div>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded inline-block mb-1">Novo Recurso</span>
                <h3 className="font-display font-black text-sm uppercase tracking-tight text-white">Aposta Bônus dos Finalistas!</h3>
              </div>
            </div>

            <p className="text-xs text-slate-350 leading-relaxed">
              Antes que o mata-mata comece, você deve definir quem será o **Campeão** (+10 pontos) e o **Vice-Campeão** (+5 pontos) da Copa!
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl flex items-start gap-2.5 text-[11px] leading-relaxed">
              <AlertCircle className="shrink-0 mt-0.5" size={14} />
              <div>
                <span className="font-bold block">Prazo Limite:</span>
                28/06/2026 às 16:00 (Horário de Brasília) — Início do mata-mata.
                <span className="block mt-1 font-bold text-amber-500">Depois desse prazo, o palpite não estará mais disponível!</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic leading-relaxed">
              Dica: Este formulário está localizado no topo da aba **"Palpites"** (Dar Palpite) quando você fechar este aviso.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  sessionStorage.setItem('gebolao_finalists_popup_seen', 'true');
                  setShowFinalistsPopup(false);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
              >
                Preencher Depois
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem('gebolao_finalists_popup_seen', 'true');
                  setShowFinalistsPopup(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer text-center shadow-md"
              >
                Palpitar Agora!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
