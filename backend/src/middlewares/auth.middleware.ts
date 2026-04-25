import { Request, Response, NextFunction } from "express";
import { supabase } from "../utils/supabase";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: string;
        email?: string;
        role?: string;
      };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Token não informado." });
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ error: "Token inválido." });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.error("Erro ao validar token com Supabase:", error);
      return res.status(401).json({ error: "Não autorizado." });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? undefined,
      role: typeof data.user.role === "string" ? data.user.role : undefined,
    };

    return next();
  } catch (error) {
    console.error("Erro no authMiddleware:", error);
    return res.status(401).json({ error: "Não autorizado." });
  }
}