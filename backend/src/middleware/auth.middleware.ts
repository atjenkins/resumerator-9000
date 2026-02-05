import { Request, Response, NextFunction } from "express";
import { supabase } from "../services/supabase.service";

// Extend Express Request to include user data
export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Missing authorization token",
        message: "Authorization header with Bearer token is required",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Auth error:", error);
      res.status(401).json({
        error: "Invalid or expired token",
        message: "Please log in again",
      });
      return;
    }

    // Attach user info to request
    (req as AuthRequest).user = {
      id: user.id,
      email: user.email!,
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(401).json({
      error: "Authentication failed",
      message: "An error occurred during authentication",
    });
  }
}

/**
 * Optional auth middleware - attaches user if token is present, but doesn't require it
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (user) {
        (req as AuthRequest).user = {
          id: user.id,
          email: user.email!,
        };
      }
    }

    next();
  } catch (error) {
    // If optional auth fails, just continue without user
    next();
  }
}
