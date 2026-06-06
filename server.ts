import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

// Import initial data and calculation engine
import {
  initialUsers,
  initialMatches,
  initialPredictions,
  initialBadges,
  computeAllStats
} from './src/initialData.js';
import { GameState, Prediction, Match, User } from './src/types.js';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json());

// Load or initialize DB state
async function getDBState(): Promise<GameState> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    const state = JSON.parse(data) as GameState;
    // Check if we need to migrate the database state to the real World Cup 2026 matches
    const hasOldMatches = state.matches.some(m => m.fase === 'Rodada 1' || m.fase === 'Rodada 2' || m.fase === 'Rodada 3');
    if (hasOldMatches || state.matches.length < 10) {
      console.log('Migrating existing database in db.json to the real World Cup 2026 match schedule...');
      state.matches = initialMatches;
      // Recompute stats
      const { roundScores, rankings, userBadges } = computeAllStats(
        state.users,
        state.matches,
        state.predictions
      );
      state.user_badges = userBadges;
      state.round_scores = roundScores;
      await saveDBState(state);
    }
    return state;
  } catch (err) {
    console.log('No db.json found or corrupt. Initializing with seeded data...');
    // Initial compute
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
    return newState;
  }
}

async function saveDBState(state: GameState): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
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
      logo_image: state.logo_image || ''
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
    const { nome, email, avatar_url } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
    }

    const state = await getDBState();

    // Check if email already registered
    let user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
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
        isAdmin: false
      };

      state.users.push(newUser);
      user = newUser;
    } else {
      // Update avatar if provided
      if (avatar_url) user.avatar_url = avatar_url;
      if (nome) user.nome = nome;
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

// Helper for mapping flag emoji from team name
function getCountryFlag(name: string): string {
  const norm = name?.trim().toLowerCase() || '';
  if (norm.includes('brasil') || norm.includes('brazil')) return '🇧🇷';
  if (norm.includes('croacia') || norm.includes('croatia')) return '🇭🇷';
  if (norm.includes('argentina')) return '🇦🇷';
  if (norm.includes('frança') || norm.includes('france')) return '🇫🇷';
  if (norm.includes('espanha') || norm.includes('spain')) return '🇪🇸';
  if (norm.includes('alemanha') || norm.includes('germany')) return '🇩🇪';
  if (norm.includes('portugal')) return '🇵🇹';
  if (norm.includes('uruguai') || norm.includes('uruguay')) return '🇺🇾';
  if (norm.includes('estados unidos') || norm.includes('usa') || norm.includes('eua') || norm.includes('united states')) return '🇺🇸';
  if (norm.includes('mexico') || norm.includes('méxico')) return '🇲🇽';
  if (norm.includes('canada') || norm.includes('canadá')) return '🇨🇦';
  if (norm.includes('italia') || norm.includes('italy')) return '🇮🇹';
  if (norm.includes('inglaterra') || norm.includes('england')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (norm.includes('holanda') || norm.includes('netherlands')) return '🇳🇱';
  if (norm.includes('belgica') || norm.includes('belgium')) return '🇧🇪';
  if (norm.includes('marrocos') || norm.includes('morocco')) return '🇲🇦';
  if (norm.includes('japao') || norm.includes('japan')) return '🇯🇵';
  if (norm.includes('senegal')) return '🇸🇳';
  if (norm.includes('equador') || norm.includes('ecuador')) return '🇪🇨';
  if (norm.includes('catar') || norm.includes('qatar')) return '🇶🇦';
  if (norm.includes('suiça') || norm.includes('switzerland')) return '🇨🇭';
  if (norm.includes('camaroes') || norm.includes('cameroon')) return '🇨🇲';
  if (norm.includes('coreia') || norm.includes('korea')) return '🇰🇷';
  if (norm.includes('gana') || norm.includes('ghana')) return '🇬🇭';
  if (norm.includes('servia') || norm.includes('serbia')) return '🇷🇸';
  if (norm.includes('dinamarca') || norm.includes('denmark')) return '🇩🇰';
  if (norm.includes('tunisia') || norm.includes('tunisia')) return '🇹🇳';
  if (norm.includes('polonia') || norm.includes('poland')) return '🇵🇱';
  if (norm.includes('aravia') || norm.includes('saudi')) return '🇸🇦';
  if (norm.includes('australia') || norm.includes('australia')) return '🇦🇺';
  if (norm.includes('gales') || norm.includes('wales')) return '🏴󠁧󠁢󠁷󠁬󠁳󠁿';
  if (norm.includes('ira') || norm.includes('iran')) return '🇮🇷';
  if (norm.includes('costa rica')) return '🇨🇷';
  return '⚽';
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
      data_hora: "2026-06-11T18:00:00Z",
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
      data_hora: "2026-06-12T15:00:00Z",
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
      data_hora: "2026-06-12T20:00:00Z",
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
      data_hora: "2026-06-13T18:00:00Z",
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
      data_hora: "2026-06-14T19:00:00Z",
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
      data_hora: "2026-06-15T15:00:00Z",
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
      data_hora: "2026-06-16T18:00:00Z",
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
      data_hora: "2026-06-17T20:00:00Z",
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
      const homeTeam = String(item.time_casa || item.home_team || item.homeTeam || item.home || item.team1 || item.team_casa || item.teamA || `Time A ${index + 1}`).trim();
      const awayTeam = String(item.time_fora || item.away_team || item.awayTeam || item.away || item.team2 || item.team_fora || item.teamB || `Time B ${index + 1}`).trim();
      
      const rawStage = item.fase || item.stage || item.group || item.round || item.phase || item.matchday || 'Fase de Grupos';
      let fase = String(rawStage).trim();
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

      let data_hora = new Date().toISOString();
      try {
        const parsedDate = item.data_hora || item.date || item.kickoff || item.time || item.datetime || item.timestamp;
        if (parsedDate) {
          const d = new Date(parsedDate);
          if (!isNaN(d.getTime())) {
            data_hora = d.toISOString();
          }
        }
      } catch {
        // use default
      }

      const estadio = String(item.estadio || item.venue || item.stadium || item.location || 'Estádio da Copa 2026').trim();
      let id = item.id || item.match_number || item.matchNumber || `wc2026-m${index + 1}`;
      id = String(id).startsWith('m-') ? String(id) : `m-imported-${id}`;

      const gols_casa = item.gols_casa !== undefined && item.gols_casa !== null ? parseInt(item.gols_casa, 10) : null;
      const gols_fora = item.gols_fora !== undefined && item.gols_fora !== null ? parseInt(item.gols_fora, 10) : null;
      const status = item.status || ((gols_casa !== null && gols_fora !== null) ? 'completed' : 'unplayed');

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
        state.matches[matchIndex] = imported;
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
