import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { supabase } from "../services/supabase.service";

const router = Router();

// All activity routes require authentication
router.use(authMiddleware);

/**
 * GET /api/activity
 * List activity log for the current user
 * Query params:
 *   ?action=analyze|generate|upload|create|update|delete
 *   ?entityType=resume|profile|company|job|analysis
 *   ?entityId=uuid
 *   ?limit=50
 *   ?offset=0
 */
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const {
      action,
      entityType,
      entityId,
      limit = "50",
      offset = "0",
    } = req.query;

    let query = supabase
      .from("activity_log")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    // Apply filters
    if (action && typeof action === "string") {
      query = query.eq("action", action);
    }

    if (entityType && typeof entityType === "string") {
      query = query.eq("entity_type", entityType);
    }

    if (entityId && typeof entityId === "string") {
      query = query.eq("entity_id", entityId);
    }

    const { data: activities, error, count } = await query;

    if (error) {
      throw new Error("Failed to fetch activity log: " + error.message);
    }

    res.json({
      activities: activities || [],
      pagination: {
        total: count || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

export default router;
