import React, { useState } from 'react';
import { User, Ranking } from '../types';
import { LogIn, UserPlus, ShieldAlert, Award, UserCheck, Flame, RotateCcw } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  users: User[];
  rankings: Ranking[];
  onSelectUser: (user: User | null) => void;
  onRegisterUser: (nome: string, email: string) => Promise<void>;
  onResetDB: () => Promise<void>;
  isLoading: boolean;
  logoImage?: string;
  onUpdateLogo?: (newLogo: string) => Promise<void>;
}

export function Header({
  currentUser,
  users,
  rankings,
  onSelectUser,
  onRegisterUser,
  onResetDB,
  isLoading,
  logoImage,
  onUpdateLogo
}: HeaderProps) {
  const [showRegister, setShowRegister] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showResetWarning, setShowResetWarning] = useState(false);

  const [isSplat, setIsSplat] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleUploadLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateLogo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Find user's current ranking & position
  const userRank = rankings.find((r) => r.user_id === currentUser?.id);
  const totalUsers = users.length;

  const handleSubmitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim() || !newEmail.trim()) return;
    onRegisterUser(newNome, newEmail);
    setNewNome('');
    setNewEmail('');
    setShowRegister(false);
  };

  return (
    <header className="bg-green-700 border-b border-green-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand / Logo Comédia Pastelão */}
        <div className="flex items-center gap-4 relative">
          
          {/* Comical Logo Avatar Badge */}
          <div 
            className="relative cursor-pointer select-none shrink-0 group"
            onClick={() => setIsSplat(!isSplat)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {/* Funny sound bubbles popping up on hover/splat */}
            {isSplat && (
              <div className="absolute -top-4 -left-5 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-lg border border-red-500 uppercase tracking-tight animate-bounce z-20 shadow-md">
                💥 SPLAT!!
              </div>
            )}
            {isSplat && (
              <div className="absolute -bottom-3 -left-3 bg-amber-400 text-green-950 font-black text-[9px] px-1.5 py-0.5 rounded-lg border border-amber-500 uppercase tracking-tight z-20 shadow">
                🤡 CORNETOU!
              </div>
            )}
            {!isSplat && showTooltip && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-350 text-green-950 font-black text-[8px] whitespace-nowrap px-1.5 py-0.5 rounded border border-yellow-450 uppercase tracking-widest animate-pulse z-20 shadow-xs">
                🎯 CLIQUE PARA TACAR TOMATE!
              </div>
            )}

            {/* Logo Mask Frame Outer Container */}
            <div className={`w-14 h-14 rounded-xl border-2 border-amber-300 bg-green-900 shadow-md overflow-hidden relative transition-all duration-300 ${isSplat ? 'animate-shake scale-95 border-red-500 bg-red-900/40' : 'group-hover:scale-105 group-hover:rotate-6'}`}>
              
              {/* Default Caricature Room/Background */}
              <div className="absolute inset-0 bg-slate-800 flex flex-col justify-between">
                {/* Book shelves background lines */}
                <div className="h-4 border-b border-slate-700/60 bg-amber-950/20 flex gap-0.5 px-1 items-end pt-1">
                  <div className="w-2 h-2.5 bg-blue-500/70 rounded-xs"></div>
                  <div className="w-1.5 h-3 bg-red-500/70 rounded-xs"></div>
                  <div className="w-2.5 h-2 bg-emerald-500/75 rounded-xs"></div>
                  <div className="w-1.5 h-3.5 bg-yellow-400/60 rounded-xs"></div>
                </div>
                <div className="h-4 border-b border-slate-700/60 bg-amber-950/20 flex gap-0.5 px-2 items-end">
                  <div className="w-2 h-3 bg-red-500/70 rounded-xs"></div>
                  <div className="w-2 h-2 bg-indigo-500/70 rounded-xs"></div>
                </div>
                <div className="h-4 bg-amber-950/20"></div>
              </div>

              {/* Portrait Frame inside */}
              {logoImage ? (
                <div className="absolute inset-0 flex items-center justify-center p-[2px] z-10">
                  <img
                    src={logoImage}
                    alt="Geb Custom Logo"
                    className="w-full h-full object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  {/* Comical overlay elements of clown nose on custom photo! */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                    {/* Big red clown nose */}
                    <div className="w-3.5 h-3.5 bg-red-600 rounded-full border border-red-400 ring-2 ring-red-300 shadow-lg animate-pulse"></div>
                  </div>
                </div>
              ) : (
                /* Default Caricature Illustration of Geb built visually */
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pt-2 selection:bg-none">
                  
                  {/* Hair */}
                  <div className="w-7 h-2.5 bg-slate-400/80 rounded-t-full -mb-0.5"></div>
                  
                  {/* Ears */}
                  <div className="absolute top-[21px] left-2.5 w-1.5 h-2 bg-amber-100 rounded-full"></div>
                  <div className="absolute top-[21px] right-2.5 w-1.5 h-2 bg-amber-100 rounded-full"></div>

                  {/* Face base */}
                  <div className="w-8 h-9 bg-amber-100 rounded-full border border-slate-700/50 flex flex-col items-center pt-0.5 relative">
                    
                    {/* Eyebrows */}
                    <div className="flex gap-1.5 -mb-0.5">
                      <div className="w-2 h-0.5 bg-slate-600 rounded-sm"></div>
                      <div className="w-2 h-0.5 bg-slate-600 rounded-sm"></div>
                    </div>

                    {/* Spectacles/Glasses (Golden wire frames) */}
                    <div className={`flex gap-0.5 -mt-0.5 items-center transition-all duration-300 ${isSplat ? '-rotate-12 translate-y-0.5' : ''}`}>
                      <div className="w-[13px] h-[13px] rounded-full border border-amber-600 bg-amber-200/20 flex items-center justify-center relative shadow-inner">
                        <div className="w-1 h-1 bg-black rounded-full"></div>
                      </div>
                      <div className="w-1.5 h-0.5 bg-amber-600"></div>
                      <div className="w-[13px] h-[13px] rounded-full border border-amber-600 bg-amber-200/20 flex items-center justify-center relative shadow-inner">
                        <div className="w-1 h-1 bg-black rounded-full"></div>
                      </div>
                    </div>

                    {/* Nose - Clown Nose overlay */}
                    <div className="w-3 h-3 bg-red-600 rounded-full border border-red-500 absolute top-3.5 left-1/2 -translate-x-1/2 z-20 shadow ring-1 ring-red-400 scale-95 flex items-center justify-center">
                    </div>

                    {/* Mouth (Flat line representing deadpan serious expression) */}
                    <div className={`w-3.5 h-0.5 bg-slate-800 mt-[6px] transition-all duration-300 ${isSplat ? 'rotate-6 bg-red-800' : ''}`}></div>
                  </div>

                  {/* Collar / White shirt */}
                  <div className="w-7 h-3 bg-white border-t border-slate-300 rounded-t-sm flex justify-center -mt-0.5 z-10 shadow-xs">
                    <div className="w-1.5 h-full bg-slate-200"></div>
                  </div>
                </div>
              )}

              {/* Tomato Splatter Splash Overlay */}
              {isSplat && (
                <div className="absolute inset-0 bg-red-600/40 z-30 flex items-center justify-center animate-ping-once pointer-events-none">
                  {/* Splat paint SVG overlay */}
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-red-600 animate-scale-up absolute top-0 left-0 p-1 opacity-90">
                    <path d="M50 15c-3 0-5 5-8 5s-6-4-9-2c-3 2 1 9 0 12c-2 2-8 0-9 3c-1 3 6 5 6 8s-6 7-4 10c2 3 8-1 10 2c1 3-3 8-1 10c2 2 7-3 9-2c3 1 1 8 4 8c3 0 5-5 8-5s6 4 9 2c3-2-1-9 0-12c2-2 8 0 9-3c1-3-6-5-6-8s6-7 4-10c-2-3-8 1-10-2c-1-3 3-8 1-10c-2-2-7 3-9 2z" />
                    <circle cx="25" cy="30" r="4" />
                    <circle cx="75" cy="40" r="5" />
                    <circle cx="40" cy="80" r="3" />
                  </svg>
                  <span className="text-[14px] font-black italic select-none absolute z-40 text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">SPLAT!</span>
                </div>
              )}
            </div>

            {/* Custom file input gear button to change Geb photo */}
            {onUpdateLogo && (
              <label 
                className="absolute -bottom-1 -right-1 bg-amber-400 hover:bg-amber-350 border-2 border-green-800 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer shadow-md select-none transition-transform hover:scale-115 z-20" 
                title="Mudar foto do Geb"
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleUploadLogoFile} 
                  className="hidden" 
                />
                <span className="text-[9px]">📸</span>
              </label>
            )}
          </div>

          {/* Logo Brand / Text layout */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-amber-400 text-green-950 px-3.5 py-0.5 rounded font-black text-xl md:text-2xl skew-x-[-12deg] italic tracking-tight shadow-md select-none transition-transform hover:scale-105 active:scale-95 inline-block">
                GEBOLÃO
              </span>
              <span className="text-[10px] md:text-[11px] bg-red-600 text-white font-extrabold uppercase italic px-1.5 py-0.2 rounded-lg border border-red-500 tracking-tight animate-pulse shrink-0 shadow-xs">
                {isSplat ? "PASTELÃO! 🍅" : "O PÉ FRIO! 🤡"}
              </span>
            </div>
            <div className="hidden sm:block pl-1.5 border-l-2 border-green-500/50 mt-1">
              <h1 className="text-[10px] uppercase font-bold tracking-widest text-white leading-none">Copa do Mundo 2026</h1>
              <p className="text-[9px] text-green-200 font-semibold mt-0.5">O Bolão Mais Comédia e Corneteiro do Grupo de Amigos</p>
            </div>
          </div>

        </div>

        {/* User Stats & Switcher Area */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Quick Switch Select Dropdown */}
          <div className="flex items-center gap-2 bg-green-850/80 border border-green-600/40 px-2.5 py-1.5 rounded-lg text-xs w-full sm:w-auto shadow-inner">
            <label className="text-green-150 whitespace-nowrap flex items-center gap-1 font-bold text-green-100">
              <UserCheck size={14} className="text-amber-300" />
              <span>Simular Competidor:</span>
            </label>
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                const selected = users.find((u) => u.id === e.target.value);
                onSelectUser(selected || null);
              }}
              className="bg-green-900 text-white border-none outline-none focus:ring-0 cursor-pointer max-w-[150px] font-black uppercase text-[11px] rounded px-1 h-6 py-0"
            >
              <option value="" className="bg-slate-900 text-slate-350">-- Visitante (Deslogado) --</option>
              {users.map((u) => {
                const rank = rankings.find((r) => r.user_id === u.id);
                return (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                    {u.nome} {rank ? `(${rank.pontos_totais} pts)` : ''} {u.isAdmin ? '👑' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Create User Button */}
          <button
            onClick={() => setShowRegister(true)}
            className="bg-amber-400 hover:bg-amber-350 active:scale-95 text-green-950 font-black tracking-wider uppercase text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            id="btn-cadastrar-participante"
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">Unir-se ao Grupo</span>
          </button>

          {/* Quick Reset State Button */}
          <button
            onClick={() => setShowResetWarning(true)}
            className="bg-green-800 hover:bg-green-600 text-green-100 border border-green-650 p-2 rounded-lg transition-all cursor-pointer"
            title="Resetar Banco de Dados do Demo"
            id="btn-redefinir-demo"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Sub-Header: Active User Identity Block */}
      {currentUser && (
        <div className="bg-green-900 border-t border-green-950/40 px-4 py-2.5 text-xs text-white">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar_url}
                alt={currentUser.nome}
                className="w-9 h-9 rounded-full border-2 border-amber-400 bg-white p-[1.5px] object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-green-200 font-medium">Simulando competidor: </span>
                <span className="font-extrabold text-amber-300 uppercase tracking-wide text-xs">{currentUser.nome}</span>
                {currentUser.isAdmin && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-amber-400 text-green-950 rounded font-display text-[9px] uppercase font-black">
                    Admin / Presidente
                  </span>
                )}
              </div>
            </div>

            {/* Quick stats badges */}
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1 text-green-100 font-bold">
                <Award size={13} className="text-amber-300" />
                <span>Colocação: </span>
                <span className="font-extrabold text-white text-xs bg-green-800/50 px-2 py-0.5 rounded border border-green-700/50">
                  {userRank ? `${userRank.posicao}º` : 'S/P'} <span className="text-green-300 font-normal">/ {totalUsers}</span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-green-100 font-bold">
                <Flame size={13} className="text-amber-300" />
                <span>Meus Pontos: </span>
                <span className="font-black text-amber-400 text-sm bg-green-805/85 px-2.5 py-0.5 rounded border border-green-800">
                  {userRank ? userRank.pontos_totais : 0} <span className="text-[10px] text-white font-normal">pts</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register user modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-900 border border-emerald-900 p-6 rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-md font-display font-bold text-white flex items-center gap-2 mb-2">
              <UserPlus className="text-emerald-400" size={18} />
              <span>Participar do GEBolão</span>
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Informe seu nome de exibição e e-mail para cadastrar sua conta. Você será logado instantaneamente para palpitar!
            </p>
            <form onSubmit={handleSubmitRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Seu Nome / Apelido</label>
                <input
                  type="text"
                  required
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex: João Da Copa, Cornetinha..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-slate-100 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Apelido Postal (E-mail)</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Ex: joao@campeao.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-slate-100 text-xs outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs transition duration-250 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition duration-250 flex items-center gap-1 cursor-pointer"
                >
                  Entrar no Bolão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Database Warning Confirmation Modal */}
      {showResetWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-slate-900 border border-red-900/50 p-6 rounded-xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-md font-display font-bold text-red-400 flex items-center gap-2 mb-2">
              <ShieldAlert size={18} />
              <span>Restaurar Demo?</span>
            </h3>
            <p className="text-slate-400 text-xs mb-4 leading-relaxed">
              Isso apagará novas contas criadas, palpites customizados e redefinirá os resultados dos jogos de volta ao estado inicial com os participantes de teste. Deseja prosseguir?
            </p>
            <div className="flex justify-end gap-2 font-display">
              <button
                type="button"
                onClick={() => setShowResetWarning(false)}
                className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs transition duration-250 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowResetWarning(false);
                  await onResetDB();
                }}
                className="px-3 py-2 rounded-lg bg-red-650 hover:bg-red-500 text-white text-xs font-bold transition duration-250 cursor-pointer"
              >
                Sim, Redefinir Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
