import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { routes } from "./routes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3333);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API do sistema de estoque rodando." });
});

app.use(routes);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});