import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { supabase } from "../services/supabase.service";
import { ImportAgent } from "../agents/import-agent";

const router = Router();

// All profile routes require authentication
router.use(authMiddleware);

/**
 * GET /api/profile
 * Get current user's profile
 */
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No profile found - create one
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            display_name: req.user.email.split("@")[0],
          })
          .select()
          .single();

        if (createError) {
          throw new Error("Failed to create profile: " + createError.message);
        }

        res.json(newProfile);
        return;
      }
      throw new Error("Failed to fetch profile: " + error.message);
    }

    res.json(profile);
  })
);

/**
 * PUT /api/profile
 * Update current user's profile
 */
router.put(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { display_name, content } = req.body;

    if (!display_name && content === undefined) {
      res.status(400).json({ error: "display_name or content is required" });
      return;
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) updates.display_name = display_name;
    if (content !== undefined) updates.content = content;

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new Error("Failed to update profile: " + error.message);
    }

    res.json(profile);
  })
);

/**
 * POST /api/profile/enrich
 * Parse pasted text (resume/CV) and enrich profile content (AI operation)
 * Body params: text (required), mode (optional: 'replace' | 'merge')
 */
router.post(
  "/enrich",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { text, mode = "merge" } = req.body;

    if (!text) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    // Get current profile
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("content")
      .eq("id", userId)
      .single();

    // Use AI agent to parse/structure the text
    const agent = new ImportAgent();
    const structuredContent = await agent.parseResume(text);

    let finalContent = structuredContent;

    // If merging with existing profile
    if (mode === "merge" && currentProfile?.content) {
      finalContent = await agent.mergeProfiles(
        currentProfile.content,
        structuredContent
      );
    }

    // Update profile with enriched content
    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        content: finalContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new Error("Failed to enrich profile: " + error.message);
    }

    res.json(profile);
  })
);

export default router;
