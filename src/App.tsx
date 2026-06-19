import React, { useState, useEffect } from 'react';
import { User, Match, Prediction, Badge, UserBadge, RoundScore, Ranking } from './types';
import { Header } from './components/Header';
import { RankingView } from './components/RankingView';
import { PredictionsView } from './components/PredictionsView';
import { MuseumView } from './components/MuseumView';
import { AdminView } from './components/AdminView';
import { OnboardingModal } from './components/OnboardingModal';
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
  const [allowRegistrations, setAllowRegistrations] = useState<boolean>(true);

  // UI Control states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'ranking' | 'palpites' | 'museum' | 'admin'>('ranking');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [forceOpenRegister, setForceOpenRegister] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

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
      setAllowRegistrations(data.allow_registrations !== false);

      // Resolve current user: try localStorage first, otherwise remain logged out
      const storedUserId = localStorage.getItem('gebolao_current_user_id');
      if (storedUserId) {
        const matchedUser = data.users?.find((u: User) => u.id === storedUserId);
        if (matchedUser) {
          setCurrentUser(matchedUser);
        } else {
          // If stored user doesn't exist in DB anymore, clear it
          localStorage.removeItem('gebolao_current_user_id');
          setCurrentUser(null);
        }
      } else if (currentUser) {
        // Re-sync current user details
        const synced = data.users?.find((u: User) => u.id === currentUser.id);
        if (synced) {
          setCurrentUser(synced);
          localStorage.setItem('gebolao_current_user_id', synced.id);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err: any) {
      console.error('Failed to parse backend session, rendering offline state.', err);
      setErrorMsg('Falha de sincronização com o contêiner do servidor. Tente redefinir o simulador ou espere alguns segundos.');
    } finally {
      setIsLoading(false);
    }
  };

  // On mount, run initial pull and check onboarding
  useEffect(() => {
    fetchState();
    const hasSeen = localStorage.getItem('gebolao_onboarding_seen');
    if (!hasSeen) {
      setShowOnboarding(true);
    }
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
  const handleRegisterUser = async (nome: string, email: string, isPaid: boolean = false) => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, is_paid: isPaid })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao registrar.');
      }

      const data = await res.json();
      setCurrentUser(data.user); // Login custom user instantly
      if (data.user) {
        localStorage.setItem('gebolao_current_user_id', data.user.id);
      }
      await fetchState(true);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao registrar usuário: ' + err.message);
    }
  };

  // Toggle registration config (Admin Only)
  const handleToggleRegistration = async () => {
    if (!currentUser?.isAdmin) return;
    setErrorMsg(null);
    try {
      const res = await fetch('/api/settings/toggle-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: currentUser.id })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao alterar configuração de inscrições.');
      }

      const data = await res.json();
      setAllowRegistrations(data.allow_registrations);
      await fetchState(true);
    } catch (err: any) {
      console.error(err);
      alert('Falha ao alterar configuração de inscrições: ' + err.message);
    }
  };

  // Toggle user admin permission
  const handleToggleAdmin = async (userId: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/user/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao alterar permissão.');
      }

      await fetchState(true);
    } catch (err: any) {
      console.error(err);
      alert('Falha ao alterar permissão de admin: ' + err.message);
    }
  };

  // Toggle user paid status
  const handleTogglePaid = async (userId: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/user/toggle-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao alterar status de pagamento.');
      }

      await fetchState(true);
    } catch (err: any) {
      console.error(err);
      alert('Falha ao alterar status de pagamento: ' + err.message);
    }
  };

  // Delete user profile
  const handleDeleteUser = async (userId: string) => {
    if (!currentUser?.isAdmin) return;
    if (userId === 'user-diego') {
      alert('Não é possível excluir o Presidente (Dono) do Bolão.');
      return;
    }
    if (userId === currentUser.id) {
      alert('Você não pode excluir o seu próprio perfil.');
      return;
    }

    if (!confirm('Tem certeza de que deseja excluir permanentemente o perfil deste usuário, juntamente com todos os seus palpites, pontuações e conquistas? Esta ação não pode ser desfeita!')) {
      return;
    }

    setErrorMsg(null);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, requester_id: currentUser.id })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao excluir usuário.');
      }

      await fetchState(true);
    } catch (err: any) {
      console.error(err);
      alert('Falha ao excluir usuário: ' + err.message);
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
    if (selected) {
      localStorage.setItem('gebolao_current_user_id', selected.id);
    } else {
      localStorage.removeItem('gebolao_current_user_id');
    }
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
      <Header
        currentUser={currentUser}
        users={users}
        rankings={rankings}
        onSelectUser={handleSelectUser}
        onRegisterUser={handleRegisterUser}
        onResetDB={handleResetDB}
        isLoading={isLoading}
        logoImage={logoImage || '/geb.png'}
        forceOpenRegister={forceOpenRegister}
        onClearForceOpenRegister={() => setForceOpenRegister(false)}
        onOpenOnboarding={() => setShowOnboarding(true)}
        allowRegistrations={allowRegistrations}
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
        <div className="sticky top-0 z-45 bg-slate-50/95 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-slate-200 shadow-sm transition-all duration-200">
          <nav className="max-w-7xl mx-auto flex flex-wrap gap-1.5 w-full text-xs">
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
              className={`px-4 py-2.5 rounded-lg font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                activeTab === 'palpites'
                  ? 'bg-amber-400 text-green-950 shadow-md border border-amber-500 scale-[1.02]'
                  : 'bg-amber-100/95 text-amber-950 border border-amber-350 shadow-xs animate-pulse-gold hover:bg-amber-200/90'
              }`}
            >
              <CalendarCheck size={14} className={activeTab === 'palpites' ? 'text-green-950' : 'text-amber-800'} />
              <span>Dar Palpites</span>
              {currentUser && getUnplayedMatchesCount() > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-lg animate-pulse">
                  {getUnplayedMatchesCount()}
                </span>
              )}
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

        {/* Mobile-Only Prize Pool Widget */}
        <div className="lg:hidden bg-slate-900 border border-emerald-900 rounded-2xl p-4 shadow-md text-white font-sans animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-emerald-950 pb-2 mb-2">
            <div>
              <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest block italic">🏆 Pote de Prêmios Acumulado</span>
              <span className="text-xl font-black text-white italic">
                {((users.length) * 50).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-md">
              {users.length} {users.length === 1 ? 'participante' : 'participantes'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-950/45 px-2 py-1.5 rounded-lg border border-emerald-950/20 text-center">
              <span className="text-amber-400 font-black text-[9px] uppercase italic block">🥇 1º (60%)</span>
              <span className="font-extrabold text-white text-[11px]">
                {(((users.length) * 50) * 0.6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="bg-slate-950/45 px-2 py-1.5 rounded-lg border border-emerald-950/20 text-center">
              <span className="text-slate-350 font-black text-[9px] uppercase italic block">🥈 2º (30%)</span>
              <span className="font-extrabold text-white text-[11px]">
                {(((users.length) * 50) * 0.3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="bg-slate-950/45 px-2 py-1.5 rounded-lg border border-emerald-950/20 text-center">
              <span className="text-amber-500 font-black text-[9px] uppercase italic block">🥉 3º (10%)</span>
              <span className="font-extrabold text-white text-[11px]">
                {(((users.length) * 50) * 0.1).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-emerald-950/40 flex justify-center">
            <button
              onClick={() => setShowRulesModal(true)}
              className="w-full text-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-250 text-[10px] font-black uppercase tracking-wider py-2 rounded-lg transition duration-150 cursor-pointer shadow-xs"
            >
              📖 Regulamento e Exemplos
            </button>
          </div>
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
                    predictions={predictions}
                    currentUser={currentUser}
                  />
                )}

                {activeTab === 'palpites' && (
                  <PredictionsView
                    currentUser={currentUser}
                    users={users}
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
                    predictions={predictions}
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
                    users={users}
                    onToggleAdmin={handleToggleAdmin}
                    onTogglePaid={handleTogglePaid}
                    onDeleteUser={handleDeleteUser}
                    onRefreshState={async () => {
                      await fetchState(true);
                    }}
                    allowRegistrations={allowRegistrations}
                    onToggleRegistration={handleToggleRegistration}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar Area Widgets (Takes 1/4 widths on desktop - perfect density architecture) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Widget: Premiação do Bolão */}
            <div className="bg-slate-900 border border-emerald-900 rounded-2xl p-5 shadow-md text-white font-sans animate-in fade-in duration-300">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest block mb-2.5 italic">🏆 Pote de Prêmios</span>
              <div className="space-y-3">
                <div className="flex justify-between items-end border-b border-emerald-950 pb-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Valor Total Acumulado</span>
                    <span className="text-2xl font-black text-white italic">
                      {((users.length) * 50).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-bold mb-1">
                    {users.length} {users.length === 1 ? 'participante' : 'participantes'}
                  </span>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-center bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-900">
                    <span className="text-amber-400 font-black text-[10px] uppercase italic">🥇 1º Lugar (60%):</span>
                    <span className="font-extrabold text-white">
                      {(((users.length) * 50) * 0.6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-900">
                    <span className="text-slate-350 font-black text-[10px] uppercase italic">🥈 2º Lugar (30%):</span>
                    <span className="font-extrabold text-white">
                      {(((users.length) * 50) * 0.3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-900">
                    <span className="text-amber-500 font-black text-[10px] uppercase italic">🥉 3º Lugar (10%):</span>
                    <span className="font-extrabold text-white">
                      {(((users.length) * 50) * 0.1).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
                
                <p className="text-[9px] text-slate-400 leading-normal pt-1 text-center font-medium">
                  Taxa de R$ 50,00 por participante. O cálculo é atualizado dinamicamente a cada novo cadastro.
                </p>
              </div>
            </div>
            
            {/* Widget 1: Personal Performance Tracker Card if logged-in */}
            {currentUser ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm font-sans">
                <span className="text-[10px] text-green-700 font-black uppercase tracking-widest block mb-3 italic">Desempenho Pessoal</span>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-green-700 flex items-center justify-center font-display font-black text-green-700 bg-green-50 shadow-sm uppercase text-xs select-none shrink-0">
                      {getInitials(currentUser.nome)}
                    </div>
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

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-550 font-medium">Gols de apenas um time (+2):</span>
                      <span className="font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 text-[11px]">
                        {rankings.find((r) => r.user_id === currentUser.id)?.gols_um_time_totais || 0}
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
                <h4 className="font-black text-xs text-slate-900 uppercase italic">Meus Palpites</h4>
                <p className="text-[10px] text-slate-500 leading-normal mt-1.5 animate-pulse">
                  Faça login ou cadastre-se no menu superior para ver seu progresso e registrar seus palpites!
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
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  * Os palpites de cada jogo são trancados de forma automática no momento exato do início programado de cada duelo.
                </p>
                <button
                  onClick={() => setShowRulesModal(true)}
                  className="w-full text-center bg-green-50 hover:bg-green-100/80 border border-green-200 text-green-700 hover:text-green-800 text-[10px] font-black uppercase tracking-wider py-2 rounded-lg transition duration-150 cursor-pointer shadow-xs"
                >
                  📖 Ver Exemplos Detalhados
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-[11px] text-slate-400 font-sans mt-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-extrabold text-slate-500">© 2026 GEBolão. Desenvolvido para a zoeira e comemorações da Copa do Mundo de 2026.</p>
          <p className="text-[10px] text-slate-400 font-mono">
            Imagens ilustrativas hospedadas em canais públicos • Rodando em ambiente Docker Sandbox do Cloud Run.
          </p>
          <div className="pt-1">
            <button
              onClick={() => {
                setActiveTab('museum');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-[9px] font-black uppercase italic tracking-widest px-3 py-1.5 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1 ${
                activeTab === 'museum'
                  ? 'bg-green-700 text-white border-green-750 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
            >
              <span>🤡 Corneta & Museu</span>
            </button>
          </div>
        </div>
      </footer>
      {/* Detailed Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[100] backdrop-blur-xs">
          <div className="bg-slate-900 border border-emerald-900 p-6 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 text-slate-100 font-sans">
            <div className="flex items-start justify-between border-b border-emerald-950 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <h3 className="font-display font-black text-white text-md uppercase tracking-tight">Regulamento de Pontuação</h3>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider italic">GEBolão Copa 2026</p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold p-1 bg-slate-800 hover:bg-slate-700 rounded-md cursor-pointer transition-colors text-xs"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-6 text-xs leading-relaxed">
              {/* Rule 1 */}
              <div className="bg-slate-950/40 border border-emerald-950 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-400 text-xs italic">🎯 1. Acerto Exato</span>
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">10 Pontos</span>
                </div>
                <p className="text-slate-300 text-[11px]">Você acerta exatamente o placar final de ambos os times.</p>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 font-mono text-[10px] space-y-1">
                  <div><span className="text-slate-500">Palpite:</span> <span className="text-amber-400 font-bold">2 x 1</span> | <span className="text-slate-500">Real:</span> <span className="text-white font-bold">2 x 1</span> <span className="text-emerald-400">→ +10 pts</span></div>
                  <div><span className="text-slate-500">Palpite:</span> <span className="text-amber-400 font-bold">0 x 0</span> | <span className="text-slate-500">Real:</span> <span className="text-white font-bold">0 x 0</span> <span className="text-emerald-400">→ +10 pts</span></div>
                </div>
              </div>

              {/* Rule 2 */}
              <div className="bg-slate-950/40 border border-emerald-950 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-200 text-xs italic">⭐ 2. Acerto do Resultado (Vencedor ou Empate)</span>
                  <span className="bg-slate-100/10 text-slate-300 border border-slate-100/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">5 Pontos</span>
                </div>
                <p className="text-slate-300 text-[11px]">Você acerta quem venceu a partida (ou que deu empate), mas erra os gols exatos.</p>
                <div className="space-y-2 text-[11px]">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 space-y-1">
                    <div><span className="text-amber-300 font-extrabold uppercase text-[9px] block mb-1">Caso A: Acertou o Vencedor</span></div>
                    <div className="font-mono text-[10px]"><span className="text-slate-500">Palpite:</span> <span className="text-amber-400 font-bold">3 x 1 (A vence)</span> | <span className="text-slate-500">Real:</span> <span className="text-white font-bold">2 x 0 (A vence)</span> <span className="text-emerald-400">→ +5 pts</span></div>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 space-y-1">
                    <div><span className="text-amber-300 font-extrabold uppercase text-[9px] block mb-1">Caso B: Acertou o Empate</span></div>
                    <div className="font-mono text-[10px]"><span className="text-slate-500">Palpite:</span> <span className="text-amber-400 font-bold">1 x 1</span> | <span className="text-slate-500">Real:</span> <span className="text-white font-bold">2 x 2</span> <span className="text-emerald-400">→ +5 pts</span></div>
                  </div>
                </div>
                <p className="text-[10px] text-amber-500/80 italic font-medium">
                  ⚠️ Obs: Você não ganha +2 pontos extras por ter acertado os gols de um dos times (a maior pontuação, de 5 pontos, prevalece).
                </p>
              </div>

              {/* Rule 3 */}
              <div className="bg-slate-950/40 border border-emerald-950 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-400 text-xs italic">⚽ 3. Acerto do Placar de Apenas Um Time</span>
                  <span className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">2 Pontos</span>
                </div>
                <p className="text-slate-300 text-[11px]">Você errou o vencedor ou o empate do jogo, mas acertou a quantidade de gols que um dos dois times fez.</p>
                <div className="space-y-2 text-[11px]">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 space-y-1">
                    <div><span className="text-emerald-400 font-extrabold uppercase text-[9px] block mb-1">Caso A: Errou o vencedor, mas acertou gols de quem perdeu</span></div>
                    <div className="font-mono text-[10px]"><span className="text-slate-500">Palpite:</span> <span className="text-amber-400 font-bold">2 x 1 (A vence)</span> | <span className="text-slate-500">Real:</span> <span className="text-white font-bold">2 x 3 (B vence)</span> <span className="text-emerald-400">→ +2 pts (acertou gols do time A)</span></div>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 space-y-1">
                    <div><span className="text-emerald-400 font-extrabold uppercase text-[9px] block mb-1">Caso B: Errou o vencedor, mas acertou gols de quem ganhou</span></div>
                    <div className="font-mono text-[10px]"><span className="text-slate-500">Palpite:</span> <span className="text-amber-400 font-bold">1 x 0 (A vence)</span> | <span className="text-slate-500">Real:</span> <span className="text-white font-bold">2 x 0 (A vence)</span> <span className="text-amber-400">→ Prevalece regra de Vencedor (+5 pts)</span></div>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 space-y-1">
                    <div><span className="text-emerald-400 font-extrabold uppercase text-[9px] block mb-1">Caso C: Apostou em empate, mas um time venceu</span></div>
                    <div className="font-mono text-[10px]"><span className="text-slate-500">Palpite:</span> <span className="text-amber-400 font-bold">1 x 1 (empate)</span> | <span className="text-slate-500">Real:</span> <span className="text-white font-bold">2 x 1 (A vence)</span> <span className="text-emerald-400">→ +2 pts (acertou gols do time B)</span></div>
                  </div>
                </div>
              </div>

              {/* Rule 4 */}
              <div className="bg-slate-950/40 border border-emerald-950 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-red-400 text-xs italic">💩 4. Erro Total</span>
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">0 Pontos</span>
                </div>
                <p className="text-slate-300 text-[11px]">Você errou o vencedor/empate e também os gols de ambos os times.</p>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 font-mono text-[10px] space-y-1">
                  <div><span className="text-slate-500">Palpite:</span> <span className="text-amber-400 font-bold">1 x 0</span> | <span className="text-slate-500">Real:</span> <span className="text-white font-bold">2 x 2</span> <span className="text-red-400">→ 0 pts</span></div>
                  <div><span className="text-slate-500">Palpite:</span> <span className="text-amber-400 font-bold">1 x 1</span> | <span className="text-slate-500">Real:</span> <span className="text-white font-bold">3 x 0</span> <span className="text-red-400">→ 0 pts</span></div>
                  <div><span className="text-red-400 font-bold">Geb, o virgem:</span> Esqueceu de palpitar antes do jogo começar <span className="text-red-400">→ 0 pts</span></div>
                </div>
              </div>
            </div>

            <div className="border-t border-emerald-950 pt-4 mt-5 flex justify-end">
              <button
                onClick={() => setShowRulesModal(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-display font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Entendi as Regras!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Wizard Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          localStorage.setItem('gebolao_onboarding_seen', 'true');
          setShowOnboarding(false);
        }}
        isLoggedIn={!!currentUser}
        onJoinGroup={() => {
          setForceOpenRegister(true);
        }}
      />
    </div>
  );
}
