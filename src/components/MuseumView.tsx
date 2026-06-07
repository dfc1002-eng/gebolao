import React, { useState } from 'react';
import { User, Badge, UserBadge, RoundScore, Match } from '../types';
import { Trophy, Frown } from 'lucide-react';

interface MuseumViewProps {
  users: User[];
  badges: Badge[];
  userBadges: UserBadge[];
  roundScores: RoundScore[];
  matches: Match[];
}

export function MuseumView({
  users,
  badges,
  userBadges,
  roundScores,
  matches
}: MuseumViewProps) {
  const [activeTab, setActiveTab] = useState<'destaques' | 'fama' | 'gebiadas'>('destaques');
  const [selectedRound, setSelectedRound] = useState<string>('Rodada 2'); // default to completed round

  const rounds = Array.from(new Set(matches.map((m) => m.fase)));

  // Helper getters
  const getUser = (id: string) => users.find((u) => u.id === id);
  const getBadge = (badgeId: string) => badges.find((b) => b.id === badgeId);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // --- 1. DESTAQUES DA RODADA AUTOMATION ---
  // Returns user who received a specific badge type in a specific round
  const getUserByRoundBadge = (badgeType: string, roundName: string) => {
    const badge = badges.find((b) => b.tipo === badgeType);
    if (!badge) return null;

    const ub = userBadges.find((u) => u.badge_id === badge.id && u.rodada === roundName);
    return ub ? getUser(ub.user_id) : null;
  };

  // --- 2. HALL DA FAMA CALCULATIONS ---
  // A. Count of times receiving Chiquinho Expert badge
  const getTopChiquinhoCount = () => {
    const counts: { [uid: string]: number } = {};
    users.forEach((u) => (counts[u.id] = 0));

    userBadges
      .filter((ub) => ub.badge_id === 'badge-chiquinho')
      .forEach((ub) => {
        counts[ub.user_id] = (counts[ub.user_id] || 0) + 1;
      });

    return Object.entries(counts)
      .map(([id, val]) => ({ user: getUser(id), count: val }))
      .sort((a, b) => b.count - a.count)
      .filter((item) => item.count > 0);
  };

  // B. Count of times receiving Olho de Águia (most exact placers)
  const getTopEagleCount = () => {
    const counts: { [uid: string]: number } = {};
    users.forEach((u) => (counts[u.id] = 0));

    userBadges
      .filter((ub) => ub.badge_id === 'badge-aguia')
      .forEach((ub) => {
        counts[ub.user_id] = (counts[ub.user_id] || 0) + 1;
      });

    return Object.entries(counts)
      .map(([id, val]) => ({ user: getUser(id), count: val }))
      .sort((a, b) => b.count - a.count)
      .filter((item) => item.count > 0);
  };

  // C. Max score in a single round in history
  const getHistoricalMaxRoundScore = () => {
    return [...roundScores].sort((a, b) => b.pontos - a.pontos).slice(0, 3);
  };

  // --- 3. MUSEU DAS GEBIADAS (Comedy Section) ---
  // A. Count of times worst (Gebiada da rodada)
  const getClownCount = () => {
    const counts: { [uid: string]: number } = {};
    users.forEach((u) => (counts[u.id] = 0));

    userBadges
      .filter((ub) => ub.badge_id === 'badge-gebiada')
      .forEach((ub) => {
        counts[ub.user_id] = (counts[ub.user_id] || 0) + 1;
      });

    return Object.entries(counts)
      .map(([id, val]) => ({ user: getUser(id), count: val }))
      .sort((a, b) => b.count - a.count)
      .filter((item) => item.count > 0);
  };

  // B. Count of times asleep (Geb, o virgem)
  const getAsleepCount = () => {
    const counts: { [uid: string]: number } = {};
    users.forEach((u) => (counts[u.id] = 0));

    userBadges
      .filter((ub) => ub.badge_id === 'badge-virgem')
      .forEach((ub) => {
        counts[ub.user_id] = (counts[ub.user_id] || 0) + 1;
      });

    return Object.entries(counts)
      .map(([id, val]) => ({ user: getUser(id), count: val }))
      .sort((a, b) => b.count - a.count)
      .filter((item) => item.count > 0);
  };

  return (
    <div className="space-y-6">
      {/* Visual Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-lg overflow-hidden border">
        <button
          onClick={() => setActiveTab('destaques')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer ${
            activeTab === 'destaques'
              ? 'border-b-2 border-green-700 text-green-700 bg-slate-50'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          🏆 Selos Semanais
        </button>
        <button
          onClick={() => setActiveTab('fama')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer ${
            activeTab === 'fama'
              ? 'border-b-2 border-amber-500 text-amber-600 bg-slate-50'
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          🐐 Hall da Fama
        </button>
        <button
          onClick={() => setActiveTab('gebiadas')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer ${
            activeTab === 'gebiadas'
              ? 'border-b-2 border-red-600 text-red-605 text-red-600 bg-slate-50'
              : 'border-b-2 border-transparent text-slate-500 hover:text-red-550 hover:bg-slate-50'
          }`}
        >
          🤡 Museu das Gebiadas
        </button>
      </div>

      {/* --- TAB CONTENT 1: DESTAQUES DA RODADA --- */}
      {activeTab === 'destaques' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-slate-900 font-display font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Trophy size={18} className="text-green-700" />
                <span>Prêmios e Decepções Semanais</span>
              </h2>
              <p className="text-xs text-slate-505 text-slate-500 font-medium">Verifique os premiados e as principais presepadas de cada rodada finalizada</p>
            </div>
            {/* Round Filter */}
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="bg-white text-slate-800 text-xs border border-slate-200 p-2 rounded-lg outline-none cursor-pointer focus:border-green-700 font-extrabold uppercase italic tracking-wider shadow-2xs"
            >
              {rounds.map((rd) => (
                <option key={rd} value={rd}>
                  {rd}
                </option>
              ))}
            </select>
          </div>

          {/* Grid of highlight cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 font-display">
            {/* Chiquinho, Sou Teu Fã */}
            <div className="bg-amber-50/60 border border-amber-300 p-5 rounded-2xl flex flex-col justify-between items-center text-center shadow-xs relative overflow-hidden group hover:border-amber-400 transition duration-200">
              <span className="absolute top-2 left-2 text-[8px] uppercase font-black text-amber-850 bg-amber-200 px-1.5 py-0.5 rounded tracking-widest italic shadow-3xs">DESTAQUE</span>
              <div className="text-4xl mb-2 select-none">🏆</div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Chiquinho, Sou Teu Fã</h3>
              <p className="text-[10px] text-slate-500 leading-normal px-2 mb-4 font-medium">
                Melhor da rodada! Liderou isolado com o maior número de palpites corretos e precisão cirúrgica.
              </p>
              {getUserByRoundBadge('chiquinho', selectedRound) ? (
                <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-amber-200 w-full animate-in fade-in duration-300 shadow-3xs">
                  <div className="w-10 h-10 rounded-full border-2 border-amber-400 mb-1 shadow-3xs flex items-center justify-center font-display font-black text-amber-700 bg-amber-50 uppercase text-[11px] select-none">
                    {getInitials(getUserByRoundBadge('chiquinho', selectedRound)?.nome || '')}
                  </div>
                  <span className="font-extrabold text-xs text-amber-700 uppercase italic tracking-wide">{getUserByRoundBadge('chiquinho', selectedRound)?.nome}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-bold">
                    Pontos na rodada: {roundScores.find((s) => s.user_id === getUserByRoundBadge('chiquinho', selectedRound)?.id && s.rodada === selectedRound)?.pontos} pts
                  </span>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-xl border border-slate-200 w-full text-slate-400 italic text-xs font-semibold">
                  Sem dados ou pendente
                </div>
              )}
            </div>

            {/* Pai Geb */}
            <div className="bg-slate-50/75 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between items-center text-center shadow-xs relative group hover:border-slate-350 transition duration-200">
              <span className="absolute top-2 left-2 text-[8px] uppercase font-black text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded tracking-widest italic">QUASE LÁ</span>
              <div className="text-4xl mb-2 select-none">🥈</div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Pai Geb</h3>
              <p className="text-[10px] text-slate-500 leading-normal px-2 mb-4 font-medium">
                Errou o placar por 1 gol, ou previu o vencedor correto acumulando o maior número de quase-erros.
              </p>
              {getUserByRoundBadge('fabio', selectedRound) ? (
                <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-slate-200 w-full shadow-3xs">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-400 mb-1 shadow-3xs flex items-center justify-center font-display font-black text-slate-700 bg-slate-50 uppercase text-[11px] select-none">
                    {getInitials(getUserByRoundBadge('fabio', selectedRound)?.nome || '')}
                  </div>
                  <span className="font-extrabold text-xs text-slate-800 uppercase italic tracking-wide">{getUserByRoundBadge('fabio', selectedRound)?.nome}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-bold">Mestre do "Quase-Gol"</span>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-xl border border-slate-200 w-full text-slate-400 italic text-xs font-semibold">
                  Sem dados ou pendente
                </div>
              )}
            </div>

            {/* O Amigo do Primo da Jana */}
            <div className="bg-green-50/30 border border-green-200 p-5 rounded-2xl flex flex-col justify-between items-center text-center shadow-xs relative group hover:border-green-300 transition duration-200">
              <span className="absolute top-2 left-2 text-[8px] uppercase font-black text-green-800 bg-green-100 px-1.5 py-0.5 rounded tracking-widest italic shadow-3xs">PRECISÃO</span>
              <div className="text-4xl mb-2 select-none">🎯</div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">O Amigo do Primo da Jana</h3>
              <p className="text-[10px] text-slate-500 leading-normal px-2 mb-4 font-medium">
                Lenda que acertou o maior número de placares exatos (gols casa e fora exatos) na rodada inteira.
              </p>
              {getUserByRoundBadge('aguia', selectedRound) ? (
                <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-green-200 w-full shadow-3xs">
                  <div className="w-10 h-10 rounded-full border-2 border-green-600 mb-1 shadow-3xs flex items-center justify-center font-display font-black text-green-700 bg-green-50 uppercase text-[11px] select-none">
                    {getInitials(getUserByRoundBadge('aguia', selectedRound)?.nome || '')}
                  </div>
                  <span className="font-extrabold text-xs text-green-700 uppercase italic tracking-wide">{getUserByRoundBadge('aguia', selectedRound)?.nome}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                    Exatos: {roundScores.find((s) => s.user_id === getUserByRoundBadge('aguia', selectedRound)?.id && s.rodada === selectedRound)?.exato_qtd} placares!
                  </span>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-xl border border-slate-200 w-full text-slate-400 italic text-xs font-semibold">
                  Sem dados ou pendente
                </div>
              )}
            </div>

            {/* Gebiada da Rodada */}
            <div className="bg-red-50/50 border border-red-200 p-5 rounded-2xl flex flex-col justify-between items-center text-center shadow-xs relative group hover:border-red-350 transition duration-200">
              <span className="absolute top-2 left-2 text-[8px] uppercase font-black text-red-700 bg-red-100 px-1.5 py-0.5 rounded tracking-widest italic shadow-3xs">PÉ FRIO</span>
              <div className="text-4xl mb-2 select-none">🤡</div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Gebiada da Rodada</h3>
              <p className="text-[10px] text-slate-500 leading-normal px-2 mb-4 font-medium">
                Pior palpiteiro ativo da rodada! Consegui a menor pontuação marcando quase nenhum gol.
              </p>
              {getUserByRoundBadge('gebiada', selectedRound) ? (
                <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-red-200 w-full shadow-3xs">
                  <div className="w-10 h-10 rounded-full border-2 border-red-400 mb-1 shadow-3xs flex items-center justify-center font-display font-black text-red-700 bg-red-50 uppercase text-[11px] select-none">
                    {getInitials(getUserByRoundBadge('gebiada', selectedRound)?.nome || '')}
                  </div>
                  <span className="font-extrabold text-xs text-red-600 uppercase italic tracking-wide">{getUserByRoundBadge('gebiada', selectedRound)?.nome}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                    Mágicos {roundScores.find((s) => s.user_id === getUserByRoundBadge('gebiada', selectedRound)?.id && s.rodada === selectedRound)?.pontos} pts!
                  </span>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-xl border border-slate-200 w-full text-slate-400 italic text-xs font-semibold">
                  Sem dados ou pendente
                </div>
              )}
            </div>

            {/* Geb, o virgem */}
            <div className="bg-purple-50/50 border border-purple-200 p-5 rounded-2xl flex flex-col justify-between items-center text-center shadow-xs relative group hover:border-purple-300 transition duration-200">
              <span className="absolute top-2 left-2 text-[8px] uppercase font-black text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded tracking-widest italic shadow-3xs">COCHILO</span>
              <div className="text-4xl mb-2 select-none">😴</div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Geb, o virgem</h3>
              <p className="text-[10px] text-slate-500 leading-normal px-2 mb-4 font-medium">
                Dormiu no ponto! Não realizou nenhum palpite na rodada inteira. Aplicação automática no sufoco.
              </p>
              {getUserByRoundBadge('virgem', selectedRound) ? (
                <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-purple-200 w-full shadow-3xs">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-500 mb-1 shadow-3xs flex items-center justify-center font-display font-black text-purple-700 bg-purple-50 uppercase text-[11px] select-none">
                    {getInitials(getUserByRoundBadge('virgem', selectedRound)?.nome || '')}
                  </div>
                  <span className="font-extrabold text-xs text-purple-600 uppercase italic tracking-wide">{getUserByRoundBadge('virgem', selectedRound)?.nome}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-semibold">Soneca profunda</span>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-xl border border-slate-200 w-full text-slate-400 italic text-xs font-semibold">
                  Ninguém dormiu nesta rodada!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 2: HALL DA FAMA (Glorioso) --- */}
      {activeTab === 'fama' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-slate-900 font-display font-black text-sm uppercase tracking-widest flex items-center gap-1.5">
              <Trophy size={18} className="text-amber-500" />
              <span>O Olimpo do GEBolão</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">Os momentos mais sublimes do bolão acumulados na eternidade dos campeonatos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 font-display">
            {/* Mais Vezes Chiquinho */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <span className="text-2xl select-none">🏆</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase italic tracking-wide">Mais Chiquinho, Fã Supremo</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Recordistas de maior pontuação na rodada</p>
                </div>
              </div>

              <div className="space-y-3">
                {getTopChiquinhoCount().map((item, idx) => (
                  <div key={item.user?.id} className="flex items-center justify-between bg-slate-50 border border-slate-150 p-2.5 rounded-lg shadow-3xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-amber-600 font-black italic">{idx + 1}º</span>
                      <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-display font-black text-slate-700 bg-slate-100 shadow-3xs uppercase text-[9px] select-none shrink-0">
                        {getInitials(item.user?.nome || '')}
                      </div>
                      <span className="text-xs font-black text-slate-800 uppercase italic tracking-wide">{item.user?.nome}</span>
                    </div>
                    <span className="bg-amber-400 text-green-950 font-black text-[10px] px-2.5 py-0.5 rounded border border-amber-500 uppercase italic">
                      {item.count} vezes
                    </span>
                  </div>
                ))}
                {getTopChiquinhoCount().length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4 font-semibold">Nenhum jogador faturou Chiquinho ainda</p>
                )}
              </div>
            </div>

            {/* Mais Vezes O Amigo do Primo da Jana */}
            <div className="bg-white border border-slate-205 border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <span className="text-2xl select-none">🎯</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase italic tracking-wide">Amigos do Primo da Jana</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Recordistas absolutos de placares exatos</p>
                </div>
              </div>

              <div className="space-y-3">
                {getTopEagleCount().map((item, idx) => (
                  <div key={item.user?.id} className="flex items-center justify-between bg-slate-50 border border-slate-150 p-2.5 rounded-lg shadow-3xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-green-700 font-black italic">{idx + 1}º</span>
                      <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-display font-black text-slate-700 bg-slate-100 shadow-3xs uppercase text-[9px] select-none shrink-0">
                        {getInitials(item.user?.nome || '')}
                      </div>
                      <span className="text-xs font-black text-slate-800 uppercase italic tracking-wide">{item.user?.nome}</span>
                    </div>
                    <span className="bg-green-700 text-white font-black text-[10px] px-2.5 py-0.5 rounded uppercase italic">
                      {item.count} vezes
                    </span>
                  </div>
                ))}
                {getTopEagleCount().length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4 font-semibold">Nenhum jogador faturou o Amigo do Primo da Jana ainda</p>
                )}
              </div>
            </div>

            {/* Recorde de Pontos Single Round */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <span className="text-2xl select-none">🔥</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase italic tracking-wide">Recordes Unitários</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Maior pontuação já feita em uma única rodada</p>
                </div>
              </div>

              <div className="space-y-3">
                {getHistoricalMaxRoundScore().map((score, idx) => (
                  <div key={score.id} className="flex items-center justify-between bg-slate-50 border border-slate-150 p-2.5 rounded-lg shadow-3xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-orange-600 font-black italic">{idx + 1}º</span>
                      <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-display font-black text-slate-700 bg-slate-100 shadow-3xs uppercase text-[9px] select-none shrink-0">
                        {getInitials(getUser(score.user_id)?.nome || '')}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase italic">{getUser(score.user_id)?.nome}</h4>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-tight block">{score.rodada}</span>
                      </div>
                    </div>
                    <span className="font-black text-xs text-green-700 uppercase italic animate-pulse">
                      {score.pontos} pts
                    </span>
                  </div>
                ))}
                {getHistoricalMaxRoundScore().length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4 font-semibold">Sem dados</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 3: MUSEU DAS GEBIADAS (Zoeira) --- */}
      {activeTab === 'gebiadas' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 text-slate-850 shadow-xs">
            <Frown className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div className="text-xs font-display font-medium">
              <span className="font-black block text-sm uppercase text-red-600 mb-0.5 italic">A Calçada da Vergonha! 🤡</span>
              Seja bem-vindo ao Museu das Gebiadas! Aqui arquivamos os tropeços mais vexatórios, os cochilos e as piores apostas do campeonato. Rir é o melhor remédio para quem botou 0x3 para Camarões contra o Japão.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-display">
            {/* Mais Gebiadas (Lanternas Semanais) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3.5 mb-4 border-b border-slate-100 pb-3">
                <span className="text-3xl select-none">🤡</span>
                <div>
                  <h3 className="font-black text-red-600 text-xs uppercase tracking-tight italic">Lendas do Pé Frio (Gebiadas)</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Quantas vezes o concorrente foi a decepção da rodada</p>
                </div>
              </div>

              <div className="space-y-3">
                {getClownCount().map((item, idx) => (
                  <div key={item.user?.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-lg shadow-3xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-red-505 text-red-500 font-black italic">#{idx + 1}</span>
                      <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-display font-black text-slate-700 bg-slate-100 shadow-3xs uppercase text-[9px] select-none shrink-0">
                        {getInitials(item.user?.nome || '')}
                      </div>
                      <span className="text-xs font-black text-slate-800 uppercase italic tracking-wide">{item.user?.nome}</span>
                    </div>
                    <span className="bg-red-100 border border-red-200 text-red-600 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded tracking-wide uppercase italic">
                      {item.count} vexames
                    </span>
                  </div>
                ))}
                {getClownCount().length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4 font-semibold">Até agora ninguém registrou gebiadas oficiais!</p>
                )}
              </div>
            </div>

            {/* Mais Geb, o virgem (Sonecas que esqueceram de palpitar) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3.5 mb-4 border-b border-slate-100 pb-3">
                <span className="text-3xl select-none">😴</span>
                <div>
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-tight italic">Campeões da Soneca (Geb, o virgem)</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Quantas vezes dormiu e não colocou nenhum palpite</p>
                </div>
              </div>

              <div className="space-y-3">
                {getAsleepCount().map((item, idx) => (
                  <div key={item.user?.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-lg shadow-3xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-slate-500 font-black italic">#{idx + 1}</span>
                      <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-display font-black text-slate-700 bg-slate-100 shadow-3xs uppercase text-[9px] select-none shrink-0">
                        {getInitials(item.user?.nome || '')}
                      </div>
                      <span className="text-xs font-black text-slate-800 uppercase italic tracking-wide">{item.user?.nome}</span>
                    </div>
                    <span className="bg-slate-205 bg-slate-200 text-slate-600 border border-slate-300 font-bold text-[10px] px-2.5 py-0.5 rounded tracking-wide uppercase italic">
                      {item.count} cochilos
                    </span>
                  </div>
                ))}
                {getAsleepCount().length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4 font-semibold">Incrível! Todo mundo votou até agora.</p>
                )}
              </div>
            </div>
          </div>

          {/* Funny banter card */}
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-center shadow-3xs">
            <span className="block text-sm uppercase font-black tracking-widest italic text-green-700 mb-1.5 animate-bounce">📢 CORNETA COLETIVA</span>
            <blockquote className="text-xs italic text-slate-600 leading-relaxed max-w-lg mx-auto font-bold">
              "O Geb é tão ruim que se ele der um palpite de que o sol de amanhã vai nascer no leste, é melhor a gente comprar lanternas extras."
            </blockquote>
            <span className="block text-[9px] text-slate-400 mt-2 font-mono uppercase tracking-widest">— Dito popular na rodada 1</span>
          </div>
        </div>
      )}
    </div>
  );
}
