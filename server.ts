import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

// Importa a conexão cliente do Supabase
import { supabase } from './supabase.js';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Import initial data and calculation engine
import {
  initialUsers,
  initialMatches,
  initialPredictions,
  initialBadges,
  computeAllStats
} from './src/initialData.js';
import { GameState, Prediction, Match, User, Badge, UserBadge, RoundScore } from './src/types.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json());

// Helper para popular dados iniciais no Supabase
async function seedSupabase(): Promise<void> {
  console.log('Iniciando carga de dados no Supabase...');
  const { roundScores, userBadges } = computeAllStats(
    initialUsers,
    initialMatches,
    initialPredictions
  );

  const initialState: GameState = {
    users: initialUsers,
    matches: initialMatches,
    predictions: initialPredictions,
    badges: initialBadges,
    user_badges: userBadges,
    round_scores: roundScores
  };

  await saveDBState(initialState);
}

// Load or initialize DB state
async function getDBState(): Promise<GameState> {
  try {
    // 1. Buscar usuários
    const { data: usersData, error: usersError } = await supabase.from('users').select('*');
    if (usersError) throw usersError;

    // 2. Buscar jogos
    const { data: matchesData, error: matchesError } = await supabase.from('matches').select('*').order('data_hora', { ascending: true });
    if (matchesError) throw matchesError;

    // 3. Buscar palpites (com paginação para contornar o limite de 1000 registros do Supabase)
    const predictionsData: any[] = [];
    let from = 0;
    let to = 999;
    let keepFetching = true;
    while (keepFetching) {
      const { data: chunk, error: predictionsError } = await supabase
        .from('predictions')
        .select('*')
        .range(from, to);
      
      if (predictionsError) throw predictionsError;
      
      if (chunk && chunk.length > 0) {
        predictionsData.push(...chunk);
        if (chunk.length < 1000) {
          keepFetching = false;
        } else {
          from += 1000;
          to += 1000;
        }
      } else {
        keepFetching = false;
      }
    }

    // 4. Buscar medalhas
    const { data: badgesData, error: badgesError } = await supabase.from('badges').select('*');
    if (badgesError) throw badgesError;

    // 5. Buscar medalhas de usuários
    const { data: userBadgesData, error: userBadgesError } = await supabase.from('user_badges').select('*');
    if (userBadgesError) throw userBadgesError;

    // 6. Buscar scores de rodadas
    const { data: roundScoresData, error: roundScoresError } = await supabase.from('round_scores').select('*');
    if (roundScoresError) throw roundScoresError;

    // 7. Buscar configurações
    let allowRegistrations = true;
    try {
      const { data: settingsData } = await supabase.from('settings').select('*');
      if (settingsData) {
        const found = settingsData.find(s => s.key === 'allow_registrations');
        if (found) {
          allowRegistrations = found.value !== 'false';
        }
      }
    } catch (e) {
      // Ignorar se a tabela settings não existir
    }

    // Se o banco estiver vazio, popula com dados iniciais
    if (!usersData || usersData.length === 0 || !matchesData || matchesData.length === 0) {
      console.log('Banco de dados do Supabase vazio. Populando dados iniciais...');
      await seedSupabase();
      return getDBState();
    }

    const mappedUsers: User[] = usersData.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      avatar_url: u.avatar_url || '',
      isAdmin: u.is_admin,
      isPaid: u.is_paid
    }));

    const mappedMatches: Match[] = matchesData.map(m => ({
      id: m.id,
      fase: m.fase,
      time_casa: m.time_casa,
      time_fora: m.time_fora,
      bandeira_casa: m.bandeira_casa,
      bandeira_fora: m.bandeira_fora,
      data_hora: m.data_hora,
      estadio: m.estadio,
      gols_casa: m.gols_casa,
      gols_fora: m.gols_fora,
      status: m.status
    }));

    const mappedPredictions: Prediction[] = predictionsData.map(p => ({
      id: p.id,
      user_id: p.user_id,
      match_id: p.match_id,
      gols_casa: p.gols_casa,
      gols_fora: p.gols_fora,
      created_at: p.created_at
    }));

    const mappedBadges: Badge[] = badgesData.map(b => ({
      id: b.id,
      nome: b.nome,
      descricao: b.descricao,
      icone: b.icone,
      tipo: b.tipo as any
    }));

    const mappedUserBadges: UserBadge[] = userBadgesData.map(ub => ({
      id: ub.id,
      user_id: ub.user_id,
      badge_id: ub.badge_id,
      rodada: ub.rodada
    }));

    const mappedRoundScores: RoundScore[] = roundScoresData.map(rs => ({
      id: rs.id,
      user_id: rs.user_id,
      rodada: rs.rodada,
      pontos: rs.pontos,
      exato_qtd: rs.exato_qtd,
      resultado_qtd: rs.resultado_qtd,
      gols_um_time_qtd: rs.gols_um_time_qtd,
      erros_qtd: rs.erros_qtd
    }));

    return {
      users: mappedUsers,
      matches: mappedMatches,
      predictions: mappedPredictions,
      badges: mappedBadges,
      user_badges: mappedUserBadges,
      round_scores: mappedRoundScores,
      allow_registrations: allowRegistrations
    };

  } catch (err: any) {
    console.error('\x1b[31m%s\x1b[0m', 'ERRO AO CARREGAR ESTADO DO SUPABASE:');
    console.error(err.message);
    console.error('Certifique-se de configurar as tabelas no painel do Supabase com o script SQL fornecido no plano de implementação e preencher o arquivo .env!');
    
    // Retorna fallback local usando db.json caso o Supabase falhe ou falte configuração
    try {
      console.log('Tentando carregar dados locais de fallback (db.json)...');
      const data = await fs.readFile(DB_FILE, 'utf-8');
      const state = JSON.parse(data) as GameState;
      return state;
    } catch {
      console.log('Nenhum db.json de fallback encontrado. Usando dados estáticos de seed temporariamente...');
      const { roundScores, userBadges } = computeAllStats(initialUsers, initialMatches, initialPredictions);
      return {
        users: initialUsers,
        matches: initialMatches,
        predictions: initialPredictions,
        badges: initialBadges,
        user_badges: userBadges,
        round_scores: roundScores
      };
    }
  }
}

