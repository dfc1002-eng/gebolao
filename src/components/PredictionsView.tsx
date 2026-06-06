import React, { useState } from 'react';
import { User, Match, Prediction, MatchStatus } from '../types';
import { Calendar, MapPin, Check, Save, Lock, AlertCircle, HelpCircle, Trophy } from 'lucide-react';
import { calculatePredictionPoints } from '../initialData';

interface PredictionsViewProps {
  currentUser: User | null;
  matches: Match[];
  predictions: Prediction[];
  onSavePrediction: (matchId: string, golsCasa: number, golsFora: number) => Promise<void>;
  isLoading: boolean;
}

export function PredictionsView({
  currentUser,
  matches,
  predictions,
  onSavePrediction,
  isLoading
}: PredictionsViewProps) {
  const rounds = Array.from(new Set(matches.map((m) => m.fase)));
  const [selectedRound, setSelectedRound] = useState<string>(() => {
    return rounds.find((r) => r.toLowerCase().includes('copa') || r.toLowerCase().includes('grupo')) || rounds[0] || 'Rodada 3';
  });
  const [inputs, setInputs] = useState<{ [matchId: string]: { casa: string; fora: string } }>({});
  const [savingMatches, setSavingMatches] = useState<{ [matchId: string]: boolean }>({});
  const [feedback, setFeedback] = useState<{ [matchId: string]: { type: 'success' | 'error'; message: string } }>({});

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

  // Check if a match has started relative to the current mock time (June 6, 2026)
  const isMatchLocked = (match: Match) => {
    if (match.status === 'completed') return true;
    const matchTime = new Date(match.data_hora);
    const mockCurrentTime = new Date('2026-06-06T02:30:08Z'); // Use metadata simulated time
    return matchTime < mockCurrentTime;
  };

  // Handle local state edit
  const handleInputChange = (matchId: string, team: 'casa' | 'fora', val: string) => {
    // Only verify numbers
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

  // Filter matches based on the selected round
  const filteredMatches = matches.filter((m) => m.fase === selectedRound || selectedRound === 'Todos');

  return (
    <div className="space-y-6">
      {/* Banner explaining rules if logged out */}
      {!currentUser && (
        <div className="bg-amber-400/10 border border-amber-300 rounded-xl p-4 flex gap-3 text-slate-900 shadow-sm">
          <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="text-xs">
            <span className="font-black text-green-950 block mb-0.5 uppercase italic">Visão de Visitante (Desconectado)</span>
            Você está visualizando a tabela de jogos disponível na Copa. Para registrar palpites, acompanhar seus pontos e obter conquistas customizadas, selecione um competidor de simulação no topo nas opções "Simular Competidor" ou use o botão "Unir-se ao Grupo"!
          </div>
        </div>
      )}

      {/* Round filtering tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {rounds.map((rd) => (
          <button
            key={rd}
            onClick={() => setSelectedRound(rd)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer ${
              selectedRound === rd
                ? 'bg-green-700 text-white shadow'
                : 'bg-white border border-slate-205 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {rd}
          </button>
        ))}
        <button
          onClick={() => setSelectedRound('Todos')}
          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer ${
            selectedRound === 'Todos'
              ? 'bg-green-700 text-white shadow'
              : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Todos os Jogos
        </button>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMatches.map((match) => {
          const isLocked = isMatchLocked(match);

          // Find current user's prediction for this match
          let userPred = currentUser
            ? predictions.find((p) => p.user_id === currentUser.id && p.match_id === match.id)
            : null;

          // Sync default values for inputs from current prediction if not set yet
          const localVal = inputs[match.id];
          const displayGolsCasa = localVal?.casa !== undefined ? localVal.casa : (userPred ? String(userPred.gols_casa) : '');
          const displayGolsFora = localVal?.fora !== undefined ? localVal.fora : (userPred ? String(userPred.gols_fora) : '');

          // If match is finished, compute the points the user got
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
              className={`bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative group hover:border-slate-350 transition duration-200 overflow-hidden ${
                match.status === 'completed' ? 'opacity-95' : ''
              }`}
            >
              {/* Card Ribbon / Score Detail if completed */}
              {match.status === 'completed' && (
                <div className="absolute top-0 right-0 bg-green-700 text-white font-black px-3.5 py-1.5 text-[9px] uppercase tracking-widest rounded-bl-xl italic">
                  Resultado Oficial
                </div>
              )}
              {isLocked && match.status !== 'completed' && (
                <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 border-l border-b border-slate-200 font-extrabold px-3 py-1.5 text-[9px] uppercase tracking-wider rounded-bl-xl flex items-center gap-1 italic">
                  <Lock size={10} />
                  <span>Em Jogo</span>
                </div>
              )}

              {/* Match Header meta info */}
              <div className="flex flex-col gap-1 mb-3">
                <span className="text-[10px] text-green-700 font-black uppercase tracking-widest italic">{match.fase}</span>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <Calendar size={12} className="text-slate-400" />
                  <span>{formatDate(match.data_hora)}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 min-h-4">
                  <MapPin size={11} className="text-slate-400" />
                  <span className="truncate max-w-[200px]">{match.estadio}</span>
                </div>
              </div>

              {/* Core Match Predictor Layout */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center my-3.5 gap-2">
                {/* Home Team */}
                <div className="flex flex-col items-center flex-1 text-center">
                  <span className="text-2xl mb-1 filter drop-shadow-sm select-none" role="img" aria-label={match.time_casa}>
                    {match.bandeira_casa}
                  </span>
                  <span className="font-extrabold text-xs text-slate-900 truncate w-full max-w-[85px] uppercase italic tracking-wide">
                    {match.time_casa}
                  </span>
                </div>

                {/* Scores & Predict Inputs */}
                <div className="flex items-center gap-2 justify-center">
                  {/* Home Input / Score representation */}
                  {isLocked ? (
                    <div className="bg-slate-200 font-black text-sm text-slate-800 w-10 h-10 border border-slate-300 rounded-lg flex items-center justify-center">
                      {userPred ? userPred.gols_casa : '-'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled={!currentUser || isLoading}
                      value={displayGolsCasa}
                      onChange={(e) => handleInputChange(match.id, 'casa', e.target.value)}
                      placeholder="-"
                      className="bg-white font-black text-center text-sm text-slate-900 focus:border-green-750 focus:ring-1 focus:ring-green-700 w-10 h-10 border border-slate-350 rounded-lg outline-none"
                    />
                  )}

                  {/* VS Divider or Actual score multiplier */}
                  <div className="flex flex-col items-center justify-center px-1 text-xs">
                    {match.status === 'completed' ? (
                      <div className="flex flex-col items-center">
                        <span className="text-green-700 font-extrabold text-xs">
                          {match.gols_casa} x {match.gols_fora}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight block">Final</span>
                      </div>
                    ) : (
                      <span className="font-extrabold text-green-700">x</span>
                    )}
                  </div>

                  {/* Away Input / Score representation */}
                  {isLocked ? (
                    <div className="bg-slate-200 font-black text-sm text-slate-800 w-10 h-10 border border-slate-300 rounded-lg flex items-center justify-center">
                      {userPred ? userPred.gols_fora : '-'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled={!currentUser || isLoading}
                      value={displayGolsFora}
                      onChange={(e) => handleInputChange(match.id, 'fora', e.target.value)}
                      placeholder="-"
                      className="bg-white font-black text-center text-sm text-slate-900 focus:border-green-750 focus:ring-1 focus:ring-green-700 w-10 h-10 border border-slate-350 rounded-lg outline-none"
                    />
                  )}
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center flex-1 text-center">
                  <span className="text-2xl mb-1 filter drop-shadow-sm select-none" role="img" aria-label={match.time_fora}>
                    {match.bandeira_fora}
                  </span>
                  <span className="font-extrabold text-xs text-slate-900 truncate w-full max-w-[85px] uppercase italic tracking-wide">
                    {match.time_fora}
                  </span>
                </div>
              </div>

              {/* Bottom footer: user results or register actions */}
              <div className="mt-2 text-xs flex justify-between items-center bg-slate-50 border-t border-slate-100 p-3 rounded-lg">
                {/* Left Area (Feedback status or helper string) */}
                <div>
                  {feedback[match.id] ? (
                    <span
                      className={`text-[11px] font-black uppercase italic ${
                        feedback[match.id].type === 'success' ? 'text-green-700' : 'text-red-600'
                      }`}
                    >
                      {feedback[match.id].message}
                    </span>
                  ) : isLocked ? (
                    userPred ? (
                      <span className="text-slate-550 font-bold text-[10px]">Palpite salvo trancado</span>
                    ) : (
                      <span className="text-orange-650 text-[10px] font-extrabold flex items-center gap-1 bg-orange-100 px-2 py-0.5 rounded border border-orange-200 uppercase italic">
                        <Lock size={10} /> Soneca: Geb Virgem (+0)
                      </span>
                    )
                  ) : currentUser ? (
                    userPred ? (
                      <span className="text-green-700 font-extrabold text-[10px] uppercase italic">Seu palpite está registrado!</span>
                    ) : (
                      <span className="text-slate-500 text-[10px] italic font-medium">Ainda sem palpite registrado</span>
                    )
                  ) : (
                    <span className="text-slate-400 text-[10px] italic">Selecione simular ou junte-se</span>
                  )}
                </div>

                {/* Right Area (Points awarded badge or palpite submit button) */}
                <div>
                  {match.status === 'completed' && userPred ? (
                    <div className="flex items-center gap-1.5">
                      {pointsCategory === 'exato' && (
                        <div className="bg-amber-400 text-green-950 font-black px-2 py-1 rounded text-[10px] flex items-center gap-1 uppercase italic tracking-wide">
                          <Trophy size={11} />
                          <span>+10 pts (Exato)</span>
                        </div>
                      )}
                      {pointsCategory === 'resultado' && (
                        <div className="bg-green-750 bg-green-700 text-white font-black px-2 py-1 rounded text-[10px] flex items-center gap-1 uppercase italic tracking-wide">
                          <Check size={11} />
                          <span>+5 pts (Resultado)</span>
                        </div>
                      )}
                      {pointsCategory === 'gols_um_time' && (
                        <div className="bg-blue-600 text-white font-black px-2 py-1 rounded text-[10px] uppercase italic tracking-wide">
                          <span>+2 pts (Gols parcial)</span>
                        </div>
                      )}
                      {pointsCategory === 'erro' && (
                        <div className="bg-slate-100 text-slate-400 px-2 py-1 border border-slate-250 border-slate-200 rounded text-[10px] font-extrabold uppercase italic tracking-wider">
                          <span>0 pts (Errou tudo)</span>
                        </div>
                      )}
                    </div>
                  ) : !isLocked && currentUser ? (
                    <button
                      onClick={() => handlePredictSubmit(match.id)}
                      disabled={savingMatches[match.id] || isLoading}
                      className="bg-green-700 hover:bg-green-600 active:scale-95 text-white text-xs px-4 py-2 font-black uppercase italic tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 shadow-sm"
                    >
                      <Save size={12} />
                      <span>{savingMatches[match.id] ? 'Salvando...' : 'Palpitar'}</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
