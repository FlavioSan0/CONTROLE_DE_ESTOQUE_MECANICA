import "dotenv/config";
import express from "express";
import cors from "cors";
import { routes } from "./routes";

const app = express();

function removeTrailingSlash(url?: string) {
  return url?.trim().replace(/\/$/, "");
}

const allowedOrigins = [
  "http://localhost:3000",
  removeTrailingSlash(process.env.FRONTEND_URL),
  removeTrailingSlash(process.env.FRONTEND_URL_PRODUCTION),
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn("CORS bloqueado para origin:", origin);
    console.warn("Origins liberadas:", allowedOrigins);

    return callback(new Error(`Origin não permitido pelo CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());

app.get("/health", (_req, res) => {
  return res.json({ ok: true });
});

app.use(routes);

const PORT = Number(process.env.PORT || 3333);

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log("Origins liberadas no CORS:", allowedOrigins);
});