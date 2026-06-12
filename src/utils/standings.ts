import { Match, Prediction } from '../types';

export interface TeamStanding {
  team: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export function calculateGroupStandings(
  matches: Match[],
  predictions: Prediction[],
  currentUserId: string | null,
  mode: 'real' | 'simulated'
): { [groupName: string]: TeamStanding[] } {
  const standings: { [groupName: string]: { [teamName: string]: TeamStanding } } = {};

  // 1. Initialize all teams appearing in group stage matches
  matches.forEach((m) => {
    if (m.fase.startsWith('Grupo ')) {
      const group = m.fase;
      if (!standings[group]) {
        standings[group] = {};
      }
      if (!standings[group][m.time_casa]) {
        standings[group][m.time_casa] = {
          team: m.time_casa,
          flag: m.bandeira_casa,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        };
      }
      if (!standings[group][m.time_fora]) {
        standings[group][m.time_fora] = {
          team: m.time_fora,
          flag: m.bandeira_fora,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        };
      }
    }
  });

  // 2. Process matches based on the selected mode
  matches.forEach((m) => {
    if (!m.fase.startsWith('Grupo ')) return;

    const group = m.fase;
    const tCasa = standings[group]?.[m.time_casa];
    const tFora = standings[group]?.[m.time_fora];
    if (!tCasa || !tFora) return;

    let useMatch = false;
    let gCasa = 0;
    let gFora = 0;

    if (m.status === 'completed') {
      useMatch = true;
      gCasa = m.gols_casa ?? 0;
      gFora = m.gols_fora ?? 0;
    } else if (mode === 'simulated' && currentUserId) {
      // Find current user's prediction for this unplayed match
      const pred = predictions.find((p) => p.user_id === currentUserId && p.match_id === m.id);
      if (pred) {
        useMatch = true;
        gCasa = pred.gols_casa;
        gFora = pred.gols_fora;
      }
    }

    if (useMatch) {
      tCasa.played += 1;
      tFora.played += 1;
      tCasa.goalsFor += gCasa;
      tCasa.goalsAgainst += gFora;
      tFora.goalsFor += gFora;
      tFora.goalsAgainst += gCasa;

      if (gCasa > gFora) {
        tCasa.won += 1;
        tCasa.points += 3;
        tFora.lost += 1;
      } else if (gCasa < gFora) {
        tFora.won += 1;
        tFora.points += 3;
        tCasa.lost += 1;
      } else {
        tCasa.drawn += 1;
        tCasa.points += 1;
        tFora.drawn += 1;
        tFora.points += 1;
      }

      tCasa.goalDifference = tCasa.goalsFor - tCasa.goalsAgainst;
      tFora.goalDifference = tFora.goalsFor - tFora.goalsAgainst;
    }
  });

  // 3. Sort each group's teams by points, goal difference, goals for, and alphabetically
  const result: { [groupName: string]: TeamStanding[] } = {};
  for (const group in standings) {
    result[group] = Object.values(standings[group]).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.localeCompare(b.team);
    });
  }

  return result;
}
