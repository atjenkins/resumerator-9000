import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { supabase } from "../services/supabase.service";
import { logActivity } from "../services/activity.service";
import { ImportAgent } from "../agents/import-agent";

const router = Router();

// All company routes require authentication
router.use(authMiddleware);

/**
 * GET /api/companies
 * List all companies for the current user
 */
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    const { data: companies, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("Failed to fetch companies: " + error.message);
    }

    res.json(companies || []);
  })
);

/**
 * POST /api/companies
 * Create a new company
 */
router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { name, slug, content } = req.body;

    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    // Generate slug from name if not provided
    const companySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const { data: company, error } = await supabase
      .from("companies")
      .insert({
        user_id: userId,
        name,
        slug: companySlug,
        content: content || "",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        res
          .status(409)
          .json({ error: "Company with this slug already exists" });
        return;
      }
      throw new Error("Failed to create company: " + error.message);
    }

    // Log activity
    logActivity({
      userId,
      action: "create",
      entityType: "company",
      entityId: company.id,
      displayTitle: `Created company '${name}'`,
    });

    res.status(201).json(company);
  })
);

/**
 * GET /api/companies/:id
 * Get a specific company
 */
router.get(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Company not found" });
        return;
      }
      throw new Error("Failed to fetch company: " + error.message);
    }

    res.json(company);
  })
);

/**
 * PUT /api/companies/:id
 * Update a company
 */
router.put(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, content } = req.body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (content !== undefined) updates.content = content;

    const { data: company, error } = await supabase
      .from("companies")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Company not found" });
        return;
      }
      throw new Error("Failed to update company: " + error.message);
    }

    // Log activity
    logActivity({
      userId,
      action: "update",
      entityType: "company",
      entityId: id,
      displayTitle: `Updated company '${company.name}'`,
    });

    res.json(company);
  })
);

/**
 * DELETE /api/companies/:id
 * Delete a company
 */
router.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    // Get company name before deleting
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to delete company: " + error.message);
    }

    // Log activity
    if (company) {
      logActivity({
        userId,
        action: "delete",
        entityType: "company",
        entityId: id,
        displayTitle: `Deleted company '${company.name}'`,
      });
    }

    res.json({ success: true, message: "Company deleted" });
  })
);

/**
 * POST /api/companies/parse
 * Parse raw text into a structured company (AI operation)
 */
router.post(
  "/parse",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { text, mode = "create", companyName } = req.body;

    if (!text) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    // Use existing ImportAgent to process company information
    const agent = new ImportAgent();
    const structuredMarkdown = await agent.processCompanyInfo(text);

    if (mode === "create") {
      // Extract company name from first heading in markdown (simple parsing)
      const nameMatch = structuredMarkdown.match(/^#\s+(.+)$/m);
      const extractedName = nameMatch ? nameMatch[1] : companyName;

      // Create new company with AI-processed content
      const slug = (companyName || extractedName || "new-company")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

      const { data: company, error } = await supabase
        .from("companies")
        .insert({
          user_id: userId,
          name: companyName || extractedName || "Unnamed Company",
          slug,
          content: structuredMarkdown,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          res
            .status(409)
            .json({ error: "Company with this slug already exists" });
          return;
        }
        throw new Error("Failed to create company: " + error.message);
      }

      res.status(201).json(company);
    } else {
      // Just return the parsed data without creating
      res.json({
        structuredMarkdown,
      });
    }
  })
);

export default router;
