import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { supabase } from "../services/supabase.service";
import { ImportAgent } from "../agents/import-agent";

const router = Router();

// All job routes require authentication
router.use(authMiddleware);

/**
 * GET /api/jobs
 * List all jobs for the current user
 * Optional query params: ?companyId=uuid
 */
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { companyId } = req.query;

    let query = supabase
      .from("jobs")
      .select("*, companies(id, name, slug)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Filter by company if specified
    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: jobs, error } = await query;

    if (error) {
      throw new Error("Failed to fetch jobs: " + error.message);
    }

    res.json(jobs || []);
  })
);

/**
 * POST /api/jobs
 * Create a new job
 */
router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { title, slug, content, companyId } = req.body;

    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }

    // Generate slug from title if not provided
    const jobSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // If companyId provided, verify it belongs to the user
    if (companyId) {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("id", companyId)
        .eq("user_id", userId)
        .single();

      if (!company) {
        res
          .status(404)
          .json({ error: "Company not found or does not belong to user" });
        return;
      }
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        user_id: userId,
        company_id: companyId || null,
        title,
        slug: jobSlug,
        content: content || "",
      })
      .select("*, companies(id, name, slug)")
      .single();

    if (error) {
      if (error.code === "23505") {
        res
          .status(409)
          .json({
            error: "Job with this slug already exists for this company",
          });
        return;
      }
      throw new Error("Failed to create job: " + error.message);
    }

    res.status(201).json(job);
  })
);

/**
 * GET /api/jobs/:id
 * Get a specific job
 */
router.get(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: job, error } = await supabase
      .from("jobs")
      .select("*, companies(id, name, slug)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      throw new Error("Failed to fetch job: " + error.message);
    }

    res.json(job);
  })
);

/**
 * PUT /api/jobs/:id
 * Update a job
 */
router.put(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, content, companyId } = req.body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (companyId !== undefined) {
      // If changing company, verify it belongs to user
      if (companyId) {
        const { data: company } = await supabase
          .from("companies")
          .select("id")
          .eq("id", companyId)
          .eq("user_id", userId)
          .single();

        if (!company) {
          res
            .status(404)
            .json({ error: "Company not found or does not belong to user" });
          return;
        }
      }
      updates.company_id = companyId;
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*, companies(id, name, slug)")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      throw new Error("Failed to update job: " + error.message);
    }

    res.json(job);
  })
);

/**
 * DELETE /api/jobs/:id
 * Delete a job
 */
router.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to delete job: " + error.message);
    }

    res.json({ success: true, message: "Job deleted" });
  })
);

/**
 * POST /api/jobs/parse
 * Parse raw text into a structured job description (AI operation)
 */
router.post(
  "/parse",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { text, mode = "create", jobName, companyId } = req.body;

    if (!text) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    // Use existing ImportAgent to process job description
    const agent = new ImportAgent();
    const structuredMarkdown = await agent.processJobDescription(text);

    if (mode === "create") {
      // Verify company if provided
      if (companyId) {
        const { data: company } = await supabase
          .from("companies")
          .select("id")
          .eq("id", companyId)
          .eq("user_id", userId)
          .single();

        if (!company) {
          res
            .status(404)
            .json({ error: "Company not found or does not belong to user" });
          return;
        }
      }

      // Extract job title from first heading in markdown (simple parsing)
      const titleMatch = structuredMarkdown.match(/^#\s+(.+)$/m);
      const extractedTitle = titleMatch ? titleMatch[1] : jobName;

      // Create new job with AI-processed content
      const slug = (jobName || extractedTitle || "new-job")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

      const { data: job, error } = await supabase
        .from("jobs")
        .insert({
          user_id: userId,
          company_id: companyId || null,
          title: jobName || extractedTitle || "Unnamed Job",
          slug,
          content: structuredMarkdown,
        })
        .select("*, companies(id, name, slug)")
        .single();

      if (error) {
        if (error.code === "23505") {
          res.status(409).json({ error: "Job with this slug already exists" });
          return;
        }
        throw new Error("Failed to create job: " + error.message);
      }

      res.status(201).json(job);
    } else {
      // Just return the parsed data without creating
      res.json({
        structuredMarkdown,
      });
    }
  })
);

export default router;
