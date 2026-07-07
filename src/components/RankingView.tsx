import React, { useState } from 'react';
import { User, Ranking, Badge, UserBadge, RoundScore, Match, Prediction } from '../types';
import { Award, Medal, Share2, Flame, Check, Info, TrendingUp, Sparkles, Smile } from 'lucide-react';
import { calculateGroupStandings } from '../utils/standings';

interface RankingViewProps {
  rankings: Ranking[];
  users: User[];
  badges: Badge[];
  userBadges: UserBadge[];
  roundScores: RoundScore[];
  matches: Match[];
  onSelectUser: (user: User | null) => void;
  predictions: Prediction[];
  currentUser: User | null;
}

export function RankingView({
  rankings,
  users,
  badges,
  userBadges,
  roundScores,
  matches,
  onSelectUser,
  predictions,
  currentUser
}: RankingViewProps) {
  const [copied, setCopied] = useState(false);
  const [focusedUser, setFocusedUser] = useState<User | null>(null);

  // Standings state controls
  const [rankingSubTab, setRankingSubTab] = useState<'bolao' | 'copa'>('bolao');
  const [standingsMode, setStandingsMode] = useState<'real' | 'simulated'>('real');
  const [selectedGroup, setSelectedGroup] = useState<string>('todos');

  // Helper: Retrieve user profile
  const getUser = (userId: string) => users.find((u) => u.id === userId);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Helper: Get user active badges
  const getUserBadgesList = (userId: string) => {
    const uBadges = userBadges.filter((ub) => ub.user_id === userId);
    // Unique badges by ID
    const uniqueBadgeIds = Array.from(new Set(uBadges.map((ub) => ub.badge_id)));
    return badges.filter((b) => uniqueBadgeIds.includes(b.id));
  };

  // Generate share message for Whatsapp
  const handleShareRanking = () => {
    let msg = `🏆 *CLASSIFICAÇÃO GEBOLÃO COPA 2026* 🏆\n\n`;
    rankings.slice(0, 10).forEach((rank, index) => {
      const u = getUser(rank.user_id);
      if (u) {
        let prefix = `${index + 1}º`;
        if (index === 0) prefix = '🥇 1º';
        else if (index === 1) prefix = '🥈 2º';
        else if (index === 2) prefix = '🥉 3º';

        msg += `${prefix} *${u.nome}* - ${rank.pontos_totais} pts (🎯 ${rank.exatos_totais} exatos)\n`;
      }
    });

    msg += `\nQuer cornetar? Acesse o painel e registre seus palpites! ⚽🔥`;

    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Detailed statistics calculations for focused user card
  const handleShowStats = (user: User) => {
    setFocusedUser(user);
  };

  const groupStandings = calculateGroupStandings(
    matches,
    predictions,
    currentUser?.id || null,
    standingsMode
  );

  return (
    <div className="space-y-6">
      {/* Dynamic Prize Pool Panel Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-green-700 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-600 animate-in fade-in duration-300">
        <div className="space-y-1">
          <span className="text-[10px] bg-emerald-500/30 border border-emerald-400/20 text-emerald-200 font-black px-2.5 py-1 rounded-md uppercase tracking-wider italic">
            🏆 Premiação Acumulada do Bolão
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-2 italic">
            {((users.length) * 50).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 md:min-w-[320px] bg-emerald-950/45 p-4 rounded-xl border border-emerald-900/50">
          <div className="text-center">
            <span className="block text-[10px] text-amber-400 font-black uppercase tracking-wider italic mb-1">🥇 1º Lugar</span>
            <span className="text-sm font-black text-white">
              {(((users.length) * 50) * 0.6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <span className="block text-[8px] text-emerald-200 font-bold uppercase mt-0.5">(60%)</span>
          </div>
          <div className="text-center border-l border-emerald-900/50 pl-2">
            <span className="block text-[10px] text-slate-300 font-black uppercase tracking-wider italic mb-1">🥈 2º Lugar</span>
            <span className="text-sm font-black text-white">
              {(((users.length) * 50) * 0.3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <span className="block text-[8px] text-emerald-200 font-bold uppercase mt-0.5">(30%)</span>
          </div>
          <div className="text-center border-l border-emerald-900/50 pl-2">
            <span className="block text-[10px] text-amber-500 font-black uppercase tracking-wider italic mb-1">🥉 3º Lugar</span>
            <span className="text-sm font-black text-white">
              {(((users.length) * 50) * 0.1).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <span className="block text-[8px] text-emerald-200 font-bold uppercase mt-0.5">(10%)</span>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl w-full">
        <button
          onClick={() => setRankingSubTab('bolao')}
          className={`flex-1 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            rankingSubTab === 'bolao'
              ? 'bg-white text-green-700 shadow-sm font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={14} />
          <span>Líderes do Bolão</span>
        </button>
        <button
          onClick={() => setRankingSubTab('copa')}
          className={`flex-1 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            rankingSubTab === 'copa'
              ? 'bg-white text-green-700 shadow-sm font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp size={14} />
          <span>Classificação da Copa</span>
        </button>
      </div>

      {rankingSubTab === 'bolao' && (
        <>
          {/* Top 3 Contenders - Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 2nd Place */}
            {rankings.length > 1 && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl order-2 md:order-1 text-center flex flex-col justify-between items-center shadow-sm relative overflow-hidden group hover:border-slate-350 transition-all">
                <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 font-extrabold px-3.5 py-1.5 rounded-bl-xl text-xs border-l border-b border-slate-200 uppercase tracking-wider italic">
                  2º Lugar
                </div>
                <div className="mb-3 flex flex-col items-center">
                  <div className="relative mb-2 mt-2">
                    <div className="w-16 h-16 rounded-full border-2 border-slate-350 flex items-center justify-center font-display font-black text-slate-700 bg-slate-100 shadow-sm uppercase text-lg select-none">
                      {getInitials(getUser(rankings[1].user_id)?.nome || '')}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-slate-300 text-slate-800 p-1 rounded-full shadow border border-white">
                      <Medal size={16} />
                    </div>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-green-700 transition-colors uppercase italic tracking-wide">
                    {getUser(rankings[1].user_id)?.nome}
                  </h3>
                </div>
                <div className="w-full bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <span className="block text-[11px] text-slate-500 font-medium">Pontuação Total</span>
                  <span className="text-xl font-black text-slate-800">{rankings[1].pontos_totais} pts</span>
                  <div className="flex items-center justify-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                    <span>🎯 {rankings[1].exatos_totais} exatos</span>
                    <span>•</span>
                    <span>⭐ {rankings[1].vencedores_totais} resultados</span>
                  </div>
                </div>
                {/* Badges */}
                <div className="flex flex-wrap justify-center gap-1 mt-3">
                  {getUserBadgesList(rankings[1].user_id).slice(0, 3).map((b) => (
                    <span key={b.id} className="cursor-help text-xs" title={`${b.nome}: ${b.descricao}`}>
                      {b.icone}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 1st Place (GOAT) */}
            {rankings.length > 0 && (
              <div className="bg-white border-2 border-amber-400 p-6 rounded-2xl order-1 md:order-2 text-center flex flex-col justify-between items-center shadow-md relative overflow-hidden group hover:border-amber-500 transition-all scale-105">
                <div className="absolute top-0 right-0 bg-amber-400 text-green-950 font-black px-4 py-2 rounded-bl-xl text-[10px] uppercase tracking-wider flex items-center gap-1 italic">
                  <Sparkles size={11} className="animate-pulse" />
                  <span>Líder Supremo</span>
                </div>
                <div className="mb-4 flex flex-col items-center">
                  <div className="relative mb-2.5 mt-2">
                    <div className="w-20 h-20 rounded-full border-4 border-amber-400 flex items-center justify-center font-display font-black text-amber-500 bg-amber-50 shadow-md uppercase text-2xl select-none">
                      {getInitials(getUser(rankings[0].user_id)?.nome || '')}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-amber-400 text-green-950 p-1.5 rounded-full shadow border border-white animate-bounce">
                      <Award size={18} />
                    </div>
                  </div>
                  <h3 className="font-black text-slate-900 text-base tracking-tight group-hover:text-green-700 transition-colors uppercase italic">
                    {getUser(rankings[0].user_id)?.nome}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">🚀 GOAT</span>
                  </div>
                </div>
                <div className="w-full bg-green-500/10 rounded-xl p-3 border border-green-500/10">
                  <span className="block text-[11px] text-green-800 font-extrabold uppercase tracking-wider">Pontos Totais</span>
                  <span className="text-2xl font-black text-green-700">{rankings[0].pontos_totais} pts</span>
                  <div className="flex items-center justify-center gap-3 mt-1.5 text-[10.5px] text-green-900 font-bold">
                    <span>🎯 {rankings[0].exatos_totais} exatos</span>
                    <span>•</span>
                    <span>🏆 {getUserBadgesList(rankings[0].user_id).length} selos</span>
                  </div>
                </div>
                {/* Badges */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {getUserBadgesList(rankings[0].user_id).slice(0, 4).map((b) => (
                    <span
                      key={b.id}
                      className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs cursor-help"
                      title={`${b.nome}: ${b.descricao}`}
                    >
                      {b.icone} <span className="text-[9px] text-slate-500 font-medium">{b.nome.split(' ')[0]}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {rankings.length > 2 && (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl order-3 md:order-3 text-center flex flex-col justify-between items-center shadow-sm relative overflow-hidden group hover:border-slate-350 transition-all">
                <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 font-extrabold px-3.5 py-1.5 rounded-bl-xl text-xs border-l border-b border-slate-200 uppercase tracking-wider italic">
                  3º Lugar
                </div>
                <div className="mb-3 flex flex-col items-center">
                  <div className="relative mb-2 mt-2">
                    <div className="w-16 h-16 rounded-full border-2 border-amber-600 flex items-center justify-center font-display font-black text-amber-800 bg-amber-50 shadow-sm uppercase text-lg select-none">
                      {getInitials(getUser(rankings[2].user_id)?.nome || '')}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-600 text-white p-1 rounded-full shadow border border-white">
                      <Medal size={16} />
                    </div>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-green-700 transition-colors uppercase italic tracking-wide">
                    {getUser(rankings[2].user_id)?.nome}
                  </h3>
                </div>
                <div className="w-full bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <span className="block text-[11px] text-slate-500 font-medium">Pontuação Total</span>
                  <span className="text-xl font-black text-slate-800">{rankings[2].pontos_totais} pts</span>
                  <div className="flex items-center justify-center gap-2 mt-1 text-[10px] text-slate-500 font-medium">
                    <span>🎯 {rankings[2].exatos_totais} exatos</span>
                    <span>•</span>
                    <span>⭐ {rankings[2].vencedores_totais} resultados</span>
                  </div>
                </div>
                {/* Badges */}
                <div className="flex flex-wrap justify-center gap-1 mt-3">
                  {getUserBadgesList(rankings[2].user_id).slice(0, 3).map((b) => (
                    <span key={b.id} className="cursor-help text-xs" title={`${b.nome}: ${b.descricao}`}>
                      {b.icone}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full Leaderboard Table Container */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50">
              <div>
                <h2 className="text-sm uppercase font-black tracking-wider text-slate-900 flex items-center gap-1.5 font-display">
                  <Award size={18} className="text-green-700" />
                  <span>Tabela Geral do Bolão</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">Acumulado de todas as rodadas já finalizadas</p>
              </div>
              <button
                onClick={handleShareRanking}
                className="w-full sm:w-auto text-xs bg-green-700 hover:bg-green-600 active:scale-95 text-white font-black uppercase tracking-wider px-3.5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                id="btn-compartilhar-ranking"
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copied ? 'Copiado para Área' : 'Zuar no WhatsApp (Copiar)'}</span>
              </button>
            </div>

            {/* Desktop and Mobile Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-650 border-b border-slate-200">
                    <th className="py-3.5 px-4 font-bold text-center w-16 select-none">POS</th>
                    <th className="py-3.5 px-3 font-bold select-none">PARTICIPANTE</th>
                    <th className="py-3.5 px-3 font-bold text-center w-24 select-none cursor-help" title="Pontos Totais: Quem tem mais pontos fica no topo.">PONTOS</th>
                    <th className="py-3.5 px-3 font-bold text-center w-24 select-none cursor-help" title="Placares Cravados (Exatos): Em caso de empate em pontos, quem acertou mais placares exatos (+10) fica na frente.">🎯 CRAVADOS</th>
                    <th className="py-3.5 px-3 font-bold text-center hidden sm:table-cell w-28 select-none cursor-help" title="Vitórias Acertadas (Resultados): Em caso de empate em pontos e em exatos, quem acertou mais vencedores/empates (+5) fica na frente.">⭐ VITÓRIAS</th>
                    <th className="py-3.5 px-3 font-bold text-center w-24 select-none cursor-help" title="Gebiadas (Erros Totais): Quantidade de palpites onde o participante errou completamente e não pontuou.">🤡 GEBIADAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rankings.map((rank, idx) => {
                    const user = getUser(rank.user_id);
                    if (!user) return null;

                    const isTop3 = idx < 3;
                    let numColor = 'text-slate-500 font-bold';
                    if (idx === 0) numColor = 'text-amber-500 font-black';
                    else if (idx === 1) numColor = 'text-slate-500 font-black';
                    else if (idx === 2) numColor = 'text-amber-700 font-black';

                    return (
                      <tr
                        key={user.id}
                        onClick={() => handleShowStats(user)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group border-b border-slate-100"
                      >
                        {/* Rank Number */}
                        <td className="py-3.5 px-4 text-center font-bold">
                          <div className="flex justify-center items-center">
                            {idx === 0 && <span className="text-sm">🥇</span>}
                            {idx === 1 && <span className="text-sm">🥈</span>}
                            {idx === 2 && <span className="text-sm">🥉</span>}
                            {!isTop3 && <span className={numColor}>{rank.posicao}º</span>}
                          </div>
                        </td>

                        {/* Participant Info */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center font-display font-black text-slate-700 bg-slate-100 shadow-sm uppercase text-[10px] select-none shrink-0">
                              {getInitials(user.nome)}
                            </div>
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="font-extrabold text-slate-900 group-hover:text-green-700 transition-colors uppercase italic tracking-wide text-xs">
                                {user.nome}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Points */}
                        <td className="py-3.5 px-3 text-center font-black text-slate-800 text-sm">
                          {rank.pontos_totais} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                        </td>

                        {/* Cravados (Exatos) */}
                        <td className="py-3.5 px-3 text-center font-bold text-slate-750 font-mono text-sm">
                          {rank.exatos_totais}
                        </td>

                        {/* Resultados */}
                        <td className="py-3.5 px-3 text-center hidden sm:table-cell font-semibold text-slate-500 font-mono">
                          {rank.vencedores_totais}
                        </td>

                        {/* Gebiadas (Erros) */}
                        <td className="py-3.5 px-3 text-center font-bold text-rose-600 font-mono text-sm">
                          {rank.erros_totais ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {rankingSubTab === 'copa' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Controls Panel */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Standings Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setStandingsMode('real')}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  standingsMode === 'real'
                    ? 'bg-white text-green-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📊 Tabela Real</span>
              </button>
              <button
                onClick={() => {
                  if (!currentUser) {
                    alert('Faça login no topo para usar o simulador de palpites!');
                    return;
                  }
                  setStandingsMode('simulated');
                }}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  standingsMode === 'simulated'
                    ? 'bg-white text-green-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🔮 Simular Meus Palpites</span>
              </button>
            </div>

            {/* Group Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-550 font-bold uppercase tracking-wider text-[10px]">Filtrar Grupo:</span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="bg-transparent text-slate-800 font-black uppercase cursor-pointer outline-none border-none focus:ring-0 text-xs py-0 h-6"
              >
                <option value="todos">Todos os Grupos</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <option key={letter} value={`Grupo ${letter}`}>
                      Grupo {letter}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Mode Explanatory Notice */}
          {standingsMode === 'simulated' && currentUser && (
            <div className="bg-amber-400/10 border border-amber-300 rounded-xl p-3.5 text-xs text-slate-900 shadow-xs animate-in slide-in-from-top-1 duration-200">
              <span className="font-black text-green-950 uppercase italic tracking-tight block mb-0.5">🔮 Modo Simulador Ativo</span>
              Mostrando as tabelas dos grupos calculadas com os resultados reais dos jogos finalizados e, para as partidas que ainda não começaram, com os palpites salvos do competidor <strong className="text-slate-900">{currentUser.nome}</strong>.
            </div>
          )}

          {/* Standings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(groupStandings)
              .filter((g) => selectedGroup === 'todos' || g === selectedGroup)
              .sort()
              .map((groupName) => {
                const teams = groupStandings[groupName];
                return (
                  <div
                    key={groupName}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-slate-350 hover:shadow-md transition duration-200 flex flex-col justify-between"
                  >
                    <div className="border-b border-slate-150 pb-2 mb-3 flex items-center justify-between">
                      <span className="font-display font-black text-slate-900 uppercase italic tracking-wide text-xs">
                        {groupName}
                      </span>
                      <span className="text-[9px] bg-slate-100 text-slate-550 font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200">
                        Copa 2026
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-100 uppercase text-[9px] font-bold">
                            <th className="pb-2 w-6 text-center">#</th>
                            <th className="pb-2">Seleção</th>
                            <th className="pb-2 w-6 text-center" title="Pontos">P</th>
                            <th className="pb-2 w-6 text-center" title="Jogos">J</th>
                            <th className="pb-2 w-6 text-center hidden sm:table-cell" title="Vitórias">V</th>
                            <th className="pb-2 w-6 text-center hidden sm:table-cell" title="Empates">E</th>
                            <th className="pb-2 w-6 text-center hidden sm:table-cell" title="Derrotas">D</th>
                            <th className="pb-2 w-8 text-center" title="Saldo de Gols">SG</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {teams.map((t, idx) => {
                            const isZone = idx < 2;
                            const diffPrefix = t.goalDifference > 0 ? '+' : '';
                            return (
                              <tr
                                key={t.team}
                                className={`transition-colors hover:bg-slate-50/50 ${
                                  isZone ? 'bg-emerald-50/20' : ''
                                }`}
                              >
                                <td className="py-2.5 text-center font-extrabold">
                                  <span
                                    className={`inline-flex w-4 h-4 rounded-full items-center justify-center text-[9px] font-black ${
                                      isZone
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-550'
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="py-2.5 font-bold text-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-base select-none filter drop-shadow-xs">{t.flag}</span>
                                    <span className="truncate max-w-[90px] md:max-w-[100px] uppercase tracking-wide text-[10px]">
                                      {t.team}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 text-center font-black text-slate-950 text-xs">
                                  {t.points}
                                </td>
                                <td className="py-2.5 text-center font-semibold text-slate-550">
                                  {t.played}
                                </td>
                                <td className="py-2.5 text-center font-medium text-slate-400 hidden sm:table-cell">
                                  {t.won}
                                </td>
                                <td className="py-2.5 text-center font-medium text-slate-400 hidden sm:table-cell">
                                  {t.drawn}
                                </td>
                                <td className="py-2.5 text-center font-medium text-slate-400 hidden sm:table-cell">
                                  {t.lost}
                                </td>
                                <td
                                  className={`py-2.5 text-center font-bold font-mono text-[10px] ${
                                    t.goalDifference > 0
                                      ? 'text-emerald-600'
                                      : t.goalDifference < 0
                                      ? 'text-red-500'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {diffPrefix}
                                  {t.goalDifference}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* User Deep Stats card popup if clicked */}
      {focusedUser && (() => {
        const userRank = rankings.find((r) => r.user_id === focusedUser.id);
        const userRoundScores = roundScores.filter((s) => s.user_id === focusedUser.id);
        const totalGebiadas = userRoundScores.reduce((acc, score) => acc + score.erros_qtd, 0);

        return (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <div className="bg-white border border-slate-300 p-6 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in duration-200 text-slate-900">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-green-700 flex items-center justify-center font-display font-black text-green-700 bg-green-50 shadow-sm uppercase text-base select-none shrink-0">
                    {getInitials(focusedUser.nome)}
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <h3 className="font-extrabold text-slate-950 text-sm uppercase italic tracking-wide">{focusedUser.nome}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setFocusedUser(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold p-1 bg-slate-100 rounded-md cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="border-t border-slate-100 py-3 mt-2 grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-550 font-black uppercase tracking-wider block">Classificação</span>
                  <span className="text-base font-black text-green-700 uppercase italic">
                    {userRank?.posicao}º Lugar
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-550 font-black uppercase tracking-wider block">Total de Pontos</span>
                  <span className="text-base font-black text-green-700 uppercase italic">
                    {userRank?.pontos_totais} pts
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest italic font-display">
                  Detalhamento dos Palpites
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Cravados */}
                  <div className="bg-slate-55/60 bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-950 uppercase italic">Placares Cravados</h5>
                        <p className="text-[10px] text-slate-550 leading-normal font-medium">+10 pontos por acerto exato</p>
                      </div>
                    </div>
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 font-mono font-black text-sm px-3 py-1 rounded-lg">
                      {userRank?.exatos_totais || 0}
                    </span>
                  </div>

                  {/* Vitórias */}
                  <div className="bg-slate-55/60 bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-950 uppercase italic">Vitórias / Empates</h5>
                        <p className="text-[10px] text-slate-550 leading-normal font-medium">+5 pontos (resultado)</p>
                      </div>
                    </div>
                    <span className="bg-blue-100 text-blue-800 border border-blue-200 font-mono font-black text-sm px-3 py-1 rounded-lg">
                      {userRank?.vencedores_totais || 0}
                    </span>
                  </div>

                  {/* Gols de apenas um time */}
                  <div className="bg-slate-55/60 bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚽</span>
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-950 uppercase italic">Gols de Um Time</h5>
                        <p className="text-[10px] text-slate-550 leading-normal font-medium">+2 pontos (parcial)</p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono font-black text-sm px-3 py-1 rounded-lg">
                      {userRank?.gols_um_time_totais || 0}
                    </span>
                  </div>

                  {/* Gebiadas (Erros) */}
                  <div className="bg-slate-55/60 bg-slate-50 border border-slate-150 px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🤡</span>
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-950 uppercase italic">Gebiadas / Erros</h5>
                        <p className="text-[10px] text-slate-550 leading-normal font-medium">Placares errados ou não palpitados (0 pts)</p>
                      </div>
                    </div>
                    <span className="bg-red-100 text-red-800 border border-red-200 font-mono font-black text-sm px-3 py-1 rounded-lg">
                      {totalGebiadas}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <p className="text-[10px] text-slate-400 font-semibold italic">Dica: Selecione qualquer jogador na tabela geral para ver suas estatísticas detalhadas.</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
