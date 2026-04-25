import axios from "axios";
import { supabase } from "./supabase";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
  console.warn(
    "NEXT_PUBLIC_API_URL não foi definida. Configure a URL do backend no ambiente do frontend."
  );
}

export const api = axios.create({
  baseURL: baseURL || "http://localhost:3333",
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError = error?.message?.toLowerCase?.().includes("network error");

    if (isNetworkError) {
      console.error(
        "Erro de conexão com a API. Verifique NEXT_PUBLIC_API_URL e se o backend está online."
      );
    }

    return Promise.reject(error);
  }
);