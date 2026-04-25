import { Router } from "express";
import { MovementController } from "../controllers/MovementController";

export const movementRoutes = Router();
const movementController = new MovementController();

movementRoutes.get("/opcoes-entrada", (req, res) =>
  movementController.getEntryOptions(req, res)
);

movementRoutes.get("/opcoes-saida", (req, res) =>
  movementController.getExitOptions(req, res)
);

movementRoutes.get("/opcoes-filtros", (req, res) =>
  movementController.getFilterOptions(req, res)
);

movementRoutes.get("/", (req, res) => movementController.index(req, res));

movementRoutes.post("/entrada", (req, res) =>
  movementController.createEntry(req, res)
);

movementRoutes.post("/saida", (req, res) =>
  movementController.createExit(req, res)
);