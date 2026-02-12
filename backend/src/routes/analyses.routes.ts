import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { supabase } from "../services/supabase.service";
import { logActivity } from "../services/activity.service";

const router = Router();

// All analysis routes require authentication
router.use(authMiddleware);

/**
 * GET /api/analyses
 * List all analyses for the current user
 * Query params:
 *   ?sourceType=resume|profile
 *   ?jobId=uuid
 *   ?resumeId=uuid (alias for sourceResumeId)
 *   ?analysisType=general|job-fit
 *   ?minScore=0-100
 *   ?limit=20
 *   ?offset=0
 */
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const {
      sourceType,
      jobId,
      resumeId,
      analysisType,
      minScore,
      limit = "20",
      offset = "0",
    } = req.query;

    let query = supabase
      .from("analyses")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1
      );

    // Apply filters
    if (sourceType === "resume" || sourceType === "profile") {
      query = query.eq("source_type", sourceType);
    }

    if (jobId && typeof jobId === "string") {
      query = query.eq("job_id", jobId);
    }

    if (resumeId && typeof resumeId === "string") {
      query = query.eq("source_resume_id", resumeId);
    }

    if (analysisType === "general" || analysisType === "job-fit") {
      query = query.eq("analysis_type", analysisType);
    }

    if (minScore) {
      const minScoreNum = parseInt(minScore as string);
      if (!isNaN(minScoreNum)) {
        query = query.gte("score", minScoreNum);
      }
    }

    const { data: analyses, error, count } = await query;

    if (error) {
      throw new Error("Failed to fetch analyses: " + error.message);
    }

    res.json({
      results: analyses || [],
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
 * Get a specific analysis with full details
 */
router.get(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: analysis, error } = await supabase
      .from("analyses")
      .select(`
        *,
        source_resume:source_resume_id (id, title),
        job:job_id (id, title),
        company:company_id (id, name)
      `)
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

    res.json(analysis);
  })
);

/**
 * DELETE /api/analyses/:id
 * Delete an analysis
 */
router.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    // Get analysis info before deleting for activity log
    const { data: analysis } = await supabase
      .from("analyses")
      .select("source_type, score")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    const { error } = await supabase
      .from("analyses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to delete analysis: " + error.message);
    }

    // Log activity
    if (analysis) {
      logActivity({
        userId,
        action: "delete",
        entityType: "analysis",
        entityId: id,
        displayTitle: `Deleted ${analysis.source_type} analysis (score: ${analysis.score})`,
      });
    }

    res.json({ success: true, message: "Analysis deleted" });
  })
);

/**
 * GET /api/analyses/stats/summary
 * Get analysis statistics for the current user
 */
router.get(
  "/stats/summary",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    // Get total count
    const { count: totalCount } = await supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get count by type
    const { count: generalCount } = await supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("analysis_type", "general");

    const { count: jobFitCount } = await supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("analysis_type", "job-fit");

    // Get average score
    const { data: allAnalyses } = await supabase
      .from("analyses")
      .select("score")
      .eq("user_id", userId);

    const scores = (allAnalyses || []).map((a) => a.score).filter((s) => s != null);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : null;

    // Get recent analyses
    const { data: recentAnalyses } = await supabase
      .from("analyses")
      .select(`
        id,
        analysis_type,
        score,
        source_type,
        created_at,
        job:job_id (title),
        company:company_id (name)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    res.json({
      total: totalCount || 0,
      generalCount: generalCount || 0,
      jobFitCount: jobFitCount || 0,
      averageScore: avgScore,
      recentAnalyses: recentAnalyses || [],
    });
  })
);

export default router;
