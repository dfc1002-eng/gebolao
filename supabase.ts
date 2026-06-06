import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('AVISO: SUPABASE_URL ou SUPABASE_ANON_KEY não configurados no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
