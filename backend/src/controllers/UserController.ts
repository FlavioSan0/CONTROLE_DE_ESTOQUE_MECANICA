import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { supabase } from "../utils/supabase";

export class UserController {
  async index(req: Request, res: Response) {
    try {
      const service = new UserService();
      const result = await service.list();

      return res.json(result);
    } catch (error) {
      console.error("Erro ao listar usuários:", error);

      return res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao listar usuários.",
      });
    }
  }

  async me(req: Request, res: Response) {
    try {
      const authUserId = req.user?.id;
      const email = req.user?.email?.trim().toLowerCase();

      console.log("GET /usuarios/me -> authUserId:", authUserId);
      console.log("GET /usuarios/me -> email:", email);

      if (!authUserId && !email) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      const service = new UserService();
      const result = await service.me(authUserId, email);

      console.log("GET /usuarios/me -> result:", result);

      return res.json(result);
    } catch (error) {
      console.error("Erro ao buscar usuário autenticado:", error);

      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao buscar usuário autenticado.",
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const requesterEmail = req.user?.email?.trim().toLowerCase();

      if (!requesterEmail) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      const requester = await supabase
        .from("usuarios")
        .select("perfil, ativo")
        .eq("email", requesterEmail)
        .maybeSingle();

      if (!requester.data || !requester.data.ativo) {
        return res.status(403).json({ error: "Usuário sem permissão." });
      }

      if (requester.data.perfil !== "admin") {
        return res.status(403).json({
          error: "Apenas usuários admin podem gerenciar usuários.",
        });
      }

      const service = new UserService();
      const result = await service.create(req.body);

      return res.status(201).json(result);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);

      return res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao criar usuário.",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const requesterEmail = req.user?.email?.trim().toLowerCase();
      const userIdParam = req.params.id;

      if (!requesterEmail) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      if (!userIdParam || Array.isArray(userIdParam)) {
        return res.status(400).json({ error: "ID do usuário inválido." });
      }

      const requester = await supabase
        .from("usuarios")
        .select("perfil, ativo")
        .eq("email", requesterEmail)
        .maybeSingle();

      if (!requester.data || !requester.data.ativo) {
        return res.status(403).json({ error: "Usuário sem permissão." });
      }

      if (requester.data.perfil !== "admin") {
        return res.status(403).json({
          error: "Apenas usuários admin podem gerenciar usuários.",
        });
      }

      const service = new UserService();
      const result = await service.update(userIdParam, req.body);

      return res.json(result);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);

      return res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erro ao atualizar usuário.",
      });
    }
  }

  async finalizeFirstAccess(req: Request, res: Response) {
    try {
      const authUserId = req.user?.id;
      const email = req.user?.email?.trim().toLowerCase();

      console.log("finalizeFirstAccess -> authUserId:", authUserId);
      console.log("finalizeFirstAccess -> email:", email);

      if (!authUserId && !email) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      const service = new UserService();
      const result = await service.finalizeFirstAccess(authUserId, email);

      console.log("finalizeFirstAccess -> result:", result);

      return res.json(result);
    } catch (error) {
      console.error("Erro ao finalizar primeiro acesso:", error);

      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Erro ao finalizar primeiro acesso.",
      });
    }
  }
}