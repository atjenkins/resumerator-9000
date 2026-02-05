import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { supabase } from "../services/supabase.service";

const router = Router();

// All analysis routes require authentication
router.use(authMiddleware);

/**
 * GET /api/analyses
 * List all analyses (historical results) for the current user
 * Optional query params: ?type=review|build&limit=20&offset=0
 */
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { type, limit = "20", offset = "0" } = req.query;

    let query = supabase
      .from("results")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    // Filter by type if specified
    if (type && (type === "review" || type === "build")) {
      query = query.eq("type", type);
    }

    const { data: results, error, count } = await query;

    if (error) {
      throw new Error("Failed to fetch analyses: " + error.message);
    }

    res.json({
      results: results || [],
      pagination: {
        total: count || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

/**
 * GET /api/analyses/:id
 * Get a specific analysis result
 */
router.get(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: result, error } = await supabase
      .from("results")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Analysis not found" });
        return;
      }
      throw new Error("Failed to fetch analysis: " + error.message);
    }

    // Parse content if it's JSON string
    let parsedResult = { ...result };
    if (typeof result.content === "string") {
      try {
        parsedResult.content = JSON.parse(result.content);
      } catch {
        // Keep as string if not valid JSON
      }
    }

    res.json(parsedResult);
  })
);

/**
 * DELETE /api/analyses/:id
 * Delete an analysis result
 */
router.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from("results")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to delete analysis: " + error.message);
    }

    res.json({ success: true, message: "Analysis deleted" });
  })
);

/**
 * GET /api/analyses/stats
 * Get analysis statistics for the current user
 */
router.get(
  "/stats/summary",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    // Get counts by type
    const { data: reviewCount } = await supabase
      .from("results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "review");

    const { data: buildCount } = await supabase
      .from("results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "build");

    // Get recent analyses
    const { data: recentResults } = await supabase
      .from("results")
      .select("id, type, person_name, company_name, job_title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    res.json({
      totalReviews: (reviewCount as any)?.count || 0,
      totalBuilds: (buildCount as any)?.count || 0,
      recentAnalyses: recentResults || [],
    });
  })
);

export default router;
