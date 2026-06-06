import React, { useState, useEffect } from 'react';
import { User, Match, Prediction, Badge, UserBadge, RoundScore, Ranking } from './types';
import { Header } from './components/Header';
import { RankingView } from './components/RankingView';
import { PredictionsView } from './components/PredictionsView';
import { MuseumView } from './components/MuseumView';
import { AdminView } from './components/AdminView';
import { Trophy, CalendarCheck, AlertTriangle, Users, Sliders, RefreshCw, BarChart2, Star } from 'lucide-react';

export default function App() {
  // Global synchronized states from DB
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [roundScores, setRoundScores] = useState<RoundScore[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [logoImage, setLogoImage] = useState<string>('');

  // UI Control states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'ranking' | 'palpites' | 'museum' | 'admin'>('ranking');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize state from backend APIs
  const fetchState = async (silently = false) => {
    if (!silently) setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/state');
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setUsers(data.users || []);
      setMatches(data.matches || []);
      setPredictions(data.predictions || []);
      setBadges(data.badges || []);
      setUserBadges(data.user_badges || []);
      setRoundScores(data.round_scores || []);
      setRankings(data.rankings || []);
      setLogoImage(data.logo_image || '');

      // If no current user is loaded initially, auto-log in as preseeded Admin "Diego" so they can experience everything immediately
      if (!currentUser && data.users?.length > 0) {
        const adminUser = data.users.find((u: User) => u.isAdmin) || data.users[0];
        setCurrentUser(adminUser);
      } else if (currentUser) {
        // Re-sync current user details
        const synced = data.users.find((u: User) => u.id === currentUser.id);
        if (synced) setCurrentUser(synced);
      }
    } catch (err: any) {
      console.error('Failed to parse backend session, rendering offline state.', err);
      setErrorMsg('Falha de sincronização com o contêiner do servidor. Tente redefinir o simulador ou espere alguns segundos.');
    } finally {
      setIsLoading(false);
    }
  };

  // On mount, run initial pull
  useEffect(() => {
    fetchState();
  }, []);

  // Post Prediction Score handler
  const handleSavePrediction = async (matchId: string, golsCasa: number, golsFora: number) => {
    if (!currentUser) return;
    setErrorMsg(null);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          match_id: matchId,
          gols_casa: golsCasa,
          gols_fora: golsFora
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Não foi possível salvar o palpite.');
      }

      // Re-trigger global state calculation sync
      await fetchState(true);
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Post admin score update handler
  const handleUpdateMatchScore = async (
    matchId: string,
    golsCasa: number | null,
    golsFora: number | null,
    status: 'unplayed' | 'completed'
  ) => {
    if (!currentUser?.isAdmin) return;
    setErrorMsg(null);
    try {
      const res = await fetch('/api/match/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          gols_casa: golsCasa,
          gols_fora: golsFora,
          status
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao salvar placar.');
      }

      await fetchState(true);
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Create customized contestant (mock or real)
  const handleRegisterUser = async (nome: string, email: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao registrar.');
      }

      const data = await res.json();
      setCurrentUser(data.user); // Login custom user instantly
      await fetchState(true);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao registrar usuário: ' + err.message);
    }
  };

  // Put bulk games in database
  const handleImportMatches = async (importedList: any[]) => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/match/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches: importedList })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao importar.');
      }

      await fetchState(true);
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Reseed state back to original schema values
  const handleResetDB = async () => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Não foi possível restaurar.');
      await fetchState(false);
    } catch (err: any) {
      console.error(err);
      alert('Falha ao restaurar dados sugeridos: ' + err.message);
    }
  };

  // Change user session on selector dropdown
  const handleSelectUser = (selected: User | null) => {
    setCurrentUser(selected);
  };

  // Helper calculating personal metrics for currently logged user
  const getUserRoundScores = () => {
    if (!currentUser) return [];
    return roundScores.filter((s) => s.user_id === currentUser.id);
  };

  const getUnplayedMatchesCount = () => {
    return matches.filter((m) => m.status === 'unplayed').length;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-green-200 selection:text-green-950 font-sans">
      {/* Dynamic Header Component */}
      <Header
        currentUser={currentUser}
        users={users}
        rankings={rankings}
        onSelectUser={handleSelectUser}
        onRegisterUser={handleRegisterUser}
        onResetDB={handleResetDB}
        isLoading={isLoading}
        logoImage={logoImage}
        onUpdateLogo={async (newLogo: string) => {
          try {
            const res = await fetch('/api/logo/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logo_image: newLogo })
            });
            if (res.ok) {
              setLogoImage(newLogo);
            }
          } catch (e) {
            console.error('Failed to save logo', e);
          }
        }}
      />

      {/* Main Container Core */}
      <main className="flex-grow max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 w-full flex flex-col gap-6">
        
        {/* Error Alert Box */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800 items-start animate-fade-in text-xs shadow-sm">
            <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-black block text-sm uppercase italic">Alerta de Sincronização</span>
              <span>{errorMsg}</span>
              <button
                onClick={() => fetchState()}
                className="block underline font-black text-red-700 hover:text-red-900 mt-2 cursor-pointer uppercase tracking-tight"
              >
                Tentar Forçar Atualização
              </button>
            </div>
          </div>
        )}

        {/* Global Navigation Selector Sub-Menu */}
        <div className="flex border-b border-slate-200 gap-1 pb-1">
          <nav className="flex flex-wrap gap-1.5 w-full md:w-auto text-xs">
            <button
              onClick={() => setActiveTab('ranking')}
              className={`px-4 py-2.5 rounded-lg font-black uppercase italic tracking-wider flex items-center gap-1.5 transition duration-200 cursor-pointer ${
                activeTab === 'ranking'
                  ? 'bg-green-700 text-white shadow'
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-200/60'
              }`}
            >
              <Trophy size={14} />
              <span>Placar de Líderes</span>
            </button>

            <button
              onClick={() => setActiveTab('palpites')}
              className={`px-4 py-2.5 rounded-lg font-black uppercase italic tracking-wider flex items-center gap-1.5 transition duration-200 cursor-pointer ${
                activeTab === 'palpites'
                  ? 'bg-green-700 text-white shadow'
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-200/60'
              }`}
            >
              <CalendarCheck size={14} />
              <span>Dar Meus Palpites</span>
              {currentUser && getUnplayedMatchesCount() > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-amber-400 text-green-950 text-[10px] font-black rounded-lg animate-pulse">
                  {getUnplayedMatchesCount()}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('museum')}
              className={`px-4 py-2.5 rounded-lg font-black uppercase italic tracking-wider flex items-center gap-1.5 transition duration-200 cursor-pointer ${
                activeTab === 'museum'
                  ? 'bg-green-700 text-white shadow'
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-200/60'
              }`}
            >
              <span>🤡 Corneta & Museu</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2.5 rounded-lg font-black uppercase italic tracking-wider flex items-center gap-1.5 transition duration-200 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-green-700 text-white shadow'
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-200/60'
              }`}
            >
              <Sliders size={14} />
              <span>Gabinete Admin (Placares)</span>
            </button>
          </nav>
        </div>

        {/* Dynamic Bento Box Structure: Column Layout split into main body and sidebar widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main Layout Screen Block (Takes 3/4 widths on desktop) */}
          <div className="lg:col-span-3 min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-24 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                <RefreshCw size={36} className="text-green-700 animate-spin mb-3" />
                <span className="font-medium text-xs text-slate-500">Processando tabelas do Bolão...</span>
              </div>
            ) : (
              <div className="animate-in fade-in duration-200">
                {activeTab === 'ranking' && (
                  <RankingView
                    rankings={rankings}
                    users={users}
                    badges={badges}
                    userBadges={userBadges}
                    roundScores={roundScores}
                    matches={matches}
                    onSelectUser={handleSelectUser}
                  />
                )}

                {activeTab === 'palpites' && (
                  <PredictionsView
                    currentUser={currentUser}
                    matches={matches}
                    predictions={predictions}
                    onSavePrediction={handleSavePrediction}
                    isLoading={isLoading}
                  />
                )}

                {activeTab === 'museum' && (
                  <MuseumView
                    users={users}
                    badges={badges}
                    userBadges={userBadges}
                    roundScores={roundScores}
                    matches={matches}
                  />
                )}

                {activeTab === 'admin' && (
                  <AdminView
                    currentUser={currentUser}
                    matches={matches}
                    rankings={rankings}
                    onUpdateMatchScore={handleUpdateMatchScore}
                    onRegisterUser={handleRegisterUser}
                    onImportMatches={handleImportMatches}
                    onResetDB={handleResetDB}
                    isLoading={isLoading}
                    onRefreshState={async () => {
                      await fetchState(true);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar Area Widgets (Takes 1/4 widths on desktop - perfect density architecture) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Widget 1: Personal Performance Tracker Card if logged-in */}
            {currentUser ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm font-sans">
                <span className="text-[10px] text-green-700 font-black uppercase tracking-widest block mb-3 italic">Desempenho Pessoal</span>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.nome}
                      className="w-10 h-10 rounded-full border-2 border-green-700 p-0.5 object-cover shadow-sm bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide italic">{currentUser.nome}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Participante Ativo</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-550 font-medium">Total de Pontos:</span>
                      <span className="font-black text-green-750 text-green-700 text-sm">
                        {rankings.find((r) => r.user_id === currentUser.id)?.pontos_totais || 0} pts
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-550 font-medium">Placares cravados (+10):</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 text-[11px]">
                        {rankings.find((r) => r.user_id === currentUser.id)?.exatos_totais || 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-550 font-medium">Vitórias acertadas (+5):</span>
                      <span className="font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 text-[11px]">
                        {rankings.find((r) => r.user_id === currentUser.id)?.vencedores_totais || 0}
                      </span>
                    </div>
                  </div>

                  {/* Highlights loop */}
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10px] uppercase font-black text-slate-400 block mb-2 italic">Histórico de Rodadas</span>
                    <div className="space-y-1.5 text-[11px]">
                      {getUserRoundScores().map((score) => (
                        <div key={score.id} className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <span className="text-slate-500 font-bold">{score.rodada}</span>
                          <span className="font-black text-green-700">{score.pontos} pts</span>
                        </div>
                      ))}
                      {getUserRoundScores().length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-1">Nenhum dado calculado ainda.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
                <Users className="text-green-700 mx-auto mb-2" size={24} />
                <h4 className="font-black text-xs text-slate-900 uppercase italic">Painel de Simulação</h4>
                <p className="text-[10px] text-slate-500 leading-normal mt-1.5 animate-pulse">
                  Selecione um dos competidores no menu superior para simular seus palpites e ver seu progresso!
                </p>
              </div>
            )}

            {/* Widget 2: Copa 2026 Core Information Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-xs space-y-3 font-sans">
              <span className="text-[10px] text-green-700 font-black uppercase tracking-widest block italic">Regulamento Oficial</span>
              <ul className="space-y-2 text-[11px] leading-relaxed text-slate-600">
                <li className="flex items-start gap-1.5">
                  <span className="text-green-600 font-bold">1. 🎯</span>
                  <span>Acerto Exato do placar: <strong className="text-slate-900 font-black">+10 pontos</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-green-600 font-bold">2. ⭐</span>
                  <span>Acerto do vencedor ou empate: <strong className="text-slate-900 font-black">+5 pontos</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-green-600 font-bold">3. ⚽</span>
                  <span>Acertou gols de apenas um time: <strong className="text-slate-900 font-black">+2 pontos</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-500 font-bold">4. 💩</span>
                  <span>Não acertou nada: <strong className="text-slate-450">0 pontos</strong>.</span>
                </li>
              </ul>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  * Os palpites de cada jogo são trancados de forma automática no momento exato do início programado de cada duelo.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-[11px] text-slate-400 font-sans mt-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-extrabold text-slate-500">© 2026 GEBolão. Desenvolvido para a zoeira e comemorações da Copa do Mundo de 2026.</p>
          <p className="text-[10px] text-slate-400 font-mono">
            Imagens ilustrativas hospedadas em canais públicos • Rodando em ambiente Docker Sandbox do Cloud Run.
          </p>
        </div>
      </footer>
    </div>
  );
}
