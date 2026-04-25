import { Router } from "express";
import { MovementController } from "../controllers/MovementController";
import { uploadNotaFiscal } from "../middlewares/upload.middleware";

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

movementRoutes.post(
  "/entrada",
  uploadNotaFiscal.single("nota_fiscal_arquivo"),
  (req, res) => movementController.createEntry(req, res)
);

movementRoutes.post(
  "/entradas",
  uploadNotaFiscal.single("nota_fiscal_arquivo"),
  (req, res) => movementController.createEntry(req, res)
);

movementRoutes.post("/saida", (req, res) =>
  movementController.createExit(req, res)
);