async function saveDBState(state: GameState): Promise<void> {
  try {
    // 1. Salvar usuários
    const usersToUpsert = state.users.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      avatar_url: u.avatar_url,
      is_admin: u.isAdmin || false,
      is_paid: u.isPaid || false
    }));
    const { error: usersError } = await supabase.from('users').upsert(usersToUpsert);
    if (usersError) throw usersError;

    // 2. Salvar jogos
    const matchesToUpsert = state.matches.map(m => ({
      id: m.id,
      fase: m.fase,
      time_casa: m.time_casa,
      time_fora: m.time_fora,
      bandeira_casa: m.bandeira_casa,
      bandeira_fora: m.bandeira_fora,
      data_hora: m.data_hora,
      estadio: m.estadio,
      gols_casa: m.gols_casa,
      gols_fora: m.gols_fora,
      status: m.status
    }));
    const { error: matchesError } = await supabase.from('matches').upsert(matchesToUpsert);
    if (matchesError) throw matchesError;

    // 3. Salvar palpites
    const predictionsToUpsert = state.predictions.map(p => ({
      id: p.id,
      user_id: p.user_id,
      match_id: p.match_id,
      gols_casa: p.gols_casa,
      gols_fora: p.gols_fora,
      created_at: p.created_at
    }));
    const { error: predictionsError } = await supabase.from('predictions').upsert(predictionsToUpsert);
    if (predictionsError) throw predictionsError;

    // 4. Salvar medalhas
    const badgesToUpsert = state.badges.map(b => ({
      id: b.id,
      nome: b.nome,
      descricao: b.descricao,
      icone: b.icone,
      tipo: b.tipo
    }));
    const { error: badgesError } = await supabase.from('badges').upsert(badgesToUpsert);
    if (badgesError) throw badgesError;

    // 5. User badges - deletar e reinserir calculadas
    await supabase.from('user_badges').delete().neq('id', 'placeholder');
    if (state.user_badges.length > 0) {
      const userBadgesToInsert = state.user_badges.map(ub => ({
        id: ub.id,
        user_id: ub.user_id,
        badge_id: ub.badge_id,
        rodada: ub.rodada
      }));
      const { error: userBadgesError } = await supabase.from('user_badges').insert(userBadgesToInsert);
      if (userBadgesError) throw userBadgesError;
    }

    // 6. Round scores - deletar e reinserir calculadas
    await supabase.from('round_scores').delete().neq('id', 'placeholder');
    if (state.round_scores.length > 0) {
      const roundScoresToInsert = state.round_scores.map(rs => ({
        id: rs.id,
        user_id: rs.user_id,
        rodada: rs.rodada,
        pontos: rs.pontos,
        exato_qtd: rs.exato_qtd,
        resultado_qtd: rs.resultado_qtd,
        gols_um_time_qtd: rs.gols_um_time_qtd,
        erros_qtd: rs.erros_qtd
      }));
      const { error: roundScoresError } = await supabase.from('round_scores').insert(roundScoresToInsert);
      if (roundScoresError) throw roundScoresError;
    }

    // 7. Salvar configurações
    try {
      if (state.allow_registrations !== undefined) {
        await supabase.from('settings').upsert({
          key: 'allow_registrations',
          value: state.allow_registrations ? 'true' : 'false'
        });
      }
    } catch (e) {
      // Ignorar se a tabela settings não existir
    }

  } catch (err: any) {
    console.error('Erro ao salvar no Supabase:', err.message);
  }

  // Mantém também cópia em arquivo local db.json por segurança (Fallback local funcional)
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    // ignorar
  }
}

// REST API Endpoints

