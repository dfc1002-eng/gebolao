import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Trophy, Award, Lock, Sparkles, HelpCircle, UserPlus } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onJoinGroup: () => void;
}

export function OnboardingModal({ isOpen, onClose, isLoggedIn, onJoinGroup }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  if (!isOpen) return null;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-55 backdrop-blur-xs">
      <div className="bg-slate-900 border border-emerald-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col justify-between min-h-[420px] font-sans">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-950 to-slate-900 border-b border-emerald-900 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles size={16} className="animate-pulse" />
            <span className="font-display font-black text-xs uppercase tracking-wider">Como Funciona o Bolão</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Slides */}
        <div className="p-6 flex-grow flex flex-col justify-center text-slate-100 text-xs">
          
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="text-center">
                <span className="bg-amber-400 text-green-950 px-3.5 py-0.5 rounded font-black text-xl skew-x-[-10deg] italic tracking-tight shadow-md inline-block">
                  GEBOLÃO SOLARIANO
                </span>
                <h3 className="font-extrabold text-sm text-white mt-3 uppercase tracking-wide">Bem-vindo à Copa do Mundo 2026!</h3>
              </div>
              <p className="text-slate-350 text-center leading-relaxed font-medium">
                Este é o nosso espaço oficial para palpites, zueira e disputa saudável. O objetivo é ver quem entende mais de futebol (ou quem tem mais sorte) e cornetar os amigos a cada rodada!
              </p>
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800 text-center text-[10px] text-emerald-400 font-bold">
                ⚽ 48 Seleções • 12 Grupos • 104 Jogos emocionante até a Grande Final!
              </div>
            </div>
          )}

          {/* STEP 2: SCORING RULES */}
          {step === 2 && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <h4 className="font-bold text-center text-white uppercase tracking-wider text-xs mb-1">Como Pontuar?</h4>
              
              <div className="grid grid-cols-1 gap-2.5">
                <div className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/15 text-amber-400 flex items-center justify-center font-black text-sm shrink-0 border border-amber-500/20">
                    🎯
                  </div>
                  <div>
                    <span className="font-black text-amber-400 uppercase italic tracking-wide text-[10px] block">Placar Cravado (+10 pontos)</span>
                    <span className="text-slate-400 text-[10px] leading-tight block">Acertar em cheio o resultado do jogo. Ex: Palpite: 2x1 | Final: 2x1.</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-500/20">
                    🏆
                  </div>
                  <div>
                    <span className="font-black text-emerald-400 uppercase italic tracking-wide text-[10px] block">Acertou o Vencedor (+5 pontos)</span>
                    <span className="text-slate-400 text-[10px] leading-tight block">Acertou quem ganhou ou se deu empate, mas errou o placar. Ex: Palpite: 2x0 | Final: 3x1.</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-black text-sm shrink-0 border border-blue-500/20">
                    ⚽
                  </div>
                  <div>
                    <span className="font-black text-blue-450 uppercase italic tracking-wide text-[10px] block">Gols de Um Time (+2 pontos)</span>
                    <span className="text-slate-400 text-[10px] leading-tight block">Errou o resultado, mas acertou os gols de um dos lados. Ex: Palpite: 1x0 | Final: 1x3.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BADGES */}
          {step === 3 && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <h4 className="font-bold text-center text-white uppercase tracking-wider text-xs mb-1">Medalhas e Títulos (Corneta)</h4>
              <p className="text-[10px] text-slate-400 text-center mb-2">A cada rodada finalizada, coroamos os melhores (e piores) com medalhas divertidas:</p>
              
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                <div className="bg-slate-950/30 border border-slate-850 p-2 rounded-xl flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div>
                    <span className="font-bold text-slate-200 block leading-tight">Chiquinho</span>
                    <span className="text-[9px] text-slate-400 block leading-none">Melhor da rodada</span>
                  </div>
                </div>

                <div className="bg-slate-950/30 border border-slate-850 p-2 rounded-xl flex items-center gap-2">
                  <span className="text-xl">🥈</span>
                  <div>
                    <span className="font-bold text-slate-200 block leading-tight">Pai Geb</span>
                    <span className="text-[9px] text-slate-400 block leading-none">Quem bateu na trave</span>
                  </div>
                </div>

                <div className="bg-slate-950/30 border border-slate-850 p-2 rounded-xl flex items-center gap-2">
                  <span className="text-xl">🤡</span>
                  <div>
                    <span className="font-bold text-slate-200 block leading-tight">Gebiada</span>
                    <span className="text-[9px] text-slate-400 block leading-none">Pior da rodada</span>
                  </div>
                </div>

                <div className="bg-slate-950/30 border border-slate-850 p-2 rounded-xl flex items-center gap-2">
                  <span className="text-xl">😴</span>
                  <div>
                    <span className="font-bold text-slate-200 block leading-tight">Geb, o virgem</span>
                    <span className="text-[9px] text-slate-400 block leading-none">Esqueceu de palpitar</span>
                  </div>
                </div>

                <div className="bg-slate-950/30 border border-slate-850 p-2 rounded-xl flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <div>
                    <span className="font-bold text-slate-200 block leading-tight">O Amigo do Primo da Jana</span>
                    <span className="text-[9px] text-slate-400 block leading-none">Mais placares exatos</span>
                  </div>
                </div>

                <div className="bg-slate-950/30 border border-slate-850 p-2 rounded-xl flex items-center gap-2">
                  <span className="text-xl">🐐</span>
                  <div>
                    <span className="font-bold text-slate-200 block leading-tight">GOAT: Geb, o chifrudo</span>
                    <span className="text-[9px] text-slate-400 block leading-none">Líder supremo geral</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PRIVACY AND GET STARTED */}
          {step === 4 && (
            <div className="space-y-4 text-center animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <Lock size={20} className="animate-pulse" />
              </div>
              <h4 className="font-bold text-white uppercase tracking-wider text-xs">Palpites 100% Secretos!</h4>
              <p className="text-slate-350 leading-relaxed font-medium px-4">
                Seus palpites ficam **ocultos** dos outros participantes até o jogo começar! Assim, ninguém pode copiar a sua estratégia.
              </p>
              
              <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-2.5 text-left text-[10px] space-y-1 text-slate-350 mx-4">
                <span className="font-bold text-amber-400 block uppercase tracking-wide">💡 Acesso em outro aparelho?</span>
                <span className="block leading-snug">
                  Não usamos senhas! Para entrar em outro celular ou PC, basta ir em <strong>"Unir-se ao Grupo"</strong> e preencher o seu nome e mesmo e-mail para recuperar todo o seu histórico.
                </span>
              </div>

              <div className="text-[10px] text-slate-400 font-bold pt-1">
                ⚠️ Os palpites trancam automaticamente no minuto em que o jogo começa. Não durma no ponto!
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Bar */}
        <div className="bg-slate-950/60 border-t border-slate-900 px-6 py-4 flex items-center justify-between font-display">
          {/* Progress Indicators */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  step === i + 1 ? 'bg-amber-400 w-5' : 'bg-slate-850'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 text-xs">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="bg-slate-850 hover:bg-slate-800 text-slate-350 px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Voltar</span>
              </button>
            )}

            {step < totalSteps ? (
              <button
                onClick={nextStep}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                <span>Avançar</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              !isLoggedIn ? (
                <button
                  onClick={() => {
                    onClose();
                    onJoinGroup();
                  }}
                  className="bg-amber-400 hover:bg-amber-350 text-green-950 font-black uppercase tracking-wide px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1 shadow"
                >
                  <UserPlus size={14} />
                  <span>Cadastrar-se!</span>
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="bg-emerald-600 hover:bg-emerald-505 text-white font-bold px-5 py-2 rounded-lg transition cursor-pointer"
                >
                  Entendi, Começar!
                </button>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
