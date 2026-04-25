import { Router } from "express";
import { UserController } from "../controllers/UserController";

export const userRoutes = Router();
const userController = new UserController();

userRoutes.get("/me", (req, res) => userController.me(req, res));
userRoutes.get("/", (req, res) => userController.index(req, res));
userRoutes.post("/", (req, res) => userController.create(req, res));
userRoutes.post("/finalizar-primeiro-acesso", (req, res) =>
  userController.finalizeFirstAccess(req, res)
);
userRoutes.patch("/:id", (req, res) => userController.update(req, res));