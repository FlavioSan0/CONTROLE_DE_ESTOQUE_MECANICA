import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("As variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);