import { User, Match, Prediction, Badge, UserBadge, RoundScore, Ranking, GameState } from './types';

export const initialUsers: User[] = [
  {
    id: 'user-diego',
    nome: 'Diogo Camargo (Admin/GOAT)',
    email: 'diocamargo1002@gmail.com',
    avatar_url: 'https://github.com/dfc1002-eng.png',
    isAdmin: true
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
  // --- GRUPO A (Completed) ---
  {
    id: 'wc2026-m1',
    fase: 'Grupo A',
    time_casa: 'México',
    time_fora: 'África do Sul',
    bandeira_casa: '🇲🇽',
    bandeira_fora: '🇿🇦',
    data_hora: '2026-06-02T18:00:00Z',
    estadio: 'Estádio Azteca, Cidade do México',
    gols_casa: 2,
    gols_fora: 1,
    status: 'completed'
  },
  // --- GRUPO B (Completed) ---
  {
    id: 'wc2026-m2',
    fase: 'Grupo B',
    time_casa: 'Canadá',
    time_fora: 'França',
    bandeira_casa: '🇨🇦',
    bandeira_fora: '🇫🇷',
    data_hora: '2026-06-03T20:00:00Z',
    estadio: 'BC Place, Vancouver',
    gols_casa: 3,
    gols_fora: 1,
    status: 'completed'
  },
  // --- GRUPO C (Completed) ---
  {
    id: 'wc2026-m3',
    fase: 'Grupo C',
    time_casa: 'Estados Unidos',
    time_fora: 'Espanha',
    bandeira_casa: '🇺🇸',
    bandeira_fora: '🇪🇸',
    data_hora: '2026-06-04T15:00:00Z',
    estadio: 'MetLife Stadium, East Rutherford',
    gols_casa: 2,
    gols_fora: 2,
    status: 'completed'
  },
  // --- GRUPO D (Completed) ---
  {
    id: 'wc2026-m4',
    fase: 'Grupo D',
    time_casa: 'Brasil',
    time_fora: 'Alemanha',
    bandeira_casa: '🇧🇷',
    bandeira_fora: '🇩🇪',
    data_hora: '2026-06-05T21:00:00Z',
    estadio: 'SoFi Stadium, Los Angeles',
    gols_casa: 1,
    gols_fora: 1,
    status: 'completed'
  },

  // --- GRUPO E (Unplayed) ---
  {
    id: 'wc2026-m5',
    fase: 'Grupo E',
    time_casa: 'Argentina',
    time_fora: 'Itália',
    bandeira_casa: '🇦🇷',
    bandeira_fora: '🇮🇹',
    data_hora: '2026-06-11T19:00:00Z',
    estadio: 'Hard Rock Stadium, Miami',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  // --- GRUPO F (Unplayed) ---
  {
    id: 'wc2026-m6',
    fase: 'Grupo F',
    time_casa: 'Portugal',
    time_fora: 'Japão',
    bandeira_casa: '🇵🇹',
    bandeira_fora: '🇯🇵',
    data_hora: '2026-06-12T15:00:00Z',
    estadio: 'Mercedes-Benz Stadium, Atlanta',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  // --- GRUPO G (Unplayed) ---
  {
    id: 'wc2026-m7',
    fase: 'Grupo G',
    time_casa: 'Bélgica',
    time_fora: 'Marrocos',
    bandeira_casa: '🇧🇪',
    bandeira_fora: '🇲🇦',
    data_hora: '2026-06-13T18:00:00Z',
    estadio: 'Gillette Stadium, Boston',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  },
  // --- GRUPO H (Unplayed) ---
  {
    id: 'wc2026-m8',
    fase: 'Grupo H',
    time_casa: 'Holanda',
    time_fora: 'Uruguai',
    bandeira_casa: '🇳🇱',
    bandeira_fora: '🇺🇾',
    data_hora: '2026-06-14T20:00:00Z',
    estadio: 'NRG Stadium, Houston',
    gols_casa: null,
    gols_fora: null,
    status: 'unplayed'
  }
];

// Preseeded predictions for our users to create instant interesting points & badges in Grupo A-D!
export const initialPredictions: Prediction[] = [
  // --- DIOGO (ADMIN) ---
  // Completados
  { id: 'p-d-r1-1', user_id: 'user-diego', match_id: 'wc2026-m1', gols_casa: 1, gols_fora: 0, created_at: '2026-06-10T14:00:00Z' },
  { id: 'p-d-r1-2', user_id: 'user-diego', match_id: 'wc2026-m2', gols_casa: 3, gols_fora: 1, created_at: '2026-06-10T14:05:00Z' },
  { id: 'p-d-r1-3', user_id: 'user-diego', match_id: 'wc2026-m3', gols_casa: 2, gols_fora: 1, created_at: '2026-06-10T14:10:00Z' },
  { id: 'p-d-r1-4', user_id: 'user-diego', match_id: 'wc2026-m4', gols_casa: 1, gols_fora: 1, created_at: '2026-06-10T14:15:00Z' },
  // Pendentes
  { id: 'p-d-r2-1', user_id: 'user-diego', match_id: 'wc2026-m5', gols_casa: 2, gols_fora: 1, created_at: '2026-06-15T14:20:00Z' },
  { id: 'p-d-r2-2', user_id: 'user-diego', match_id: 'wc2026-m6', gols_casa: 1, gols_fora: 2, created_at: '2026-06-15T14:21:00Z' },
  { id: 'p-d-r2-3', user_id: 'user-diego', match_id: 'wc2026-m7', gols_casa: 1, gols_fora: 3, created_at: '2026-06-15T14:22:00Z' },
  { id: 'p-d-r2-4', user_id: 'user-diego', match_id: 'wc2026-m8', gols_casa: 0, gols_fora: 0, created_at: '2026-06-15T14:23:00Z' }
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
