import { User, Match, Prediction, Badge, UserBadge, RoundScore, Ranking, GameState } from './types';

export const initialUsers: User[] = [
  {
    id: 'user-diego',
    nome: 'Diego (Admin/GOAT)',
    email: 'diocamargo1002@gmail.com',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    isAdmin: true
  },
  {
    id: 'user-chiquinho',
    nome: 'Chiquinho Expert',
    email: 'chiquinho@gebolao.com',
    avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&h=150&q=80',
    isAdmin: false
  },
  {
    id: 'user-fabio',
    nome: 'Fábio "Quase Lá"',
    email: 'fabio@gebolao.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    isAdmin: false
  },
  {
    id: 'user-geb',
    nome: 'Geb "O Pé Frio"',
    email: 'geb@gebolao.com',
    avatar_url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80',
    isAdmin: false
  },
  {
    id: 'user-dorminhoco',
    nome: 'Soneca Geb Virgem',
    email: 'soneca@gebolao.com',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
    isAdmin: false
  }
];

export const initialBadges: Badge[] = [
  {
    id: 'badge-chiquinho',
    nome: 'Chiquinho, Sou Teu Fã',
    descricao: 'Melhor participante da rodada (maior pontuação, desempate por mais exatos).',
    icone: '🏆',
    tipo: 'chiquinho'
  },
  {
    id: 'badge-fabio',
    nome: 'Fábio Quase Lá',
    descricao: 'O participante que mais bateu na trave (errou placares por apenas 1 gol).',
    icone: '🥈',
    tipo: 'fabio'
  },
  {
    id: 'badge-gebiada',
    nome: 'Gebiada da Rodada',
    descricao: 'Pior desempenho da rodada (menor pontuação com palpites feitos).',
    icone: '🤡',
    tipo: 'gebiada'
  },
  {
    id: 'badge-virgem',
    nome: 'Geb Virgem',
    descricao: 'Dormiu no ponto! Não realizou nenhum palpite na rodada.',
    icone: '😴',
    tipo: 'virgem'
  },
  {
    id: 'badge-aguia',
    nome: 'O Amigo do Primo da Jana',
    descricao: 'Lenda dos placares exatos! Maior número de acertos exatos na rodada.',
    icone: '🎯',
    tipo: 'aguia'
  },
  {
    id: 'badge-chamas',
    nome: 'Em Chamas',
    descricao: 'Consistência pura! Três rodadas consecutivas acima da média.',
    icone: '🔥',
    tipo: 'chamas'
  },
  {
    id: 'badge-goat',
    nome: 'GOAT do Bolão',
    descricao: 'Líder supremo na classificação geral acumulada!',
    icone: '🐐',
    tipo: 'goat'
  }
];

