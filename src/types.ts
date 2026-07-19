export interface User {
  id: string;
  nome: string;
  email: string;
  avatar_url: string;
  isAdmin?: boolean;
  isPaid?: boolean;
}

export type MatchStatus = 'unplayed' | 'completed';

export interface Match {
  id: string;
  fase: string; // 'Rodada 1' | 'Rodada 2' | 'Rodada 3' | 'Fase Final'
  time_casa: string;
  time_fora: string;
  bandeira_casa: string; // Emoji flag or code
  bandeira_fora: string; // Emoji flag or code
  data_hora: string; // ISO String
  estadio: string;
  gols_casa?: number | null;
  gols_fora?: number | null;
  status: MatchStatus;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  gols_casa: number;
  gols_fora: number;
  created_at: string;
}

export interface Badge {
  id: string;
  nome: string;
  descricao: string;
  icone: string; // Lucide icon name or emoji representation
  tipo: 'chiquinho' | 'fabio' | 'gebiada' | 'virgem' | 'aguia' | 'chamas' | 'goat';
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  rodada: string;
}

export interface RoundScore {
  id: string;
  user_id: string;
  rodada: string;
  pontos: number;
  exato_qtd: number;    // Count of exact scores
  resultado_qtd: number;  // Count of correct winners/draws
  gols_um_time_qtd: number; // Count of correct goals for one team
  erros_qtd: number;     // Count of completely wrong predictions
}

export interface Ranking {
  user_id: string;
  pontos_totais: number;
  posicao: number;
  exatos_totais: number;
  vencedores_totais: number;
  gols_um_time_totais: number;
  erros_totais: number;
  badges: string[]; // Badges IDs currently active or count
}

export interface GameState {
  users: User[];
  matches: Match[];
  predictions: Prediction[];
  badges: Badge[];
  user_badges: UserBadge[];
  round_scores: RoundScore[];
  logo_image?: string;
  allow_registrations?: boolean;
  finalist_predictions?: any[];
}

export interface DashboardData {
  currentUser: User | null;
  ranking: Ranking[];
  matches: Match[];
  predictions: Prediction[];
  userBadges: UserBadge[];
  badges: Badge[];
  roundScores: RoundScore[];
}

export interface Team {
  id: string;
  nome: string;
  bandeira: string;
}

export interface FinalistPrediction {
  id: string;
  user_id: string;
  campeao_team_id: string;
  vice_team_id: string;
  created_at: string;
  updated_at: string;
}

