import "dotenv/config";
import express from "express";
import cors from "cors";
import { routes } from "./routes";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
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
});