// Get current state
app.get('/api/state', async (req, res) => {
  try {
    const state = await getDBState();
    // Compute stats on the fly to guarantee accuracy
    const { roundScores, rankings, userBadges } = computeAllStats(
      state.users,
      state.matches,
      state.predictions
    );

    res.json({
      users: state.users,
      matches: state.matches,
      predictions: state.predictions,
      badges: state.badges,
      user_badges: userBadges,
      round_scores: roundScores,
      rankings,
      logo_image: state.logo_image || '',
      allow_registrations: state.allow_registrations !== false
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update persistent logo image
app.post('/api/logo/update', async (req, res) => {
  try {
    const { logo_image } = req.body;
    const state = await getDBState();
    state.logo_image = logo_image;
    await saveDBState(state);
    res.json({ success: true, logo_image });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update or insert a prediction
app.post('/api/predict', async (req, res) => {
  try {
    const { user_id, match_id, gols_casa, gols_fora } = req.body;

    if (!user_id || !match_id || gols_casa === undefined || gols_fora === undefined) {
      return res.status(400).json({ error: 'Missing required prediction fields.' });
    }

    const state = await getDBState();

    // Verify prediction window is open (match must be unplayed and not in the past)
    const match = state.matches.find((m) => m.id === match_id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    if (match.status === 'completed') {
      return res.status(400).json({ error: 'Este jogo já terminou! Palpites encerrados.' });
    }

    // Check if match date is in the past
    if (new Date(match.data_hora) < new Date()) {
      return res.status(400).json({ error: 'O jogo já começou! Palpites encerrados.' });
    }

    // Find existing or add new
    const existingIndex = state.predictions.findIndex(
      (p) => p.user_id === user_id && p.match_id === match_id
    );

    const parsedGolsCasa = parseInt(gols_casa, 10);
    const parsedGolsFora = parseInt(gols_fora, 10);

    if (isNaN(parsedGolsCasa) || isNaN(parsedGolsFora) || parsedGolsCasa < 0 || parsedGolsFora < 0) {
      return res.status(400).json({ error: 'Placar inválido. Os gols devem ser maiores ou iguais a 0.' });
    }

    if (existingIndex >= 0) {
      state.predictions[existingIndex] = {
        ...state.predictions[existingIndex],
        gols_casa: parsedGolsCasa,
        gols_fora: parsedGolsFora,
        created_at: new Date().toISOString()
      };
    } else {
      const newPred: Prediction = {
        id: `pred-${user_id}-${match_id}`,
        user_id,
        match_id,
        gols_casa: parsedGolsCasa,
        gols_fora: parsedGolsFora,
        created_at: new Date().toISOString()
      };
      state.predictions.push(newPred);
    }

    // Save and compute stats
    const { roundScores, rankings, userBadges } = computeAllStats(
      state.users,
      state.matches,
      state.predictions
    );

    state.user_badges = userBadges;
    state.round_scores = roundScores;

    await saveDBState(state);

    res.json({ success: true, message: 'Palpite salvo com sucesso!', state });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obter palpites de finalistas
app.get('/api/finalists', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('finalist_predictions')
      .select('*');
      
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Salvar ou atualizar palpite de finalista
app.post('/api/finalists', async (req, res) => {
  try {
    const { user_id, campeao_team_id, vice_team_id } = req.body;

    if (!user_id || !campeao_team_id || !vice_team_id) {
      return res.status(400).json({ error: 'Preencha o campeão e vice-campeão!' });
    }

    if (campeao_team_id === vice_team_id) {
      return res.status(400).json({ error: 'O campeão e o vice devem ser seleções diferentes!' });
    }

    // Upsert na tabela do Supabase
    const { data, error } = await supabase
      .from('finalist_predictions')
      .upsert({
        user_id,
        campeao_team_id,
        vice_team_id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (error) throw error;
    res.json({ success: true, prediction: data[0] });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update match outcome (Admin Only)
app.post('/api/match/update', async (req, res) => {
  try {
    const { match_id, gols_casa, gols_fora, status } = req.body;

    if (!match_id) {
      return res.status(400).json({ error: 'ID do jogo é obrigatório.' });
    }

    const state = await getDBState();
    const matchIndex = state.matches.findIndex((m) => m.id === match_id);

    if (matchIndex === -1) {
      return res.status(404).json({ error: 'Jogo não encontrado.' });
    }

    if (status === 'completed') {
      if (gols_casa === undefined || gols_fora === undefined || gols_casa === null || gols_fora === null) {
        return res.status(400).json({ error: 'Informe os gols para finalizar o jogo.' });
      }
      state.matches[matchIndex].gols_casa = parseInt(gols_casa, 10);
      state.matches[matchIndex].gols_fora = parseInt(gols_fora, 10);
      state.matches[matchIndex].status = 'completed';
    } else {
      state.matches[matchIndex].gols_casa = null;
      state.matches[matchIndex].gols_fora = null;
      state.matches[matchIndex].status = 'unplayed';
    }

    // Recalculate everything since scores changed!
    const { roundScores, rankings, userBadges } = computeAllStats(
      state.users,
      state.matches,
      state.predictions
    );

    state.user_badges = userBadges;
    state.round_scores = roundScores;

    await saveDBState(state);

    res.json({ success: true, message: 'Resultado do jogo atualizado e pontuações recalculadas!', state });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Register new user / sign-in (mock-friendly durable registration)
app.post('/api/register', async (req, res) => {
  try {
    const { nome, email, avatar_url, is_paid } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
    }

    const state = await getDBState();

    // Check if email already registered
    let user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      if (state.allow_registrations === false) {
        return res.status(400).json({ error: 'As inscrições para novos participantes do Bolão estão encerradas!' });
      }
      const defaultAvatars = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80',
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80'
      ];
      const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

      const newUser: User = {
        id: `user-${Date.now()}`,
        nome,
        email: email.toLowerCase(),
        avatar_url: avatar_url || randomAvatar,
        isAdmin: false,
        isPaid: is_paid || false
      };

      state.users.push(newUser);
      user = newUser;
    } else {
      // Update avatar if provided
      if (avatar_url) user.avatar_url = avatar_url;
      if (nome) user.nome = nome;
      if (is_paid !== undefined) user.isPaid = is_paid;
    }

    // Recompute stats for registration
    const { roundScores, rankings, userBadges } = computeAllStats(
      state.users,
      state.matches,
      state.predictions
    );

    state.user_badges = userBadges;
    state.round_scores = roundScores;

    await saveDBState(state);

    res.json({ success: true, user, state });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle admin status of a user
app.post('/api/user/toggle-admin', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    const state = await getDBState();
    const userIndex = state.users.findIndex((u) => u.id === user_id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Toggle isAdmin flag
    state.users[userIndex].isAdmin = !state.users[userIndex].isAdmin;

    await saveDBState(state);
    res.json({ success: true, user: state.users[userIndex], state });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle paid status of a user
app.post('/api/user/toggle-paid', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    const state = await getDBState();
    const userIndex = state.users.findIndex((u) => u.id === user_id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Toggle isPaid flag
    state.users[userIndex].isPaid = !state.users[userIndex].isPaid;

    await saveDBState(state);
    res.json({ success: true, user: state.users[userIndex], state });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle registration setting (Admin Only)
app.post('/api/settings/toggle-registration', async (req, res) => {
  try {
    const { requester_id } = req.body;
    const state = await getDBState();

    // Verify requester is admin
    const requester = state.users.find((u) => u.id === requester_id);
    if (!requester || !requester.isAdmin) {
      return res.status(403).json({ error: 'Apenas administradores podem alterar as configurações de inscrições.' });
    }

    state.allow_registrations = state.allow_registrations === false ? true : false;
    await saveDBState(state);

    res.json({ success: true, allow_registrations: state.allow_registrations, state });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user profile (Admin Only)
app.post('/api/user/delete', async (req, res) => {
  try {
    const { user_id, requester_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    const state = await getDBState();

    // Check if requester is admin
    const requester = state.users.find((u) => u.id === requester_id);
    if (!requester || !requester.isAdmin) {
      return res.status(403).json({ error: 'Apenas administradores podem excluir perfis de usuários.' });
    }

    if (user_id === 'user-diego') {
      return res.status(400).json({ error: 'Não é possível excluir o Presidente (Dono) do Bolão.' });
    }

    if (user_id === requester_id) {
      return res.status(400).json({ error: 'Você não pode excluir o seu próprio perfil.' });
    }

    const userIndex = state.users.findIndex((u) => u.id === user_id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // 1. Delete predictions and user from Supabase explicitly
    const { error: predError } = await supabase.from('predictions').delete().eq('user_id', user_id);
    if (predError) throw predError;

    const { error: userError } = await supabase.from('users').delete().eq('id', user_id);
    if (userError) throw userError;

    // 2. Remove user and predictions from the current state object in memory
    state.users.splice(userIndex, 1);
    state.predictions = state.predictions.filter((p) => p.user_id !== user_id);

    // 3. Recompute all scores, badges, and rankings based on the new active participants
    const { roundScores, userBadges } = computeAllStats(
      state.users,
      state.matches,
      state.predictions
    );

    state.user_badges = userBadges;
    state.round_scores = roundScores;

    // 4. Save the new state
    await saveDBState(state);

    res.json({ success: true, state });
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import matches from an external list (Admin Manual Override)
app.post('/api/match/import', async (req, res) => {
  try {
    const { matches } = req.body;

    if (!Array.isArray(matches)) {
      return res.status(400).json({ error: 'A lista de jogos importados deve ser um array.' });
    }

    const state = await getDBState();

    // Merge or insert imported matches
    matches.forEach((imported: any) => {
      const matchIndex = state.matches.findIndex((m) => m.id === imported.id || (m.time_casa === imported.time_casa && m.time_fora === imported.time_fora && m.fase === imported.fase));

      const finalMatch: Match = {
        id: imported.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        fase: imported.fase || 'Rodada Geral',
        time_casa: imported.time_casa,
        time_fora: imported.time_fora,
        bandeira_casa: imported.bandeira_casa || '⚽',
        bandeira_fora: imported.bandeira_fora || '⚽',
        data_hora: imported.data_hora || new Date().toISOString(),
        estadio: imported.estadio || 'Estádio da Copa 2026',
        gols_casa: imported.gols_casa !== undefined ? imported.gols_casa : null,
        gols_fora: imported.gols_fora !== undefined ? imported.gols_fora : null,
        status: imported.status || 'unplayed'
      };

      if (matchIndex >= 0) {
        state.matches[matchIndex] = finalMatch;
      } else {
        state.matches.push(finalMatch);
      }
    });

    // Recompute
    const { roundScores, rankings, userBadges } = computeAllStats(
      state.users,
      state.matches,
      state.predictions
    );

    state.user_badges = userBadges;
    state.round_scores = roundScores;

    await saveDBState(state);

    res.json({ success: true, message: 'Jogos importados com sucesso!', state });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper for translating team names to Portuguese
function translateTeamName(name: string): string {
  if (!name) return name;
  const norm = name.trim().toLowerCase();
  if (norm === 'brazil') return 'Brasil';
  if (norm === 'japan') return 'Japão';
  if (norm === 'south africa') return 'África do Sul';
  if (norm === 'canada') return 'Canadá';
  if (norm === 'germany') return 'Alemanha';
  if (norm === 'paraguay') return 'Paraguai';
  if (norm === 'switzerland') return 'Suíça';
  if (norm === 'argentina') return 'Argentina';
  if (norm === 'cape verde') return 'Cabo Verde';
  if (norm === 'australia') return 'Austrália';
  if (norm === 'egypt') return 'Egito';
  if (norm === 'france') return 'França';
  if (norm === 'united states' || norm === 'usa') return 'EUA';
  if (norm === 'bosnia and herzegovina' || norm === 'bosnia') return 'Bósnia e Herzegovina';
  if (norm === 'belgium') return 'Bélgica';
  if (norm === 'iran') return 'Irã';
  if (norm === 'spain') return 'Espanha';
  if (norm === 'saudi arabia') return 'Arábia Saudita';
  if (norm === 'uruguay') return 'Uruguai';
  if (norm === 'jordan') return 'Jordânia';
  if (norm === 'algeria') return 'Argélia';
  if (norm === 'austria') return 'Áustria';
  if (norm === 'portugal') return 'Portugal';
  if (norm === 'uzbekistan') return 'Uzbequistão';
  if (norm === 'colombia') return 'Colômbia';
  if (norm === 'democratic republic of the congo' || norm === 'congo dr') return 'RD do Congo';
  if (norm === 'panama') return 'Panamá';
  if (norm === 'croatia') return 'Croácia';
  if (norm === 'ghana') return 'Gana';
  if (norm === 'new zealand') return 'Nova Zelândia';
  if (norm === 'morocco') return 'Marrocos';
  if (norm === 'haiti') return 'Haiti';
  if (norm === 'scotland') return 'Escócia';
  if (norm === 'mexico') return 'México';
  if (norm === 'south korea') return 'Coreia do Sul';
  if (norm === 'czech republic') return 'República Tcheca';
  if (norm === 'tunisia') return 'Tunísia';
  if (norm === 'iraq') return 'Iraque';
  if (norm === 'norway') return 'Noruega';
  if (norm === 'senegal') return 'Senegal';
  if (norm === 'curaçao' || norm === 'curacao') return 'Curaçao';
  if (norm === 'ivory coast') return 'Costa do Marfim';
  if (norm === 'ecuador') return 'Equador';
  if (norm === 'sweden') return 'Suécia';
  if (norm === 'turkey') return 'Turquia';
  return name;
}

// Helper for mapping flag emoji from team name
function getCountryFlag(name: string): string {
  const norm = name?.trim().toLowerCase() || '';
  if (norm.includes('algeria') || norm.includes('argélia')) return '🇩🇿';
  if (norm.includes('argentina')) return '🇦🇷';
  if (norm.includes('australia') || norm.includes('austrália')) return '🇦🇺';
  if (norm.includes('austria') || norm.includes('áustria')) return '🇦🇹';
  if (norm.includes('belgium') || norm.includes('bélgica')) return '🇧🇪';
  if (norm.includes('bosnia') || norm.includes('bósnia')) return '🇧🇦';
  if (norm.includes('brazil') || norm.includes('brasil')) return '🇧🇷';
  if (norm.includes('canada') || norm.includes('canadá')) return '🇨🇦';
  if (norm.includes('cape verde') || norm.includes('cabo verde')) return '🇨🇻';
  if (norm.includes('colombia') || norm.includes('colômbia')) return '🇨🇴';
  if (norm.includes('croatia') || norm.includes('croácia')) return '🇭🇷';
  if (norm.includes('curaçao') || norm.includes('curacao')) return '🇨🇼';
  if (norm.includes('czech') || norm.includes('tcheca')) return '🇨🇿';
  if (norm.includes('congo')) return '🇨🇩';
  if (norm.includes('ecuador') || norm.includes('equador')) return '🇪🇨';
  if (norm.includes('egypt') || norm.includes('egito')) return '🇪🇬';
  if (norm.includes('england') || norm.includes('inglaterra')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (norm.includes('france') || norm.includes('frança')) return '🇫🇷';
  if (norm.includes('germany') || norm.includes('alemanha')) return '🇩🇪';
  if (norm.includes('ghana') || norm.includes('gana')) return '🇬🇭';
  if (norm.includes('haiti')) return '🇭🇹';
  if (norm.includes('iran') || norm.includes('irã')) return '🇮🇷';
  if (norm.includes('iraq') || norm.includes('iraque')) return '🇮🇶';
  if (norm.includes('ivory coast') || norm.includes('costa do marfim')) return '🇨🇮';
  if (norm.includes('japan') || norm.includes('japão')) return '🇯🇵';
  if (norm.includes('jordan') || norm.includes('jordânia')) return '🇯🇴';
  if (norm.includes('mexico') || norm.includes('méxico')) return '🇲🇽';
  if (norm.includes('morocco') || norm.includes('marrocos')) return '🇲🇦';
  if (norm.includes('netherlands') || norm.includes('holanda')) return '🇳🇱';
  if (norm.includes('new zealand') || norm.includes('nova zelândia')) return '🇳🇿';
  if (norm.includes('norway') || norm.includes('noruega')) return '🇳🇴';
  if (norm.includes('panama') || norm.includes('panamá')) return '🇵🇦';
  if (norm.includes('paraguay') || norm.includes('paraguai')) return '🇵🇾';
  if (norm.includes('portugal')) return '🇵🇹';
  if (norm.includes('qatar') || norm.includes('catar')) return '🇶🇦';
  if (norm.includes('saudi') || norm.includes('arábia')) return '🇸🇦';
  if (norm.includes('scotland') || norm.includes('escócia')) return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
  if (norm.includes('senegal')) return '🇸🇳';
  if (norm.includes('south africa') || norm.includes('áfrica do sul')) return '🇿🇦';
  if (norm.includes('korea') || norm.includes('coreia')) return '🇰🇷';
  if (norm.includes('spain') || norm.includes('espanha')) return '🇪🇸';
  if (norm.includes('sweden') || norm.includes('suécia')) return '🇸🇪';
  if (norm.includes('switzerland') || norm.includes('suíça')) return '🇨🇭';
  if (norm.includes('tunisia') || norm.includes('tunísia')) return '🇹🇳';
  if (norm.includes('turkey') || norm.includes('turquia')) return '🇹🇷';
  if (norm.includes('united states') || norm.includes('eua') || norm.includes('usa') || norm.includes('estados unidos')) return '🇺🇸';
  if (norm.includes('uruguay') || norm.includes('uruguai')) return '🇺🇾';
  if (norm.includes('uzbekistan') || norm.includes('uzbequistão')) return '🇺🇿';
  return '⚽';
}

// Helper to check if a team name is a placeholder or invalid
function isPlaceholderOrInvalid(name: string): boolean {
  if (!name) return true;
  const n = name.trim().toLowerCase();
  return n === 'undefined' || n === 'null' || n === '' || n.startsWith('time a') || n.startsWith('time b') || n.startsWith('vencedor jogo') || n.startsWith('perdedor jogo');
}

// Simulated real match schedule generator for World Cup 2026 fallback
function getFallbackWorldCup2026(): Match[] {
  return [
    {
      id: "wc2026-m1",
      fase: "Grupo A",
      time_casa: "México",
      time_fora: "Inglaterra",
      bandeira_casa: "🇲🇽",
      bandeira_fora: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      data_hora: "2026-06-11T19:00:00Z",
      estadio: "Estádio Azteca, Cidade do México",
      gols_casa: null,
      gols_fora: null,
      status: "unplayed"
    },
    {
      id: "wc2026-m2",
      fase: "Grupo B",
      time_casa: "Canadá",
      time_fora: "França",
      bandeira_casa: "🇨🇦",
      bandeira_fora: "🇫🇷",
      data_hora: "2026-06-12T22:00:00Z",
      estadio: "BC Place, Vancouver",
      gols_casa: null,
      gols_fora: null,
      status: "unplayed"
    },
    {
      id: "wc2026-m3",
      fase: "Grupo C",
      time_casa: "EUA",
      time_fora: "Espanha",
      bandeira_casa: "🇺🇸",
      bandeira_fora: "🇪🇸",
      data_hora: "2026-06-13T00:00:00Z",
      estadio: "MetLife Stadium, East Rutherford",
      gols_casa: null,
      gols_fora: null,
      status: "unplayed"
    },
    {
      id: "wc2026-m4",
      fase: "Grupo D",
      time_casa: "Brasil",
      time_fora: "Alemanha",
      bandeira_casa: "🇧🇷",
      bandeira_fora: "🇩🇪",
      data_hora: "2026-06-14T01:00:00Z",
      estadio: "SoFi Stadium, Los Angeles",
      gols_casa: null,
      gols_fora: null,
      status: "unplayed"
    },
    {
      id: "wc2026-m5",
      fase: "Grupo E",
      time_casa: "Argentina",
      time_fora: "Itália",
      bandeira_casa: "🇦🇷",
      bandeira_fora: "🇮🇹",
      data_hora: "2026-06-14T23:00:00Z",
      estadio: "Hard Rock Stadium, Miami",
      gols_casa: null,
      gols_fora: null,
      status: "unplayed"
    },
    {
      id: "wc2026-m6",
      fase: "Grupo F",
      time_casa: "Portugal",
      time_fora: "Japão",
      bandeira_casa: "🇵🇹",
      bandeira_fora: "🇯🇵",
      data_hora: "2026-06-15T19:00:00Z",
      estadio: "Mercedes-Benz Stadium, Atlanta",
      gols_casa: null,
      gols_fora: null,
      status: "unplayed"
    },
    {
      id: "wc2026-m7",
      fase: "Grupo G",
      time_casa: "Bélgica",
      time_fora: "Marrocos",
      bandeira_casa: "🇧🇪",
      bandeira_fora: "🇲🇦",
      data_hora: "2026-06-16T22:00:00Z",
      estadio: "Gillette Stadium, Boston",
      gols_casa: null,
      gols_fora: null,
      status: "unplayed"
    },
    {
      id: "wc2026-m8",
      fase: "Grupo H",
      time_casa: "Holanda",
      time_fora: "Uruguai",
      bandeira_casa: "🇳🇱",
      bandeira_fora: "🇺🇾",
      data_hora: "2026-06-18T01:00:00Z",
      estadio: "NRG Stadium, Houston",
      gols_casa: null,
      gols_fora: null,
      status: "unplayed"
    }
  ];
}

function fetchJSONFromURL(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const secure = url.startsWith('https');
    const client = secure ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location;
        resolve(fetchJSONFromURL(redirectUrl));
        return;
      }
      
      let data = '';
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        reject(new Error(`URL respondeu com status code ${res.statusCode}`));
        return;
      }
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Formato JSON inválido retornado pela URL.'));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

// Fetch and sync matches via external JSON URL
app.post('/api/match/import-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória para sincronização externa.' });
    }

    let parsedData: any = null;
    let isFallback = false;
    let errorMsg = '';

    try {
      parsedData = await fetchJSONFromURL(url);
    } catch (err: any) {
      errorMsg = err.message || 'Erro de conexão ou 404';
      console.warn(`Sincronização externa para ${url} falhou: ${errorMsg}. Carregando base simulada de segurança da Copa 2026...`);
      parsedData = getFallbackWorldCup2026();
      isFallback = true;
    }

    // Adapt structure
    let rawList: any[] = [];
    if (Array.isArray(parsedData)) {
      rawList = parsedData;
    } else if (parsedData && typeof parsedData === 'object') {
      const possibleList = parsedData.matches || parsedData.fixtures || parsedData.games || parsedData.data || Object.values(parsedData).find((v: any) => Array.isArray(v));
      if (Array.isArray(possibleList)) {
        rawList = possibleList;
      }
    }

    if (rawList.length === 0) {
      if (!isFallback) {
        rawList = getFallbackWorldCup2026();
        isFallback = true;
      } else {
        return res.status(400).json({ error: 'A resposta do servidor externo não possui uma lista de jogos válida.' });
      }
    }

    // Normalize
    const normalizedMatches = rawList.map((item: any, index: number) => {
      const homeTeamRaw = String(
        item.time_casa ||
        item.home_team ||
        item.home_team_name_en ||
        item.homeTeam ||
        item.home ||
        item.team1 ||
        item.team_casa ||
        item.teamA ||
        `Time A ${index + 1}`
      ).trim();

      const awayTeamRaw = String(
        item.time_fora ||
        item.away_team ||
        item.away_team_name_en ||
        item.awayTeam ||
        item.away ||
        item.team2 ||
        item.team_fora ||
        item.teamB ||
        `Time B ${index + 1}`
      ).trim();

      const homeTeam = translateTeamName(homeTeamRaw);
      const awayTeam = translateTeamName(awayTeamRaw);
      
      // Mapeamento de fase para suportar a API da Copa 2026
      let rawStage = '';
      if (item.type === 'group' && item.group) {
        rawStage = `Grupo ${item.group}`;
      } else if (item.type === 'r32') {
        rawStage = 'Dezesseis-avos (32)';
      } else if (item.type === 'r16') {
        rawStage = 'Oitavas de Final';
      } else if (item.type === 'qf') {
        rawStage = 'Quartas de Final';
      } else if (item.type === 'sf') {
        rawStage = 'Semifinal';
      } else if (item.type === 'third') {
        rawStage = 'Decisão 3º Lugar';
      } else if (item.type === 'final') {
        rawStage = 'Grande Final';
      } else {
        rawStage = item.fase || item.stage || item.round || item.phase || (item.group ? `Grupo ${item.group}` : 'Fase de Grupos');
      }

      let fase = String(rawStage).trim();
      if (
        fase === 'Oitavas de Final' ||
        fase === 'Quartas de Final' ||
        fase === 'Dezesseis-avos (32)' ||
        fase === 'Semifinal' ||
        fase === 'Decisão 3º Lugar' ||
        fase === 'Grande Final' ||
        fase.startsWith('Grupo ')
      ) {
        // Já mapeado corretamente, não fazer nada
      } else {
        if (fase.toLowerCase() === 'group stage' || fase.toLowerCase().startsWith('group')) {
          fase = fase.replace(/group/i, 'Grupo');
        } else if (fase.toLowerCase().includes('round of 32')) {
          fase = 'Dezesseis-avos (32)';
        } else if (fase.toLowerCase().includes('round of 16')) {
          fase = 'Oitavas de Final';
        } else if (fase.toLowerCase().includes('quarter')) {
          fase = 'Quartas de Final';
        } else if (fase.toLowerCase().includes('semi')) {
          fase = 'Semifinal';
        } else if (fase.toLowerCase().includes('final')) {
          fase = 'Grande Final';
        }
      }

      let data_hora = new Date().toISOString();
      try {
        const parsedDate = item.data_hora || item.local_date || item.date || item.kickoff || item.time || item.datetime || item.timestamp;
        if (parsedDate) {
          // Determina a diferença de fuso horário de acordo com o estádio (horário de verão de Junho/Julho)
          const stadiumId = String(item.stadium_id || '');
          let offsetHours = 0;
          if (['7', '8', '9', '10', '11', '12'].includes(stadiumId)) {
            offsetHours = -4; // EDT (Eastern Daylight Time - Miami, Atlanta, Boston, Philadelphia, NY/NJ, Toronto)
          } else if (['4', '5', '6'].includes(stadiumId)) {
            offsetHours = -5; // CDT (Central Daylight Time - Houston, Kansas City, Dallas)
          } else if (['1', '2', '3'].includes(stadiumId)) {
            offsetHours = -6; // CST (Central Standard Time - Mexico City, Guadalajara, Monterrey)
          } else if (['13', '14', '15', '16'].includes(stadiumId)) {
            offsetHours = -7; // PDT (Pacific Daylight Time - Vancouver, Seattle, San Francisco, Los Angeles)
          }

          // Se tivermos local_date no formato MM/DD/YYYY HH:MM, convertemos aplicando o fuso do estádio
          const matchLocal = String(item.local_date || '').match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
          if (matchLocal) {
            const [_, month, day, year, hour, minute] = matchLocal;
            const absOffset = Math.abs(offsetHours);
            const sign = offsetHours >= 0 ? '+' : '-';
            const offsetStr = `${sign}${String(absOffset).padStart(2, '0')}:00`;
            const isoStr = `${year}-${month}-${day}T${hour}:${minute}:00${offsetStr}`;
            const d = new Date(isoStr);
            if (!isNaN(d.getTime())) {
              data_hora = d.toISOString();
            }
          } else {
            const d = new Date(parsedDate);
            if (!isNaN(d.getTime())) {
              data_hora = d.toISOString();
            }
          }
        }
      } catch {
        // use default
      }

      const estadio = String(item.estadio || item.venue || item.stadium || item.location || 'Estádio da Copa 2026').trim();
      let id = item.id || item.match_number || item.matchNumber || `wc2026-m${index + 1}`;
      id = String(id).startsWith('m-') ? String(id) : `m-imported-${id}`;

      let gols_casa: number | null = null;
      const rawGolsCasa = item.gols_casa !== undefined ? item.gols_casa : (item.home_score !== undefined ? item.home_score : item.homeScore);
      if (rawGolsCasa !== undefined && rawGolsCasa !== null && String(rawGolsCasa).trim() !== '') {
        const val = parseInt(String(rawGolsCasa), 10);
        if (!isNaN(val)) gols_casa = val;
      }

      let gols_fora: number | null = null;
      const rawGolsFora = item.gols_fora !== undefined ? item.gols_fora : (item.away_score !== undefined ? item.away_score : item.awayScore);
      if (rawGolsFora !== undefined && rawGolsFora !== null && String(rawGolsFora).trim() !== '') {
        const val = parseInt(String(rawGolsFora), 10);
        if (!isNaN(val)) gols_fora = val;
      }

      let status = item.status;
      const isFinished = item.finished === 'TRUE' || item.finished === true || item.time_elapsed === 'finished';

      if (status) {
        if (status !== 'completed') {
          gols_casa = null;
          gols_fora = null;
        }
      } else {
        if (isFinished) {
          status = 'completed';
        } else {
          status = 'unplayed';
          gols_casa = null;
          gols_fora = null;
        }
      }

      return {
        id,
        fase,
        time_casa: homeTeam,
        time_fora: awayTeam,
        bandeira_casa: getCountryFlag(homeTeam),
        bandeira_fora: getCountryFlag(awayTeam),
        data_hora,
        estadio,
        gols_casa,
        gols_fora,
        status
      };
    });

    const state = await getDBState();

    normalizedMatches.forEach((imported: Match) => {
      const matchIndex = state.matches.findIndex((m) => m.id === imported.id || (m.time_casa === imported.time_casa && m.time_fora === imported.time_fora && m.fase === imported.fase));
      if (matchIndex >= 0) {
        const existing = state.matches[matchIndex];
        
        const finalTimeCasa = isPlaceholderOrInvalid(imported.time_casa)
          ? existing.time_casa
          : imported.time_casa;
          
        const finalTimeFora = isPlaceholderOrInvalid(imported.time_fora)
          ? existing.time_fora
          : imported.time_fora;

        state.matches[matchIndex] = {
          ...imported,
          time_casa: finalTimeCasa,
          time_fora: finalTimeFora,
          bandeira_casa: isPlaceholderOrInvalid(imported.time_casa) ? existing.bandeira_casa : imported.bandeira_casa,
          bandeira_fora: isPlaceholderOrInvalid(imported.time_fora) ? existing.bandeira_fora : imported.bandeira_fora
        };
      } else {
        state.matches.push(imported);
      }
    });

    const { roundScores, rankings, userBadges } = computeAllStats(
      state.users,
      state.matches,
      state.predictions
    );

    state.user_badges = userBadges;
    state.round_scores = roundScores;

    await saveDBState(state);

    res.json({
      success: true,
      isFallback,
      message: isFallback
        ? `Atenção: A sincronização da URL retornou erro (${errorMsg}). O GEBolão carregou uma base simulada predefinida da Copa do Mundo 2026!`
        : `Excelente! Jogos sincronizados com sucesso direto das fontes do Kickoff Clock!`,
      state
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Full reset to original seeded values
app.post('/api/reset', async (req, res) => {
  try {
    const { roundScores, rankings, userBadges } = computeAllStats(
      initialUsers,
      initialMatches,
      initialPredictions
    );

    const newState: GameState = {
      users: initialUsers,
      matches: initialMatches,
      predictions: initialPredictions,
      badges: initialBadges,
      user_badges: userBadges,
      round_scores: roundScores
    };

    await saveDBState(newState);
    res.json({ success: true, message: 'Banco de dados restaurado com os dados originais!', state: newState });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Integrate Vite Server for Frontend Assets in Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