export const initialMatches: Match[] = [
  // --- AMISTOSOS - R1 (Completed for instant action) ---
  {
    id: 'm-r1-1',
    fase: 'Amistosos - R1',
    time_casa: 'EUA',
    time_fora: 'México',
    bandeira_casa: '🇺🇸',
    bandeira_fora: '🇲🇽',
    data_hora: '2026-06-02T18:00:00Z',
    estadio: 'Estádio Azteca, Cidade do México',
    gols_casa: 2,
    gols_fora: 1,
    status: 'completed'
  },
  {
    id: 'm-r1-2',
    fase: 'Amistosos - R1',
    time_casa: 'Brasil',
    time_fora: 'Croácia',
    bandeira_casa: '🇧🇷',
    bandeira_fora: '🇭🇷',
    data_hora: '2026-06-03T20:00:00Z',
    estadio: 'MetLife Stadium, East Rutherford',
    gols_casa: 3,
    gols_fora: 1,
    status: 'completed'
  },
  {
    id: 'm-r1-3',
    fase: 'Amistosos - R1',
    time_casa: 'Argentina',
    time_fora: 'França',
    bandeira_casa: '🇦🇷',
    bandeira_fora: '🇫🇷',
    data_hora: '2026-06-04T15:00:00Z',
    estadio: 'SoFi Stadium, Los Angeles',
    gols_casa: 2,
    gols_fora: 2,
    status: 'completed'
  },
  {
    id: 'm-r1-4',
    fase: 'Amistosos - R1',
    time_casa: 'Espanha',
    time_fora: 'Alemanha',
    bandeira_casa: '🇪🇸',
    bandeira_fora: '🇩🇪',
    data_hora: '2026-06-05T21:00:00Z',
    estadio: 'Hard Rock Stadium, Miami',
    gols_casa: 1,
    gols_fora: 1,
    status: 'completed'
  },

  // --- AMISTOSOS - R2 (Completed for instant action) ---
  {
    id: 'm-r2-1',
    fase: 'Amistosos - R2',
    time_casa: 'Brasil',
    time_fora: 'Argentina',
    bandeira_casa: '🇧🇷',
    bandeira_fora: '🇦🇷',
    data_hora: '2026-06-07T20:00:00Z',
    estadio: 'SoFi Stadium, Los Angeles',
    gols_casa: 2,
    gols_fora: 1,
    status: 'completed'
  },
  {
    id: 'm-r2-2',
    fase: 'Amistosos - R2',
    time_casa: 'Alemanha',
    time_fora: 'França',
    bandeira_casa: '🇩🇪',
    bandeira_fora: '🇫🇷',
    data_hora: '2026-06-08T18:00:00Z',
    estadio: 'MetLife Stadium, East Rutherford',
    gols_casa: 0,
    gols_fora: 2,
    status: 'completed'
  },
  {
    id: 'm-r2-3',
    fase: 'Amistosos - R2',
    time_casa: 'Canadá',
    time_fora: 'EUA',
    bandeira_casa: '🇨🇦',
    bandeira_fora: '🇺🇸',
    data_hora: '2026-06-09T21:00:00Z',
    estadio: 'BMO Field, Toronto',
    gols_casa: 1,
    gols_fora: 3,
    status: 'completed'
  },
  {
    id: 'm-r2-4',
    fase: 'Amistosos - R2',
    time_casa: 'Portugal',
    time_fora: 'Uruguai',
    bandeira_casa: '🇵🇹',
    bandeira_fora: '🇺🇾',
    data_hora: '2026-06-10T15:00:00Z',
    estadio: 'Hard Rock Stadium, Miami',
    gols_casa: 1,
    gols_fora: 1,
    status: 'completed'
  },

  // --- COPA DO MUNDO 2026 (Unplayed real group stage matches) ---
  {
    id: 'm-r3-1',
    fase: 'Copa do Mundo 2026',
    time_casa: 'México',
    time_fora: 'Equador',
    bandeira_casa: '🇲🇽',
    bandeira_fora: '🇪🇨',
    data_hora: '2026-06-11T18:00:00Z',
    estadio: 'Estádio Azteca, Cidade do México',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  {
    id: 'm-r3-2',
    fase: 'Copa do Mundo 2026',
    time_casa: 'Inglaterra',
    time_fora: 'Camarões',
    bandeira_casa: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    bandeira_fora: '🇨🇲',
    data_hora: '2026-06-11T21:00:00Z',
    estadio: 'Estádio Guadalajara, Zapopan',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  {
    id: 'm-r3-3',
    fase: 'Copa do Mundo 2026',
    time_casa: 'Canadá',
    time_fora: 'Tunísia',
    bandeira_casa: '🇨🇦',
    bandeira_fora: '🇹🇳',
    data_hora: '2026-06-12T15:00:00Z',
    estadio: 'BMO Field, Toronto',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  {
    id: 'm-r3-4',
    fase: 'Copa do Mundo 2026',
    time_casa: 'França',
    time_fora: 'Japão',
    bandeira_casa: '🇫🇷',
    bandeira_fora: '🇯🇵',
    data_hora: '2026-06-12T18:00:00Z',
    estadio: 'BC Place, Vancouver',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  {
    id: 'm-r3-5',
    fase: 'Copa do Mundo 2026',
    time_casa: 'EUA',
    time_fora: 'Paraguai',
    bandeira_casa: '🇺🇸',
    bandeira_fora: '🇵🇾',
    data_hora: '2026-06-12T20:00:00Z',
    estadio: 'SoFi Stadium, Los Angeles',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  {
    id: 'm-r3-6',
    fase: 'Copa do Mundo 2026',
    time_casa: 'Espanha',
    time_fora: 'Nigéria',
    bandeira_casa: '🇪🇸',
    bandeira_fora: '🇳🇬',
    data_hora: '2026-06-12T22:30:00Z',
    estadio: 'MetLife Stadium, East Rutherford',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  {
    id: 'm-r3-7',
    fase: 'Copa do Mundo 2026',
    time_casa: 'Brasil',
    time_fora: 'Coreia do Sul',
    bandeira_casa: '🇧🇷',
    bandeira_fora: '🇰🇷',
    data_hora: '2026-06-13T15:00:00Z',
    estadio: 'MetLife Stadium, East Rutherford',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  {
    id: 'm-r3-8',
    fase: 'Copa do Mundo 2026',
    time_casa: 'Alemanha',
    time_fora: 'Marrocos',
    bandeira_casa: '🇩🇪',
    bandeira_fora: '🇲🇦',
    data_hora: '2026-06-13T18:00:00Z',
    estadio: 'SoFi Stadium, Los Angeles',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  {
    id: 'm-r3-9',
    fase: 'Copa do Mundo 2026',
    time_casa: 'Argentina',
    time_fora: 'Costa Rica',
    bandeira_casa: '🇦🇷',
    bandeira_fora: '🇨🇷',
    data_hora: '2026-06-14T19:00:00Z',
    estadio: 'Hard Rock Stadium, Miami',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  {
    id: 'm-r3-10',
    fase: 'Copa do Mundo 2026',
    time_casa: 'Itália',
    time_fora: 'Senegal',
    bandeira_casa: '🇮🇹',
    bandeira_fora: '🇸🇳',
    data_hora: '2026-06-14T22:00:00Z',
    estadio: 'Mercedes-Benz Stadium, Atlanta',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  {
    id: 'm-r3-11',
    fase: 'Copa do Mundo 2026',
    time_casa: 'Portugal',
    time_fora: 'Egito',
    bandeira_casa: '🇵🇹',
    bandeira_fora: '🇪🇬',
    data_hora: '2026-06-15T15:00:00Z',
    estadio: 'Mercedes-Benz Stadium, Atlanta',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  {
    id: 'm-r3-12',
    fase: 'Copa do Mundo 2026',
    time_casa: 'Dinamarca',
    time_fora: 'Colômbia',
    bandeira_casa: '🇩🇰',
    bandeira_fora: '🇨🇴',
    data_hora: '2026-06-15T18:00:00Z',
    estadio: 'Gillette Stadium, Boston',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  }
];

// Preseeded predictions for our users to create instant interesting points & badges in Rodada 1 & Rodada 2!
export const initialPredictions: Prediction[] = [
  // --- CHIQUINHO EXPERT (Extremely good guesser) ---
  // Rodada 1
  { id: 'p-c-r1-1', user_id: 'user-chiquinho', match_id: 'm-r1-1', gols_casa: 2, gols_fora: 1, created_at: '2026-06-10T12:00:00Z' }, // Exact Match: 10 pts
  { id: 'p-c-r1-2', user_id: 'user-chiquinho', match_id: 'm-r1-2', gols_casa: 3, gols_fora: 1, created_at: '2026-06-10T12:05:00Z' }, // Exact Match: 10 pts
  { id: 'p-c-r1-3', user_id: 'user-chiquinho', match_id: 'm-r1-3', gols_casa: 2, gols_fora: 2, created_at: '2026-06-10T12:10:00Z' }, // Exact Match: 10 pts
  { id: 'p-c-r1-4', user_id: 'user-chiquinho', match_id: 'm-r1-4', gols_casa: 1, gols_fora: 1, created_at: '2026-06-10T12:15:00Z' }, // Exact Match: 10 pts
  // Rodada 2
  { id: 'p-c-r2-1', user_id: 'user-chiquinho', match_id: 'm-r2-1', gols_casa: 2, gols_fora: 1, created_at: '2026-06-15T12:20:00Z' }, // Exact Match: 10 pts
  { id: 'p-c-r2-2', user_id: 'user-chiquinho', match_id: 'm-r2-2', gols_casa: 0, gols_fora: 2, created_at: '2026-06-15T12:21:00Z' }, // Exact Match: 10 pts
  { id: 'p-c-r2-3', user_id: 'user-chiquinho', match_id: 'm-r2-3', gols_casa: 1, gols_fora: 2, created_at: '2026-06-15T12:22:00Z' }, // Correct outcome (winner EUA): 5 pts
  { id: 'p-c-r2-4', user_id: 'user-chiquinho', match_id: 'm-r2-4', gols_casa: 2, gols_fora: 2, created_at: '2026-06-15T12:23:00Z' }, // Correct outcome (draw): 5 pts

  // --- DIEGO (ADMIN) (Very competitive) ---
  // Rodada 1
  { id: 'p-d-r1-1', user_id: 'user-diego', match_id: 'm-r1-1', gols_casa: 1, gols_fora: 0, created_at: '2026-06-10T14:00:00Z' }, // Correct outcome: 5 pts
  { id: 'p-d-r1-2', user_id: 'user-diego', match_id: 'm-r1-2', gols_casa: 3, gols_fora: 1, created_at: '2026-06-10T14:05:00Z' }, // Exact Match: 10 pts
  { id: 'p-d-r1-3', user_id: 'user-diego', match_id: 'm-r1-3', gols_casa: 2, gols_fora: 1, created_at: '2026-06-10T14:10:00Z' }, // Incorrect outcome, check gols Francia (2): 2 pts
  { id: 'p-d-r1-4', user_id: 'user-diego', match_id: 'm-r1-4', gols_casa: 1, gols_fora: 1, created_at: '2026-06-10T14:15:00Z' }, // Exact Match: 10 pts
  // Rodada 2
  { id: 'p-d-r2-1', user_id: 'user-diego', match_id: 'm-r2-1', gols_casa: 2, gols_fora: 1, created_at: '2026-06-15T14:20:00Z' }, // Exact Match: 10 pts
  { id: 'p-d-r2-2', user_id: 'user-diego', match_id: 'm-r2-2', gols_casa: 1, gols_fora: 2, created_at: '2026-06-15T14:21:00Z' }, // Correct outcome, correct opponent goals (2): 5 pts
  { id: 'p-d-r2-3', user_id: 'user-diego', match_id: 'm-r2-3', gols_casa: 1, gols_fora: 3, created_at: '2026-06-15T14:22:00Z' }, // Exact Match: 10 pts
  { id: 'p-d-r2-4', user_id: 'user-diego', match_id: 'm-r2-4', gols_casa: 0, gols_fora: 0, created_at: '2026-06-15T14:23:00Z' }, // Correct outcome (draw): 5 pts

  // --- FABIO "QUASE LA" (Misses scores by exactly 1 goal) ---
  // Rodada 1
  { id: 'p-f-r1-1', user_id: 'user-fabio', match_id: 'm-r1-1', gols_casa: 2, gols_fora: 0, created_at: '2026-06-10T13:00:00Z' }, // Missed exact by 1 goal (gols fora: predicted 0, actual 1). Correct outcome: 5 pts
  { id: 'p-f-r1-2', user_id: 'user-fabio', match_id: 'm-r1-2', gols_casa: 2, gols_fora: 1, created_at: '2026-06-10T13:05:00Z' }, // Missed exact by 1 goal (gols casa: predicted 2, actual 3). Correct outcome: 5 pts
  { id: 'p-f-r1-3', user_id: 'user-fabio', match_id: 'm-r1-3', gols_casa: 2, gols_fora: 1, created_at: '2026-06-10T13:10:00Z' }, // Missed draw by 1 goal. Got gols_casa correct (2). Wrong outcome: 2 pts
  { id: 'p-f-r1-4', user_id: 'user-fabio', match_id: 'm-r1-4', gols_casa: 2, gols_fora: 1, created_at: '2026-06-10T13:15:00Z' }, // Missed draw by 1 goal. Got gols_fora correct (1). Wrong outcome: 2 pts
  // Rodada 2
  { id: 'p-f-r2-1', user_id: 'user-fabio', match_id: 'm-r2-1', gols_casa: 2, gols_fora: 0, created_at: '2026-06-15T13:20:00Z' }, // Missed exact by 1 goal. Correct outcome: 5 pts
  { id: 'p-f-r2-2', user_id: 'user-fabio', match_id: 'm-r2-2', gols_casa: 0, gols_fora: 1, created_at: '2026-06-15T13:21:00Z' }, // Missed exact by 1 goal. Correct outcome: 5 pts
  { id: 'p-f-r2-3', user_id: 'user-fabio', match_id: 'm-r2-3', gols_casa: 2, gols_fora: 3, created_at: '2026-06-15T13:22:00Z' }, // Missed exact by 1 goal (gols_casa correct 1vs2? No correct winner EUA, correct goals fora 3: 5 pts)
  { id: 'p-f-r2-4', user_id: 'user-fabio', match_id: 'm-r2-4', gols_casa: 1, gols_fora: 0, created_at: '2026-06-15T13:23:00Z' }, // Missed draw by 1 goal. Correct goals casa (1). Wrong outcome: 2 pts

  // --- GEB O PE FRIO (Terrible predictions) ---
  // Rodada 1
  { id: 'p-g-r1-1', user_id: 'user-geb', match_id: 'm-r1-1', gols_casa: 0, gols_fora: 3, created_at: '2026-06-10T15:00:00Z' }, // Mispredicted entirely: 0 pts
  { id: 'p-g-r1-2', user_id: 'user-geb', match_id: 'm-r1-2', gols_casa: 0, gols_fora: 2, created_at: '2026-06-10T15:05:00Z' }, // Mispredicted entirely: 0 pts
  { id: 'p-g-r1-3', user_id: 'user-geb', match_id: 'm-r1-3', gols_casa: 3, gols_fora: 0, created_at: '2026-06-10T15:10:00Z' }, // Mispredicted entirely: 0 pts
  { id: 'p-g-r1-4', user_id: 'user-geb', match_id: 'm-r1-4', gols_casa: 3, gols_fora: 0, created_at: '2026-06-10T15:15:00Z' }, // Mispredicted entirely: 0 pts
  // Rodada 2
  { id: 'p-g-r2-1', user_id: 'user-geb', match_id: 'm-r2-1', gols_casa: 0, gols_fora: 3, created_at: '2026-06-15T15:20:00Z' }, // Mispredicted entirely: 0 pts
  { id: 'p-g-r2-2', user_id: 'user-geb', match_id: 'm-r2-2', gols_casa: 3, gols_fora: 0, created_at: '2026-06-15T15:21:00Z' }, // Mispredicted entirely: 0 pts
  { id: 'p-g-r2-3', user_id: 'user-geb', match_id: 'm-r2-3', gols_casa: 0, gols_fora: 0, created_at: '2026-06-15T15:22:00Z' }, // Mispredicted outcome. Correct goals casa (nothing-actual is 1): 0 pts
  { id: 'p-g-r2-4', user_id: 'user-geb', match_id: 'm-r2-4', gols_casa: 3, gols_fora: 0, created_at: '2026-06-15T15:23:00Z' }, // Mispredicted outcome. Correct goals count: 0 pts

  // --- SON ECA GEB VIRGEM (Has some palpites in R1 but NONE in R2) ---
  // Rodada 1
  { id: 'p-s-r1-1', user_id: 'user-dorminhoco', match_id: 'm-r1-1', gols_casa: 1, gols_fora: 1, created_at: '2026-06-10T16:00:00Z' }, // Got goals of casa correct (1) but incorrect outcome: 2 pts
  { id: 'p-s-r1-2', user_id: 'user-dorminhoco', match_id: 'm-r1-2', gols_casa: 2, gols_fora: 0, created_at: '2026-06-10T16:05:00Z' }, // Correct outcome: 5 pts
  { id: 'p-s-r1-3', user_id: 'user-dorminhoco', match_id: 'm-r1-3', gols_casa: 1, gols_fora: 1, created_at: '2026-06-10T16:10:00Z' }, // Correct outcome (draw): 5 pts
  { id: 'p-s-r1-4', user_id: 'user-dorminhoco', match_id: 'm-r1-4', gols_casa: 0, gols_fora: 0, created_at: '2026-06-10T16:15:00Z' }, // Correct outcome (draw): 5 pts
  // Rodada 2: NONE! (Sleeps through, trigger "Geb Virgem" for Rodada 2)
];

// Utility: Matches standard sweepstakes score calculation we discussed earlier!
export function calculatePredictionPoints(
  predCasa: number,
  predFora: number,
  actCasa: number,
  actFora: number
): { points: number; category: 'exato' | 'resultado' | 'gols_um_time' | 'erro' } {
  // 1. Exact Match
  if (predCasa === actCasa && predFora === actFora) {
    return { points: 10, category: 'exato' };
  }

  // 2. Winner/Draw outcome
  const predDraw = predCasa === predFora;
  const actDraw = actCasa === actFora;
  const predWinsHome = predCasa > predFora;
  const actWinsHome = actCasa > actFora;
  const predWinsAway = predCasa < predFora;
  const actWinsAway = actCasa < actFora;

  const correctOutcome =
    (predDraw && actDraw) ||
    (predWinsHome && actWinsHome) ||
    (predWinsAway && actWinsAway);

  if (correctOutcome) {
    return { points: 5, category: 'resultado' };
  }

  // 3. Got goals of only ONE team correctly
  const homeGoalsCorrect = predCasa === actCasa;
  const awayGoalsCorrect = predFora === actFora;

  if (homeGoalsCorrect || awayGoalsCorrect) {
    return { points: 2, category: 'gols_um_time' };
  }

  return { points: 0, category: 'erro' };
}

// Full engine for running recalculations:
// Recalculates round scores, total rankings, and badges
export function computeAllStats(
  users: User[],
  matches: Match[],
  predictions: Prediction[]
): { roundScores: RoundScore[]; rankings: Ranking[]; userBadges: UserBadge[] } {
  const roundScores: RoundScore[] = [];
  const userBadges: UserBadge[] = [];

  // Group matches by round for convenience
  const rounds = Array.from(new Set(matches.map((m) => m.fase)));

  // 1. Calculate RoundScores
  rounds.forEach((rd) => {
    const rdMatches = matches.filter((m) => m.fase === rd);
    const rdMatchesCompleted = rdMatches.filter((m) => m.status === 'completed');

    users.forEach((user) => {
      const userPreds = predictions.filter((p) => p.user_id === user.id);

      let points = 0;
      let exato_qtd = 0;
      let resultado_qtd = 0;
      let gols_um_time_qtd = 0;
      let erros_qtd = 0;
      let predictionsCompletedInRoundCount = 0;

      rdMatchesCompleted.forEach((match) => {
        const pred = userPreds.find((p) => p.match_id === match.id);
        if (pred) {
          predictionsCompletedInRoundCount++;
          const result = calculatePredictionPoints(
            pred.gols_casa,
            pred.gols_fora,
            match.gols_casa!,
            match.gols_fora!
          );

          points += result.points;
          if (result.category === 'exato') exato_qtd++;
          else if (result.category === 'resultado') resultado_qtd++;
          else if (result.category === 'gols_um_time') gols_um_time_qtd++;
          else erros_qtd++;
        } else {
          // No prediction for this match
          erros_qtd++;
        }
      });

      // Special rule: if it was a completed phase and they didn't do any predictions in the round at all
      if (rdMatchesCompleted.length > 0 && predictionsCompletedInRoundCount === 0) {
        // Did not make any prediction in the round
        // Points remain 0
      }

      roundScores.push({
        id: `score-${user.id}-${rd.replace(/\s+/g, '-')}`,
        user_id: user.id,
        rodada: rd,
        pontos: points,
        exato_qtd,
        resultado_qtd,
        gols_um_time_qtd,
        erros_qtd
      });
    });
  });

  // 2. Award badges per round
  rounds.forEach((rd) => {
    const rdMatches = matches.filter((m) => m.fase === rd);
    const completedMatchesInRound = rdMatches.filter((m) => m.status === 'completed');

    if (completedMatchesInRound.length === 0) return; // Don't award badges for rounds with no completed games

    const rdScores = roundScores.filter((s) => s.rodada === rd);

    // Filter users who participated (had at least one prediction in this round)
    const activeParticipants = rdScores.filter((score) => {
      const userPreds = predictions.filter(
        (p) => p.user_id === score.user_id && rdMatches.some((m) => m.id === p.match_id)
      );
      return userPreds.length > 0;
    });

    const inactiveParticipants = rdScores.filter((score) => {
      const userPreds = predictions.filter(
        (p) => p.user_id === score.user_id && rdMatches.some((m) => m.id === p.match_id)
      );
      return userPreds.length === 0;
    });

    // Award "😴 Geb Virgem" to inactive users
    inactiveParticipants.forEach((score) => {
      userBadges.push({
        id: `ub-${score.user_id}-virgem-${rd.replace(/\s+/g, '-')}`,
        user_id: score.user_id,
        badge_id: 'badge-virgem',
        rodada: rd
      });
    });

    if (activeParticipants.length > 0) {
      // Find max score
      let maxPoints = -1;
      let chiquinhoWinners: RoundScore[] = [];

      activeParticipants.forEach((score) => {
        if (score.pontos > maxPoints) {
          maxPoints = score.pontos;
          chiquinhoWinners = [score];
        } else if (score.pontos === maxPoints) {
          chiquinhoWinners.push(score);
        }
      });

      // Tie-breaker for Chiquinho Award:
      // 1. Most exact scores
      // 2. Most winner outcomes
      let ultimateChiquinho: RoundScore | null = null;
      if (chiquinhoWinners.length === 1) {
        ultimateChiquinho = chiquinhoWinners[0];
      } else if (chiquinhoWinners.length > 1) {
        // Sort tiebreakers
        const sorted = [...chiquinhoWinners].sort((a, b) => {
          if (b.exato_qtd !== a.exato_qtd) return b.exato_qtd - a.exato_qtd;
          return b.resultado_qtd - a.resultado_qtd;
        });
        ultimateChiquinho = sorted[0];
      }

      if (ultimateChiquinho) {
        userBadges.push({
          id: `ub-${ultimateChiquinho.user_id}-chiquinho-${rd.replace(/\s+/g, '-')}`,
          user_id: ultimateChiquinho.user_id,
          badge_id: 'badge-chiquinho',
          rodada: rd
        });
      }

      // 🎯 Olho de Águia: Most exact scores in the round (must be >= 1)
      let maxExacts = 0;
      let aguiaWinners: RoundScore[] = [];
      activeParticipants.forEach((score) => {
        if (score.exato_qtd > maxExacts) {
          maxExacts = score.exato_qtd;
          aguiaWinners = [score];
        } else if (score.exato_qtd === maxExacts && maxExacts > 0) {
          aguiaWinners.push(score);
        }
      });

      aguiaWinners.forEach((winner) => {
        userBadges.push({
          id: `ub-${winner.user_id}-aguia-${rd.replace(/\s+/g, '-')}`,
          user_id: winner.user_id,
          badge_id: 'badge-aguia',
          rodada: rd
        });
      });

      // 🥈 Fábio Quase Lá: Most partial outcomes or batidas na trave
      // Let's define this as: the player who has the highest count of (gols_um_time_qtd + resultado_qtd) but didn't win Chiquinho
      // Or simple calculation: largest count of gols_um_time_qtd (got goals of one team but missed final score)
      let maxQuase = -1;
      let fabioWinners: RoundScore[] = [];
      activeParticipants.forEach((score) => {
        // Sum of "quase lá" hits (either got gols_um_time or outcome but not exact)
        const quaseValue = score.gols_um_time_qtd + score.resultado_qtd;
        if (quaseValue > maxQuase) {
          maxQuase = quaseValue;
          fabioWinners = [score];
        } else if (quaseValue === maxQuase && quaseValue > 0) {
          fabioWinners.push(score);
        }
      });

      fabioWinners.forEach((winner) => {
        userBadges.push({
          id: `ub-${winner.user_id}-fabio-${rd.replace(/\s+/g, '-')}`,
          user_id: winner.user_id,
          badge_id: 'badge-fabio',
          rodada: rd
        });
      });

      // 🤡 Gebiada da Rodada: Pior desempenho (with active predictions)
      let minPoints = Number.MAX_SAFE_INTEGER;
      let gebiadaWinners: RoundScore[] = [];
      activeParticipants.forEach((score) => {
        if (score.pontos < minPoints) {
          minPoints = score.pontos;
          gebiadaWinners = [score];
        } else if (score.pontos === minPoints) {
          gebiadaWinners.push(score);
        }
      });

      // Only award if they actually registered points (even if 0) and completed
      gebiadaWinners.forEach((winner) => {
        userBadges.push({
          id: `ub-${winner.user_id}-gebiada-${rd.replace(/\s+/g, '-')}`,
          user_id: winner.user_id,
          badge_id: 'badge-gebiada',
          rodada: rd
        });
      });
    }
  });

  // Calculate cumulative ranking
  const totalScoresByUser: { [userId: string]: { total: number; exatos: number; vencedores: number } } = {};
  users.forEach((user) => {
    totalScoresByUser[user.id] = { total: 0, exatos: 0, vencedores: 0 };
  });

  roundScores.forEach((score) => {
    if (totalScoresByUser[score.user_id]) {
      totalScoresByUser[score.user_id].total += score.pontos;
      totalScoresByUser[score.user_id].exatos += score.exato_qtd;
      totalScoresByUser[score.user_id].vencedores += score.resultado_qtd;
    }
  });

  const sortedRankings = Object.keys(totalScoresByUser)
    .map((usrId) => ({
      user_id: usrId,
      pontos_totais: totalScoresByUser[usrId].total,
      exatos_totais: totalScoresByUser[usrId].exatos,
      vencedores_totais: totalScoresByUser[usrId].vencedores,
      posicao: 1, // calculated below
      badges: [] as string[]
    }))
    .sort((a, b) => {
      if (b.pontos_totais !== a.pontos_totais) {
        return b.pontos_totais - a.pontos_totais;
      }
      // Tie breaker 1: exact score predictions
      if (b.exatos_totais !== a.exatos_totais) {
        return b.exatos_totais - a.exatos_totais;
      }
      return b.vencedores_totais - a.vencedores_totais;
    });

  // Calculate ranks properly (handling ties)
  let currentRank = 1;
  for (let i = 0; i < sortedRankings.length; i++) {
    if (i > 0) {
      const prev = sortedRankings[i - 1];
      const curr = sortedRankings[i];
      const matchesPrev =
        prev.pontos_totais === curr.pontos_totais &&
        prev.exatos_totais === curr.exatos_totais &&
        prev.vencedores_totais === curr.vencedores_totais;

      if (!matchesPrev) {
        currentRank = i + 1;
      }
    }
    sortedRankings[i].posicao = currentRank;
  }

  // Award "🐐 GOAT do Bolão" badge to the first place in overall ranking if any round is completed
  const hasCompletedMatches = matches.some((m) => m.status === 'completed');
  if (hasCompletedMatches && sortedRankings.length > 0) {
    const leaderRank = sortedRankings[0].posicao;
    const leaders = sortedRankings.filter((r) => r.posicao === leaderRank);

    // Award GOAT badge to overall leader(s)
    leaders.forEach((leader) => {
      userBadges.push({
        id: `ub-${leader.user_id}-goat-overall`,
        user_id: leader.user_id,
        badge_id: 'badge-goat',
        rodada: 'Geral'
      });
    });
  }

  // 🔥 Em Chamas Award check (3 rounds consecutive above the average score of active users in that round)
  // Since we only have 3 rounds max, let's look at rounds: we check Rodada 1, Rodada 2, and Rodada 3
  // If active in each round and points in each round was > average points of that round!
  users.forEach((user) => {
    let consecutiveCount = 0;
    rounds.forEach((rd) => {
      const rdScores = roundScores.filter((s) => s.rodada === rd);
      const activeRdScores = rdScores.filter((s) => {
        // User has at least one prediction in this round
        return predictions.some((p) => p.user_id === s.user_id && matches.some((m) => m.id === p.match_id && m.fase === rd));
      });

      if (activeRdScores.length > 0) {
        const sum = activeRdScores.reduce((acc, current) => acc + current.pontos, 0);
        const avg = sum / activeRdScores.length;

        const userScore = rdScores.find((s) => s.user_id === user.id);
        if (userScore && userScore.pontos > avg) {
          consecutiveCount++;
        } else {
          // Break streak if played and was below, or didn't play
          consecutiveCount = 0;
        }
      }
    });

    if (consecutiveCount >= 2) { // Allow 2 or more rounds consecutive for our smaller 3-round demo set
      userBadges.push({
        id: `ub-${user.id}-chamas-streak`,
        user_id: user.id,
        badge_id: 'badge-chamas',
        rodada: 'Fase de Grupos'
      });
    }
  });

  return {
    roundScores,
    rankings: sortedRankings,
    userBadges
  };
}
