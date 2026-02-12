import { Router, Response } from "express";
import multer from "multer";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { supabase } from "../services/supabase.service";
import { logActivity } from "../services/activity.service";
import { ImportAgent } from "../agents/import-agent";
import { parsePdfBuffer } from "../parsers/pdf-parser";
import { parseDocxBuffer } from "../parsers/docx-parser";
import path from "path";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExtensions = [".pdf", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      allowedTypes.includes(file.mimetype) ||
      allowedExtensions.includes(ext)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and DOCX files are allowed."));
    }
  },
});

// All resume routes require authentication
router.use(authMiddleware);

/**
 * GET /api/resumes
 * List all resumes for the current user
 */
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    const { data: resumes, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("Failed to fetch resumes: " + error.message);
    }

    res.json(resumes || []);
  })
);

/**
 * POST /api/resumes
 * Create a new resume
 * Optional: companyId, jobId, isPrimary
 */
router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { title, content, companyId, jobId, isPrimary = false } = req.body;

    if (!title) {
      res.status(400).json({ error: "title is required" });
      return;
    }

    const { data: resume, error } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        title,
        content: content || "",
        company_id: companyId || null,
        job_id: jobId || null,
        is_primary: isPrimary,
        origin: "manual",
      })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to create resume: " + error.message);
    }

    // Log activity
    logActivity({
      userId,
      action: "create",
      entityType: "resume",
      entityId: resume.id,
      displayTitle: `Created resume '${title}'`,
    });

    res.status(201).json(resume);
  })
);

/**
 * POST /api/resumes/parse
 * Parse a PDF/DOCX file and return structured markdown (no DB write).
 * Used by frontend for "upload to enrich profile" and "upload resume" flows.
 */
router.post(
  "/parse",
  upload.single("file"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "File is required" });
      return;
    }

    const startTime = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    let content: string;

    try {
      if (ext === ".pdf") {
        const pdfResult = await parsePdfBuffer(file.buffer);
        content = pdfResult.content;
      } else if (ext === ".docx") {
        const docxResult = await parseDocxBuffer(file.buffer);
        content = docxResult.content;
      } else {
        res.status(400).json({ error: "Unsupported file type" });
        return;
      }
    } catch (parseError: any) {
      throw new Error("Failed to parse file: " + parseError.message);
    }

    const agent = new ImportAgent();
    const markdown = await agent.parseResume(content);
    
    const duration_ms = Date.now() - startTime;

    // Log activity (parse only, no entity created yet)
    logActivity({
      userId,
      action: "parse",
      entityType: "resume",
      durationMs: duration_ms,
      displayTitle: `Parsed file '${file.originalname}'`,
    });

    res.json({ markdown, duration_ms });
  })
);

/**
 * GET /api/resumes/:id
 * Get a specific resume
 */
router.get(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: resume, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Resume not found" });
        return;
      }
      throw new Error("Failed to fetch resume: " + error.message);
    }

    res.json(resume);
  })
);

/**
 * PUT /api/resumes/:id
 * Update a resume
 * Optional: title, content, companyId, jobId, isPrimary
 */
router.put(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, content, companyId, jobId, isPrimary } = req.body;

    // First, get the current resume to check origin
    const { data: existingResume } = await supabase
      .from("resumes")
      .select("origin, title, is_edited")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (content !== undefined) {
      updates.content = content;
      // Mark as edited if it was generated and this is the first content edit
      if (existingResume?.origin === "generated" && !existingResume.is_edited) {
        updates.is_edited = true;
      }
    }
    if (companyId !== undefined) updates.company_id = companyId;
    if (jobId !== undefined) updates.job_id = jobId;
    if (isPrimary !== undefined) updates.is_primary = isPrimary;

    const { data: resume, error } = await supabase
      .from("resumes")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        res.status(404).json({ error: "Resume not found" });
        return;
      }
      throw new Error("Failed to update resume: " + error.message);
    }

    // Log activity
    logActivity({
      userId,
      action: "update",
      entityType: "resume",
      entityId: id,
      displayTitle: `Updated resume '${resume.title}'`,
    });

    res.json(resume);
  })
);

/**
 * DELETE /api/resumes/:id
 * Delete a resume
 */
router.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    // Get resume title before deleting
    const { data: resume } = await supabase
      .from("resumes")
      .select("title")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to delete resume: " + error.message);
    }

    // Log activity
    if (resume) {
      logActivity({
        userId,
        action: "delete",
        entityType: "resume",
        entityId: id,
        displayTitle: `Deleted resume '${resume.title}'`,
      });
    }

    res.json({ success: true, message: "Resume deleted" });
  })
);

/**
 * POST /api/resumes/upload
 * Upload and parse a PDF/DOCX file into a new resume
 */
router.post(
  "/upload",
  upload.single("file"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "File is required" });
      return;
    }

    const startTime = Date.now();

    // Parse file based on type
    const ext = path.extname(file.originalname).toLowerCase();
    let content: string;

    try {
      if (ext === ".pdf") {
        const pdfResult = await parsePdfBuffer(file.buffer);
        content = pdfResult.content;
      } else if (ext === ".docx") {
        const docxResult = await parseDocxBuffer(file.buffer);
        content = docxResult.content;
      } else {
        res.status(400).json({ error: "Unsupported file type" });
        return;
      }
    } catch (parseError: any) {
      throw new Error("Failed to parse file: " + parseError.message);
    }

    // Use AI agent to structure the content
    const agent = new ImportAgent();
    const structuredMarkdown = await agent.parseResume(content);

    const duration_ms = Date.now() - startTime;

    // Create resume with structured content
    const title = file.originalname.replace(/\.(pdf|docx)$/i, "");

    const { data: resume, error } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        title,
        content: structuredMarkdown,
        origin: "uploaded",
      })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to create resume: " + error.message);
    }

    // Log activity
    logActivity({
      userId,
      action: "upload",
      entityType: "resume",
      entityId: resume.id,
      durationMs: duration_ms,
      displayTitle: `Uploaded and parsed resume '${title}'`,
    });

    res.status(201).json(resume);
  })
);

export default router;
