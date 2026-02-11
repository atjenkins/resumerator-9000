import { Router, Response } from "express";
import multer from "multer";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { supabase } from "../services/supabase.service";
import { ImportAgent } from "../agents/import-agent";
import { JobFitAgent } from "../agents/job-fit-agent";
import { GeneralResumeAgent } from "../agents/general-agent";
import { ResumeBuilderAgent } from "../agents/builder-agent";
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
      })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to create resume: " + error.message);
    }

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
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "File is required" });
      return;
    }

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
    res.json({ markdown });
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

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
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

    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to delete resume: " + error.message);
    }

    res.json({ success: true, message: "Resume deleted" });
  })
);

/**
 * POST /api/resumes/:id/analyze
 * Analyze/review a resume with optional context (AI operation)
 * Optional body params: companyId, jobId
 */
router.post(
  "/:id/analyze",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { companyId, jobId, save = false } = req.body;

    // Get resume
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (resumeError) {
      if (resumeError.code === "PGRST116") {
        res.status(404).json({ error: "Resume not found" });
        return;
      }
      throw new Error("Failed to fetch resume: " + resumeError.message);
    }

    // Get optional context
    let companyData = null;
    let jobData = null;

    if (companyId) {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .eq("user_id", userId)
        .single();
      companyData = data;
    }

    if (jobId) {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", userId)
        .single();
      jobData = data;
    }

    // Run appropriate agent based on context
    let result: any;

    if (jobData || companyData) {
      // Build context string
      let context = "";
      if (companyData) {
        context += `## Company Context\n\n${companyData.content}\n\n`;
      }
      if (jobData) {
        context += `## Job Description\n\n${jobData.content}`;
      }

      const agent = new JobFitAgent();
      result = await agent.review(resume.content, context);
    } else {
      const agent = new GeneralResumeAgent();
      result = await agent.review(resume.content);
    }

    // Save result if requested
    if (save) {
      const { data: savedResult } = await supabase
        .from("results")
        .insert({
          user_id: userId,
          resume_id: resume.id,
          company_id: companyData?.id || null,
          job_id: jobData?.id || null,
          type: "review",
          person_name: resume.title,
          company_name: companyData?.name,
          job_title: jobData?.title,
          content: JSON.stringify(result),
          metadata: {
            analysisType: jobData || companyData ? "job-fit" : "general",
          },
        })
        .select()
        .single();

      result.savedResultId = savedResult?.id;
    }

    res.json(result);
  })
);

/**
 * POST /api/resumes/:id/tailor
 * Generate a tailored resume for a specific job (AI operation)
 * Required body param: jobId
 */
router.post(
  "/:id/tailor",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { jobId, save = false } = req.body;

    if (!jobId) {
      res.status(400).json({ error: "jobId is required for tailoring" });
      return;
    }

    // Get resume
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (resumeError) {
      if (resumeError.code === "PGRST116") {
        res.status(404).json({ error: "Resume not found" });
        return;
      }
      throw new Error("Failed to fetch resume: " + resumeError.message);
    }

    // Get job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*, companies(*)")
      .eq("id", jobId)
      .eq("user_id", userId)
      .single();

    if (jobError) {
      if (jobError.code === "PGRST116") {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      throw new Error("Failed to fetch job: " + jobError.message);
    }

    // Build context
    let context = "";
    if (job.companies) {
      context += `## Company Context\n\n${job.companies.content}\n\n`;
    }
    context += `## Job Description\n\n${job.content}`;

    // Generate tailored resume
    const agent = new ResumeBuilderAgent();
    const result = await agent.build(resume.content, context);

    // Save result if requested
    if (save) {
      // Create a new resume with the tailored content and context
      const { data: tailoredResume } = await supabase
        .from("resumes")
        .insert({
          user_id: userId,
          title: `${resume.title} - ${job.title}`,
          content: result.markdown,
          company_id: job.company_id || null,
          job_id: job.id,
          is_primary: false,
        })
        .select()
        .single();

      // Save analysis result with proper foreign keys
      const { data: savedResult } = await supabase
        .from("results")
        .insert({
          user_id: userId,
          resume_id: tailoredResume?.id,
          company_id: job.company_id || null,
          job_id: job.id,
          type: "build",
          person_name: resume.title,
          company_name: job.companies?.name,
          job_title: job.title,
          content: JSON.stringify(result),
          metadata: {
            originalResumeId: resume.id,
            emphasizedSkills: result.emphasizedSkills,
            selectedExperiences: result.selectedExperiences,
          },
        })
        .select()
        .single();

      res.json({
        ...result,
        savedResultId: savedResult?.id,
        tailoredResumeId: tailoredResume?.id,
      });
      return;
    }

    res.json(result);
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

    // Create resume with structured content
    const title = file.originalname.replace(/\.(pdf|docx)$/i, "");

    const { data: resume, error } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        title,
        content: structuredMarkdown,
      })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to create resume: " + error.message);
    }

    res.status(201).json(resume);
  })
);

export default router;
