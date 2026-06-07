import React, { useState } from 'react';
import { User, Match, Ranking } from '../types';
import { Shield, Plus, Upload, Play, Check, AlertTriangle, RefreshCw, RefreshCw as ResetIcon } from 'lucide-react';

interface AdminViewProps {
  currentUser: User | null;
  matches: Match[];
  rankings: Ranking[];
  onUpdateMatchScore: (matchId: string, golsCasa: number | null, golsFora: number | null, status: 'unplayed' | 'completed') => Promise<void>;
  onRegisterUser: (nome: string, email: string) => Promise<void>;
  onImportMatches: (matchesJSON: any[]) => Promise<void>;
  onResetDB: () => Promise<void>;
  isLoading: boolean;
  users: User[];
  onToggleAdmin: (userId: string) => Promise<void>;
  onRefreshState?: () => Promise<void>;
}

export function AdminView({
  currentUser,
  matches,
  rankings,
  onUpdateMatchScore,
  onRegisterUser,
  onImportMatches,
  onResetDB,
  isLoading,
  users,
  onToggleAdmin,
  onRefreshState
}: AdminViewProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<'jogos' | 'usuarios' | 'importar'>('jogos');

  // Local state for external URL Synchronization from kickoff clock
  const [syncUrl, setSyncUrl] = useState('https://worldcup26.ir/get/games');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSyncUrlSubmit = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch('/api/match/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: syncUrl })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição de sincronização de jogos.');
      }
      setSyncResult({
        type: 'success',
        message: data.message
      });
      if (onRefreshState) {
        await onRefreshState();
      }
    } catch (err: any) {
      setSyncResult({
        type: 'error',
        message: err.message || 'Falha ao sincronizar jogos a partir da URL.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Local state for adding match score
  const [editingScore, setEditingScore] = useState<{ [matchId: string]: { casa: string; fora: string } }>({});
  const [savingMatches, setSavingMatches] = useState<{ [matchId: string]: boolean }>({});

  // Local state for adding custom participant
  const [usrNome, setUsrNome] = useState('');
  const [usrEmail, setUsrEmail] = useState('');
  const [usrSuccess, setUsrSuccess] = useState('');

  // Local state for importing matches JSON
  const [jsonText, setJsonText] = useState(`[
  {
    "id": "imported-final-sofi",
    "fase": "Grande Final",
    "time_casa": "Brasil",
    "time_fora": "Alemanha",
    "bandeira_casa": "🇧🇷",
    "bandeira_fora": "🇩🇪",
    "data_hora": "2026-07-19T20:00:00Z",
    "estadio": "MetLife Stadium, NJ",
    "status": "unplayed"
  }
]`);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check if current user is indeed an administrator
  if (!currentUser?.isAdmin) {
    return (
      <div className="bg-red-950/20 border border-red-900/40 p-12 rounded-2xl text-center flex flex-col items-center max-w-lg mx-auto my-12 animate-in fade-in duration-200">
        <AlertTriangle className="text-red-500 mb-3" size={40} />
        <h3 className="font-display font-black text-red-500 text-lg uppercase">Área Restrita</h3>
        <p className="text-xs text-slate-300 leading-relaxed mt-2">
          Somente o administrador do GEBolão tem autorização para acessar esta área, atualizar os placares oficiais dos jogos e simular os novos rankings do grupo de amigos!
        </p>
        <p className="text-[11px] text-slate-500 font-mono mt-4">
          Dica rápida: Use o menu "Simular Usuário" no topo para alternar para "Diogo Camargo (Admin/GOAT)"!
        </p>
      </div>
    );
  }

  // Handle local change of goals
  const handleScoreChange = (matchId: string, team: 'casa' | 'fora', val: string) => {
    if (val !== '' && !/^\d+$/.test(val)) return;
    setEditingScore((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId] || { casa: '', fora: '' },
        [team]: val
      }
    }));
  };

  // Submit match final score
  const handleSaveScore = async (matchId: string, clean: boolean = false) => {
    setSavingMatches((prev) => ({ ...prev, [matchId]: true }));
    try {
      if (clean) {
        // Reset to unplayed
        await onUpdateMatchScore(matchId, null, null, 'unplayed');
      } else {
        const goals = editingScore[matchId];
        if (!goals || goals.casa === '' || goals.fora === '') {
          alert('Preencha os números antes de salvar o resultado oficial!');
          return;
        }
        await onUpdateMatchScore(matchId, parseInt(goals.casa, 10), parseInt(goals.fora, 10), 'completed');
      }
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    } finally {
      setSavingMatches((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  // Standard submit for register friend
  const handleRegisterFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usrNome.trim() || !usrEmail.trim()) return;

    try {
      await onRegisterUser(usrNome, usrEmail);
      setUsrSuccess(`Participante ${usrNome} registrado no banco com sucesso e incluído na tabela geral!`);
      setUsrNome('');
      setUsrEmail('');
      setTimeout(() => setUsrSuccess(''), 5000);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  // JSON Import parser
  const handleImportSubmit = async () => {
    setImportStatus(null);
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('O JSON enviado deve conter obrigatoriamente uma lista (array) de objetos de jogo.');
      }
      await onImportMatches(parsed);
      setImportStatus({ type: 'success', message: 'Jogos importados com sucesso na tabela oficial!' });
    } catch (err: any) {
      setImportStatus({ type: 'error', message: err.message || 'Falha de formatação JSON' });
    }
  };

  const handleQuickLoadTemplate = () => {
    const template = [
      {
        "id": "real-temp-1",
        "fase": "Semifinal 1",
        "time_casa": "Brasil",
        "time_fora": "França",
        "bandeira_casa": "🇧🇷",
        "bandeira_fora": "🇫🇷",
        "data_hora": "2026-07-14T20:00:00Z",
        "estadio": "SoFi Stadium, Los Angeles",
        "status": "unplayed"
      },
      {
        "id": "real-temp-2",
        "fase": "Semifinal 2",
        "time_casa": "Espanha",
        "time_fora": "Alemanha",
        "bandeira_casa": "🇪🇸",
        "bandeira_fora": "🇩🇪",
        "data_hora": "2026-07-15T20:00:00Z",
        "estadio": "MetLife Stadium, NJ",
        "status": "unplayed"
      }
    ];
    setJsonText(JSON.stringify(template, null, 2));
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 to-slate-900 border-b border-emerald-900 px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="font-display font-black text-white text-md uppercase tracking-tight">Console de Administração</h2>
            <p className="text-xs text-slate-400">Gerenciador absoluto de dados, resultados e palpites</p>
          </div>
        </div>
        <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded">
          Presidente do Bolão
        </span>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {/* Navigation Selector Tabs inside the panel */}
        <div className="flex border-b border-slate-900 gap-1 pb-1 text-xs font-display">
          <button
            onClick={() => setActiveAdminTab('jogos')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeAdminTab === 'jogos'
                ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            Atualizar Resultados
          </button>
          <button
            onClick={() => setActiveAdminTab('usuarios')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeAdminTab === 'usuarios'
                ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            Cadastrar Concorrentes
          </button>
          <button
            onClick={() => setActiveAdminTab('importar')}
            className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeAdminTab === 'importar'
                ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            Importar Jogos (JSON)
          </button>
        </div>

        {/* --- TAB 1: MODIFICAÇÃO DE JOGOS --- */}
        {activeAdminTab === 'jogos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Insira os resultados finais abaixo para computar os pontos dos amigos:</span>
              <span className="text-slate-500 italic">As pontuações dependem de cada encerramento.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => {
                const localGoals = editingScore[m.id];
                const inputCasa = localGoals?.casa !== undefined ? localGoals.casa : (m.gols_casa !== null ? String(m.gols_casa) : '');
                const inputFora = localGoals?.fora !== undefined ? localGoals.fora : (m.gols_fora !== null ? String(m.gols_fora) : '');

                return (
                  <div key={m.id} className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between gap-3 relative">
                    <div className="flex justify-between items-center bg-slate-950/40 p-1.5 rounded text-[10px]">
                      <span className="font-bold text-emerald-400">{m.fase}</span>
                      <span className={`font-mono px-1.5 py-0.2. rounded text-[9px] ${
                        m.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {m.status === 'completed' ? 'Encerrado' : 'Aberto'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-1">
                      {/* Home */}
                      <div className="flex items-center gap-1.5 w-1/3">
                        <span className="text-xl">{m.bandeira_casa}</span>
                        <span className="font-bold text-xs truncate text-slate-205">{m.time_casa}</span>
                      </div>

                      {/* Inputs panel */}
                      <div className="flex items-center gap-1.5 justify-center w-1/3">
                        <input
                          type="text"
                          value={inputCasa}
                          onChange={(e) => handleScoreChange(m.id, 'casa', e.target.value)}
                          placeholder="-"
                          className="bg-slate-950 font-black text-center text-sm w-8 h-8 rounded border border-slate-850 outline-none text-white focus:border-emerald-500"
                        />
                        <span className="text-slate-500 text-xs">x</span>
                        <input
                          type="text"
                          value={inputFora}
                          onChange={(e) => handleScoreChange(m.id, 'fora', e.target.value)}
                          placeholder="-"
                          className="bg-slate-950 font-black text-center text-sm w-8 h-8 rounded border border-slate-850 outline-none text-white focus:border-emerald-500"
                        />
                      </div>

                      {/* Away */}
                      <div className="flex items-center justify-end gap-1.5 w-1/3 text-right">
                        <span className="font-bold text-xs truncate text-slate-205">{m.time_fora}</span>
                        <span className="text-xl">{m.bandeira_fora}</span>
                      </div>
                    </div>

                    {/* Action Panel for match scoring */}
                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-950/20">
                      {m.status === 'completed' && (
                        <button
                          onClick={() => handleSaveScore(m.id, true)}
                          disabled={savingMatches[m.id]}
                          className="bg-slate-850 hover:bg-slate-800 text-slate-300 px-3 py-1.5 text-[10px] items-center rounded-lg cursor-pointer transition flex gap-1"
                        >
                          <RefreshCw size={10} className="animate-spin-slow" />
                          <span>Reabrir Jogo</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleSaveScore(m.id, false)}
                        disabled={savingMatches[m.id]}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-display font-black px-3 py-1.5 text-[10px] items-center rounded-lg cursor-pointer transition"
                      >
                        {m.status === 'completed' ? 'Salvar Novo Placar' : 'Salvar Resultado'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- TAB 2: CRIAÇÃO DE USUÁRIOS --- */}
        {activeAdminTab === 'usuarios' && (
          <div className="max-w-md mx-auto py-4 space-y-4 font-display">
            <h3 className="font-bold text-xs text-slate-350">Adicione novos amigos fictícios ou reais no banco de dados para criar competidores adicionais no ranking:</h3>

            {usrSuccess && (
              <div className="bg-emerald-950/30 border border-emerald-900/30 text-emerald-450 text-xs px-3 py-2.5 rounded-lg">
                {usrSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterFriend} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-450 mb-1">Nome Completo / Apelido</label>
                <input
                  type="text"
                  required
                  value={usrNome}
                  onChange={(e) => setUsrNome(e.target.value)}
                  placeholder="Ex: Pedro Craque, Chiquinho Jr..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-450 mb-1">E-mail de Identificação</label>
                <input
                  type="email"
                  required
                  value={usrEmail}
                  onChange={(e) => setUsrEmail(e.target.value)}
                  placeholder="Ex: pedro@golsdomeu.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold text-xs py-2 rounded-lg transition duration-220 cursor-pointer flex items-center justify-center gap-1"
                id="btn-admin-criar-competidor"
              >
                <Plus size={14} />
                <span>Salvar Novo Competidor</span>
              </button>
            </form>

            {/* List of existing users with Admin toggles */}
            <div className="border-t border-slate-900 pt-6 mt-6 space-y-3">
              <h4 className="font-bold text-xs text-slate-350 uppercase tracking-wider">Gerenciar Administradores</h4>
              <p className="text-[10px] text-slate-500">Promova participantes confiáveis para ajudar na atualização dos placares oficiais do bolão.</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {users.map((u) => (
                  <div key={u.id} className="bg-slate-900/40 border border-slate-850 px-4 py-2.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={u.avatar_url} alt={u.nome} className="w-8 h-8 rounded-full object-cover border border-slate-800 bg-slate-900" />
                      <div>
                        <span className="font-bold text-white block">{u.nome}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{u.email}</span>
                      </div>
                    </div>
                    <div>
                      {u.id === 'user-diego' ? (
                        <span className="bg-emerald-500/10 text-emerald-450 border border-emerald-900/40 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded">Presidente (Dono)</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleAdmin(u.id)}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition duration-150 cursor-pointer ${
                            u.isAdmin
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-900/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-700'
                          }`}
                        >
                          {u.isAdmin ? '👑 Admin (Remover)' : 'Promover a Admin'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: IMPORTAÇÃO MANUAL OU SINCRONIZAÇÃO KICKOFF CLOCK --- */}
        {activeAdminTab === 'importar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-display text-slate-300">
            
            {/* Direct URL Sync */}
            <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl space-y-4">
              <div className="space-y-1">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block">Mecanismo de Conexão</span>
                <h4 className="font-extrabold text-sm text-white">Sincronizador Kickoff Clock</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Conecte o GEBolão com a base oficial de jogos. Nós traduzimos os estádios, datas e o nome das seleções automaticamente com bandeiras divertidas instaladas na hora!
                </p>
              </div>

              {syncResult && (
                <div className={`p-3 rounded-lg text-xs border leading-relaxed ${
                  syncResult.type === 'success' 
                    ? 'bg-emerald-950/25 text-emerald-450 border-emerald-900/40' 
                    : 'bg-red-950/25 text-red-400 border-red-900/40'
                }`}>
                  {syncResult.message}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs text-slate-400">Insira a URL JSON de sincronização dos jogos:</label>
                <input
                  type="text"
                  value={syncUrl}
                  onChange={(e) => setSyncUrl(e.target.value)}
                  placeholder="https://www.kickoffclock.com/download.json"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleSyncUrlSubmit}
                disabled={isSyncing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 text-xs font-black py-2.5 rounded-lg transition duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Conectando e Processando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Sincronizar de URL (Kickoff Clock)</span>
                  </>
                )}
              </button>

              <div className="bg-slate-950/40 border border-slate-900/80 p-3 rounded-lg text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
                <span className="font-extrabold text-slate-300 block uppercase tracking-tight text-[9px] italic">🛡️ Segurança Anti-Quotas Integrada</span>
                <p>
                  Não se preocupe com o status do site! Caso o endereço externo da Kickoff Clock retorne um status inválido (ex: Erro 404), o GEBolão gera de forma inteligente uma base de dados local simulada com os times da Copa do Mundo 2026.
                </p>
              </div>
            </div>

            {/* Manual JSON Import Console */}
            <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <span className="bg-slate-850 text-slate-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block">Avançado</span>
                  <h4 className="font-extrabold text-sm text-white">Importador JSON Manual</h4>
                </div>
                <button
                  onClick={handleQuickLoadTemplate}
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                >
                  Carregar Exemplo
                </button>
              </div>

              {importStatus && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                  importStatus.type === 'success' ? 'bg-emerald-950/20 text-emerald-450 border border-emerald-900/30' : 'bg-red-950/20 text-red-400 border border-red-900/40'
                }`}>
                  {importStatus.message}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs text-slate-400">Cole uma estrutura de lista JSON de jogos:</label>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-[10px] font-mono text-slate-300 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleImportSubmit}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <Upload size={14} />
                <span>Salvar Jogos do Console</span>
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
